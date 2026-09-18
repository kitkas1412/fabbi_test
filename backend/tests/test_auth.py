"""Auth tests."""

from datetime import timedelta

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """Test successful user registration."""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test successful login after registration."""
    # Register first
    await client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "password": "password123"},
    )

    # Then login
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient):
    """Test getting current user info."""
    # Register and get token
    reg_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "me@example.com", "password": "password123"},
    )
    token = reg_response.json()["access_token"]

    # Get current user
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"


@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    """Test logout endpoint."""
    # Register and get token
    reg_response = await client.post(
        "/api/v1/auth/register",
        json={"email": "logout@example.com", "password": "password123"},
    )
    token = reg_response.json()["access_token"]

    # Logout
    response = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"


@pytest.mark.asyncio
async def test_refresh_token_rotation_rejects_replay(
    client: AsyncClient,
    shared_redis,
):
    """AUTH-003: a refresh token is single-use after a successful rotation."""
    registration = await client.post(
        "/api/v1/auth/register",
        json={"email": "refresh-rotation@example.com", "password": "password123"},
    )
    original_refresh_token = registration.json()["refresh_token"]

    first_refresh = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": original_refresh_token},
    )

    assert first_refresh.status_code == 200
    assert first_refresh.json()["refresh_token"] != original_refresh_token

    replay = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": original_refresh_token},
    )

    assert replay.status_code == 401


@pytest.mark.asyncio
async def test_logout_revokes_access_and_refresh_session(
    client: AsyncClient,
    shared_redis,
):
    """AUTH-003: logout makes the current access and refresh session unusable."""
    registration = await client.post(
        "/api/v1/auth/register",
        json={"email": "logout-revocation@example.com", "password": "password123"},
    )
    tokens = registration.json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    logout_response = await client.post("/api/v1/auth/logout", headers=headers)
    access_after_logout = await client.get("/api/v1/auth/me", headers=headers)
    refresh_after_logout = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )

    assert logout_response.status_code == 200
    assert access_after_logout.status_code == 401
    assert refresh_after_logout.status_code == 401


@pytest.mark.asyncio
async def test_expired_access_token_is_rejected(client: AsyncClient):
    """AUTH-001: an expired access token cannot authenticate a request."""
    registration = await client.post(
        "/api/v1/auth/register",
        json={"email": "expired@example.com", "password": "password123"},
    )
    valid_access_token = registration.json()["access_token"]
    current_user = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {valid_access_token}"},
    )
    user_id = current_user.json()["id"]
    expired_token = create_access_token(
        data={"sub": user_id},
        expires_delta=timedelta(seconds=-1),
    )

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_cannot_authenticate_access_endpoint(client: AsyncClient):
    """AUTH-002: access-only dependencies must reject refresh tokens."""
    registration = await client.post(
        "/api/v1/auth/register",
        json={"email": "refresh-as-access@example.com", "password": "password123"},
    )
    refresh_token = registration.json()["refresh_token"]

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )

    assert response.status_code == 401
