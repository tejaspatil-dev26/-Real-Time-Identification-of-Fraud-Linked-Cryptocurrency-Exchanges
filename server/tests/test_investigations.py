import pytest
from httpx import AsyncClient
from app.services.rpc_client import RPCClient

@pytest.mark.asyncio
async def test_crypto_address_validation():
    # Valid EVM
    valid_eth, _ = RPCClient.validate_crypto_address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e", "ETHEREUM")
    assert valid_eth is True

    # Invalid EVM (bad length)
    invalid_eth, _ = RPCClient.validate_crypto_address("0x742d35Cc", "ETHEREUM")
    assert invalid_eth is False

    # Valid Bitcoin (Bech32 segwit)
    valid_btc, _ = RPCClient.validate_crypto_address("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", "BITCOIN")
    assert valid_btc is True

    # Invalid Bitcoin
    invalid_btc, _ = RPCClient.validate_crypto_address("not_a_btc_addr", "BITCOIN")
    assert invalid_btc is False

@pytest.mark.asyncio
async def test_case_creation_and_investigation_dispatch(client: AsyncClient):
    # 1. Login as investigator
    login = await client.post("/api/v1/auth/login", json={
        "email": "agent.smith@fbi.gov",
        "password": "InvestigatorPassword123!"
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Case
    case_res = await client.post("/api/v1/cases", headers=headers, json={
        "title": "Operation Apex: Ransomware Fund Traversal",
        "description": "Suspect wallet laundering fund dissipation",
        "seed_wallet": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "network": "ETHEREUM",
        "reported_victim_loss_usd": 50000.0
    })
    assert case_res.status_code == 201
    case_data = case_res.json()
    case_id = case_data["id"]

    # 3. Dispatch Investigation
    dispatch_res = await client.post("/api/v1/investigations/dispatch", headers=headers, json={
        "case_id": case_id,
        "seed_wallet": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        "network": "ETHEREUM",
        "max_depth": 5,
        "min_usd_threshold": 500.0
    })
    assert dispatch_res.status_code == 202
    dispatch_data = dispatch_res.json()
    assert dispatch_data["status"] == "QUEUED"
    assert "task_id" in dispatch_data
    assert f"/api/v1/investigations/events/{dispatch_data['task_id']}" in dispatch_data["event_stream"]
