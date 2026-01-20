/**
 * FocusGuard API Service
 * 
 * Centralized API client for all backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============================================================================
// Types
// ============================================================================

export interface User {
  user_id: string;
  username: string;
  email: string;
  full_name?: string;
  bio?: string;
  xp: number;
  lvl: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  session_id: string;
  user_id: string;
  planned_duration: number;
  actual_duration: number;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
  completed_at?: string;
  xp_earned: number;
  focus_score?: number;
}

export interface Garden {
  garden_id: string;
  user_id: string;
  total_plants: number;
  rare_plants: number;
  epic_plants: number;
  legendary_plants: number;
  last_plant_at?: string;
}

export interface UserStats {
  user_id: string;
  total_focus_min: number;
  total_sessions: number;
  current_streak: number;
  longest_streak: number;
  avg_focus_per_session: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  value: number;
  lvl?: number;
}

export interface DailyStats {
  date: string;
  focus_min: number;
  sessions_completed: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// ============================================================================
// Authentication API
// ============================================================================

export const authAPI = {
  async register(username: string, email: string, password: string, full_name?: string) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, full_name }),
    });
    return handleResponse<{
      user: User;
      access_token: string;
      refresh_token: string;
      token_type: string;
    }>(response);
  },

  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse<{
      user: User;
      access_token: string;
      refresh_token: string;
      token_type: string;
    }>(response);
  },

  async refreshToken(refreshToken: string) {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return handleResponse<{
      access_token: string;
      token_type: string;
    }>(response);
  },

  async logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};

// ============================================================================
// User API
// ============================================================================

export const userAPI = {
  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeader(),
    });
    return handleResponse<User>(response);
  },

  async updateProfile(data: { full_name?: string; bio?: string }) {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse<User>(response);
  },

  async changePassword(current_password: string, new_password: string) {
    const response = await fetch(`${API_BASE_URL}/users/me/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ current_password, new_password }),
    });
    return handleResponse<{ message: string }>(response);
  },

  async deleteAccount() {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return response.ok;
  },

  async getStats() {
    const response = await fetch(`${API_BASE_URL}/users/me/stats`, {
      headers: getAuthHeader(),
    });
    return handleResponse<UserStats>(response);
  },
};

// ============================================================================
// Session API
// ============================================================================

export const sessionAPI = {
  async create(planned_duration: number) {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ planned_duration }),
    });
    return handleResponse<Session>(response);
  },

  async list(params?: { status?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE_URL}/sessions?${query}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<Session[]>(response);
  },

  async getActive() {
    const response = await fetch(`${API_BASE_URL}/sessions/active`, {
      headers: getAuthHeader(),
    });
    return handleResponse<Session | null>(response);
  },

  async getById(sessionId: string) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<Session>(response);
  },

  async complete(sessionId: string, actual_duration: number, focus_score?: number) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/complete`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ actual_duration, focus_score }),
    });
    return handleResponse<Session>(response);
  },

  async abandon(sessionId: string) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/abandon`, {
      method: 'PATCH',
      headers: getAuthHeader(),
    });
    return handleResponse<Session>(response);
  },

  async delete(sessionId: string) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return response.ok;
  },
};

// ============================================================================
// Garden API
// ============================================================================

export const gardenAPI = {
  async get() {
    const response = await fetch(`${API_BASE_URL}/garden`, {
      headers: getAuthHeader(),
    });
    return handleResponse<Garden>(response);
  },

  async growPlant(sessionId: string) {
    const response = await fetch(`${API_BASE_URL}/garden/grow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ session_id: sessionId }),
    });
    return handleResponse<{
      plant_type: string;
      message: string;
      garden: Garden;
    }>(response);
  },

  async reset() {
    const response = await fetch(`${API_BASE_URL}/garden/reset`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return handleResponse<{
      message: string;
      garden: Garden;
    }>(response);
  },
};

// ============================================================================
// Statistics API
// ============================================================================

export const statsAPI = {
  async getDailyStats(days: number = 7) {
    const response = await fetch(`${API_BASE_URL}/stats/daily?days=${days}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<{
      stats: DailyStats[];
      total_days: number;
    }>(response);
  },

  async getTrends() {
    const response = await fetch(`${API_BASE_URL}/stats/trends`, {
      headers: getAuthHeader(),
    });
    return handleResponse<{
      this_week: {
        total_focus_min: number;
        sessions_completed: number;
        avg_focus_score: number;
      };
      last_week: {
        total_focus_min: number;
        sessions_completed: number;
        avg_focus_score: number;
      };
      this_month: any;
      last_month: any;
    }>(response);
  },

  async getLeaderboard(metric: 'xp' | 'focus_time' | 'streak' = 'xp', limit: number = 10) {
    const response = await fetch(
      `${API_BASE_URL}/stats/leaderboard?metric=${metric}&limit=${limit}`,
      {
        headers: getAuthHeader(),
      }
    );
    return handleResponse<{
      leaderboard: LeaderboardEntry[];
      current_user_rank?: number;
      total_users: number;
      metric: string;
    }>(response);
  },

  async getUserRank(metric: 'xp' | 'focus_time' | 'streak' = 'xp') {
    const response = await fetch(`${API_BASE_URL}/stats/leaderboard/me?metric=${metric}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<{
      rank: number;
      total_users: number;
      metric: string;
      value: number;
    }>(response);
  },
};

// ============================================================================
// Health Check
// ============================================================================

export const healthAPI = {
  async check() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<{
      status: string;
      database: string;
      timestamp: string;
    }>(response);
  },
};
