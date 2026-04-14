Backend — Taxi Registration & Inspection API

This folder contains a FastAPI starter for the Taxi Registration & Inspection MVP.

Structure

- `app/main.py` — FastAPI app entrypoint
- `app/api/` — API routers (auth, vehicles, ...)
- `app/models.py` — SQLAlchemy models
- `app/schemas.py` — Pydantic schemas
- `.env.example` — example environment variables
- `requirements.txt` — Python deps

Next steps

- Use Poetry to manage dependencies and virtual environments
- Implement DB connection and migrations (Alembic)
- Expand API routers with auth and CRUD

Quick start (Poetry)

1. Install Poetry: follow https://python-poetry.org/docs/

2. From the `backend` folder install dependencies:

```bash
cd backend
poetry install
```

3. Run the app during development:

```bash
poetry run uvicorn app.main:app --reload
```

4. Create an initial Alembic migration (after verifying `DATABASE_URL` in `.env`):

```bash
poetry run alembic revision --autogenerate -m "init"
poetry run alembic upgrade head
```

Notes

- The project includes an Alembic `env.py` that reads `DATABASE_URL` from environment.
- For development the app creates tables on startup; prefer migrations for production.
  Backend — Taxi Registration & Inspection API

This folder contains a FastAPI starter for the Taxi Registration & Inspection MVP.

Structure

- `app/main.py` — FastAPI app entrypoint
- `app/api/` — API routers (auth, vehicles, ...)
- `app/models.py` — SQLAlchemy models
- `app/schemas.py` — Pydantic schemas
- `.env.example` — example environment variables
- `requirements.txt` — Python deps

Next steps

- Create a virtualenv and install the dependencies
- Implement DB connection and migrations (Alembic)
- Expand API routers with auth and CRUD

Keep-alive automation (optional)

- A scheduled GitHub Actions workflow is included at `.github/workflows/keepalive-render.yml`.
- It pings a DB-backed endpoint every 6 hours to reduce inactivity pauses.
- Default endpoint: `https://traffic-cl4o.onrender.com/vehicles/stats/summary`
- If your Render URL changes, update `KEEP_ALIVE_URL` in that workflow file.
