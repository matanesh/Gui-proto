"""Ops Command Center — FastAPI Backend-For-Frontend (BFF).

Thin translation layer between the browser (REST + SSE) and the messaging
backbone (RabbitMQ) that fronts the Python Core. Sanitized: no real system
names, endpoints, or secrets. See docs/HLD.md and docs/API_CONTRACT.md.
"""

__version__ = "0.1.0"
