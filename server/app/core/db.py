"""
Database Session and Engine compatibility alias layer.
Provides Base, engine, AsyncSessionLocal, and get_db from app.core.database.
"""
from app.core.database import Base, engine, AsyncSessionLocal, get_db

__all__ = ["Base", "engine", "AsyncSessionLocal", "get_db"]
