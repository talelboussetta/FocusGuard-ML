"""
FocusGuard API Schemas Package

Exports all Pydantic models for request/response validation.
"""

from .auth import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    TokenResponse,
    RefreshTokenRequest,
    TokenPayload,
    LogoutResponse
)

from .user import (
    UserCreate,
    UserUpdate,
    PasswordChange,
    UserInDB,
    UserResponse,
    UserPublic,
    UserWithStats,
    UserDeleteResponse,
    UserUpdateResponse
)

from .session import (
    SessionCreate,
    SessionUpdate,
    SessionResponse,
    SessionInDB,
    SessionListResponse,
    ActiveSessionResponse,
    SessionWithGarden,
    SessionDeleteResponse
)

from .garden import (
    PlantType,
    GardenCreate,
    GardenUpdate,
    GardenResponse,
    GardenInDB,
    GardenListResponse,
    GardenStats,
    GardenDeleteResponse
)

from .stats import (
    UserStatsResponse,
    UserStatsInDB,
    DailyStats,
    DailyStatsResponse,
    TrendStats,
    TrendsResponse,
    PlatformSummary,
    LeaderboardEntry,
    LeaderboardResponse
)

from .distraction import (
    EventType,
    Severity,
    DistractionEventCreate,
    DistractionEventResponse,
    DistractionEventList,
    DistractionStats,
    DetectionFrame,
    MonitoringSessionStart,
    MonitoringSessionStop,
    AlertNotification
)

__all__ = [
    # Auth schemas
    "RegisterRequest",
    "RegisterResponse",
    "LoginRequest",
    "LoginResponse",
    "TokenResponse",
    "RefreshTokenRequest",
    "TokenPayload",
    "LogoutResponse",
    "AuthUserResponse",
    
    # User schemas
    "UserCreate",
    "UserUpdate",
    "PasswordChange",
    "UserInDB",
    "UserResponse",
    "UserPublic",
    "UserWithStats",
    "UserDeleteResponse",
    "UserUpdateResponse",
    
    # Session schemas
    "SessionCreate",
    "SessionUpdate",
    "SessionResponse",
    "SessionInDB",
    "SessionListResponse",
    "ActiveSessionResponse",
    "SessionWithGarden",
    "SessionDeleteResponse",
    
    # Garden schemas
    "PlantType",
    "GardenCreate",
    "GardenUpdate",
    "GardenResponse",
    "GardenInDB",
    "GardenListResponse",
    "GardenStats",
    "GardenDeleteResponse",
    
    # Stats schemas
    "UserStatsResponse",
    "UserStatsInDB",
    "DailyStats",
    "DailyStatsResponse",
    "TrendStats",
    "TrendsResponse",
    "PlatformSummary",
    "LeaderboardEntry",
    "LeaderboardResponse",
    
    # Distraction schemas
    "EventType",
    "Severity",
    "DistractionEventCreate",
    "DistractionEventResponse",
    "DistractionEventList",
    "DistractionStats",
    "DetectionFrame",
    "MonitoringSessionStart",
    "MonitoringSessionStop",
    "AlertNotification",
]

# Rebuild auth models to resolve forward references
from .auth import rebuild_models
rebuild_models()
