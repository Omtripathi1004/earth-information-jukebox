"""Backend app package for Earth Information Jukebox."""
import os
from pathlib import Path


def _load_env_file(filepath: Path, override: bool = True) -> None:
    """Load KEY=VALUE pairs from a .env file into os.environ without requiring external packages."""
    if not filepath.is_file():
        return
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if override or k not in os.environ:
                    os.environ[k] = v
    except Exception:
        pass


_root = Path(__file__).resolve().parents[2]
_load_env_file(_root / ".env", override=True)
if not os.environ.get("MAPILLARY_TOKEN") or not os.environ.get("CESIUM_ION_TOKEN"):
    _load_env_file(_root / ".env.example", override=False)

