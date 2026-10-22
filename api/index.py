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
        # Debug environ
        headers = {k: v for k, v in environ.items() if k.startswith("HTTP_") or k in ("PATH_INFO", "RAW_URI", "REQUEST_URI")}
        print(f"VERCEL DEBUG HEADERS: {headers}", flush=True)

        path = (
            environ.get("HTTP_X_FORWARDED_URI")
            or environ.get("HTTP_X_MATCHED_PATH")
            or environ.get("HTTP_X_REAL_IP")
            or environ.get("RAW_URI")
        )
        # Check if incoming request path in header
        x_now_route = environ.get("HTTP_X_VERCEL_SC_PATH") or environ.get("HTTP_X_NOW_ROUTE_MATCHES")
        if x_now_route:
            print(f"NOW_ROUTE: {x_now_route}", flush=True)

        if path and path != "/api/index.py":
            environ["PATH_INFO"] = path.split("?")[0]
        return self.wsgi_app(environ, start_response)


app.wsgi_app = VercelPathMiddleware(app.wsgi_app)
