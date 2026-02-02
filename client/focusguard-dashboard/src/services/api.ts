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
  xp_points: number;  // Backend uses xp_points, not xp
  lvl: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;  // UUID from backend
  user_id: string;  // UUID from backend
  completed: boolean;
  duration_minutes?: number;  // Planned duration (15, 25, 45, 60 for Pomodoro)
  blink_rate?: number;  // AI analysis
  created_at: string;
}

export interface ActiveSessionResponse {
  has_active: boolean;
  session: Session | null;
}

export interface SessionListResponse {
  sessions: Session[];
  total: number;
  completed_count: number;
  incomplete_count: number;
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

export interface TeamLeaderboardEntry {
  rank: number;
  team_id: string;
  team_name: string;
  value: number; // team metric (xp / focus_time / sessions)
  members?: number;
}

export interface DailyStats {
  date: string;
  focus_min: number;
  sessions_completed: number;
}

export interface SourceDocument {
  content: string;
  source: string;
  section_title: string;
  score: number;
  category?: string;
}

export interface RAGQueryResponse {
  answer: string;
  sources?: SourceDocument[];
  query: string;
  model_used: string;
}

export interface RAGQueryRequest {
  query: string;
  top_k?: number;
  include_sources?: boolean;
  category_filter?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Helper function to safely extract error message
export function getErrorMessage(error: any, fallback: string = 'An error occurred'): string {
  if (!error) return fallback;
  
  // If it's already a string, return it
  if (typeof error === 'string') return error;
  
  // If it has a message property, use it
  if (error.message && typeof error.message === 'string') return error.message;
  
  // If it has a detail property (FastAPI errors)
  if (error.detail) {
    if (typeof error.detail === 'string') return error.detail;
    if (Array.isArray(error.detail)) {
      return error.detail.map((e: any) => 
        typeof e === 'string' ? e : e.msg || JSON.stringify(e)
      ).join(', ');
    }
  }
  
  // If it has an error property
  if (error.error && typeof error.error === 'string') return error.error;
  
  // Last resort - try to stringify, but avoid [object Object]
  try {
    const str = JSON.stringify(error);
    return str !== '{}' && str !== '[object Object]' ? str : fallback;
  } catch {
    return fallback;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      
      // Extract error message from various possible formats
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData.detail) {
        // FastAPI typically uses 'detail' for error messages
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (typeof errorData.detail === 'object' && errorData.detail.message) {
          // Backend returns detail as object with message property
          errorMessage = errorData.detail.message;
        } else if (Array.isArray(errorData.detail)) {
          // Validation errors are arrays
          errorMessage = errorData.detail.map((err: any) => 
            typeof err === 'string' ? err : err.msg || JSON.stringify(err)
          ).join(', ');
        } else {
          errorMessage = JSON.stringify(errorData.detail);
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // If JSON parsing fails, use the status text
      console.error('Failed to parse error response:', e);
    }
    
    throw new Error(errorMessage);
  }
  return response.json();
}

// ============================================================================
// Authentication API
// ============================================================================

export const authAPI = {
  async register(username: string, email: string, password: string, full_name?: string) {
    try {
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
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  },

  async login(username: string, password: string) {
    try {
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
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
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
      body: JSON.stringify({ duration_min: planned_duration }),
    });
    return handleResponse<Session>(response);
  },

  async list(params?: { status?: string; limit?: number; offset?: number }): Promise<Session[]> {
    const query = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE_URL}/sessions?${query}`, {
      headers: getAuthHeader(),
    });
    const data = await handleResponse<SessionListResponse>(response);
    return data.sessions;
  },

  async getActive(): Promise<Session | null> {
    const response = await fetch(`${API_BASE_URL}/sessions/active`, {
      headers: getAuthHeader(),
    });
    const data = await handleResponse<ActiveSessionResponse>(response);
    return data.session;
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
    const response = await fetch(`${API_BASE_URL}/garden/stats`, {
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
      deleted_count: number;
    }>(response);
  },

  async plantSingle(sessionId: string) {
    const response = await fetch(`${API_BASE_URL}/garden/plant/${sessionId}`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return handleResponse<{
      plant_num: number;
      plant_type: string;
      rarity: string;
      total_plants: number;
      message: string;
    }>(response);
  },

  async getPlants(limit: number = 100) {
    const response = await fetch(`${API_BASE_URL}/garden?limit=${limit}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<{
      gardens: Array<{
        id: string;
        plant_num: number;
        plant_type: string;
        growth_stage: number;
        created_at: string;
      }>;
      total: number;
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
      daily_stats: DailyStats[];
      total_days: number;
      total_focus_min: number;
      total_sessions: number;
      average_focus_per_day: number;
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

  async getLeaderboard(metric: 'xp' | 'sessions' | 'focus_time' | 'streak' = 'xp', limit: number = 10, teamId?: string) {
    const params = new URLSearchParams({ metric, limit: String(limit) })
    if (teamId) params.set('team_id', teamId)
    const response = await fetch(`${API_BASE_URL}/stats/leaderboard?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<{
      leaderboard: LeaderboardEntry[];
      current_user_rank?: number;
      total_users: number;
      metric: string;
    }>(response);
  },

  async getTeamLeaderboard(metric: 'xp' | 'sessions' | 'focus_time' | 'streak' = 'xp', limit: number = 10) {
    const response = await fetch(`${API_BASE_URL}/stats/leaderboard/teams?metric=${metric}&limit=${limit}`, {
      headers: getAuthHeader(),
    })

    return handleResponse<{
      leaderboard: TeamLeaderboardEntry[];
      total_teams?: number;
      metric: string;
    }>(response)
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

// ============================================================================
// Team API
// ============================================================================

export interface Team {
  team_id: string;
  team_name: string;
  created_at: string;
  updated_at: string;
  total_members: number;
  total_xp: number;
  total_sessions_completed: number;
}

export interface TeamMember {
  user_id: string;
  username: string;
  joined_at: string;
}

export interface TeamDetail extends Team {
  members: TeamMember[];
}

export interface UserTeam {
  team_id: string;
  team_name: string;
  joined_at: string;
  total_members: number;
  total_xp: number;
  total_sessions_completed: number;
}

export interface TeamMessage {
  message_id: string;
  team_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  type: string;
  is_edited: boolean;
}

export interface TeamMessageCreate {
  content: string;
  type?: string;
}

export interface TeamMessagesListResponse {
  messages: TeamMessage[];
}

export const teamAPI = {
  async createTeam(team_name: string) {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ team_name }),
    });
    return handleResponse<Team>(response);
  },

  async joinTeam(team_id: string) {
    const response = await fetch(`${API_BASE_URL}/teams/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ team_id }),
    });
    return handleResponse<Team>(response);
  },

  async leaveTeam(team_id: string) {
    const response = await fetch(`${API_BASE_URL}/teams/${team_id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return response.ok;
  },

  async getTeam(team_id: string) {
    const response = await fetch(`${API_BASE_URL}/teams/${team_id}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<TeamDetail>(response);
  },

  async getMyTeam() {
    const response = await fetch(`${API_BASE_URL}/teams/me/current`, {
      headers: getAuthHeader(),
    });
    return handleResponse<UserTeam>(response);
  },

  async listTeams(limit: number = 20, offset: number = 0) {
    const response = await fetch(`${API_BASE_URL}/teams?limit=${limit}&offset=${offset}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<Team[]>(response);
  },

  // Team Messages
  async sendMessage(team_id: string, data: TeamMessageCreate) {
    const response = await fetch(`${API_BASE_URL}/teams/${team_id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse<TeamMessage>(response);
  },

  async getMessages(team_id: string, limit: number = 50, offset: number = 0) {
    const response = await fetch(`${API_BASE_URL}/teams/${team_id}/messages?limit=${limit}&offset=${offset}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<TeamMessagesListResponse>(response);
  },

  async getMessageById(team_id: string, message_id: string) {
    const response = await fetch(`${API_BASE_URL}/teams/${team_id}/messages/${message_id}`, {
      headers: getAuthHeader(),
    });
    return handleResponse<TeamMessage>(response);
  },

  async deleteMessage(team_id: string, message_id: string) {
    const response = await fetch(`${API_BASE_URL}/teams/${team_id}/messages/${message_id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return response.ok;
  },

  async cleanupOldMessages(team_id: string, days: number) {
    const response = await fetch(`${API_BASE_URL}/teams/${team_id}/messages/cleanup/older-than/${days}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return response.ok;
  },
};

// ============================================================================
// RAG (AI Assistant) API
// ============================================================================

export const ragAPI = {
  async query(data: RAGQueryRequest) {
    const response = await fetch(`${API_BASE_URL}/rag/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<RAGQueryResponse>(response);
  },
};
