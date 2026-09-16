import logging
import resend
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        if settings.RESEND_API_KEY:
            resend.api_key = settings.RESEND_API_KEY

    def send_password_reset_email(
        self,
        recipient_email: str,
        raw_token: str,
        recipient_name: Optional[str] = None
    ) -> bool:
        """
        Sends a branded TechLoom password reset email via Resend.
        Does not raise exceptions to the caller to preserve anti-enumeration.
        """
        if not settings.RESEND_API_KEY:
            logger.info("RESEND_API_KEY not configured. Skipping transactional email delivery.")
            return False

        reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={raw_token}"
        display_name = recipient_name or "there"
        subject = "Reset your TechLoom password"

        # Email design: Deep navy #07111F, surface #0D1727, border #213149, teal #16B89A, brass #C8A96B
        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07111F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F5F7FA;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #07111F; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #0D1727; border: 1px solid #213149; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 20px 36px; border-bottom: 1px solid #18263A;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 700; letter-spacing: 0.1em; color: #F5F7FA; text-transform: uppercase;">TECHLOOM</span>
                    <div style="font-size: 10px; font-weight: 600; letter-spacing: 0.15em; color: #16B89A; text-transform: uppercase; margin-top: 2px;">Modern Commerce with Precision</div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #C8A96B;"></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0; letter-spacing: -0.01em;">Reset your password</h1>
              <p style="font-size: 14px; line-height: 22px; color: #A7B3C4; margin: 0 0 20px 0;">Hello {display_name},</p>
              <p style="font-size: 14px; line-height: 22px; color: #A7B3C4; margin: 0 0 28px 0;">
                We received a request to reset the password for your TechLoom account. Click the button below to create your new password.
              </p>
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #16B89A;">
                    <a href="{reset_url}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 13px; font-weight: 700; letter-spacing: 0.02em; color: #07111F; text-decoration: none; border-radius: 8px;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 12px; line-height: 18px; color: #748196; margin: 0 0 16px 0;">
                This link will expire after 15 minutes. If you didn't request a password reset, you can safely ignore this email.
              </p>
              <p style="font-size: 12px; line-height: 18px; color: #748196; margin: 0;">
                For your security, never share this link with anyone.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #09121F; border-top: 1px solid #18263A;">
              <p style="font-size: 11px; color: #748196; margin: 0; line-height: 16px;">
                TechLoom &bull; Modern commerce with precision.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

        plain_text = f"""TECHLOOM
Reset your password

Hello {display_name},

We received a request to reset the password for your TechLoom account.
Visit the following link to reset your password:

{reset_url}

This link will expire after 15 minutes.
If you didn't request a password reset, you can safely ignore this email.
For your security, never share this link with anyone.

TechLoom
Modern commerce with precision.
"""

        try:
            params = {
                "from": settings.RESEND_FROM_EMAIL,
                "to": [recipient_email],
                "subject": subject,
                "html": html_content,
                "text": plain_text,
            }
            resend.Emails.send(params)
            logger.info("Password reset email sent to recipient")
            return True
        except Exception as e:
            logger.error(f"Failed to dispatch password reset email via Resend: {type(e).__name__}")
            return False
