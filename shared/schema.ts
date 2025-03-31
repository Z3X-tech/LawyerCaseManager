import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (for authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"), // admin, user
});

// Professionals table (lawyers and court officials)
export const professionals = pgTable("professionals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  type: text("type").notNull(), // lawyer, court_official
  specialization: text("specialization").notNull(), // Civil, Criminal, Labor, etc.
  jurisdictions: text("jurisdictions").array().notNull(),
  userId: integer("user_id").references(() => users.id),
  active: boolean("active").notNull().default(true),
});

// Jurisdictions table (comarcas)
export const jurisdictions = pgTable("jurisdictions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  state: text("state").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
});

// Hearings table
export const hearings = pgTable("hearings", {
  id: serial("id").primaryKey(),
  processNumber: text("process_number").notNull(),
  jurisdictionId: integer("jurisdiction_id").references(() => jurisdictions.id).notNull(),
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  type: text("type").notNull(), // Conciliation, Instruction, Judgment, etc.
  area: text("area").notNull(), // Civil, Criminal, Labor, etc.
  professionalId: integer("professional_id").references(() => professionals.id),
  status: text("status").notNull().default("pending"), // pending, assigned, completed, cancelled
  notes: text("notes"),
  minutesUploaded: boolean("minutes_uploaded").notNull().default(false),
  minutesUrl: text("minutes_url"),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, processing, paid
  paymentAmount: doublePrecision("payment_amount"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  hearingId: integer("hearing_id").references(() => hearings.id).notNull(),
  professionalId: integer("professional_id").references(() => professionals.id).notNull(),
  amount: doublePrecision("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, paid
  paymentDate: timestamp("payment_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed
  type: text("type").notNull(), // upload_minutes, assign_professional, payment, etc.
  relatedId: integer("related_id"), // Can be hearingId, professionalId, etc.
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertProfessionalSchema = createInsertSchema(professionals).omit({ id: true });
export const insertJurisdictionSchema = createInsertSchema(jurisdictions).omit({ id: true });
export const insertHearingSchema = createInsertSchema(hearings).omit({ 
  id: true, 
  createdAt: true, 
  minutesUploaded: true, 
  minutesUrl: true, 
  paymentStatus: true, 
  paymentAmount: true 
});
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Professional = typeof professionals.$inferSelect;
export type InsertProfessional = z.infer<typeof insertProfessionalSchema>;

export type Jurisdiction = typeof jurisdictions.$inferSelect;
export type InsertJurisdiction = z.infer<typeof insertJurisdictionSchema>;

export type Hearing = typeof hearings.$inferSelect;
export type InsertHearing = z.infer<typeof insertHearingSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// Extended schemas for validation
export const hearingFormSchema = insertHearingSchema.extend({
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().min(1, "Horário é obrigatório"),
});

export const paymentFormSchema = insertPaymentSchema.extend({
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
});

export const professionalFormSchema = insertProfessionalSchema.extend({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
});

export const jurisdictionFormSchema = insertJurisdictionSchema.extend({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  state: z.string().min(2, "Estado deve ter pelo menos 2 caracteres"),
  city: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres"),
});
