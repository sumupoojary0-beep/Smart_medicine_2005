"""
Delete the "Jan Aushadhi Kendra - Moodabidri (demo)" entry only.

Run from the Backend folder:
    python -m scripts.remove_moodabidri_demo
"""

import asyncio

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

NAME = "Jan Aushadhi Kendra - Moodabidri (demo)"


async def main() -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    try:
        result = await client[settings.DATABASE_NAME]["kendras"].delete_one({"name": NAME})
        print(f"Deleted {result.deleted_count} entry.")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())