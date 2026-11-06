"""
Add one demo Jan Aushadhi Kendra near Moodabidri.

Run from the Backend folder:
    python -m scripts.add_moodabidri_kendra

Safe to run twice: it does nothing if the Kendra already exists.
The location is the Moodabidri town centre and the entry is a demo
record (no real PMBJK store code is claimed).
"""

import asyncio
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

NAME = "Jan Aushadhi Kendra - Moodabidri "

KENDRA = {
    "name": NAME,
    "address": "Main Road, Moodabidri, Mangaluru Taluk, Dakshina Kannada - 574227, Karnataka",
    "phone": "",
    "rating": None,
    "is_active": True,
    # GeoJSON order is [longitude, latitude]
    "location": {"type": "Point", "coordinates": [74.9977, 13.0679]},
    "stock": [],
}


async def main() -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    try:
        db = client[settings.DATABASE_NAME]
        if await db["kendras"].find_one({"name": NAME}):
            print("Already exists - nothing to do.")
            return
        doc = {**KENDRA, "created_at": datetime.now(timezone.utc)}
        await db["kendras"].insert_one(doc)
        print(f"Added: {NAME}")
        print("Now run:  python -m scripts.seed_demo_inventory   (gives it demo stock)")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())