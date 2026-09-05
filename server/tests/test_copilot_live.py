import pytest
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.case import Case, SuspectWallet
from app.api.v1.endpoints.copilot_live import build_gemini_setup_message, execute_tool_call
from app.services.copilot_service import CopilotToolExecutor
from app.services.rpc_service import MempoolRPCMonitor

def test_gemini_setup_message_structure():
    setup = build_gemini_setup_message(case_id="case-gemini-test")
    assert "setup" in setup
    s = setup["setup"]
    assert "model" in s
    assert s["generationConfig"]["responseModalities"] == ["AUDIO"]
    assert s["generationConfig"]["speechConfig"]["voiceConfig"]["prebuiltVoiceConfig"]["voiceName"] == "Puck"
    
    # Assert tool definitions
    tools = s["tools"][0]["functionDeclarations"]
    tool_names = [t["name"] for t in tools]
    assert "add_wallet_number" in tool_names
    assert "extract_peel_chain" in tool_names
    assert "calculate_threat_matrix" in tool_names
    assert "generate_freeze_subpoena" in tool_names


@pytest.mark.asyncio
async def test_tool_executor_add_wallet_number():
    async with AsyncSessionLocal() as session:
        test_case = Case(
            case_number="CASE-COPILOT-001",
            title="Copilot Voice Tool Test Case",
            primary_investigator_id="usr-inv-01"
        )
        session.add(test_case)
        await session.commit()
        await session.refresh(test_case)
        case_id = test_case.id

    test_wallet = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
    result = await CopilotToolExecutor.add_wallet_number(
        case_id=case_id,
        address=test_wallet,
        label="Vitalik Hot Wallet"
    )

    assert result["status"] == "SUCCESS"
    assert result["action"] == "add_wallet_number"
    assert result["address"] == test_wallet.lower()

    # Verify persisted in database
    async with AsyncSessionLocal() as session:
        stmt = select(SuspectWallet).where(
            SuspectWallet.case_id == case_id,
            SuspectWallet.address == test_wallet.lower()
        )
        saved = (await session.execute(stmt)).scalar_one_or_none()
        assert saved is not None

    # Verify registered in mempool monitor
    monitor = MempoolRPCMonitor.get_instance()
    assert test_wallet.lower() in monitor._local_watchlist


@pytest.mark.asyncio
async def test_tool_executor_extract_peel_chain():
    result = await CopilotToolExecutor.extract_peel_chain(
        case_id="case-gemini-test",
        seed_wallet="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
    )
    assert result["status"] == "SUCCESS"
    assert result["action"] == "extract_peel_chain"
    assert result["hops_count"] >= 1
    assert "peel_chains" in result
    assert result["total_peeled_usd"] > 0


@pytest.mark.asyncio
async def test_tool_executor_calculate_threat_matrix():
    result = await CopilotToolExecutor.calculate_threat_matrix(
        case_id="case-gemini-test"
    )
    assert result["status"] == "SUCCESS"
    assert result["action"] == "calculate_threat_matrix"
    assert "top_threats" in result


@pytest.mark.asyncio
async def test_tool_executor_generate_freeze_subpoena():
    result = await CopilotToolExecutor.generate_freeze_subpoena(
        case_id="case-gemini-test",
        vasp_name="Binance",
        deposit_address="0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be",
        absorbed_usd=25000.0
    )
    assert result["status"] == "SUCCESS"
    assert result["action"] == "generate_freeze_subpoena"
    assert "subpoena_id" in result
    assert len(result["file_hash"]) == 64
    assert "download_url" in result
