import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_auth_login_success(client: AsyncClient):
    # Test login with seeded investigator credentials
    res = await client.post("/api/v1/auth/login", json={
        "email": "agent.smith@fbi.gov",
        "password": "InvestigatorPassword123!"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["role"] == "INVESTIGATOR"
    assert data["user"]["email"] == "agent.smith@fbi.gov"

@pytest.mark.asyncio
async def test_auth_login_invalid_password(client: AsyncClient):
    res = await client.post("/api/v1/auth/login", json={
        "email": "agent.smith@fbi.gov",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
    assert "Invalid credentials" in res.json()["detail"]

@pytest.mark.asyncio
async def test_auth_me_endpoint(client: AsyncClient):
    # Obtain token
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "admin@antigravity.gov",
        "password": "AdminSecurePassword123!"
    })
    token = login_res.json()["access_token"]

    # Call /me with Bearer token
    me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    user_info = me_res.json()
    assert user_info["email"] == "admin@antigravity.gov"
    assert user_info["role"] == "ADMIN"
