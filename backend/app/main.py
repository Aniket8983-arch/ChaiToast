"""
SmartWaste 360 — FastAPI Application
All routes, middleware, background simulation scheduler, and startup events defined here.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from .core.config import settings
from .core.database import create_all_tables, SessionLocal
from .services.seed_service import seed_database
from .api.routes import (
    dashboard, waste, bins, sensors, pickups, vehicles,
    alerts, analytics, compliance, devices, simulation, auth
)


async def background_simulation_loop():
    """
    Background simulation worker loop:
    Periodically executes one step of ultrasonic fill-level simulation across active bins.
    Simulation -> Backend -> Database -> API -> Frontend (Source of Truth).
    """
    while True:
        try:
            await asyncio.sleep(4)  # Step every 4 seconds
            if settings.SIMULATION_ENABLED:
                db = SessionLocal()
                try:
                    from .api.routes.simulation import step_bin_simulation
                    from .models.bin import Bin
                    online_bins = db.query(Bin).filter(Bin.status == "ONLINE").all()
                    for b in online_bins:
                        step_bin_simulation(b.id, db)
                except Exception as e:
                    print(f"[SIMULATION LOOP ERROR] {e}")
                finally:
                    db.close()
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[SIMULATION TASK ERROR] {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # ── Startup ──────────────────────────────────────────────────────────
    print(f"[STARTUP] {settings.APP_NAME} v{settings.APP_VERSION}")
    print("[STARTUP] Creating database tables...")
    create_all_tables()

    print("[STARTUP] Seeding initial data (if empty)...")
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    print("[STARTUP] [OK] Backend ready on http://localhost:8000")
    print("[STARTUP] API docs at http://localhost:8000/docs")

    # Start background simulation loop
    sim_task = asyncio.create_task(background_simulation_loop())

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────
    sim_task.cancel()
    print("[SHUTDOWN] SmartWaste 360 API shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Commercial waste segregation and logistics management platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount all API route groups ────────────────────────────────────────────
app.include_router(dashboard.router,   prefix="/api/dashboard",   tags=["Dashboard"])
app.include_router(waste.router,       prefix="/api/waste",        tags=["Waste"])
app.include_router(bins.router,        prefix="/api/bins",         tags=["Bins"])
app.include_router(sensors.router,     prefix="/api/sensors",      tags=["Sensors"])
app.include_router(pickups.router,     prefix="/api/pickups",      tags=["Pickups"])
app.include_router(vehicles.router,    prefix="/api/vehicles",     tags=["Vehicles"])
app.include_router(alerts.router,      prefix="/api/alerts",       tags=["Alerts"])
app.include_router(analytics.router,   prefix="/api/analytics",    tags=["Analytics"])
app.include_router(compliance.router,  prefix="/api/compliance",   tags=["Compliance"])
app.include_router(devices.router,     prefix="/api/devices",      tags=["Devices"])
app.include_router(simulation.router,  prefix="/api/simulation",   tags=["Simulation"])
app.include_router(auth.router,        prefix="/api/auth",         tags=["Auth"])


@app.get("/", tags=["Root"])
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/api/dashboard/health",
    }
