import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import crypto from "crypto";
import Stripe from "stripe";
import { storage } from "./storage";
import { emailService } from "./services/email";
import { nudgeService } from "./services/nudge";
import { cronService } from "./services/cron";
import { insertUserSchema, insertInvoiceSchema } from "@shared/schema";
import { z } from "zod";

// Only initialize Stripe if the secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil",
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: 'lax',
    },
  }));

  // Passport configuration
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.emailConfirmed) {
          return done(null, false, { message: 'Please confirm your email address' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Authentication required' });
  };

  // Auth routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, businessName } = insertUserSchema.extend({
        businessName: z.string().optional(),
      }).parse(req.body);

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with email confirmed by default (skip email verification in development)
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        businessName,
        emailConfirmed: true,
      });

      // Email confirmation is disabled in development mode
      console.log('User created successfully:', user.email);

      res.json({ message: 'Account created successfully! You can now log in.' });
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || 'Authentication failed' });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ user });
      });
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json(req.user);
  });

  app.post('/api/auth/confirm-email', async (req, res) => {
    try {
      const { token } = req.body;
      const user = await storage.confirmUserEmail(token);
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      res.json({ message: 'Email confirmed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Confirmation failed' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.json({ message: 'If the email exists, a reset link has been sent' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.setPasswordResetToken(email, resetToken, resetTokenExpiry);
      await emailService.sendPasswordResetEmail(user, resetToken);

      res.json({ message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to send reset email' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.resetPassword(token, hashedPassword);
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Password reset failed' });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
      const stats = await storage.getUserInvoiceStats((req.user as any).id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  app.get('/api/dashboard/upcoming-nudges', requireAuth, async (req, res) => {
    try {
      const upcomingNudges = await nudgeService.getUpcomingNudges((req.user as any).id);
      res.json(upcomingNudges);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch upcoming nudges' });
    }
  });

  // Invoice routes
  app.get('/api/invoices', requireAuth, async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByUser((req.user as any).id);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  });

  app.post('/api/invoices', requireAuth, async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse(req.body);
      
      // Check limits for free users
      if (!(req.user as any).isPro) {
        const invoices = await storage.getInvoicesByUser((req.user as any).id);
        const activeInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue');
        
        if (activeInvoices.length >= 3) {
          return res.status(400).json({ message: 'Free plan limited to 3 active invoices. Upgrade to Pro for unlimited invoices.' });
        }
      }

      const invoice = await storage.createInvoice((req.user as any).id, invoiceData);
      res.json(invoice);
    } catch (error: any) {
      res.status(400).json({ message: 'Invalid input', error: error.message });
    }
  });

  app.patch('/api/invoices/:id/mark-paid', requireAuth, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice || invoice.userId !== (req.user as any).id) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      const updatedInvoice = await storage.markInvoicePaid(invoiceId);
      res.json(updatedInvoice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark invoice as paid' });
    }
  });

  app.get('/api/invoices/:id/nudge-logs', requireAuth, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice || invoice.userId !== (req.user as any).id) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      const logs = await storage.getNudgeLogsByInvoice(invoiceId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch nudge logs' });
    }
  });

  // Settings routes
  app.get('/api/settings', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser((req.user as any).id);
      const subscription = await storage.getSubscriptionByUser((req.user as any).id);
      
      res.json({
        user: {
          email: user?.email,
          businessName: user?.businessName,
          timezone: user?.timezone,
          messageTone: user?.messageTone,
          isPro: user?.isPro,
        },
        subscription,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  app.patch('/api/settings', requireAuth, async (req, res) => {
    try {
      const { businessName, timezone, messageTone, smtpHost, smtpPort, smtpUser, smtpPass, smtpFromName, nudgeEnabled, firstNudgeDelay, nudgeInterval, businessHoursOnly, businessStartHour, businessEndHour, weekdaysOnly } = req.body;
      const user = await storage.updateUser((req.user as any).id, {
        businessName,
        timezone,
        messageTone,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        smtpFromName,
        nudgeEnabled,
        firstNudgeDelay,
        nudgeInterval,
        businessHoursOnly,
        businessStartHour,
        businessEndHour,
        weekdaysOnly,
      });
      
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update settings' });
    }
  });

  app.post('/api/test-smtp', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFromName } = req.body;
      
      // Create test transporter
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      // Send test email
      await transporter.sendMail({
        from: `${smtpFromName} <${smtpUser}>`,
        to: user.email,
        subject: 'SMTP Test - Flow',
        html: `
          <h2>SMTP Test Successful</h2>
          <p>Your SMTP configuration is working correctly!</p>
          <p>This test email was sent from your Flow application.</p>
          <hr>
          <p><small>Flow - Invoice Nudge Automation</small></p>
        `
      });

      res.json({ message: 'Test email sent successfully' });
    } catch (error) {
      console.error('SMTP test error:', error);
      res.status(500).json({ message: 'Failed to send test email: ' + error.message });
    }
  });

  // Nudge settings routes
  app.get('/api/nudge-settings', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser((req.user as any).id);
      const settings = {
        enabled: user?.nudgeEnabled ?? true,
        firstNudgeDelay: user?.firstNudgeDelay ?? 1,
        nudgeInterval: user?.nudgeInterval ?? 3,
        maxNudges: user?.isPro ? 5 : 3,
        businessHoursOnly: user?.businessHoursOnly ?? true,
        businessStartHour: user?.businessStartHour ?? 9,
        businessEndHour: user?.businessEndHour ?? 17,
        weekdaysOnly: user?.weekdaysOnly ?? true,
        fromEmail: user?.fromEmail ?? user?.email,
      };
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get nudge settings' });
    }
  });

  app.put('/api/nudge-settings', requireAuth, async (req, res) => {
    try {
      const { 
        enabled, 
        firstNudgeDelay, 
        nudgeInterval, 
        businessHoursOnly, 
        businessStartHour, 
        businessEndHour, 
        weekdaysOnly, 
        fromEmail 
      } = req.body;
      
      const user = await storage.updateUser((req.user as any).id, {
        nudgeEnabled: enabled,
        firstNudgeDelay,
        nudgeInterval,
        businessHoursOnly,
        businessStartHour,
        businessEndHour,
        weekdaysOnly,
        fromEmail,
      });
      
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update nudge settings' });
    }
  });

  // Email templates routes
  app.get('/api/email-templates', requireAuth, async (req, res) => {
    try {
      const templates = await storage.getEmailTemplateByUser((req.user as any).id, 'all');
      res.json(templates || []);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get email templates' });
    }
  });

  // Real-time data endpoints for notifications
  app.get('/api/recent-activity', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const recentInvoices = await storage.getInvoicesByUser(userId);
      
      // Generate activity from recent invoice changes
      const activities = recentInvoices
        .filter(invoice => invoice.status === 'paid')
        .map(invoice => ({
          id: `activity-${invoice.id}`,
          type: 'invoice_paid',
          invoiceId: invoice.invoiceId,
          amount: invoice.amount,
          timestamp: invoice.updatedAt || invoice.createdAt,
        }));
      
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get recent activity' });
    }
  });

  app.get('/api/invoices/overdue', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const invoices = await storage.getInvoicesByUser(userId);
      
      const overdueInvoices = invoices.filter(invoice => {
        const now = new Date();
        const dueDate = new Date(invoice.dueDate);
        return dueDate < now && invoice.status !== 'paid';
      });
      
      res.json(overdueInvoices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get overdue invoices' });
    }
  });

  app.get('/api/nudge-logs/recent', requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const invoices = await storage.getInvoicesByUser(userId);
      
      const recentLogs = [];
      for (const invoice of invoices) {
        const logs = await storage.getNudgeLogsByInvoice(invoice.id);
        const recentInvoiceLogs = logs
          .filter(log => {
            if (!log.sentAt) return false;
            const daysSince = (new Date().getTime() - new Date(log.sentAt).getTime()) / (1000 * 60 * 60 * 24);
            return daysSince <= 1; // Last 24 hours
          })
          .map(log => ({
            ...log,
            invoice: {
              id: invoice.id,
              clientName: invoice.clientName,
              invoiceId: invoice.invoiceId,
            }
          }));
        recentLogs.push(...recentInvoiceLogs);
      }
      
      res.json(recentLogs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get recent nudge logs' });
    }
  });

  // Stripe subscription routes
  app.post('/api/create-subscription', requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: { message: 'Stripe is not configured' } });
      }

      let user = req.user as any;
      const { tier = 'pro' } = req.body;

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        const latestInvoice = subscription.latest_invoice as any;
        const clientSecret = latestInvoice?.payment_intent?.client_secret || null;
        
        return res.json({
          subscriptionId: subscription.id,
          clientSecret,
        });
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: user.businessName || user.email,
      });

      // Map tier to Stripe price ID
      const priceIds = {
        'pro': process.env.STRIPE_PRICE_ID_PRO || 'price_pro_monthly',
        'platinum': process.env.STRIPE_PRICE_ID_PLATINUM || 'price_platinum_monthly',
        'enterprise': process.env.STRIPE_PRICE_ID_ENTERPRISE || 'price_enterprise_monthly',
        'unlimited': process.env.STRIPE_PRICE_ID_UNLIMITED || 'price_unlimited_monthly',
      };

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: priceIds[tier as keyof typeof priceIds] || priceIds.pro,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(user.id, customer.id, subscription.id, tier);
      await storage.createSubscription(user.id, {
        stripeSubscriptionId: subscription.id,
        tier,
        status: subscription.status,
        nextPaymentDate: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null,
      });

      const latestInvoice = subscription.latest_invoice as any;
      const clientSecret = latestInvoice?.payment_intent?.client_secret || null;

      res.json({
        subscriptionId: subscription.id,
        clientSecret,
      });
    } catch (error: any) {
      res.status(400).json({ error: { message: error.message } });
    }
  });

  app.post('/api/cancel-subscription', requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: 'Stripe is not configured' });
      }

      const user = req.user as any;
      
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: 'No active subscription' });
      }

      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      res.json({ message: 'Subscription will be cancelled at the end of the current period' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  });

  // Email template routes
  app.get('/api/email-templates', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const templates = await storage.getEmailTemplatesByUser(user.id);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch email templates' });
    }
  });

  app.post('/api/email-templates', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const templateData = {
        ...req.body,
        userId: user.id,
      };
      
      const template = await storage.createEmailTemplate(user.id, templateData);
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create email template' });
    }
  });

  app.patch('/api/email-templates/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const templateId = parseInt(req.params.id);
      
      // Check if template belongs to user
      const existingTemplate = await storage.getEmailTemplate(templateId);
      if (!existingTemplate || existingTemplate.userId !== user.id) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      const template = await storage.updateEmailTemplate(templateId, req.body);
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update email template' });
    }
  });

  app.delete('/api/email-templates/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const templateId = parseInt(req.params.id);
      
      // Check if template belongs to user
      const existingTemplate = await storage.getEmailTemplate(templateId);
      if (!existingTemplate || existingTemplate.userId !== user.id) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      await storage.deleteEmailTemplate(templateId);
      res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete email template' });
    }
  });

  // Unsubscribe route for clients
  app.get('/api/unsubscribe', async (req, res) => {
    try {
      const invoiceId = parseInt(req.query.invoice as string);
      await storage.updateInvoice(invoiceId, { nudgeActive: false });
      res.send(`
        <html>
          <head>
            <title>Unsubscribed - Flow</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .container { text-align: center; }
              .success { color: #059669; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="success">Unsubscribed Successfully</h1>
              <p>You will no longer receive payment reminders for this invoice.</p>
              <p>If you have any questions, please contact the business directly.</p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      res.status(500).send(`
        <html>
          <head>
            <title>Error - Flow</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .container { text-align: center; }
              .error { color: #dc2626; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Error</h1>
              <p>Failed to unsubscribe. Please try again or contact support.</p>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Start cron jobs
  cronService.start();

  const httpServer = createServer(app);
  return httpServer;
}
