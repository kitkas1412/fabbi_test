import pytest
from pydantic import ValidationError

from app.core.config import Settings


@pytest.mark.parametrize("missing_setting", ["DATABASE_URL", "REDIS_URL", "JWT_SECRET"])
def test_sensitive_settings_are_required(monkeypatch, missing_setting):
    configured_values = {
        "DATABASE_URL": "sqlite+aiosqlite:///./test.db",
        "REDIS_URL": "redis://localhost:6379/0",
        "JWT_SECRET": "test-only-jwt-secret",
    }
    for setting, value in configured_values.items():
        monkeypatch.setenv(setting, value)
    monkeypatch.delenv(missing_setting)

    with pytest.raises(ValidationError):
        Settings(_env_file=None)
