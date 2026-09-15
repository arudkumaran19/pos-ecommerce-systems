from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.user import User, UserRole
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(func.lower(User.email) == func.lower(email), User.deleted_at.is_(None)).first()

    def count_active_admins(self) -> int:
        return self.db.query(User).filter(
            User.role == UserRole.ADMIN,
            User.is_active.is_(True),
            User.deleted_at.is_(None)
        ).count()

    def search_users(
        self,
        query: Optional[str] = None,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[User], int]:
        q = self.db.query(User).filter(User.deleted_at.is_(None))
        
        if query:
            pattern = f"%{query}%"
            q = q.filter(or_(User.email.ilike(pattern), User.full_name.ilike(pattern)))
        
        if role:
            q = q.filter(User.role == role)
            
        if is_active is not None:
            q = q.filter(User.is_active == is_active)
            
        total = q.count()
        users = q.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
        return users, total
