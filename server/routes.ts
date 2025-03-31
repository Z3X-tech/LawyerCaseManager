import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { 
  insertProfessionalSchema, 
  insertJurisdictionSchema, 
  insertHearingSchema, 
  insertPaymentSchema, 
  insertTaskSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Get dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy" });
  });
  
  // professionals routes
  app.get("/api/professionals", async (_req, res) => {
    try {
      const professionals = await storage.getProfessionals();
      res.json(professionals);
    } catch (error) {
      console.error("Error getting professionals:", error);
      res.status(500).json({ error: "Error getting professionals" });
    }
  });
  
  app.get("/api/professionals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const professional = await storage.getProfessional(id);
      if (!professional) {
        return res.status(404).json({ error: "Professional not found" });
      }
      
      res.json(professional);
    } catch (error) {
      console.error("Error getting professional:", error);
      res.status(500).json({ error: "Error getting professional" });
    }
  });
  
  app.get("/api/professionals/jurisdiction/:jurisdiction", async (req, res) => {
    try {
      const jurisdiction = req.params.jurisdiction;
      const professionals = await storage.getProfessionalsByJurisdiction(jurisdiction);
      res.json(professionals);
    } catch (error) {
      console.error("Error getting professionals by jurisdiction:", error);
      res.status(500).json({ error: "Error getting professionals by jurisdiction" });
    }
  });
  
  app.get("/api/professionals/type/:type", async (req, res) => {
    try {
      const type = req.params.type;
      const professionals = await storage.getProfessionalsByType(type);
      res.json(professionals);
    } catch (error) {
      console.error("Error getting professionals by type:", error);
      res.status(500).json({ error: "Error getting professionals by type" });
    }
  });
  
  app.post("/api/professionals", async (req, res) => {
    try {
      const result = insertProfessionalSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      const professional = await storage.createProfessional(result.data);
      res.status(201).json(professional);
    } catch (error) {
      console.error("Error creating professional:", error);
      res.status(500).json({ error: "Error creating professional" });
    }
  });
  
  app.put("/api/professionals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const result = insertProfessionalSchema.partial().safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      const professional = await storage.updateProfessional(id, result.data);
      if (!professional) {
        return res.status(404).json({ error: "Professional not found" });
      }
      
      res.json(professional);
    } catch (error) {
      console.error("Error updating professional:", error);
      res.status(500).json({ error: "Error updating professional" });
    }
  });
  
  app.delete("/api/professionals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const success = await storage.deleteProfessional(id);
      if (!success) {
        return res.status(404).json({ error: "Professional not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting professional:", error);
      res.status(500).json({ error: "Error deleting professional" });
    }
  });
  
  // jurisdictions routes
  app.get("/api/jurisdictions", async (_req, res) => {
    try {
      const jurisdictions = await storage.getJurisdictions();
      res.json(jurisdictions);
    } catch (error) {
      console.error("Error getting jurisdictions:", error);
      res.status(500).json({ error: "Error getting jurisdictions" });
    }
  });
  
  app.get("/api/jurisdictions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const jurisdiction = await storage.getJurisdiction(id);
      if (!jurisdiction) {
        return res.status(404).json({ error: "Jurisdiction not found" });
      }
      
      res.json(jurisdiction);
    } catch (error) {
      console.error("Error getting jurisdiction:", error);
      res.status(500).json({ error: "Error getting jurisdiction" });
    }
  });
  
  app.post("/api/jurisdictions", async (req, res) => {
    try {
      const result = insertJurisdictionSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      const jurisdiction = await storage.createJurisdiction(result.data);
      res.status(201).json(jurisdiction);
    } catch (error) {
      console.error("Error creating jurisdiction:", error);
      res.status(500).json({ error: "Error creating jurisdiction" });
    }
  });
  
  app.put("/api/jurisdictions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const result = insertJurisdictionSchema.partial().safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      const jurisdiction = await storage.updateJurisdiction(id, result.data);
      if (!jurisdiction) {
        return res.status(404).json({ error: "Jurisdiction not found" });
      }
      
      res.json(jurisdiction);
    } catch (error) {
      console.error("Error updating jurisdiction:", error);
      res.status(500).json({ error: "Error updating jurisdiction" });
    }
  });
  
  app.delete("/api/jurisdictions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const success = await storage.deleteJurisdiction(id);
      if (!success) {
        return res.status(404).json({ error: "Jurisdiction not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting jurisdiction:", error);
      res.status(500).json({ error: "Error deleting jurisdiction" });
    }
  });
  
  // Hearings routes
  app.get("/api/hearings", async (_req, res) => {
    try {
      const hearings = await storage.getHearings();
      res.json(hearings);
    } catch (error) {
      console.error("Error getting hearings:", error);
      res.status(500).json({ error: "Error getting hearings" });
    }
  });
  
  app.get("/api/hearings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const hearing = await storage.getHearing(id);
      if (!hearing) {
        return res.status(404).json({ error: "Hearing not found" });
      }
      
      res.json(hearing);
    } catch (error) {
      console.error("Error getting hearing:", error);
      res.status(500).json({ error: "Error getting hearing" });
    }
  });
  
  app.get("/api/hearings/date/:date", async (req, res) => {
    try {
      const hearings = await storage.getHearingsByDate(req.params.date);
      res.json(hearings);
    } catch (error) {
      console.error("Error getting hearings by date:", error);
      res.status(500).json({ error: "Error getting hearings by date" });
    }
  });
  
  app.get("/api/hearings/professional/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const hearings = await storage.getHearingsByProfessional(id);
      res.json(hearings);
    } catch (error) {
      console.error("Error getting hearings by professional:", error);
      res.status(500).json({ error: "Error getting hearings by professional" });
    }
  });
  
  app.get("/api/hearings/jurisdiction/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const hearings = await storage.getHearingsByJurisdiction(id);
      res.json(hearings);
    } catch (error) {
      console.error("Error getting hearings by jurisdiction:", error);
      res.status(500).json({ error: "Error getting hearings by jurisdiction" });
    }
  });
  
  app.get("/api/hearings/status/:status", async (req, res) => {
    try {
      const hearings = await storage.getHearingsByStatus(req.params.status);
      res.json(hearings);
    } catch (error) {
      console.error("Error getting hearings by status:", error);
      res.status(500).json({ error: "Error getting hearings by status" });
    }
  });
  
  app.get("/api/hearings/upcoming", async (_req, res) => {
    try {
      const hearings = await storage.getUpcomingHearings();
      res.json(hearings);
    } catch (error) {
      console.error("Error getting upcoming hearings:", error);
      res.status(500).json({ error: "Error getting upcoming hearings" });
    }
  });
  
  app.get("/api/hearings/pending-assignment", async (_req, res) => {
    try {
      const hearings = await storage.getPendingAssignmentHearings();
      res.json(hearings);
    } catch (error) {
      console.error("Error getting pending assignment hearings:", error);
      res.status(500).json({ error: "Error getting pending assignment hearings" });
    }
  });
  
  app.post("/api/hearings", async (req, res) => {
    try {
      const result = insertHearingSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      const hearing = await storage.createHearing(result.data);
      res.status(201).json(hearing);
    } catch (error) {
      console.error("Error creating hearing:", error);
      res.status(500).json({ error: "Error creating hearing" });
    }
  });
  
  app.put("/api/hearings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const result = insertHearingSchema.partial().safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      const hearing = await storage.updateHearing(id, result.data);
      if (!hearing) {
        return res.status(404).json({ error: "Hearing not found" });
      }
      
      res.json(hearing);
    } catch (error) {
      console.error("Error updating hearing:", error);
      res.status(500).json({ error: "Error updating hearing" });
    }
  });
  
  app.delete("/api/hearings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const success = await storage.deleteHearing(id);
      if (!success) {
        return res.status(404).json({ error: "Hearing not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting hearing:", error);
      res.status(500).json({ error: "Error deleting hearing" });
    }
  });
  
  // Upload hearing minutes
  app.post("/api/hearings/:id/minutes", upload.single("minutes"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const hearing = await storage.getHearing(id);
      if (!hearing) {
        return res.status(404).json({ error: "Hearing not found" });
      }
      
      const minutesUrl = `/uploads/${req.file.filename}`;
      const updatedHearing = await storage.updateHearing(id, {
        minutesUploaded: true,
        minutesUrl,
        status: "completed"
      });
      
      if (!updatedHearing) {
        return res.status(500).json({ error: "Failed to update hearing" });
      }
      
      // Check if there's a task for uploading minutes for this hearing
      const tasks = await storage.getTasks();
      const minutesTask = tasks.find(t => 
        t.type === "upload_minutes" && 
        t.relatedId === id && 
        t.status === "pending"
      );
      
      if (minutesTask) {
        await storage.updateTask(minutesTask.id, { status: "completed" });
      }
      
      res.json(updatedHearing);
    } catch (error) {
      console.error("Error uploading minutes:", error);
      res.status(500).json({ error: "Error uploading minutes" });
    }
  });
  
  // Payments routes
  app.get("/api/payments", async (_req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error getting payments:", error);
      res.status(500).json({ error: "Error getting payments" });
    }
  });
  
  app.get("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const payment = await storage.getPayment(id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      res.json(payment);
    } catch (error) {
      console.error("Error getting payment:", error);
      res.status(500).json({ error: "Error getting payment" });
    }
  });
  
  app.get("/api/payments/professional/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const payments = await storage.getPaymentsByProfessional(id);
      res.json(payments);
    } catch (error) {
      console.error("Error getting payments by professional:", error);
      res.status(500).json({ error: "Error getting payments by professional" });
    }
  });
  
  app.get("/api/payments/status/:status", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByStatus(req.params.status);
      res.json(payments);
    } catch (error) {
      console.error("Error getting payments by status:", error);
      res.status(500).json({ error: "Error getting payments by status" });
    }
  });
  
  app.post("/api/payments", async (req, res) => {
    try {
      const result = insertPaymentSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      const payment = await storage.createPayment(result.data);
      
      // Check if there's a task for payment for this hearing
      const tasks = await storage.getTasks();
      const paymentTask = tasks.find(t => 
        t.type === "payment" && 
        t.relatedId === result.data.hearingId && 
        t.status === "pending"
      );
      
      if (paymentTask) {
        await storage.updateTask(paymentTask.id, { status: "completed" });
      }
      
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Error creating payment" });
    }
  });
  
  app.put("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const result = insertPaymentSchema.partial().safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      const payment = await storage.updatePayment(id, result.data);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      res.json(payment);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ error: "Error updating payment" });
    }
  });
  
  app.delete("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const success = await storage.deletePayment(id);
      if (!success) {
        return res.status(404).json({ error: "Payment not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ error: "Error deleting payment" });
    }
  });
  
  // Tasks routes
  app.get("/api/tasks", async (_req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error getting tasks:", error);
      res.status(500).json({ error: "Error getting tasks" });
    }
  });
  
  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error getting task:", error);
      res.status(500).json({ error: "Error getting task" });
    }
  });
  
  app.get("/api/tasks/status/:status", async (req, res) => {
    try {
      const tasks = await storage.getTasksByStatus(req.params.status);
      res.json(tasks);
    } catch (error) {
      console.error("Error getting tasks by status:", error);
      res.status(500).json({ error: "Error getting tasks by status" });
    }
  });
  
  app.get("/api/tasks/type/:type", async (req, res) => {
    try {
      const tasks = await storage.getTasksByType(req.params.type);
      res.json(tasks);
    } catch (error) {
      console.error("Error getting tasks by type:", error);
      res.status(500).json({ error: "Error getting tasks by type" });
    }
  });
  
  app.post("/api/tasks", async (req, res) => {
    try {
      const result = insertTaskSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      const task = await storage.createTask(result.data);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Error creating task" });
    }
  });
  
  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const result = insertTaskSchema.partial().safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      const task = await storage.updateTask(id, result.data);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Error updating task" });
    }
  });
  
  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const success = await storage.deleteTask(id);
      if (!success) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Error deleting task" });
    }
  });
  
  // Statistics and reports
  app.get("/api/stats/hearings", async (_req, res) => {
    try {
      const stats = await storage.getHearingStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting hearing stats:", error);
      res.status(500).json({ error: "Error getting hearing stats" });
    }
  });
  
  app.get("/api/stats/financial", async (req, res) => {
    try {
      const period = req.query.period as string || "month";
      const summary = await storage.getFinancialSummary(period);
      res.json(summary);
    } catch (error) {
      console.error("Error getting financial summary:", error);
      res.status(500).json({ error: "Error getting financial summary" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
