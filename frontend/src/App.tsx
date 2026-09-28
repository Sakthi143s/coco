import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { RidersPage } from './pages/RidersPage';
import { RiderProfilePage } from './pages/RiderProfilePage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CheckCircle2, AlertCircle, RefreshCw, Flame } from 'lucide-react';
import type { 
  DashboardOverview, 
  LeaderboardResponse, 
  Rider, 
  Activity 
} from './types';
import { api } from './services/api';

function MainApp() {
  const { user, token, loading: authLoading, refreshUser, disconnectStrava } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  
  // Dashboard & State Data
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [todayLeaderboard, setTodayLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('today');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check URL query parameters (e.g. after Strava OAuth redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('strava_connected') === 'true') {
      setNotice({
        type: 'success',
        message: 'Strava account successfully connected! You can now sync your real activities.'
      });
      refreshUser();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('strava_error')) {
      const err = params.get('strava_error');
      setNotice({
        type: 'error',
        message: `Strava connection error: ${err}`
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadData = async () => {
    try {
      const [dashData, ridersData, activitiesData] = await Promise.all([
        api.getDashboardSummary(),
        api.getRiders(),
        api.getActivities(undefined, undefined, 100)
      ]);

      setOverview(dashData.overview);
      setTodayLeaderboard(dashData.leaderboard_today);
      setRiders(ridersData);
      setActivities(activitiesData);
    } catch (err: any) {
      console.error('Error fetching data from backend API:', err);
    }
  };

  useEffect(() => {
    if (user && token) {
      loadData();
    }
  }, [user, token]);

  const handleRefresh = async () => {
    setIsSyncing(true);
    await loadData();
    await refreshUser();
    setIsSyncing(false);
  };

  const handleConnectStrava = async () => {
    try {
      const auth = await api.getStravaAuthUrl(user?.id);
      if (auth.authorize_url) {
        window.location.href = auth.authorize_url;
      }
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err.message || 'Failed to initiate Strava OAuth'
      });
    }
  };

  const handleDisconnectStrava = async () => {
    if (window.confirm('Are you sure you want to disconnect your Strava account? Your previously imported activities will remain in CycleClub.')) {
      try {
        await disconnectStrava();
        setNotice({
          type: 'success',
          message: 'Strava account disconnected. Your previously imported activities have been preserved.'
        });
        await loadData();
      } catch (err: any) {
        setNotice({
          type: 'error',
          message: err.message || 'Failed to disconnect Strava'
        });
      }
    }
  };

  const handleSyncMyActivities = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncMyActivities();
      setNotice({
        type: 'success',
        message: res.message || 'Successfully synced Strava activities!'
      });
      await loadData();
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err.message || 'Failed to sync Strava activities'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRiderSelect = (riderId: string) => {
    setSelectedRiderId(riderId);
    setActiveTab('rider-detail');
  };

  const handleToggleRiderStatus = async (riderId: string, currentStatus: 'active' | 'inactive') => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.updateRiderStatus(riderId, nextStatus);
      await loadData();
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err.message || 'Failed to update rider status'
      });
    }
  };

  const handleRemoveRider = async (riderId: string) => {
    if (window.confirm('Are you sure you want to remove this rider from CycleClub?')) {
      try {
        await api.deleteRider(riderId);
        setNotice({
          type: 'success',
          message: 'Rider removed from club successfully.'
        });
        await loadData();
      } catch (err: any) {
        setNotice({
          type: 'error',
          message: err.message || 'Failed to remove rider'
        });
      }
    }
  };

  // Loading state during initial session check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4 animate-pulse">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
          <span>Restoring session...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated: Render Login Page
  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    if (activeTab === 'rider-detail' && selectedRiderId) {
      return (
        <RiderProfilePage
          riderId={selectedRiderId}
          onBack={() => setActiveTab('riders')}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            overview={overview}
            leaderboard={todayLeaderboard}
            recentActivities={activities}
            onRiderSelect={handleRiderSelect}
            onFilterChange={(tf) => setSelectedTimeframe(tf)}
            selectedTimeframe={selectedTimeframe}
            onConnectStrava={handleConnectStrava}
          />
        );
      case 'riders':
        return (
          <RidersPage
            riders={riders}
            onSelectRider={handleRiderSelect}
            onToggleStatus={handleToggleRiderStatus}
            onRemoveRider={handleRemoveRider}
            onConnectStrava={handleConnectStrava}
          />
        );
      case 'activities':
        return (
          <ActivitiesPage
            activities={activities}
            onRiderSelect={handleRiderSelect}
            onRefresh={handleRefresh}
          />
        );
      case 'leaderboard':
        return <LeaderboardPage onRiderSelect={handleRiderSelect} />;
      case 'challenges':
        return <ChallengesPage onRiderSelect={handleRiderSelect} />;
      case 'analytics':
        return <AnalyticsPage activities={activities} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            overview={overview}
            leaderboard={todayLeaderboard}
            recentActivities={activities}
            onRiderSelect={handleRiderSelect}
            onFilterChange={(tf) => setSelectedTimeframe(tf)}
            selectedTimeframe={selectedTimeframe}
            onConnectStrava={handleConnectStrava}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'rider-detail') setSelectedRiderId(null);
        }}
        stravaStatus={user.strava_connected}
        onConnectStrava={handleConnectStrava}
        onDisconnectStrava={handleDisconnectStrava}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          onRefresh={handleRefresh}
          isSyncing={isSyncing}
          onSyncStrava={handleSyncMyActivities}
        />

        {/* Global Notification Toast / Banner */}
        {notice && (
          <div className="px-8 pt-4">
            <div
              className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-lg animate-fadeIn ${
                notice.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {notice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className="font-medium">{notice.message}</span>
              </div>
              <button
                onClick={() => setNotice(null)}
                className="text-slate-400 hover:text-white px-2 py-0.5 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
