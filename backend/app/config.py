"""
Central settings, loaded from environment variables / a .env file in
backend/. Nothing here is hardcoded — this is the ONE place you plug in
your own MongoDB URI and secrets once you're ready to connect for real.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- MongoDB ---
    # Paste your own connection string here (Atlas or local). Example:
    # mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "voyexa"

    # --- JWT auth ---
    # Generate a real secret before deploying anywhere, e.g.:
    #   python -c "import secrets; print(secrets.token_hex(32))"
    JWT_SECRET: str = "change-this-before-deploying"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # --- Admin signup gate ---
    # Only someone who knows this key can create an account with role="admin"
    # (passed as `admin_key` in the /auth/signup request body). Keep this
    # secret - anyone with it can self-register as an admin.
    ADMIN_SIGNUP_KEY: str = "change-this-too"

    # --- CORS ---
    # Your Vite dev server's origin(s). Add your deployed frontend URL here
    # too once you have one.
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # --- Data paths (relative to backend/ when run normally) ---
    PLACES_CSV_PATH: str = "../data/processed/places_processed.csv"
    RAW_CSV_PATH: str = "../data/raw/travel.csv"
    CHATBOT_QNA_PATH: str = "../data/raw/chatbot_qna.xlsx"
    ML_ARTIFACTS_DIR: str = "../ml/artifacts"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
