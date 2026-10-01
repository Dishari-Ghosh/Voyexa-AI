from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "voyexa"
    JWT_SECRET: str = "change-this-before-deploying"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    ADMIN_SIGNUP_KEY: str = "change-this-too"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173","https://voyexa-ai.vercel.app"]
    PLACES_CSV_PATH: str = "../data/processed/places_processed.csv"
    RAW_CSV_PATH: str = "../data/raw/travel.csv"
    CHATBOT_QNA_PATH: str = "../data/raw/chatbot_qna.xlsx"
    ML_ARTIFACTS_DIR: str = "../ml/artifacts"
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
settings = Settings()
