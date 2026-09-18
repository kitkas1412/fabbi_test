"""Todo tests."""

from unittest.mock import MagicMock

import pytest
from httpx import AsyncClient


async def get_auth_token(client: AsyncClient, email: str = "todo@example.com") -> str:
    """Helper to register and get auth token."""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123"},
    )
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_create_todo(client: AsyncClient):
    """Test creating a new todo."""
    token = await get_auth_token(client, "create@example.com")

    response = await client.post(
        "/api/v1/todos",
        json={"title": "Test Todo", "description": "A test todo item"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Todo"
    assert data["description"] == "A test todo item"
    assert data["completed"] is False


@pytest.mark.asyncio
async def test_get_todos(client: AsyncClient):
    """Test getting todo list."""
    token = await get_auth_token(client, "list@example.com")

    # Create a todo first
    await client.post(
        "/api/v1/todos",
        json={"title": "List Todo"},
        headers={"Authorization": f"Bearer {token}"},
    )

    # Get todos
    response = await client.get(
        "/api/v1/todos",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) >= 1


@pytest.mark.asyncio
async def test_update_todo(client: AsyncClient):
    """Test updating a todo."""
    token = await get_auth_token(client, "update@example.com")

    # Create a todo
    create_response = await client.post(
        "/api/v1/todos",
        json={"title": "Update Me"},
        headers={"Authorization": f"Bearer {token}"},
    )
    todo_id = create_response.json()["id"]

    # Update it
    response = await client.put(
        f"/api/v1/todos/{todo_id}",
        json={"title": "Updated Title", "completed": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"


@pytest.mark.asyncio
async def test_delete_todo(client: AsyncClient):
    """Test deleting a todo."""
    token = await get_auth_token(client, "delete@example.com")

    # Create a todo
    create_response = await client.post(
        "/api/v1/todos",
        json={"title": "Delete Me"},
        headers={"Authorization": f"Bearer {token}"},
    )
    todo_id = create_response.json()["id"]

    # Delete it
    response = await client.delete(
        f"/api/v1/todos/{todo_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_get_single_todo(client: AsyncClient):
    """Test getting a single todo by ID."""
    token = await get_auth_token(client, "single@example.com")

    # Create a todo
    create_response = await client.post(
        "/api/v1/todos",
        json={"title": "Single Todo", "description": "Get me"},
        headers={"Authorization": f"Bearer {token}"},
    )
    todo_id = create_response.json()["id"]

    # Get it
    response = await client.get(
        f"/api/v1/todos/{todo_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Single Todo"


@pytest.mark.asyncio
@pytest.mark.parametrize("method", ["get", "put", "delete"])
async def test_user_cannot_access_another_users_todo(
    client: AsyncClient,
    method: str,
):
    """TODO-001: detail reads and mutations must be scoped to the owner."""
    owner_token = await get_auth_token(client, f"owner-{method}@example.com")
    attacker_token = await get_auth_token(client, f"attacker-{method}@example.com")
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    attacker_headers = {"Authorization": f"Bearer {attacker_token}"}

    created = await client.post(
        "/api/v1/todos",
        json={"title": "Owner private todo", "description": "Owner secret"},
        headers=owner_headers,
    )
    todo_id = created.json()["id"]

    if method == "put":
        attack_response = await client.put(
            f"/api/v1/todos/{todo_id}",
            json={"title": "Changed by attacker", "completed": True},
            headers=attacker_headers,
        )
    else:
        attack_response = await client.request(
            method,
            f"/api/v1/todos/{todo_id}",
            headers=attacker_headers,
        )

    owner_response = await client.get(
        f"/api/v1/todos/{todo_id}",
        headers=owner_headers,
    )

    assert attack_response.status_code == 404
    assert owner_response.status_code == 200
    assert owner_response.json()["title"] == "Owner private todo"
    assert owner_response.json()["completed"] is False


@pytest.mark.asyncio
async def test_todo_cache_is_isolated_by_user(
    client: AsyncClient,
    shared_redis: MagicMock,
):
    """CACHE-001: one user's cached list must never be served to another user."""
    user_a_token = await get_auth_token(client, "cache-user-a@example.com")
    user_b_token = await get_auth_token(client, "cache-user-b@example.com")
    user_a_headers = {"Authorization": f"Bearer {user_a_token}"}
    user_b_headers = {"Authorization": f"Bearer {user_b_token}"}

    await client.post(
        "/api/v1/todos",
        json={"title": "User A private todo"},
        headers=user_a_headers,
    )
    await client.post(
        "/api/v1/todos",
        json={"title": "User B private todo"},
        headers=user_b_headers,
    )

    user_a_response = await client.get("/api/v1/todos", headers=user_a_headers)
    user_b_response = await client.get("/api/v1/todos", headers=user_b_headers)

    assert user_a_response.status_code == 200
    assert user_b_response.status_code == 200
    assert [item["title"] for item in user_a_response.json()["items"]] == [
        "User A private todo"
    ]
    assert [item["title"] for item in user_b_response.json()["items"]] == [
        "User B private todo"
    ]


@pytest.mark.asyncio
async def test_todo_cache_is_isolated_by_pagination_query(
    client: AsyncClient,
    shared_redis: MagicMock,
):
    """CACHE-001: pagination inputs must be part of the list cache identity."""
    token = await get_auth_token(client, "cache-query@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    for title in ("First todo", "Second todo"):
        await client.post(
            "/api/v1/todos",
            json={"title": title},
            headers=headers,
        )

    first_page = await client.get(
        "/api/v1/todos",
        params={"page": 1, "size": 1},
        headers=headers,
    )
    second_page = await client.get(
        "/api/v1/todos",
        params={"page": 2, "size": 1},
        headers=headers,
    )

    assert first_page.status_code == 200
    assert second_page.status_code == 200
    assert first_page.json()["page"] == 1
    assert second_page.json()["page"] == 2
    assert first_page.json()["items"][0]["id"] != second_page.json()["items"][0]["id"]


@pytest.mark.asyncio
async def test_partial_update_can_set_completed_to_false(client: AsyncClient):
    """TODO-002: explicit false must be persisted instead of treated as omitted."""
    token = await get_auth_token(client, "completed-false@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    created = await client.post(
        "/api/v1/todos",
        json={"title": "Toggle me"},
        headers=headers,
    )
    todo_id = created.json()["id"]

    completed = await client.put(
        f"/api/v1/todos/{todo_id}",
        json={"completed": True},
        headers=headers,
    )
    reopened = await client.put(
        f"/api/v1/todos/{todo_id}",
        json={"completed": False},
        headers=headers,
    )
    persisted = await client.get(
        f"/api/v1/todos/{todo_id}",
        headers=headers,
    )

    assert completed.status_code == 200
    assert completed.json()["completed"] is True
    assert reopened.status_code == 200
    assert reopened.json()["completed"] is False
    assert persisted.json()["completed"] is False


@pytest.mark.asyncio
async def test_partial_update_preserves_omitted_description(client: AsyncClient):
    """TODO-003: omitted fields must retain their stored values."""
    token = await get_auth_token(client, "preserve-description@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    created = await client.post(
        "/api/v1/todos",
        json={"title": "Original title", "description": "Keep this description"},
        headers=headers,
    )
    todo_id = created.json()["id"]

    updated = await client.put(
        f"/api/v1/todos/{todo_id}",
        json={"title": "Updated title"},
        headers=headers,
    )
    persisted = await client.get(
        f"/api/v1/todos/{todo_id}",
        headers=headers,
    )

    assert updated.status_code == 200
    assert updated.json()["description"] == "Keep this description"
    assert persisted.json()["description"] == "Keep this description"
