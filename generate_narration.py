"""ElevenLabs Text-to-Speech narration generator.

Usage:
    python generate_narration.py
    python generate_narration.py --api-key YOUR_API_KEY
    python generate_narration.py --text "Custom narration text here"
"""
import argparse
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ENV_PATH = ROOT / ".env"

# 1. Safely load .env without hard dependency on python-dotenv
def load_env_file(filepath: Path) -> None:
    if not filepath.exists():
        return
    try:
        from dotenv import load_dotenv  # type: ignore
        load_dotenv(filepath)
    except ImportError:
        # Fallback manual parser if python-dotenv is not installed
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("'\"")
                    if k and k not in os.environ:
                        os.environ[k] = v
        except Exception:
            pass

load_env_file(ENV_PATH)

# 2. Check for elevenlabs package
try:
    from elevenlabs.client import ElevenLabs  # type: ignore
    from elevenlabs import save  # type: ignore
except ImportError:
    print("=" * 60)
    print("[ERROR] Missing required package: 'elevenlabs'")
    print("Please install the dependencies by running:")
    print("    pip install elevenlabs python-dotenv")
    print("=" * 60)
    sys.exit(1)


def parse_args():
    parser = argparse.ArgumentParser(description="Generate narration audio using ElevenLabs.")
    parser.add_argument("--api-key", dest="api_key", default=None, help="ElevenLabs API key")
    parser.add_argument("--voice-id", dest="voice_id", default="NOpBlnGInO9m6vDvFkFC", help="Voice ID")
    parser.add_argument(
        "--model-id",
        dest="model_id",
        default=os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2"),
        help="ElevenLabs Model ID (default: eleven_multilingual_v2)",
    )
    parser.add_argument("--text", dest="text", default=None, help="Narration text")
    parser.add_argument(
        "--output",
        dest="output",
        default=str(ROOT / "assets" / "narration.mp3"),
        help="Output audio path (default: assets/narration.mp3)",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    api_key = args.api_key or os.getenv("ELEVENLABS_API_KEY", "").strip()

    # Prompt interactively if key is not found
    if not api_key:
        print("=" * 60)
        print("ElevenLabs API Key is not set.")
        print("=" * 60)
        try:
            entered_key = input("Please enter your ElevenLabs API Key (or press Enter to cancel): ").strip()
            if entered_key:
                api_key = entered_key
                # Save into .env for future runs
                env_content = ""
                if ENV_PATH.exists():
                    with open(ENV_PATH, "r", encoding="utf-8") as f:
                        env_content = f.read()
                if "ELEVENLABS_API_KEY=" in env_content:
                    lines = [
                        f"ELEVENLABS_API_KEY={api_key}" if l.startswith("ELEVENLABS_API_KEY=") else l
                        for l in env_content.splitlines()
                    ]
                    with open(ENV_PATH, "w", encoding="utf-8") as f:
                        f.write("\n".join(lines) + "\n")
                else:
                    with open(ENV_PATH, "a", encoding="utf-8") as f:
                        f.write(f"\nELEVENLABS_API_KEY={api_key}\n")
                print(f"[OK] Saved ELEVENLABS_API_KEY to {ENV_PATH.name}")
            else:
                print("[INFO] No API key entered.")
                print("You can set it in your .env file:")
                print("    ELEVENLABS_API_KEY=your_key_here")
                print("Or pass it via command line:")
                print("    python generate_narration.py --api-key YOUR_API_KEY")
                sys.exit(0)
        except (EOFError, KeyboardInterrupt):
            print("\n[INFO] Cancelled.")
            sys.exit(0)

    # Narration text
    default_text = (
        "Welcome to the Earth Information Jukebox. Orbiting hundreds of kilometers above, "
        "NASA satellites capture the rhythm of our living planet—from the shifting currents "
        "of the oceans to the pulse of ancient rainforests. Listen closely as Earth's data "
        "transforms into sound and story."
    )
    text = args.text or default_text
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    client = ElevenLabs(api_key=api_key)
    voice_id = args.voice_id
    model_id = args.model_id

    print(f"Generating audio with voice '{voice_id}' using model '{model_id}'...")

    try:
        audio = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id=model_id,
            language_code="en",
        )

        save(audio, str(output_path))
        print(f"[SUCCESS] Audio successfully generated and saved to:")
        print(f"  {output_path}")

    except Exception as e:
        err_msg = str(e)
        # Fallback to eleven_turbo_v2_5 or eleven_monolingual_v1 if model fails
        if "model" in err_msg.lower() and model_id != "eleven_turbo_v2_5":
            print(f"[WARN] Model '{model_id}' failed. Retrying with 'eleven_turbo_v2_5'...")
            try:
                audio = client.text_to_speech.convert(
                    voice_id=voice_id,
                    text=text,
                    model_id="eleven_turbo_v2_5",
                    language_code="en",
                )
                save(audio, str(output_path))
                print(f"[SUCCESS] Audio successfully generated and saved to:")
                print(f"  {output_path}")
                return
            except Exception as fallback_err:
                print(f"[ERROR] Fallback generation also failed: {fallback_err}")
                sys.exit(1)
        else:
            print(f"[ERROR] Generation failed: {e}")
            if "401" in err_msg or "unauthorized" in err_msg.lower():
                print("[HINT] Please verify your ELEVENLABS_API_KEY.")
            sys.exit(1)


if __name__ == "__main__":
    main()


if __name__ == "__main__":
    main()

