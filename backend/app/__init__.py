"""Backend app package for Earth Information Jukebox."""
from pathlib import Path

try:
    from dotenv import load_dotenv

    _root = Path(__file__).resolve().parents[2]
    load_dotenv(_root / ".env")
except ImportError:
    pass
