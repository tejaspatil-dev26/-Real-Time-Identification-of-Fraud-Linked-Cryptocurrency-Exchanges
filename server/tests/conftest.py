import os
import sys
from pathlib import Path
import pytest
from httpx import AsyncClient, ASGITransport

server_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(server_dir))

# Force SQLite async for local test suite
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_forensics.db"

from app.main import app
from app.core.database import Base, engine, AsyncSessionLocal
from app.core.seed import seed_database

@pytest.fixture(scope="session", autouse=True)
async def setup_test_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_database()
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
