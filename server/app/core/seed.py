import asyncio
import logging
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.vasp import VASPEntity, RiskLevel
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

INITIAL_USERS = [
    {
        "email": "admin@antigravity.gov",
        "password": "AdminSecurePassword123!",
        "full_name": "Chief Forensics Administrator",
        "role": UserRole.ADMIN,
        "agency_or_firm": "Federal Cyber Defense Agency",
    },
    {
        "email": "agent.smith@fbi.gov",
        "password": "InvestigatorPassword123!",
        "full_name": "Special Agent J. Smith",
        "role": UserRole.INVESTIGATOR,
        "agency_or_firm": "FBI Virtual Assets Unit",
    },
    {
        "email": "analyst.chen@finsec.org",
        "password": "AnalystPassword123!",
        "full_name": "Senior Analyst Linda Chen",
        "role": UserRole.ANALYST,
        "agency_or_firm": "Financial Intelligence Network",
    },
]

INITIAL_VASPS = [
    {
        "vasp_name": "Binance",
        "legal_entity_name": "Binance Holdings Ltd",
        "jurisdiction_code": "KYM",
        "risk_level": RiskLevel.LOW,
        "compliance_email": "compliance@binance.com",
        "travel_rule_compliant": True,
    },
    {
        "vasp_name": "Coinbase",
        "legal_entity_name": "Coinbase Global Inc",
        "jurisdiction_code": "USA",
        "risk_level": RiskLevel.LOW,
        "compliance_email": "lawenforcement@coinbase.com",
        "travel_rule_compliant": True,
    },
    {
        "vasp_name": "Kraken",
        "legal_entity_name": "Payward Inc",
        "jurisdiction_code": "USA",
        "risk_level": RiskLevel.LOW,
        "compliance_email": "compliance@kraken.com",
        "travel_rule_compliant": True,
    },
    {
        "vasp_name": "OKX",
        "legal_entity_name": "Aux Cayes FinTech Co",
        "jurisdiction_code": "SYC",
        "risk_level": RiskLevel.LOW,
        "compliance_email": "legal@okx.com",
        "travel_rule_compliant": True,
    },
    {
        "vasp_name": "HTX (Huobi)",
        "legal_entity_name": "Huobi Global Ltd",
        "jurisdiction_code": "SYC",
        "risk_level": RiskLevel.MEDIUM,
        "compliance_email": "compliance@htx.com",
        "travel_rule_compliant": True,
    },
    {
        "vasp_name": "KuCoin",
        "legal_entity_name": "Mek Global Limited",
        "jurisdiction_code": "SYC",
        "risk_level": RiskLevel.MEDIUM,
        "compliance_email": "compliance@kucoin.com",
        "travel_rule_compliant": False,
    },
    {
        "vasp_name": "Tornado Cash (Sanctioned)",
        "legal_entity_name": "Decentralized Smart Contract Mixer",
        "jurisdiction_code": "UNK",
        "risk_level": RiskLevel.CRITICAL,
        "compliance_email": "none@tornadocash.eth",
        "travel_rule_compliant": False,
    },
]

async def seed_database():
    """Initializes schema and populates initial administrative accounts and known VASPs."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        for u in INITIAL_USERS:
            stmt = select(User).where(User.email == u["email"])
            existing = (await session.execute(stmt)).scalar_one_or_none()
            if not existing:
                user_obj = User(
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    agency_or_firm=u["agency_or_firm"],
                    is_active=True,
                )
                session.add(user_obj)

        for v in INITIAL_VASPS:
            stmt = select(VASPEntity).where(VASPEntity.vasp_name == v["vasp_name"])
            existing = (await session.execute(stmt)).scalar_one_or_none()
            if not existing:
                vasp_obj = VASPEntity(**v)
                session.add(vasp_obj)

        await session.commit()
    logger.info("Database initialized and seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed_database())
