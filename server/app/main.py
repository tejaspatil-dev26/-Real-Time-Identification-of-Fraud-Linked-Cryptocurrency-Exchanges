import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.seed import seed_database
from app.api.v1.api_router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("forensics_platform")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Booting Real-Time Crypto-Forensics & Fraud-Linked VASP Identification Platform...")
    try:
        await seed_database()
        logger.info("System database initialized and seeded with administrative profiles and VASP registry.")
    except Exception as e:
        logger.error(f"Database bootstrap notice: {e}")

    # Initialize Phase 1: Background Mempool RPC Monitor
    from app.services.rpc_service import MempoolRPCMonitor
    monitor = MempoolRPCMonitor.get_instance()
    try:
        await monitor.sync_watchlist_from_db()
        monitor.start_monitor()
        logger.info("Mempool RPC Monitor successfully started in background.")
    except Exception as e:
        logger.warning(f"Notice starting Mempool RPC Monitor: {e}")

    yield

    try:
        await monitor.stop_monitor()
    except Exception:
        pass
    logger.info("Shutting down Forensics Platform Gateway.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Automated Cryptocurrency Forensic Intelligence Engine for Terminal VASP Identification & ISO/IEC 27037 Evidence Generation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "status": "OPERATIONAL",
        "standards": ["ISO/IEC 27037:2012", "FATF Travel Rule", "ERC-55 / BIP-173"]
    }
