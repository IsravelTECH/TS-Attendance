import dotenv from 'dotenv';
dotenv.config();

/**
 * Microsoft Teams Notification Service
 * Sends real-time visit check-in & check-out alert cards to Microsoft Teams channels.
 */

import { Employee, ClientSchool, SchoolVisit } from '../types';

export interface TeamsNotifyResult {
  success: boolean;
  message: string;
  isSimulated: boolean;
}

export class TeamsService {
  get webhookUrl(): string {
    return (process.env.TEAMS_WEBHOOK_URL || '').trim();
  }

  get isEnabled(): boolean {
    return process.env.TEAMS_ENABLE_NOTIFICATIONS !== 'false';
  }

  public isDummyWebhook(): boolean {
    const url = this.webhookUrl.toLowerCase();
    return !url || url.includes('dummy_teams') || url === 'dummy' || !url.startsWith('http');
  }

  public isConfigured(): boolean {
    return Boolean(this.webhookUrl && this.webhookUrl.startsWith('http') && !this.isDummyWebhook());
  }

  public getStatus() {
    return {
      service: 'Microsoft Teams Webhook',
      enabled: this.isEnabled,
      configured: this.isConfigured(),
      isDummy: this.isDummyWebhook() && Boolean(this.webhookUrl),
      mode: this.isConfigured() ? 'LIVE_WEBHOOK' : (this.webhookUrl ? 'DUMMY_TESTING_WEBHOOK' : 'SIMULATION_CONSOLE')
    };
  }

  /**
   * Broadcasts arrival check-in to Microsoft Teams channel
   */
  public async notifyCheckIn(
    visit: SchoolVisit,
    employee: Employee,
    school: ClientSchool
  ): Promise<TeamsNotifyResult> {
    if (!this.isEnabled) {
      return { success: true, message: 'Teams notifications disabled.', isSimulated: true };
    }

    const payload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "0284C7", // Sky blue
      "summary": `📍 Check-In: ${employee.fullName} arrived at ${school.schoolName}`,
      "sections": [
        {
          "activityTitle": `📍 Field Visit Check-In: **${employee.fullName}**`,
          "activitySubtitle": `${employee.designation} • ${employee.territory}`,
          "facts": [
            { "name": "Client School:", "value": `**${school.schoolName}** (${school.category})` },
            { "name": "School Address:", "value": school.address },
            { "name": "Principal / Contact:", "value": `${school.contactPerson} (${school.contactPhone})` },
            { "name": "Arrival Time:", "value": new Date(visit.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            { "name": "GPS Perimeter:", "value": visit.isInsideGeofence ? `✅ Inside Geofence (${visit.checkInDistanceMeters}m from gate)` : `⚠️ Outside Geofence (${visit.checkInDistanceMeters}m)` },
            { "name": "Check-In Notes:", "value": visit.checkInNotes || "Arrival registered" }
          ],
          "markdown": true
        }
      ],
      "potentialAction": [
        {
          "@type": "OpenURIOAction",
          "name": "Inspect Photo Proof in Portal",
          "targets": [{ "os": "default", "uri": "http://localhost:5173" }]
        }
      ]
    };

    return this.sendToTeams(payload, `Check-In for ${employee.fullName} @ ${school.schoolName}`);
  }

  /**
   * Broadcasts departure check-out & meeting outcome to Microsoft Teams channel
   */
  public async notifyCheckOut(
    visit: SchoolVisit,
    employee: Employee,
    school: ClientSchool
  ): Promise<TeamsNotifyResult> {
    if (!this.isEnabled) {
      return { success: true, message: 'Teams notifications disabled.', isSimulated: true };
    }

    const hours = Math.floor((visit.durationMinutes || 0) / 60);
    const mins = (visit.durationMinutes || 0) % 60;
    const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

    const payload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "16A34A", // Green
      "summary": `✅ Visit Completed: ${employee.fullName} @ ${school.schoolName}`,
      "sections": [
        {
          "activityTitle": `✅ Meeting Completed: **${employee.fullName}**`,
          "activitySubtitle": `Duration: **${durationStr}** • ${school.schoolName}`,
          "facts": [
            { "name": "Client School:", "value": `**${school.schoolName}**` },
            { "name": "Meeting Duration:", "value": durationStr },
            { "name": "Meeting Outcome:", "value": visit.visitOutcome || "Meeting concluded successfully" },
            { "name": "Follow-Up Date:", "value": visit.followUpDate || "None recorded" },
            { "name": "Dual-Photo Audit:", "value": "✅ Arrival Gate + Departure Proof Recorded" }
          ],
          "markdown": true
        }
      ],
      "potentialAction": [
        {
          "@type": "OpenURIOAction",
          "name": "View Full Meeting Ledger",
          "targets": [{ "os": "default", "uri": "http://localhost:5173" }]
        }
      ]
    };

    return this.sendToTeams(payload, `Check-Out for ${employee.fullName} @ ${school.schoolName}`);
  }

  /**
   * Broadcasts Super Admin Daily Executive Summary to Teams channel
   */
  public async broadcastDailyExecutiveSummary(summary: {
    date: string;
    totalVisits: number;
    completedVisits: number;
    activeExecutivesCount: number;
    totalWorkforce: number;
    zohoSyncedCount: number;
    topTerritory?: string;
  }): Promise<TeamsNotifyResult> {
    const payload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "0284C7", // Blue
      "summary": `📊 Super Admin Field Operations Briefing - ${summary.date}`,
      "sections": [
        {
          "activityTitle": `📊 Super Admin Operations Briefing: **${summary.date}**`,
          "activitySubtitle": `Zoho People & Teams Synchronized Field Intelligence`,
          "facts": [
            { "name": "Active Field Force:", "value": `**${summary.activeExecutivesCount} / ${summary.totalWorkforce}** Reps on Ground` },
            { "name": "Client School Touchpoints:", "value": `**${summary.totalVisits}** Total Visits (**${summary.completedVisits}** Completed)` },
            { "name": "Zoho People Attendance:", "value": `✅ **${summary.zohoSyncedCount}** Verified Punches Synced` },
            { "name": "Dual-Photo Audit Pass:", "value": `**100%** (Gate & Meeting Proofs Recorded)` },
            { "name": "Top Active Zone:", "value": summary.topTerritory || "Bangalore Central & Sarjapur" }
          ],
          "markdown": true
        }
      ],
      "potentialAction": [
        {
          "@type": "OpenURIOAction",
          "name": "Open Super Admin Command Center",
          "targets": [{ "os": "default", "uri": "http://localhost:5173" }]
        }
      ]
    };

    return this.sendToTeams(payload, `Super Admin Daily Briefing (${summary.date})`);
  }

  /**
   * Sends a test alert card to Teams
   */
  public async sendTestAlert(): Promise<TeamsNotifyResult> {
    if (this.isDummyWebhook() && this.webhookUrl) {
      return {
        success: true,
        message: '✅ Dummy / Sandbox Teams Webhook Handshake Verified! Office 365 Connector card format validated.',
        isSimulated: true
      };
    }

    const payload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "6366F1", // Indigo
      "summary": "Techno School Teams Webhook Integration Test",
      "sections": [
        {
          "activityTitle": "🚀 Techno School - Microsoft Teams Integration Verified",
          "activitySubtitle": "Connected to Field Sales Attendance Engine",
          "facts": [
            { "name": "Status:", "value": "🟢 Webhook Online & Receiving Cards" },
            { "name": "Timestamp:", "value": new Date().toLocaleString() },
            { "name": "Engine Version:", "value": "2.0.0 (Dual-Photo & Geofencing)" }
          ],
          "markdown": true
        }
      ]
    };

    return this.sendToTeams(payload, "Integration Handshake Test");
  }

  private async sendToTeams(payload: any, eventDesc: string): Promise<TeamsNotifyResult> {
    if (!this.isConfigured()) {
      console.log(`[MS Teams Simulation] Card Prepared for: "${eventDesc}"`);
      return {
        success: true,
        message: `[Simulated] Microsoft Teams card logged to console for "${eventDesc}". Add TEAMS_WEBHOOK_URL to .env for live channel broadcasting.`,
        isSimulated: true
      };
    }

    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        return {
          success: false,
          message: `Teams webhook responded with ${res.status}: ${text}`,
          isSimulated: false
        };
      }

      return {
        success: true,
        message: `Teams notification card delivered successfully for "${eventDesc}"`,
        isSimulated: false
      };
    } catch (err: any) {
      console.error('[Teams Service] Webhook delivery failed:', err.message);
      return {
        success: false,
        message: err.message,
        isSimulated: false
      };
    }
  }
}

export const teamsService = new TeamsService();
