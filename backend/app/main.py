"""FastAPI Application Entry Point for ForestVision AI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI(
    title="ForestVision AI - Canopy Intelligence API",
    description="Production-grade API for high-resolution satellite tree crown detection and canopy estimation.",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "name": "ForestVision AI Canopy Intelligence Platform",
        "status": "operational",
        "version": "2.4.0-prod-sat",
        "docs": "/docs",
        "analysis_endpoint": "/api/analyze",
        "samples_endpoint": "/api/samples",
        "health_endpoint": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
