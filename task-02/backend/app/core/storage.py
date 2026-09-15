import os
import uuid
import shutil
from fastapi import UploadFile
from PIL import Image
import io
from app.core.config import settings
from app.core.exceptions import BadRequestException

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

def ensure_media_dir():
    os.makedirs(settings.MEDIA_DIR, exist_ok=True)

def save_avatar(file: UploadFile, user_id: str) -> str:
    """Validate, sanitize, resize/convert, and save an uploaded avatar."""
    ensure_media_dir()
    
    # Validate extension and MIME type
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIME_TYPES:
        raise BadRequestException("Invalid file format. Only JPEG, PNG, and WebP images are allowed.")
    
    # Read and validate size
    content = file.file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise BadRequestException(f"Image exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB.")
    
    try:
        image = Image.open(io.BytesIO(content))
        image.verify()
        image = Image.open(io.BytesIO(content))
        image = image.convert("RGB")
        # Resize to max 512x512 square thumbnail
        image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    except Exception as e:
        raise BadRequestException("Corrupted or invalid image file.")
    
    # Generate unique filename
    unique_filename = f"{user_id}_{uuid.uuid4().hex[:12]}.webp"
    file_path = os.path.join(settings.MEDIA_DIR, unique_filename)
    
    # Save optimized WebP
    image.save(file_path, "WEBP", quality=85)
    
    # Return relative URL path
    return f"/media/avatars/{unique_filename}"

def delete_avatar(avatar_url: str):
    """Safely delete an avatar file if it exists."""
    if not avatar_url or not avatar_url.startswith("/media/avatars/"):
        return
    filename = os.path.basename(avatar_url)
    file_path = os.path.join(settings.MEDIA_DIR, filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass
