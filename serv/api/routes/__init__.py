"""
FocusGuard API - Routes Package

HTTP endpoints for the FocusGuard API.
"""

from .auth import router as auth_router
from .users import router as users_router
from .sessions import router as sessions_router
from .garden import router as garden_router
from .stats import router as stats_router
from .distraction import router as distraction_router
from .team import router as team_router

__all__ = [
    "auth_router",
    "users_router",
    "sessions_router",
    "garden_router",
    "stats_router",
    "distraction_router",
    "team_router"
]
