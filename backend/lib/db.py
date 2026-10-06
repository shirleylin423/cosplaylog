import os

from motor.motor_asyncio import AsyncIOMotorClient


MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "cosplaylog")

if not MONGO_URL:
    raise RuntimeError("MONGO_URL environment variable is not set")


client = AsyncIOMotorClient(MONGO_URL)

db = client[DB_NAME]

users_collection = db["users"]
records_collection = db["records"]
