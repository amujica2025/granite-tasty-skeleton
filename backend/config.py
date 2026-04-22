from dotenv import load_dotenv
import os
from tastytrade import Session

load_dotenv()

CLIENT_SECRET = os.getenv("TASTY_CLIENT_SECRET")
REFRESH_TOKEN = os.getenv("TASTY_REFRESH_TOKEN")
IS_SANDBOX = os.getenv("TASTY_SANDBOX", "false").lower() == "true"

if not CLIENT_SECRET or not REFRESH_TOKEN:
    raise ValueError("❌ Missing TASTY_CLIENT_SECRET or TASTY_REFRESH_TOKEN in .env!")

print(f"🔄 Creating fresh Session (Sandbox: {IS_SANDBOX})...")

session = Session(
    provider_secret=CLIENT_SECRET,
    refresh_token=REFRESH_TOKEN,
    is_test=IS_SANDBOX
)

print(f"✅ Fresh Tastytrade Session created (Sandbox: {IS_SANDBOX})")