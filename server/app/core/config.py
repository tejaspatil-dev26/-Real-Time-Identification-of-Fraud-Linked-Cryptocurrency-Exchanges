from pathlib import Path
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(BASE_DIR.parent / ".env"), extra="ignore")

    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "Real-Time Crypto-Forensics & Fraud-Linked VASP Identification Platform"
    LOG_LEVEL: str = "INFO"

    # Ports & Networking
    SERVER_PORT: int = 8000
    CLIENT_PORT: int = 3000

    # Relational Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./crypto_forensics.db",
        description="Async SQLAlchemy database connection string"
    )

    # Neo4j Graph Database
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "TestPassword123"
    NEO4J_DATABASE: str = "neo4j"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # RS256 Cryptographic Authentication
    JWT_ALGORITHM: str = "RS256"
    JWT_PRIVATE_KEY_PATH: str = str(BASE_DIR / "certs" / "private_key.pem")
    JWT_PUBLIC_KEY_PATH: str = str(BASE_DIR / "certs" / "public_key.pem")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 60
    JWT_ISSUER: str = "antigravity-auth-service"

    # RPC Endpoints
    ETH_RPC_URL: str = "https://eth.llamarpc.com"
    BTC_RPC_URL: str = "https://blockstream.info/api"
    POLYGON_RPC_URL: str = "https://polygon-rpc.com"
    TRON_RPC_URL: str = "https://api.trongrid.io"

    # Evidence Storage
    EVIDENCE_STORAGE_PATH: str = str(BASE_DIR / "evidence_vault")
    S3_STORAGE_BUCKET: str = "crypto-forensics-evidence-vault"

    # Machine Learning
    GNN_MODEL_PATH: str = str(BASE_DIR.parent / "worker" / "worker_app" / "ml" / "weights" / "graphsage_v1.pth")
    GNN_HIDDEN_CHANNELS: int = 128
    GNN_NUM_LAYERS: int = 3
    GNN_OUTPUT_DIM: int = 32

settings = Settings()
