import sys
from pathlib import Path
from urllib.parse import parse_qs, urlencode

# Add project root to sys.path so backend modules are importable
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.main import app


class VercelPathMiddleware:
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        qs_str = environ.get("QUERY_STRING", "")
        if "__path__=" in qs_str:
            qs = parse_qs(qs_str, keep_blank_values=True)
            if "__path__" in qs:
                path = qs.pop("__path__")[0]
                environ["PATH_INFO"] = path
                flat_qs = [(k, v) for k, vs in qs.items() for v in vs]
                environ["QUERY_STRING"] = urlencode(flat_qs)
        return self.wsgi_app(environ, start_response)


app.wsgi_app = VercelPathMiddleware(app.wsgi_app)
