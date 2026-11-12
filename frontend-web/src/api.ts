import { 
  Employee, 
  ClientSchool, 
  SchoolVisit, 
  FieldSummaryMetrics,
  IntegrationsOverview,
  SuperAdminOverview 
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://ts-attendance.onrender.com/api');

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('techno_sales_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('techno_sales_token', token);
    } else {
      localStorage.removeItem('techno_sales_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  }

  // Auth
  async login(email: string, password: string): Promise<{ success: boolean; token: string; user: Employee }> {
    const res = await this.request<{ success: boolean; token: string; user: Employee }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.token);
    return res;
  }

  async getMe(): Promise<{ success: boolean; user: Employee }> {
    return this.request<{ success: boolean; user: Employee }>('/auth/me');
  }

  async getDemoAccounts(): Promise<{ success: boolean; accounts: any[] }> {
    return this.request<{ success: boolean; accounts: any[] }>('/auth/demo-accounts');
  }

  // Visits (Dual-Photo Check-In & Check-Out)
  async checkIn(payload: {
    schoolId: string;
    latitude?: number;
    longitude?: number;
    photo?: string;
    notes?: string;
    overrideGeofence?: boolean;
  }): Promise<{ success: boolean; message: string; visit: SchoolVisit; school: ClientSchool }> {
    return this.request('/visits/check-in', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async checkOut(payload: {
    visitId?: string;
    latitude?: number;
    longitude?: number;
    photo?: string;
    outcome?: string;
    followUpDate?: string;
  }): Promise<{ success: boolean; message: string; visit: SchoolVisit }> {
    return this.request('/visits/check-out', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getTodayStatus(): Promise<{
    success: boolean;
    today: string;
    activeVisit: any;
    hasActiveVisit: boolean;
    visits: SchoolVisit[];
    completedVisitsCount: number;
  }> {
    return this.request('/visits/today');
  }

  async getVisitsLedger(date?: string, employeeId?: string, schoolId?: string, status?: string): Promise<{
    success: boolean;
    date: string;
    count: number;
    ledger: SchoolVisit[];
  }> {
    const query = new URLSearchParams();
    if (date) query.set('date', date);
    if (employeeId) query.set('employeeId', employeeId);
    if (schoolId) query.set('schoolId', schoolId);
    if (status) query.set('status', status);
    return this.request(`/visits/ledger?${query.toString()}`);
  }

  async getVisitsSummary(date?: string): Promise<{
    success: boolean;
    date: string;
    metrics: FieldSummaryMetrics;
  }> {
    const query = date ? `?date=${date}` : '';
    return this.request(`/visits/summary${query}`);
  }

  // Schools Directory
  async getSchools(): Promise<{ success: boolean; schools: ClientSchool[] }> {
    return this.request('/schools');
  }

  async getNearbySchools(lat?: number, lng?: number): Promise<{ success: boolean; schools: ClientSchool[] }> {
    const query = lat && lng ? `?latitude=${lat}&longitude=${lng}` : '';
    return this.request(`/schools/nearby${query}`);
  }

  async createSchool(payload: Partial<ClientSchool>): Promise<any> {
    return this.request('/schools', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Employees Roster
  async getEmployees(): Promise<{ success: boolean; employees: Employee[] }> {
    return this.request('/employees');
  }

  // Zoho People & Microsoft Teams Integrations
  async getIntegrationsStatus(): Promise<IntegrationsOverview> {
    return this.request<IntegrationsOverview>('/integrations/status');
  }

  async testZohoConnection(): Promise<{ success: boolean; message: string; details: any }> {
    return this.request('/integrations/zoho/test', { method: 'POST' });
  }

  async testTeamsAlert(): Promise<{ success: boolean; message: string; isSimulated: boolean }> {
    return this.request('/integrations/teams/test', { method: 'POST' });
  }

  async syncVisitToZoho(visitId: string): Promise<{ success: boolean; message: string; visit: SchoolVisit }> {
    return this.request(`/integrations/zoho/sync/${visitId}`, { method: 'POST' });
  }

  async syncRosterFromZoho(): Promise<{ success: boolean; message: string; count: number; employees: Employee[] }> {
    return this.request('/integrations/zoho/sync-roster', { method: 'POST' });
  }

  // Super Admin Overall Data
  async getSuperAdminOverview(date?: string): Promise<SuperAdminOverview> {
    const query = date ? `?date=${date}` : '';
    return this.request<SuperAdminOverview>(`/integrations/super-admin/overview${query}`);
  }

  async superAdminSyncAll(date?: string): Promise<{ success: boolean; syncedCount: number; results: any[] }> {
    return this.request('/integrations/super-admin/sync-all', {
      method: 'POST',
      body: JSON.stringify({ date })
    });
  }

  async broadcastDailySummary(date?: string): Promise<{ success: boolean; message: string; isSimulated: boolean }> {
    return this.request('/integrations/super-admin/broadcast-daily-summary', {
      method: 'POST',
      body: JSON.stringify({ date })
    });
  }

  // Live Zoho Attendance Punches
  async getZohoLivePunches(date?: string): Promise<import('./types').ZohoLiveAttendanceResponse> {
    const query = date ? `?date=${date}` : '';
    return this.request(`/integrations/zoho/live-punches${query}`);
  }

  async reconcileZohoAttendance(date?: string): Promise<{
    success: boolean;
    message: string;
    reconciledCount: number;
    livePunches: import('./types').ZohoLiveAttendanceResponse;
  }> {
    return this.request('/integrations/zoho/reconcile-attendance', {
      method: 'POST',
      body: JSON.stringify({ date })
    });
  }

  // Bike & Odometer AI OCR Claims
  async getBikeClaims(date?: string, employeeId?: string): Promise<{ success: boolean; claims: import('./types').BikeOdometerRecord[] }> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (employeeId) params.append('employeeId', employeeId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/integrations/bike-claims${query}`);
  }

  async simulateTeamsOdometer(preset: string = 'FZ', employeeEmail?: string): Promise<{ success: boolean; message: string; claim: import('./types').BikeOdometerRecord }> {
    return this.request('/integrations/bike-claims/simulate', {
      method: 'POST',
      body: JSON.stringify({ preset, employeeEmail })
    });
  }

  async submitOdometerClaim(payload: any): Promise<{ success: boolean; message: string; claim: import('./types').BikeOdometerRecord }> {
    return this.request('/integrations/teams/inbound-odometer', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}

export const api = new ApiService();
