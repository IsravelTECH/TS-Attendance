import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import { Employee, UserRole } from '../types';

/**
 * Zoho People HRMS Integration Service
 * Manages OAuth 2.0 authentication, check-in, check-out, and attendance sync.
 */

interface ZohoTokenResponse {
  access_token: string;
  expires_in: number;
  api_domain?: string;
  token_type?: string;
  error?: string;
}

export interface ZohoPunchResult {
  success: boolean;
  punchId?: string;
  message: string;
  isSimulated: boolean;
  rawResponse?: any;
}

export class ZohoPeopleService {
  private cachedAccessToken: string | null = null;
  private tokenExpiry: number = 0;

  get clientId(): string {
    return (process.env.ZOHO_CLIENT_ID || '').trim();
  }

  get clientSecret(): string {
    return (process.env.ZOHO_CLIENT_SECRET || '').trim();
  }

  get refreshToken(): string {
    return (process.env.ZOHO_REFRESH_TOKEN || '').trim();
  }

  get accountsBaseUrl(): string {
    return (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in').replace(/\/+$/, '');
  }

  get apiBaseUrl(): string {
    return (process.env.ZOHO_API_URL || 'https://people.zoho.in').replace(/\/+$/, '');
  }

  get isEnabled(): boolean {
    return process.env.ZOHO_ENABLE_SYNC !== 'false';
  }

  /**
   * Checks whether keys look like dummy / testing placeholders
   */
  public isDummyKey(): boolean {
    const isPlaceholder = (val: string) => {
      if (!val) return true;
      const lower = val.toLowerCase();
      return (
        lower.startsWith('dummy') ||
        lower.startsWith('mock') ||
        lower.startsWith('test') ||
        lower.startsWith('sandbox') ||
        lower.includes('placeholder') ||
        lower.includes('your_') ||
        lower.includes('example')
      );
    };

    return isPlaceholder(this.clientId) || isPlaceholder(this.clientSecret) || isPlaceholder(this.refreshToken);
  }

  /**
   * Checks whether credentials have been entered (either dummy or live)
   */
  public isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.refreshToken);
  }

  /**
   * Checks whether credentials are real live production credentials
   */
  public isLive(): boolean {
    return this.isConfigured() && !this.isDummyKey();
  }

  public getStatus() {
    return {
      service: 'Zoho People HRMS',
      enabled: this.isEnabled,
      configured: this.isConfigured(),
      isDummyKey: this.isDummyKey(),
      mode: this.isLive() ? 'LIVE_OAUTH' : (this.isConfigured() ? 'DUMMY_TESTING_KEY' : 'SIMULATION_SANDBOX'),
      accountsUrl: this.accountsBaseUrl,
      apiUrl: this.apiBaseUrl,
      hasCachedToken: Boolean(this.cachedAccessToken && Date.now() < this.tokenExpiry)
    };
  }

  /**
   * Fetches or refreshes Zoho OAuth 2.0 Access Token
   */
  public async getAccessToken(): Promise<string> {
    if (this.cachedAccessToken && Date.now() < this.tokenExpiry) {
      return this.cachedAccessToken;
    }

    if (!this.isConfigured()) {
      throw new Error('Zoho People credentials (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN) not configured in .env');
    }

    // If using Dummy / Mock testing credentials, generate simulated OAuth 2.0 token
    if (this.isDummyKey()) {
      this.cachedAccessToken = `1000.DUMMY_TEST_TOKEN_${Date.now()}`;
      this.tokenExpiry = Date.now() + 3600 * 1000;
      return this.cachedAccessToken;
    }

    const tokenUrl = `${this.accountsBaseUrl}/oauth/v2/token?refresh_token=${encodeURIComponent(this.refreshToken)}&client_id=${encodeURIComponent(this.clientId)}&client_secret=${encodeURIComponent(this.clientSecret)}&grant_type=refresh_token`;

    const res = await fetch(tokenUrl, { method: 'POST' });
    const data = await res.json() as ZohoTokenResponse;

    if (!res.ok || data.error || !data.access_token) {
      throw new Error(`Zoho OAuth token refresh failed: ${data.error || res.statusText}`);
    }

    this.cachedAccessToken = data.access_token;
    // Expire cache 5 minutes before official expiration (default 3600s)
    this.tokenExpiry = Date.now() + Math.max(60, (data.expires_in - 300)) * 1000;
    return this.cachedAccessToken;
  }

  /**
   * Formats a JS Date to Zoho's required format: dd/MM/yyyy HH:mm:ss
   */
  public formatZohoDate(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Records Check-In into Zoho People Attendance
   */
  public async recordCheckIn(emailId: string, timestamp: Date): Promise<ZohoPunchResult> {
    if (!this.isEnabled) {
      return {
        success: true,
        isSimulated: true,
        message: 'Zoho People sync is disabled in configuration.'
      };
    }

    const formattedDate = this.formatZohoDate(timestamp);

    // If live credentials are not yet set or dummy key is active, return simulated success
    if (!this.isLive()) {
      const mockPunchId = `ZOHO-DUMMY-PUNCH-${Date.now().toString().slice(-6)}`;
      console.log(`[Zoho People Simulation] Recorded Check-In for ${emailId} at ${formattedDate} -> PunchID: ${mockPunchId}`);
      return {
        success: true,
        punchId: mockPunchId,
        message: `[Testing Mode] Zoho Check-in logged for ${emailId} at ${formattedDate}`,
        isSimulated: true,
        rawResponse: {
          response: {
            status: 'success',
            message: 'Data added successfully (Simulated Sandbox).',
            result: {
              punchId: mockPunchId,
              employee: emailId,
              checkIn: formattedDate
            }
          }
        }
      };
    }

    try {
      const token = await this.getAccessToken();
      const params = new URLSearchParams();
      params.append('dateFormat', 'dd/MM/yyyy HH:mm:ss');
      params.append('emailId', emailId);
      params.append('checkIn', formattedDate);

      const res = await fetch(`${this.apiBaseUrl}/people/api/attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const json = await res.json() as any;

      if (!res.ok || json.response?.status !== 'success') {
        const errMsg = json.response?.message || json.message || 'Zoho API rejected attendance check-in';
        console.error('[Zoho People] Check-in error:', errMsg);
        return {
          success: false,
          message: errMsg,
          isSimulated: false,
          rawResponse: json
        };
      }

      const punchId = json.response?.result?.punchId || `ZOHO-PUNCH-${Date.now()}`;
      return {
        success: true,
        punchId,
        message: `Zoho Check-in logged successfully for ${emailId}`,
        isSimulated: false,
        rawResponse: json
      };
    } catch (err: any) {
      console.error('[Zoho People] Exception during check-in:', err.message);
      return {
        success: false,
        message: err.message,
        isSimulated: false
      };
    }
  }

  /**
   * Records Check-Out into Zoho People Attendance
   */
  public async recordCheckOut(emailId: string, checkInDate: Date, checkOutDate: Date): Promise<ZohoPunchResult> {
    if (!this.isEnabled) {
      return {
        success: true,
        isSimulated: true,
        message: 'Zoho People sync is disabled in configuration.'
      };
    }

    const formattedCheckIn = this.formatZohoDate(checkInDate);
    const formattedCheckOut = this.formatZohoDate(checkOutDate);

    if (!this.isLive()) {
      const mockPunchId = `ZOHO-DUMMY-PUNCH-${Date.now().toString().slice(-6)}`;
      console.log(`[Zoho People Simulation] Recorded Check-Out for ${emailId} (${formattedCheckIn} -> ${formattedCheckOut}) -> PunchID: ${mockPunchId}`);
      return {
        success: true,
        punchId: mockPunchId,
        message: `[Testing Mode] Zoho Check-out logged for ${emailId} (${formattedCheckIn} - ${formattedCheckOut})`,
        isSimulated: true,
        rawResponse: {
          response: {
            status: 'success',
            message: 'Attendance duration logged successfully (Simulated Sandbox).',
            result: {
              punchId: mockPunchId,
              checkIn: formattedCheckIn,
              checkOut: formattedCheckOut,
              employee: emailId
            }
          }
        }
      };
    }

    try {
      const token = await this.getAccessToken();
      const params = new URLSearchParams();
      params.append('dateFormat', 'dd/MM/yyyy HH:mm:ss');
      params.append('emailId', emailId);
      params.append('checkIn', formattedCheckIn);
      params.append('checkOut', formattedCheckOut);

      const res = await fetch(`${this.apiBaseUrl}/people/api/attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const json = await res.json() as any;

      if (!res.ok || json.response?.status !== 'success') {
        const errMsg = json.response?.message || json.message || 'Zoho API rejected attendance check-out';
        console.error('[Zoho People] Check-out error:', errMsg);
        return {
          success: false,
          message: errMsg,
          isSimulated: false,
          rawResponse: json
        };
      }

      const punchId = json.response?.result?.punchId || `ZOHO-PUNCH-${Date.now()}`;
      return {
        success: true,
        punchId,
        message: `Zoho Check-out logged successfully for ${emailId}`,
        isSimulated: false,
        rawResponse: json
      };
    } catch (err: any) {
      console.error('[Zoho People] Exception during check-out:', err.message);
      return {
        success: false,
        message: err.message,
        isSimulated: false
      };
    }
  }

  /**
   * Tests connection to Zoho People
   */
  public async testConnection(): Promise<{ success: boolean; message: string; details: any }> {
    if (this.isDummyKey()) {
      const token = await this.getAccessToken();
      return {
        success: true,
        message: '✅ Dummy / Sandbox API Key Handshake Verified! Simulation engine active.',
        details: {
          status: 'DUMMY_KEY_VERIFIED',
          clientId: this.clientId,
          simulatedToken: `${token.substring(0, 15)}...`,
          endpoint: `${this.apiBaseUrl}/people/api/attendance`,
          notes: 'Dummy credentials detected. Full attendance workflow can be tested without production Zoho calls.'
        }
      };
    }

    if (!this.isConfigured()) {
      return {
        success: true,
        message: 'Sandbox / Simulation Mode active: Ready to accept live Zoho credentials in .env.',
        details: {
          status: 'SIMULATED',
          advice: 'Add ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN to .env for live sync.'
        }
      };
    }

    try {
      const token = await this.getAccessToken();
      return {
        success: true,
        message: 'Zoho People OAuth 2.0 handshake verified successfully with LIVE Zoho servers!',
        details: {
          status: 'CONNECTED',
          tokenPreview: `${token.substring(0, 10)}...${token.slice(-5)}`,
          apiUrl: this.apiBaseUrl
        }
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Zoho connection test failed: ${err.message}`,
        details: { error: err.message }
      };
    }
  }

  /**
   * Fetches Real Employees Roster directly from Zoho People
   */
  public async fetchRealEmployeesFromZoho(): Promise<Employee[]> {
    if (!this.isConfigured() || this.isDummyKey()) {
      throw new Error('Live Zoho People credentials required to fetch real employee directory.');
    }

    const token = await this.getAccessToken();
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}-${today.toLocaleString('en', { month: 'short' })}-${today.getFullYear()}`;
    
    // User report returns all employees associated with the Zoho People organization
    const url = `${this.apiBaseUrl}/people/api/attendance/getUserReport?sdate=${dateStr}&edate=${dateStr}&dateFormat=dd-MMM-yyyy`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
    });

    const data = await res.json() as any;

    if (!res.ok || !data.result || !Array.isArray(data.result)) {
      throw new Error(data.message || 'Failed to fetch employee list from Zoho People');
    }

    const passwordHash = bcrypt.hashSync('techno123', 10);
    const territories = [
      'Sarjapur & Whitefield District',
      'Koramangala & Indiranagar District',
      'Jayanagar & South Bangalore',
      'Bangalore Central & Malleshwaram',
      'Electronic City & Hosur Road'
    ];

    const allEmployees = data.result.map((item: any, idx: number) => {
      const details = item.employeeDetails || {};
      const zohoId = details.id || `emp-${idx + 1}`;
      const email = details['mail id'] || `employee_${zohoId}@technoschool.com`;
      const firstName = details['first name'] || 'Zoho';
      const lastName = details['last name'] || 'Employee';
      const fullName = `${firstName} ${lastName}`.trim();
      const isOwner = email.toLowerCase() === 'israveltech@gmail.com';

      let role: UserRole = 'SALES_EXECUTIVE';
      let designation = 'EdTech Solutions Consultant';
      let territory = territories[idx % territories.length];

      if (isOwner) {
        role = 'SALES_DIRECTOR';
        designation = 'Managing Director & Super Admin';
        territory = 'South India Region & Enterprise Headquarters';
      } else if (idx === 1) {
        role = 'AREA_SALES_MANAGER';
        designation = 'Area Sales Manager (Regional Lead)';
        territory = 'Bangalore Central & East Zone';
      } else if (idx % 3 === 0) {
        role = 'FIELD_AGENT';
        designation = 'Field Relationship Executive';
      }

      return {
        id: `zoho-${zohoId}`,
        employeeCode: details.erecno ? `TS-${details.erecno.slice(-6)}` : `TS-ZH-${zohoId}`,
        fullName,
        email,
        phone: `+91 98450 ${String(10000 + idx).padStart(5, '0')}`,
        passwordHash,
        role,
        territory,
        designation,
        joiningDate: '2023-01-15',
        isActive: true,
        createdAt: new Date().toISOString(),
        zohoErecno: details.erecno
      };
    });

    // 100% Free Plan Tier: Keep strictly 5 employees (Owner Isravel S + 4 core sales reps)
    const owner = allEmployees.find((e: Employee) => e.email.toLowerCase() === 'israveltech@gmail.com');
    const others = allEmployees.filter((e: Employee) => e.email.toLowerCase() !== 'israveltech@gmail.com');
    const freeTierEmployees = owner ? [owner, ...others.slice(0, 4)] : allEmployees.slice(0, 5);

    return freeTierEmployees;
  }

  /**
   * Fetches Real Daily Attendance Report directly from Zoho People
   */
  public async fetchRealAttendanceReportFromZoho(dateStr?: string): Promise<any> {
    const token = await this.getAccessToken();
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const formattedDate = `${targetDate.getDate().toString().padStart(2, '0')}-${targetDate.toLocaleString('en', { month: 'short' })}-${targetDate.getFullYear()}`;

    const url = `${this.apiBaseUrl}/people/api/attendance/getUserReport?sdate=${formattedDate}&edate=${formattedDate}&dateFormat=dd-MMM-yyyy`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
    });

    return res.json();
  }

  /**
   * Fetches and normalizes live check-in and check-out punches from Zoho People
   */
  public async fetchNormalizedLivePunches(dateStr?: string): Promise<{
    date: string;
    totalEmployees: number;
    presentCount: number;
    inProgressCount: number;
    absentCount: number;
    records: Array<{
      employeeEmail: string;
      fullName: string;
      erecno: string;
      date: string;
      firstIn: string | null;
      lastOut: string | null;
      totalHours: string;
      workingHours: string;
      shiftName: string;
      shiftStartTime: string;
      shiftEndTime: string;
      lateIn: string;
      earlyOut: string;
      firstInLocation: string | null;
      lastOutLocation: string | null;
      firstInCoords: { lat: number; lng: number } | null;
      lastOutCoords: { lat: number; lng: number } | null;
      status: 'PRESENT' | 'ABSENT' | 'IN_PROGRESS';
    }>;
  }> {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const targetDateIso = targetDate.toISOString().split('T')[0];
    const data = await this.fetchRealAttendanceReportFromZoho(targetDateIso);

    if (!data.result || !Array.isArray(data.result)) {
      return {
        date: targetDateIso,
        totalEmployees: 0,
        presentCount: 0,
        inProgressCount: 0,
        absentCount: 0,
        records: []
      };
    }

    const records = data.result.map((item: any) => {
      const details = item.employeeDetails || {};
      const attObj = item.attendanceDetails || {};
      const dayData = attObj[targetDateIso] || Object.values(attObj)[0] || {};

      const rawFirstIn = dayData.FirstIn && dayData.FirstIn !== '-' ? dayData.FirstIn : null;
      const rawLastOut = dayData.LastOut && dayData.LastOut !== '-' ? dayData.LastOut : null;

      let status: 'PRESENT' | 'ABSENT' | 'IN_PROGRESS' = 'ABSENT';
      if (rawFirstIn && rawLastOut) {
        status = 'PRESENT';
      } else if (rawFirstIn) {
        status = 'IN_PROGRESS';
      }

      const firstName = details['first name'] || '';
      const lastName = details['last name'] || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Zoho Employee';

      return {
        employeeEmail: details['mail id'] || '',
        fullName,
        erecno: details.erecno || '',
        date: targetDateIso,
        firstIn: rawFirstIn,
        lastOut: rawLastOut,
        totalHours: dayData.TotalHours && dayData.TotalHours !== '-' ? dayData.TotalHours : '00:00',
        workingHours: dayData.WorkingHours && dayData.WorkingHours !== '-' ? dayData.WorkingHours : '00:00',
        shiftName: dayData.ShiftName || 'General',
        shiftStartTime: dayData.ShiftStartTime || '09:00 AM',
        shiftEndTime: dayData.ShiftEndTime || '06:00 PM',
        lateIn: dayData.Late_In && dayData.Late_In !== '-' ? dayData.Late_In : '00:00',
        earlyOut: dayData.Early_Out && dayData.Early_Out !== '-' ? dayData.Early_Out : '00:00',
        firstInLocation: dayData.FirstIn_Location && dayData.FirstIn_Location !== '-' ? dayData.FirstIn_Location : null,
        lastOutLocation: dayData.LastOut_Location && dayData.LastOut_Location !== '-' ? dayData.LastOut_Location : null,
        firstInCoords: dayData.FirstIn_Latitude && dayData.FirstIn_Longitude ? {
          lat: Number(dayData.FirstIn_Latitude),
          lng: Number(dayData.FirstIn_Longitude)
        } : null,
        lastOutCoords: dayData.LastOut_Latitude && dayData.LastOut_Longitude ? {
          lat: Number(dayData.LastOut_Latitude),
          lng: Number(dayData.LastOut_Longitude)
        } : null,
        status
      };
    });

    const presentCount = records.filter((r: any) => r.status === 'PRESENT').length;
    const inProgressCount = records.filter((r: any) => r.status === 'IN_PROGRESS').length;
    const absentCount = records.filter((r: any) => r.status === 'ABSENT').length;

    return {
      date: targetDateIso,
      totalEmployees: records.length,
      presentCount,
      inProgressCount,
      absentCount,
      records
    };
  }
}

export const zohoPeopleService = new ZohoPeopleService();
