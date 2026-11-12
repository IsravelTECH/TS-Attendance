import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Employee, ClientSchool, SchoolVisit, BikeOdometerRecord } from '../types';

interface DatabaseSchema {
  employees: Employee[];
  schools: ClientSchool[];
  visits: SchoolVisit[];
  bikeClaims?: BikeOdometerRecord[];
}

const DB_FILE = path.join(__dirname, 'database.json');

// Reusable SVG data URLs for realistic check-in / check-out photo previews
const SAMPLE_GATE_PHOTO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230284c7"/><text x="200" y="130" fill="white" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">🏫 SCHOOL MAIN ENTRANCE</text><text x="200" y="165" fill="%23bae6fd" font-family="sans-serif" font-size="14" text-anchor="middle">Arrival Check-In Photo Verified</text><text x="200" y="250" fill="white" opacity="0.8" font-family="monospace" font-size="12" text-anchor="middle">📍 GPS: 12.9716° N, 77.5946° E</text></svg>';

const SAMPLE_MEETING_PHOTO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23059669"/><text x="200" y="130" fill="white" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">📝 PRINCIPAL OFFICE MEETING</text><text x="200" y="165" fill="%23a7f3d0" font-family="sans-serif" font-size="14" text-anchor="middle">Completion Check-Out Photo Verified</text><text x="200" y="250" fill="white" opacity="0.8" font-family="monospace" font-size="12" text-anchor="middle">✔️ Proposal Handed Over</text></svg>';

class JSONDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.employees && parsed.schools && parsed.visits) {
          return parsed;
        }
      } catch (err) {
        console.error('Failed reading database file, re-initializing seed:', err);
      }
    }
    const initial = this.generateSeedData();
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving data to disk:', err);
    }
  }

  private persist() {
    this.saveData(this.data);
  }

  private generateSeedData(): DatabaseSchema {
    const passwordHash = bcrypt.hashSync('techno123', 10);
    const today = new Date().toISOString().split('T')[0];

    // Client Schools Directory that sales representatives visit
    const schools: ClientSchool[] = [
      {
        id: 'sch-1',
        schoolCode: 'SCH-BLR-001',
        schoolName: "St. Xavier's International School",
        address: '14th Cross, Indiranagar, Bangalore - 560038',
        contactPerson: 'Dr. Joseph Kurian (Principal)',
        contactPhone: '+91 98450 11223',
        contactEmail: 'principal@stxaviers-blr.edu',
        category: 'CBSE',
        latitude: 12.9716,
        longitude: 77.5946,
        geofenceRadiusMeters: 250
      },
      {
        id: 'sch-2',
        schoolCode: 'SCH-BLR-002',
        schoolName: 'Greenwood High Global Campus',
        address: 'Sarjapur Main Road, Varthur, Bangalore - 560087',
        contactPerson: 'Mrs. Nandita Sen (Vice Principal & Academics)',
        contactPhone: '+91 98450 22334',
        contactEmail: 'nandita.sen@greenwoodhigh.edu',
        category: 'INTERNATIONAL',
        latitude: 12.9255,
        longitude: 77.6892,
        geofenceRadiusMeters: 300
      },
      {
        id: 'sch-3',
        schoolCode: 'SCH-BLR-003',
        schoolName: 'Delhi Public Academy - Central',
        address: 'Koramangala 4th Block, Bangalore - 560034',
        contactPerson: 'Mr. Arvind Aggarwal (Director of Procurement)',
        contactPhone: '+91 98450 33445',
        contactEmail: 'procurement@dps-central.edu',
        category: 'CBSE',
        latitude: 12.9352,
        longitude: 77.6245,
        geofenceRadiusMeters: 200
      },
      {
        id: 'sch-4',
        schoolCode: 'SCH-BLR-004',
        schoolName: 'Oakridge World School',
        address: 'Whitefield ITPL Main Road, Bangalore - 560066',
        contactPerson: 'Dr. Meenakshi Sundaram (Head of School)',
        contactPhone: '+91 98450 44556',
        contactEmail: 'head@oakridge-world.edu',
        category: 'ICSE',
        latitude: 12.9850,
        longitude: 77.7290,
        geofenceRadiusMeters: 250
      },
      {
        id: 'sch-5',
        schoolCode: 'SCH-BLR-005',
        schoolName: 'National Public School - Jayanagar',
        address: '9th Block, Jayanagar, Bangalore - 560069',
        contactPerson: 'Sister Theresa (Administrator)',
        contactPhone: '+91 98450 55667',
        contactEmail: 'admin@nps-jayanagar.edu',
        category: 'K-12',
        latitude: 12.9220,
        longitude: 77.5850,
        geofenceRadiusMeters: 200
      }
    ];

    // Real Zoho People Employees (Synchronized from live organization)
    const employees: Employee[] = [
      {
        id: 'zoho-1',
        employeeCode: 'TS-315003',
        fullName: 'Isravel S',
        email: 'israveltech@gmail.com',
        phone: '+91 98450 10000',
        passwordHash,
        role: 'SALES_DIRECTOR',
        territory: 'South India Region & Enterprise Headquarters',
        designation: 'Managing Director & Super Admin',
        joiningDate: '2023-01-15',
        isActive: true,
        createdAt: '2023-01-15T08:00:00Z',
        zohoErecno: '404400000000315003'
      },
      {
        id: 'zoho-S2',
        employeeCode: 'TS-315567',
        fullName: 'Lilly Williams',
        email: 'lillywilliams@zylker.com',
        phone: '+91 98450 10001',
        passwordHash,
        role: 'AREA_SALES_MANAGER',
        territory: 'Bangalore Central & East Zone',
        designation: 'Area Sales Manager',
        joiningDate: '2023-02-01',
        isActive: true,
        createdAt: '2023-02-01T08:00:00Z',
        zohoErecno: '404400000000315567'
      },
      {
        id: 'zoho-S3',
        employeeCode: 'TS-315568',
        fullName: 'Clarkson Walter',
        email: 'clarksonwalter@zylker.com',
        phone: '+91 98450 10002',
        passwordHash,
        role: 'SALES_EXECUTIVE',
        territory: 'Sarjapur & Whitefield District',
        designation: 'EdTech Solutions Consultant',
        joiningDate: '2023-03-01',
        isActive: true,
        createdAt: '2023-03-01T08:00:00Z',
        zohoErecno: '404400000000315568'
      }
    ];

    // Clean visits ledger (Populated dynamically via field checks)
    const visits: SchoolVisit[] = [];

    return { employees, schools, visits };
  }

  // Employee Operations
  getEmployees(): Employee[] { return this.data.employees; }
  getEmployeeById(id: string): Employee | undefined { return this.data.employees.find(e => e.id === id); }
  getEmployeeByEmail(email: string): Employee | undefined { 
    return this.data.employees.find(e => e.email.toLowerCase() === email.toLowerCase()); 
  }

  // School Operations
  getSchools(): ClientSchool[] { return this.data.schools; }
  getSchoolById(id: string): ClientSchool | undefined { return this.data.schools.find(s => s.id === id); }
  createSchool(school: ClientSchool): ClientSchool {
    this.data.schools.push(school);
    this.persist();
    return school;
  }
  updateSchool(id: string, updates: Partial<ClientSchool>): ClientSchool | undefined {
    const idx = this.data.schools.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.data.schools[idx] = { ...this.data.schools[idx], ...updates };
    this.persist();
    return this.data.schools[idx];
  }

  // Visit Operations
  getVisits(date?: string, employeeId?: string): SchoolVisit[] {
    return this.data.visits.filter(v => {
      if (date && v.visitDate !== date) return false;
      if (employeeId && v.employeeId !== employeeId) return false;
      return true;
    });
  }

  getVisitById(id: string): SchoolVisit | undefined {
    return this.data.visits.find(v => v.id === id);
  }

  getActiveVisit(employeeId: string, date: string): SchoolVisit | undefined {
    return this.data.visits.find(v => v.employeeId === employeeId && v.visitDate === date && v.status === 'IN_PROGRESS');
  }

  createVisit(visit: SchoolVisit): SchoolVisit {
    this.data.visits.push(visit);
    this.persist();
    return visit;
  }

  updateVisit(id: string, updates: Partial<SchoolVisit>): SchoolVisit | undefined {
    const idx = this.data.visits.findIndex(v => v.id === id);
    if (idx === -1) return undefined;
    this.data.visits[idx] = { ...this.data.visits[idx], ...updates };
    this.persist();
    return this.data.visits[idx];
  }

  // Bike & Odometer Operations
  getBikeClaims(date?: string, employeeId?: string): BikeOdometerRecord[] {
    if (!this.data.bikeClaims) this.data.bikeClaims = [];
    return this.data.bikeClaims.filter(c => {
      if (date && c.date !== date) return false;
      if (employeeId && c.employeeId !== employeeId) return false;
      return true;
    });
  }

  createBikeClaim(claim: BikeOdometerRecord): BikeOdometerRecord {
    if (!this.data.bikeClaims) this.data.bikeClaims = [];
    this.data.bikeClaims.push(claim);
    this.persist();
    return claim;
  }

  updateBikeClaim(id: string, updates: Partial<BikeOdometerRecord>): BikeOdometerRecord | undefined {
    if (!this.data.bikeClaims) this.data.bikeClaims = [];
    const idx = this.data.bikeClaims.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.data.bikeClaims[idx] = { ...this.data.bikeClaims[idx], ...updates };
    this.persist();
    return this.data.bikeClaims[idx];
  }

  replaceEmployees(employees: Employee[]) {
    this.data.employees = employees;
    this.persist();
  }

  clearVisits() {
    this.data.visits = [];
    this.persist();
  }

  purgeDummyData() {
    const dummyEmails = [
      'priya.nair@technoschool.com',
      'amit.patel@technoschool.com',
      'deepak.rao@technoschool.com',
      'rahul.sharma@technoschool.com',
      'salesdirector@technoschool.com'
    ];
    this.data.employees = this.data.employees.filter(e => !dummyEmails.includes(e.email.toLowerCase()));
    this.data.visits = this.data.visits.filter(v => v.id !== 'vst-1' && v.id !== 'vst-2');
    this.persist();
  }
}

export const db = new JSONDatabase();
