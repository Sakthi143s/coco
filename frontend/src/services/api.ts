import type {
  DashboardOverview,
  LeaderboardResponse,
  Rider,
  Activity,
  RiderAnalytics,
  Challenge
} from '../types';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('cycleclub_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Current Authenticated User
  getCurrentUser: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  // Dashboard Summary
  getDashboardSummary: async (): Promise<{ overview: DashboardOverview; leaderboard_today: LeaderboardResponse }> => {
    const res = await fetch(`${API_BASE}/dashboard/summary`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
  },

  // Riders Management
  getRiders: async (status?: string): Promise<Rider[]> => {
    const url = status && status !== 'all'
      ? `${API_BASE}/riders?status_filter=${status}`
      : `${API_BASE}/riders`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch riders');
    return res.json();
  },

  getRiderById: async (riderId: string): Promise<Rider> => {
    const res = await fetch(`${API_BASE}/riders/${riderId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch rider');
    return res.json();
  },

  updateRiderStatus: async (riderId: string, status: 'active' | 'inactive'): Promise<Rider> => {
    const res = await fetch(`${API_BASE}/riders/${riderId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update rider status');
    return res.json();
  },

  updateRiderLeaderboardOptIn: async (riderId: string, leaderboard_opt_in: boolean): Promise<Rider> => {
    const res = await fetch(`${API_BASE}/riders/${riderId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ leaderboard_opt_in })
    });
    if (!res.ok) throw new Error('Failed to update leaderboard privacy setting');
    return res.json();
  },

  deleteRider: async (riderId: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/riders/${riderId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to delete rider');
    }
    return res.json();
  },

  // Strava Auth Flow
  getStravaAuthUrl: async (userId?: string): Promise<{ authorize_url: string; is_mock: boolean; mode: string }> => {
    const url = userId ? `${API_BASE}/auth/strava?user_id=${userId}` : `${API_BASE}/auth/strava`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to initiate Strava auth');
    return res.json();
  },

  disconnectStrava: async (): Promise<{ message: string; strava_connected: boolean }> => {
    const res = await fetch(`${API_BASE}/auth/strava/disconnect`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to disconnect Strava');
    return res.json();
  },

  // Activities
  getActivities: async (riderId?: string, activityType?: string, limit = 50): Promise<Activity[]> => {
    let url = `${API_BASE}/activities?limit=${limit}`;
    if (riderId) url += `&rider_id=${riderId}`;
    if (activityType && activityType !== 'all') url += `&activity_type=${activityType}`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch activities');
    return res.json();
  },

  syncMyActivities: async (): Promise<{ message: string; new_activities: number; total_activities: number }> => {
    const res = await fetch(`${API_BASE}/activities/sync`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to sync Strava activities');
    }
    return res.json();
  },

  syncRiderActivities: async (riderId: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/activities/sync/${riderId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Failed to sync Strava activities');
    }
    return res.json();
  },

  // Leaderboards
  getLeaderboard: async (timeframe: string, category: string): Promise<LeaderboardResponse> => {
    const res = await fetch(`${API_BASE}/leaderboards?timeframe=${timeframe}&category=${category}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
  },

  // Rider Profile Analytics
  getRiderAnalytics: async (riderId: string): Promise<RiderAnalytics> => {
    const res = await fetch(`${API_BASE}/analytics/rider/${riderId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch rider analytics');
    return res.json();
  },

  // Challenges
  getChallenges: async (): Promise<Challenge[]> => {
    const res = await fetch(`${API_BASE}/challenges`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch challenges');
    return res.json();
  },

  joinChallenge: async (challengeId: string, riderId: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/challenges/${challengeId}/join/${riderId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to join challenge');
    return res.json();
  }
};
