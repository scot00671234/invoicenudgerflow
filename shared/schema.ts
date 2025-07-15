import { pgTable, text, serial, integer, boolean, timestamp, numeric, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  businessName: varchar("business_name", { length: 255 }),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  messageTone: varchar("message_tone", { length: 20 }).default("friendly"),
  isPro: boolean("is_pro").default(false),
  subscriptionTier: varchar("subscription_tier", { length: 20 }).default("free"), // free, pro, platinum, enterprise, unlimited
  maxInvoices: integer("max_invoices").default(3),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  emailConfirmed: boolean("email_confirmed").default(false),
  emailConfirmToken: varchar("email_confirm_token", { length: 255 }),
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  nudgeEnabled: boolean("nudge_enabled").default(true),
  firstNudgeDelay: integer("first_nudge_delay").default(1),
  nudgeInterval: integer("nudge_interval").default(3),
  businessHoursOnly: boolean("business_hours_only").default(true),
  businessStartHour: integer("business_start_hour").default(9),
  businessEndHour: integer("business_end_hour").default(17),
  weekdaysOnly: boolean("weekdays_only").default(true),
  fromEmail: varchar("from_email", { length: 255 }),
  // SMTP settings for email automation
  smtpHost: varchar("smtp_host", { length: 255 }),
  smtpPort: integer("smtp_port").default(587),
  smtpUser: varchar("smtp_user", { length: 255 }),
  smtpPass: varchar("smtp_pass", { length: 255 }),
  smtpFromName: varchar("smtp_from_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull(),
  tier: varchar("tier", { length: 20 }).notNull(), // pro, platinum, enterprise, unlimited
  status: varchar("status", { length: 50 }).notNull(),
  nextPaymentDate: timestamp("next_payment_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }).notNull(),
  invoiceId: varchar("invoice_id", { length: 100 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, paid, overdue, cancelled
  paidAt: timestamp("paid_at"),
  nudgeCount: integer("nudge_count").default(0),
  lastNudgeAt: timestamp("last_nudge_at"),
  nudgeActive: boolean("nudge_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const nudgeLogs = pgTable("nudge_logs", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  emailSubject: varchar("email_subject", { length: 255 }).notNull(),
  emailBody: text("email_body").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  opened: boolean("opened").default(false),
  clicked: boolean("clicked").default(false),
});

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  tone: varchar("tone", { length: 20 }).notNull(),
  nudgeNumber: integer("nudge_number").default(1), // 1st, 2nd, 3rd nudge, etc.
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  invoices: many(invoices),
  subscriptions: many(subscriptions),
  emailTemplates: many(emailTemplates),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  nudgeLogs: many(nudgeLogs),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const nudgeLogsRelations = relations(nudgeLogs, ({ one }) => ({
  invoice: one(invoices, {
    fields: [nudgeLogs.invoiceId],
    references: [invoices.id],
  }),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  user: one(users, {
    fields: [emailTemplates.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  businessName: true,
  timezone: true,
  messageTone: true,
  emailConfirmToken: true,
  emailConfirmed: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  clientName: true,
  clientEmail: true,
  invoiceId: true,
  amount: true,
  dueDate: true,
}).extend({
  amount: z.string().or(z.number()).transform(val => String(val)),
  dueDate: z.string().or(z.date()).transform(val => new Date(val)),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  stripeSubscriptionId: true,
  tier: true,
  status: true,
  nextPaymentDate: true,
});

export const insertNudgeLogSchema = createInsertSchema(nudgeLogs).pick({
  invoiceId: true,
  emailSubject: true,
  emailBody: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).pick({
  tone: true,
  subject: true,
  body: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type NudgeLog = typeof nudgeLogs.$inferSelect;
export type InsertNudgeLog = z.infer<typeof insertNudgeLogSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
