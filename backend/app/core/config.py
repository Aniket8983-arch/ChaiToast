"""
SmartWaste 360 — Application Settings
Loaded from environment variables / .env file.
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "SmartWaste 360"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./data/smartwaste.db"

    # AI Inference microservice (separate process on :8001)
    INFERENCE_SERVICE_URL: str = "http://localhost:8001"

    # Hardware / Serial
    SERIAL_PORT: str = "COM4"
    BAUD_RATE: int = 115200
    SERIAL_TIMEOUT: int = 2

    # AI Thresholds
    CONFIDENCE_THRESHOLD: float = 0.70
    BIN_WARNING_THRESHOLD: float = 0.80
    BIN_CRITICAL_THRESHOLD: float = 0.95

    # Simulation
    SIMULATION_ENABLED: bool = True
    SIMULATION_BIN_INTERVAL_SECONDS: int = 15
    SIMULATION_GPS_INTERVAL_SECONDS: int = 5

    # CORS — comma-separated list parsed by validator
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    model_config = {
        "env_file": "../.env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


settings = Settings()
