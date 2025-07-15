import cron from 'node-cron';
import { nudgeService } from './nudge';

export class CronService {
  start(): void {
    // Run nudge processing every hour
    cron.schedule('0 * * * *', async () => {
      console.log('Running nudge processing...');
      try {
        await nudgeService.processOverdueInvoices();
        console.log('Nudge processing completed');
      } catch (error) {
        console.error('Error processing nudges:', error);
      }
    });

    // Run daily cleanup at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('Running daily cleanup...');
      // Add cleanup tasks here if needed
    });

    console.log('Cron jobs started');
  }
}

export const cronService = new CronService();
