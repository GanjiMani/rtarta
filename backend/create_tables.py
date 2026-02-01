from app.db.session import engine
from app.db.base import BaseModel
from app.models import *  # Import all models to ensure they are registered

print("Creating tables...")
BaseModel.metadata.create_all(bind=engine)
print("Tables created successfully.")
