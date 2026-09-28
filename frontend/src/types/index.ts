export interface Rider {
  id: string;
  email: string;
  name?: string;
  full_name: string;
  avatar_url?: string;
  profile_image?: string;
  role: 'OWNER' | 'MEMBER' | 'admin' | 'member';
  status: 'active' | 'inactive';
  leaderboard_opt_in?: boolean;
  strava_athlete_id?: string;
  strava_connection_status: 'connected' | 'disconnected';
  joined_date: string;
  total_rides: number;
  total_distance_km: number;
  total_elevation_m: number;
  total_moving_time_hrs: number;
}

export interface Activity {
  id: string;
  strava_activity_id: string;
  user_id?: string;
  rider_id: string;
  rider_name: string;
  rider_avatar?: string;
  activity_type: string;
  name?: string;
  activity_name: string;
  distance: number; // km
  moving_time: number; // sec
  elapsed_time: number; // sec
  elevation_gain: number; // m
  average_speed: number; // km/h
  max_speed: number; // km/h
  calories: number;
  start_date: string;
  start_latitude?: number;
  start_longitude?: number;
  strava_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardOverview {
  total_active_riders: number;
  rides_today: number;
  distance_today_km: number;
  elevation_today_m: number;
  moving_time_today_sec: number;
  moving_time_today_formatted: string;
  weekly_distance_km: number;
  monthly_distance_km: number;
}

export interface LeaderboardEntry {
  rank: number;
  rider_id: string;
  rider_name: string;
  rider_avatar?: string;
  distance_km: number;
  elevation_m: number;
  moving_time_sec: number;
  moving_time_formatted: string;
  average_speed_kmh: number;
  ride_count: number;
  max_single_distance_km: number;
  strava_athlete_id?: string;
}

export interface LeaderboardResponse {
  timeframe: string;
  category: string;
  updated_at: string;
  entries: LeaderboardEntry[];
}

export interface ChartPoint {
  [key: string]: string | number;
}

export interface RiderAnalytics {
  rider: Rider;
  total_rides: number;
  total_distance_km: number;
  total_elevation_m: number;
  total_moving_time_sec: number;
  total_moving_time_formatted: string;
  average_speed_kmh: number;
  longest_ride_km: number;
  avg_distance_per_ride_km: number;
  distance_over_time: Array<{ date: string; distance: number; elevation: number }>;
  weekly_distance: Array<{ week: string; distance: number }>;
  monthly_distance: Array<{ month: string; distance: number }>;
  elevation_trend: Array<{ date: string; elevation: number }>;
  ride_frequency: Array<{ day: string; count: number }>;
  recent_activities: Activity[];
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  challenge_type: string;
  target_metric: string;
  target_value: number;
  start_date: string;
  end_date: string;
  status: string;
  participant_count: number;
  top_participants: Array<{
    rider_id: string;
    rider_name: string;
    rider_avatar?: string;
    progress: number;
    completed: boolean;
  }>;
}
