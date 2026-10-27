from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

is_sqlite = settings.DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    if not is_sqlite:
        with engine.connect() as conn:
            # Enable vector extension on postgresql
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        try:
            if is_sqlite:
                conn.execute(text("ALTER TABLE draft_versions ADD COLUMN images_data JSON;"))
                conn.commit()
            else:
                conn.execute(text("ALTER TABLE draft_versions ADD COLUMN IF NOT EXISTS images_data JSON;"))
                conn.commit()
        except Exception:
            pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
