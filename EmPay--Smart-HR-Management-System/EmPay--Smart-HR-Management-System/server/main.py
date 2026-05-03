"""
Main FastAPI application for EmPay backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .config.database import Base, engine
from .routers import router as auth_router

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="EmPay API",
    description="Smart HR Management System API",
    version="1.0.0",
)

# Create database tables
Base.metadata.create_all(bind=engine)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - API status"""
    return {
        "message": "EmPay API Server",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "EmPay Backend",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server.main:app",
        host="0.0.0.0",
        port=5000,
        reload=True,
    )
