import { users, invoices, subscriptions, nudgeLogs, emailTemplates, type User, type InsertUser, type Invoice, type InsertInvoice, type Subscription, type InsertSubscription, type NudgeLog, type InsertNudgeLog, type EmailTemplate, type InsertEmailTemplate } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, sql, lt, gte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  updateUserStripeInfo(id: number, stripeCustomerId: string, stripeSubscriptionId: string, tier?: string): Promise<User>;
  confirmUserEmail(token: string): Promise<User | undefined>;
  setPasswordResetToken(email: string, token: string, expiry: Date): Promise<void>;
  resetPassword(token: string, hashedPassword: string): Promise<User | undefined>;
  
  // Invoices
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByUser(userId: number): Promise<Invoice[]>;
  createInvoice(userId: number, invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice>;
  markInvoicePaid(id: number): Promise<Invoice>;
  getOverdueInvoices(): Promise<Invoice[]>;
  getUserInvoiceStats(userId: number): Promise<{
    total: number;
    paid: number;
    overdue: number;
    totalValue: string;
    paidValue: string;
  }>;
  
  // Subscriptions
  getSubscriptionByUser(userId: number): Promise<Subscription | undefined>;
  createSubscription(userId: number, subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription>;
  
  // Nudge Logs
  createNudgeLog(nudgeLog: InsertNudgeLog): Promise<NudgeLog>;
  getNudgeLogsByInvoice(invoiceId: number): Promise<NudgeLog[]>;
  
  // Email Templates
  getEmailTemplateByUser(userId: number, tone: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(userId: number, template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, updates: Partial<EmailTemplate>): Promise<EmailTemplate>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: number, stripeCustomerId: string, stripeSubscriptionId: string, tier: string = 'pro'): Promise<User> {
    const tierToMaxInvoices = {
      'pro': 50,
      'platinum': 1000,
      'enterprise': 5000,
      'unlimited': -1,
    };
    
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionTier: tier,
        maxInvoices: tierToMaxInvoices[tier as keyof typeof tierToMaxInvoices] || 50,
        isPro: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async confirmUserEmail(token: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        emailConfirmed: true,
        emailConfirmToken: null,
        updatedAt: new Date()
      })
      .where(eq(users.emailConfirmToken, token))
      .returning();
    return user || undefined;
  }

  async setPasswordResetToken(email: string, token: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({ 
        resetToken: token,
        resetTokenExpiry: expiry,
        updatedAt: new Date()
      })
      .where(eq(users.email, email));
  }

  async resetPassword(token: string, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(and(
        eq(users.resetToken, token),
        gte(users.resetTokenExpiry, new Date())
      ))
      .returning();
    return user || undefined;
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoicesByUser(userId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));
  }

  async createInvoice(userId: number, invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values({ ...invoice, userId })
      .returning();
    return newInvoice;
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async markInvoicePaid(id: number): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({ 
        status: "paid",
        paidAt: new Date(),
        nudgeActive: false,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async getOverdueInvoices(): Promise<Invoice[]> {
    const now = new Date();
    return await db
      .select()
      .from(invoices)
      .where(and(
        lt(invoices.dueDate, now),
        eq(invoices.status, "pending"),
        eq(invoices.nudgeActive, true)
      ))
      .orderBy(asc(invoices.dueDate));
  }

  async getUserInvoiceStats(userId: number): Promise<{
    total: number;
    paid: number;
    overdue: number;
    totalValue: string;
    paidValue: string;
  }> {
    const [totalCount] = await db
      .select({ count: count() })
      .from(invoices)
      .where(eq(invoices.userId, userId));

    const [paidCount] = await db
      .select({ count: count() })
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.status, "paid")));

    const [overdueCount] = await db
      .select({ count: count() })
      .from(invoices)
      .where(and(
        eq(invoices.userId, userId),
        eq(invoices.status, "pending"),
        lt(invoices.dueDate, new Date())
      ));

    const [totalValue] = await db
      .select({ sum: sql<string>`COALESCE(SUM(${invoices.amount}), 0)` })
      .from(invoices)
      .where(eq(invoices.userId, userId));

    const [paidValue] = await db
      .select({ sum: sql<string>`COALESCE(SUM(${invoices.amount}), 0)` })
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.status, "paid")));

    return {
      total: totalCount.count,
      paid: paidCount.count,
      overdue: overdueCount.count,
      totalValue: totalValue.sum,
      paidValue: paidValue.sum,
    };
  }

  async getSubscriptionByUser(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
    return subscription || undefined;
  }

  async createSubscription(userId: number, subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db
      .insert(subscriptions)
      .values({ ...subscription, userId })
      .returning();
    return newSubscription;
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  async createNudgeLog(nudgeLog: InsertNudgeLog): Promise<NudgeLog> {
    const [newNudgeLog] = await db
      .insert(nudgeLogs)
      .values(nudgeLog)
      .returning();
    return newNudgeLog;
  }

  async getNudgeLogsByInvoice(invoiceId: number): Promise<NudgeLog[]> {
    return await db
      .select()
      .from(nudgeLogs)
      .where(eq(nudgeLogs.invoiceId, invoiceId))
      .orderBy(desc(nudgeLogs.sentAt));
  }

  async getEmailTemplateByUser(userId: number, tone: string): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(and(eq(emailTemplates.userId, userId), eq(emailTemplates.tone, tone)));
    return template || undefined;
  }

  async createEmailTemplate(userId: number, template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db
      .insert(emailTemplates)
      .values({ ...template, userId })
      .returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: number, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const [template] = await db
      .update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return template;
  }
}

export const storage = new DatabaseStorage();
