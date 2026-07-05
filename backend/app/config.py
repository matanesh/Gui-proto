"""Runtime configuration, sourced from environment variables (no secrets in code)."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="BFF_", env_file=".env", extra="ignore")

    # API
    api_prefix: str = "/api"
    # Comma-separated CORS origins for the Vite dev server / deployed frontend.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Broker. When disabled, an in-process simulator drives run lifecycles so the
    # BFF is fully demoable without RabbitMQ (see app/simulator.py).
    broker_enabled: bool = False
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"
    commands_exchange: str = "occ.commands"
    events_exchange: str = "occ.events"
    events_queue: str = "occ.bff.events"

    # SSE
    heartbeat_interval_sec: float = 10.0
    # Bounded per-run replay window for Last-Event-ID reconnects.
    replay_window: int = 200

    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
