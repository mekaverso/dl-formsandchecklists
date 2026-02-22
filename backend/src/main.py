from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    from src.core.database import engine
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS — allow all origins in development
    origins = settings.cors_origins
    allow_creds = True
    if settings.app_env in ("development", "dev", "local"):
        origins = ["*"]
        allow_creds = False  # wildcard + credentials is invalid per CORS spec
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=allow_creds,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    from src.auth.router import router as auth_router
    from src.organizations.router import router as org_router
    from src.forms.router import router as forms_router
    from src.responses.router import router as responses_router
    from src.action_plans.router import router as action_plans_router

    api_prefix = "/api/v1"
    app.include_router(auth_router, prefix=api_prefix)
    app.include_router(org_router, prefix=api_prefix)
    app.include_router(forms_router, prefix=api_prefix)
    app.include_router(responses_router, prefix=api_prefix)
    app.include_router(action_plans_router, prefix=api_prefix)

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
