import { storage } from '../storage';
import { emailService } from './email';
import type { Invoice, User } from '@shared/schema';

export class NudgeService {
  async processOverdueInvoices(): Promise<void> {
    const overdueInvoices = await storage.getOverdueInvoices();
    
    for (const invoice of overdueInvoices) {
      await this.processInvoiceNudge(invoice);
    }
  }

  private async processInvoiceNudge(invoice: Invoice): Promise<void> {
    const user = await storage.getUser(invoice.userId);
    if (!user) return;

    const daysSinceOverdue = this.getDaysSinceOverdue(invoice.dueDate);
    const daysSinceLastNudge = invoice.lastNudgeAt ? this.getDaysSince(invoice.lastNudgeAt) : 0;
    
    // Check if we should send a nudge
    if (!await this.shouldSendNudge(user, daysSinceOverdue, daysSinceLastNudge, invoice.nudgeCount || 0)) {
      return;
    }

    // Check user limits (free tier: 3 active invoices)
    if (!user.isPro && await this.getActiveInvoiceCount(user.id) > 3) {
      return;
    }

    // Check max nudges limit
    const maxNudges = user.isPro ? 5 : 3;
    if ((invoice.nudgeCount || 0) >= maxNudges) {
      // Stop nudging this invoice
      await storage.updateInvoice(invoice.id, { nudgeActive: false });
      return;
    }

    try {
      await emailService.sendInvoiceNudge(invoice, user, (invoice.nudgeCount || 0) + 1);
      console.log(`Nudge sent for invoice ${invoice.invoiceId} to ${invoice.clientEmail}`);
    } catch (error) {
      console.error(`Failed to send nudge for invoice ${invoice.invoiceId}:`, error);
    }
  }

  private getDaysSinceOverdue(dueDate: Date): number {
    const now = new Date();
    const diffTime = now.getTime() - dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getDaysSince(date: Date): number {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async shouldSendNudge(user: User, daysSinceOverdue: number, daysSinceLastNudge: number, nudgeCount: number): Promise<boolean> {
    // Check if nudges are enabled
    if (!user.nudgeEnabled) return false;
    
    // Check business hours
    if (user.businessHoursOnly) {
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour < (user.businessStartHour || 9) || currentHour >= (user.businessEndHour || 17)) {
        return false;
      }
    }
    
    // Check weekdays only
    if (user.weekdaysOnly) {
      const now = new Date();
      const dayOfWeek = now.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Sunday = 0, Saturday = 6
    }
    
    // First nudge: after configured delay
    const firstNudgeDelay = user.firstNudgeDelay || 1;
    if (nudgeCount === 0 && daysSinceOverdue >= firstNudgeDelay) {
      return true;
    }
    
    // Subsequent nudges: every configured interval
    const nudgeInterval = user.nudgeInterval || 3;
    if (nudgeCount > 0 && daysSinceLastNudge >= nudgeInterval) {
      return true;
    }
    
    return false;
  }

  private async getActiveInvoiceCount(userId: number): Promise<number> {
    const invoices = await storage.getInvoicesByUser(userId);
    return invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').length;
  }

  async getUpcomingNudges(userId: number): Promise<Array<{
    invoice: Invoice;
    nextNudgeDate: Date;
    nudgeNumber: number;
  }>> {
    const invoices = await storage.getInvoicesByUser(userId);
    const upcomingNudges = [];

    for (const invoice of invoices) {
      if (invoice.status !== 'pending' || !invoice.nudgeActive) continue;

      const nextNudgeDate = this.calculateNextNudgeDate(invoice);
      if (nextNudgeDate) {
        upcomingNudges.push({
          invoice,
          nextNudgeDate,
          nudgeNumber: (invoice.nudgeCount || 0) + 1,
        });
      }
    }

    return upcomingNudges.sort((a, b) => a.nextNudgeDate.getTime() - b.nextNudgeDate.getTime());
  }

  private calculateNextNudgeDate(invoice: Invoice): Date | null {
    const now = new Date();
    const nudgeCount = invoice.nudgeCount || 0;
    
    if (nudgeCount === 0) {
      // First nudge: 1 day after due date
      const firstNudgeDate = new Date(invoice.dueDate.getTime() + 24 * 60 * 60 * 1000);
      return firstNudgeDate > now ? firstNudgeDate : now;
    }
    
    if (invoice.lastNudgeAt) {
      // Subsequent nudges: every 3 days
      const nextNudgeDate = new Date(invoice.lastNudgeAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      return nextNudgeDate > now ? nextNudgeDate : now;
    }
    
    return null;
  }
}

export const nudgeService = new NudgeService();
