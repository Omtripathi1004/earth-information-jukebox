import sys
from pathlib import Path

# Add project root to sys.path so backend modules are importable
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.main import app


class VercelPathMiddleware:
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        # Vercel forwards the real incoming path in HTTP headers
        path = (
            environ.get("HTTP_X_FORWARDED_URI")
            or environ.get("HTTP_X_MATCHED_PATH")
            or environ.get("RAW_URI")
        )
        if path:
            environ["PATH_INFO"] = path.split("?")[0]
        return self.wsgi_app(environ, start_response)


app.wsgi_app = VercelPathMiddleware(app.wsgi_app)
