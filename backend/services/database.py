"""
Database Service
SQLAlchemy models and database operations
"""
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, Float, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from datetime import datetime
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    role = Column(String(50), default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    company_name = Column(String(255), nullable=False)
    company_description = Column(Text)
    overall_score = Column(Float)
    risk_level = Column(String(50))
    status = Column(String(50), default="pending")
    analysis_data = Column(JSON)
    recommendations = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime,
                        default=datetime.utcnow,
                        onupdate=datetime.utcnow)


class AppRequest(Base):
    __tablename__ = "app_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    request_type = Column(String(100), nullable=False)
    request_data = Column(JSON)
    status = Column(String(50), default="pending")
    response_data = Column(JSON)
    processing_time = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)


class DatabaseService:
    """Database service for managing connections and operations"""

    def __init__(self, database_url: str = "sqlite:///./tca_app.db"):
        self.database_url = database_url
        self.engine = create_engine(database_url,
                                    poolclass=StaticPool,
                                    connect_args={"check_same_thread": False}
                                    if "sqlite" in database_url else {})
        self.SessionLocal = sessionmaker(autocommit=False,
                                         autoflush=False,
                                         bind=self.engine)

    def create_tables(self):
        """Create all database tables"""
        try:
            Base.metadata.create_all(bind=self.engine)
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Error creating database tables: {str(e)}")
            raise

    def get_db(self) -> Session:
        """Get database session"""
        db = self.SessionLocal()
        try:
            return db
        finally:
            pass  # Session will be closed by caller

    def close_db(self, db: Session):
        """Close database session"""
        try:
            db.close()
        except Exception as e:
            logger.error(f"Error closing database session: {str(e)}")

    def check_health(self) -> Dict[str, Any]:
        """Check database health"""
        try:
            db = self.get_db()
            start_time = datetime.now()

            # Test query
            db.execute("SELECT 1")

            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds() * 1000

            # Get table counts
            user_count = db.query(User).count()
            evaluation_count = db.query(Evaluation).count()
            request_count = db.query(AppRequest).count()

            self.close_db(db)

            return {
                "status": "healthy",
                "response_time": f"{response_time:.2f}ms",
                "tables": {
                    "users": {
                        "status": "ok",
                        "records": user_count
                    },
                    "evaluations": {
                        "status": "ok",
                        "records": evaluation_count
                    },
                    "app_requests": {
                        "status": "ok",
                        "records": request_count
                    }
                },
                "last_check": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "last_check": datetime.now().isoformat()
            }


# Global database service instance
database_service = DatabaseService()


def get_database():
    """Get database service instance"""
    return database_service


def init_database():
    """Initialize database tables"""
    try:
        database_service.create_tables()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise