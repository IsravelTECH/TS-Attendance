import { useState, useEffect } from 'react';
import { api } from './api';
import { Employee } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardView } from './components/DashboardView';
import { FieldVisitCheckInView } from './components/FieldVisitCheckInView';
import { DualPhotoAuditView } from './components/DualPhotoAuditView';
import { ClientSchoolsDirectoryView } from './components/ClientSchoolsDirectoryView';
import { FieldRosterView } from './components/FieldRosterView';
import { IntegrationsView } from './components/IntegrationsView';
import { SuperAdminConsoleView } from './components/SuperAdminConsoleView';
import { BikeOdometerAuditView } from './components/BikeOdometerAuditView';
import { Loader2 } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      setLoading(true);
      const demoRes = await api.getDemoAccounts();
      setDemoAccounts(demoRes.accounts);

      try {
        if (api.getToken()) {
          const me = await api.getMe();
          setCurrentUser(me.user);
        } else if (demoRes.accounts.length > 0) {
          // Log in with Field Sales Rep (Priya Nair) or Sales Director by default
          const defaultRep = demoRes.accounts.find((a: any) => a.role === 'SALES_EXECUTIVE') || demoRes.accounts[0];
          const loginRes = await api.login(defaultRep.email, 'techno123');
          setCurrentUser(loginRes.user);
        }
      } catch (authErr) {
        if (demoRes.accounts.length > 0) {
          const defaultRep = demoRes.accounts.find((a: any) => a.role === 'SALES_EXECUTIVE') || demoRes.accounts[0];
          const loginRes = await api.login(defaultRep.email, 'techno123');
          setCurrentUser(loginRes.user);
        }
      }
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = async (email: string) => {
    try {
      setLoading(true);
      const res = await api.login(email, 'techno123');
      setCurrentUser(res.user);
    } catch (err) {
      console.error('Failed to switch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    setCurrentUser(null);
  };

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg animate-bounce mb-4 text-xl">
          📸
        </div>
        <div className="flex items-center space-x-2 text-slate-600 font-medium text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
          <span>Starting Techno School Field Sales Operations Hub...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Modern Left Sidebar Navigation */}
      <Sidebar
        user={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Content Area (Offset by lg:pl-64 on desktop for fixed sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 min-h-screen">
        <Header
          user={currentUser}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
          demoAccounts={demoAccounts}
          activeTab={activeTab}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
          {currentUser && (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView user={currentUser} onNavigate={setActiveTab} />
              )}
              {activeTab === 'superadmin' && (
                <SuperAdminConsoleView />
              )}
              {activeTab === 'visit' && (
                <FieldVisitCheckInView user={currentUser} />
              )}
              {activeTab === 'audit' && (
                <DualPhotoAuditView />
              )}
              {activeTab === 'bike-km' && (
                <BikeOdometerAuditView currentUser={currentUser} />
              )}
              {activeTab === 'schools' && (
                <ClientSchoolsDirectoryView />
              )}
              {activeTab === 'roster' && (
                <FieldRosterView />
              )}
              {activeTab === 'integrations' && (
                <IntegrationsView />
              )}
            </>
          )}
        </main>

        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4">
            <p>© 2026 Techno School Field Operations • Dual-Photo Verified GPS Attendance Engine • Zoho People & Teams Integrated</p>
          </div>
        </footer>

        {/* Mobile Bottom Navigation Bar (< 1024px) */}
        <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}

export default App;
