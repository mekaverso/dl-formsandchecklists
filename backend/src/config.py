from urllib.parse import quote_plus

from pydantic import computed_field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database (individual fields matching .env)
    postgres_host: str = "127.0.0.1"
    postgres_port: int = 5432
    postgres_db: str = "mekaforms"
    postgres_user: str = "postgres"
    postgres_password: str = ""

    @computed_field
    @property
    def database_url(self) -> str:
        password = quote_plus(self.postgres_password)
        host = self.postgres_host
        # Windows: asyncpg can't resolve "localhost" — use 127.0.0.1
        if host.lower() == "localhost":
            host = "127.0.0.1"
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{password}"
            f"@{host}:{self.postgres_port}/{self.postgres_db}"
        )

    # JWT
    jwt_secret_key: str = "change-me-to-a-random-secret"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 30

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""

    # Local file storage
    upload_dir: str = "uploads"

    # App
    app_name: str = "Meka Forms"
    app_env: str = "development"
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
