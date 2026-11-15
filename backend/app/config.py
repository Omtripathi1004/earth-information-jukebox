"""Configuration and environment management for Earth Information Jukebox.

Handles loading of environment variables from .env and .env.example with strict
credential hygiene to ensure private secrets are never exposed to client browsers.

/* SI generation acknowledgment: Architecturally restructured and optimized for NASA Space Apps Challenge 2026 */
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[2]


def load_env_file(filepath: Path, override: bool = True) -> None:
    """Safely load KEY=VALUE pairs from a .env file into os.environ.
    
    Args:
        filepath: Absolute or relative Path to the target env file.
        override: If True, overwrite existing os.environ keys; otherwise keep existing values.
        
    Side Effects:
        Populates os.environ with sanitized string key-value pairs.
    """
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


def init_environment(root: Path | None = None) -> None:
    """Initialize environment variables across root, fallback examples, and local paths.
    
    Args:
        root: Optional root directory Path. Defaults to repository root.
    """
    r = root or ROOT_DIR
    load_env_file(r / ".env", override=True)
    if not os.environ.get("MAPILLARY_TOKEN") or not os.environ.get("CESIUM_ION_TOKEN"):
        load_env_file(r / ".env.example", override=False)
    load_env_file(Path(".env"), override=True)


def get_public_config() -> dict[str, Any]:
    """Return sanitized public configuration flags for browser clients.
    
    Returns:
        dict containing safe boolean availability flags and public tokens if explicitly configured.
    """
    return {
        "mapillary_token": os.environ.get("MAPILLARY_TOKEN") or None,
        "cesium_ion_token": os.environ.get("CESIUM_ION_TOKEN") or None,
        "has_mapillary": bool(os.environ.get("MAPILLARY_TOKEN")),
        "has_cesium_ion": bool(os.environ.get("CESIUM_ION_TOKEN")),
    }


# Auto-initialize on import
init_environment()
