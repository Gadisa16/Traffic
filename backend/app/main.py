from .db import create_tables
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import traceback

app = FastAPI(title="Taxi Registration API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok"}


@app.on_event("startup")
def on_startup():
    # ensure tables exist during development; use Alembic for migrations
    try:
        create_tables()
    except Exception:
        pass


uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
try:
    os.makedirs(uploads_dir, exist_ok=True)
except Exception:
    pass
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.exception_handler(ResponseValidationError)
async def response_validation_exception_handler(request, exc: ResponseValidationError):
    # log the full validation error for debugging
    print("ResponseValidationError:")
    traceback.print_exc()
    # attempt to print pydantic validation details and the problematic body
    try:
        errs = exc.errors() if callable(getattr(exc, 'errors', None)
                                        ) else getattr(exc, 'errors', None)
        print("Validation errors:", errs)
    except Exception:
        try:
            print("ResponseValidationError repr:", repr(exc))
        except Exception:
            pass
    try:
        body = getattr(exc, 'body', None)
        print("Response body:", body)
    except Exception:
        pass
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request, exc: RequestValidationError):
    print("RequestValidationError:")
    traceback.print_exc()
    return JSONResponse(status_code=400, content={"detail": exc.errors()})


# Routers will be included here
try:
    from .api import auth, vehicles, owners, inspections  # noqa: E402
    app.include_router(auth.router)
    app.include_router(vehicles.router)
    app.include_router(owners.router)
    app.include_router(inspections.router)
except Exception as e:
    # Log import errors so they are visible during development
    import traceback
    tb = traceback.format_exc()
    print("Failed to include API routers:\n", tb)
    # Re-raise to make the error explicit during startup
    raise
