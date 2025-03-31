import { 
  User, InsertUser, 
  Professional, InsertProfessional, 
  Jurisdiction, InsertJurisdiction, 
  Hearing, InsertHearing, 
  Payment, InsertPayment, 
  Task, InsertTask 
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Professional operations
  getProfessional(id: number): Promise<Professional | undefined>;
  getProfessionals(): Promise<Professional[]>;
  getProfessionalsByJurisdiction(jurisdiction: string): Promise<Professional[]>;
  getProfessionalsByType(type: string): Promise<Professional[]>;
  createProfessional(professional: InsertProfessional): Promise<Professional>;
  updateProfessional(id: number, professional: Partial<Professional>): Promise<Professional | undefined>;
  deleteProfessional(id: number): Promise<boolean>;
  
  // Jurisdiction operations
  getJurisdiction(id: number): Promise<Jurisdiction | undefined>;
  getJurisdictions(): Promise<Jurisdiction[]>;
  createJurisdiction(jurisdiction: InsertJurisdiction): Promise<Jurisdiction>;
  updateJurisdiction(id: number, jurisdiction: Partial<Jurisdiction>): Promise<Jurisdiction | undefined>;
  deleteJurisdiction(id: number): Promise<boolean>;
  
  // Hearing operations
  getHearing(id: number): Promise<Hearing | undefined>;
  getHearings(): Promise<Hearing[]>;
  getHearingsByDate(date: string): Promise<Hearing[]>;
  getHearingsByProfessional(professionalId: number): Promise<Hearing[]>;
  getHearingsByJurisdiction(jurisdictionId: number): Promise<Hearing[]>;
  getHearingsByStatus(status: string): Promise<Hearing[]>;
  getUpcomingHearings(): Promise<Hearing[]>;
  getPendingAssignmentHearings(): Promise<Hearing[]>;
  createHearing(hearing: InsertHearing): Promise<Hearing>;
  updateHearing(id: number, hearing: Partial<Hearing>): Promise<Hearing | undefined>;
  deleteHearing(id: number): Promise<boolean>;
  
  // Payment operations
  getPayment(id: number): Promise<Payment | undefined>;
  getPayments(): Promise<Payment[]>;
  getPaymentsByProfessional(professionalId: number): Promise<Payment[]>;
  getPaymentsByStatus(status: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<boolean>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasks(): Promise<Task[]>;
  getTasksByStatus(status: string): Promise<Task[]>;
  getTasksByType(type: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Statistics and reports
  getHearingStats(): Promise<{ 
    todayCount: number; 
    pendingAssignment: number; 
    pendingMinutes: number; 
    pendingPayments: number 
  }>;
  getFinancialSummary(period?: string): Promise<{ 
    total: number; 
    pending: number; 
    paid: number 
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private professionals: Map<number, Professional>;
  private jurisdictions: Map<number, Jurisdiction>;
  private hearings: Map<number, Hearing>;
  private payments: Map<number, Payment>;
  private tasks: Map<number, Task>;
  
  private userIdCounter: number;
  private professionalIdCounter: number;
  private jurisdictionIdCounter: number;
  private hearingIdCounter: number;
  private paymentIdCounter: number;
  private taskIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.professionals = new Map();
    this.jurisdictions = new Map();
    this.hearings = new Map();
    this.payments = new Map();
    this.tasks = new Map();
    
    this.userIdCounter = 1;
    this.professionalIdCounter = 1;
    this.jurisdictionIdCounter = 1;
    this.hearingIdCounter = 1;
    this.paymentIdCounter = 1;
    this.taskIdCounter = 1;
    
    this.seedData();
  }
  
  private seedData() {
    // Add some initial data for testing
    // Add admin user
    this.createUser({
      username: "admin",
      password: "admin",
      name: "Admin",
      email: "admin@juriscrm.com",
      role: "admin"
    });
    
    // Add jurisdictions
    const jurisdictions = [
      { name: "Foro Central Civil", state: "SP", city: "São Paulo", address: "Praça João Mendes, s/n" },
      { name: "Foro Regional Criminal", state: "RJ", city: "Rio de Janeiro", address: "Av. Erasmo Braga, 115" },
      { name: "Vara Trabalhista", state: "MG", city: "Belo Horizonte", address: "Av. Augusto de Lima, 1234" },
      { name: "Vara Federal", state: "DF", city: "Brasília", address: "SAUS Quadra 2, Bloco G" },
      { name: "Vara Cível", state: "RS", city: "Porto Alegre", address: "Rua Manoelito de Ornellas, 50" }
    ];
    
    jurisdictions.forEach(j => this.createJurisdiction(j));
    
    // Add professionals
    const professionals = [
      { name: "Dr. Carlos Mendes", email: "carlos@juriscrm.com", phone: "11987654321", type: "lawyer", specialization: "Civil", jurisdictions: ["SP", "RJ"] },
      { name: "Dra. Mariana Costa", email: "mariana@juriscrm.com", phone: "21987654321", type: "lawyer", specialization: "Criminal", jurisdictions: ["RJ", "SP"] },
      { name: "Dr. Rafael Almeida", email: "rafael@juriscrm.com", phone: "31987654321", type: "lawyer", specialization: "Labor", jurisdictions: ["MG", "SP"] },
      { name: "Dra. Patrícia Lima", email: "patricia@juriscrm.com", phone: "61987654321", type: "court_official", specialization: "Civil", jurisdictions: ["DF", "SP"] },
      { name: "Dr. Eduardo Santos", email: "eduardo@juriscrm.com", phone: "51987654321", type: "court_official", specialization: "Criminal", jurisdictions: ["RS", "RJ"] }
    ];
    
    professionals.forEach(p => this.createProfessional(p));
    
    // Add some hearings
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const hearingData = [
      { 
        processNumber: "2023.0123.4567", 
        jurisdictionId: 1, 
        date: today.toISOString().split('T')[0], 
        time: "14:30", 
        type: "Instruction", 
        area: "Civil", 
        professionalId: 1, 
        status: "assigned" 
      },
      { 
        processNumber: "2023.7654.3210", 
        jurisdictionId: 2, 
        date: tomorrow.toISOString().split('T')[0], 
        time: "10:00", 
        type: "Conciliation", 
        area: "Criminal", 
        professionalId: 2, 
        status: "assigned" 
      },
      { 
        processNumber: "2023.9876.5432", 
        jurisdictionId: 3, 
        date: tomorrow.toISOString().split('T')[0], 
        time: "09:15", 
        type: "Judgment", 
        area: "Labor", 
        status: "pending" 
      }
    ];
    
    hearingData.forEach(h => this.createHearing(h));
    
    // Add tasks
    const tasks = [
      { 
        title: "Upload de Ata Pendente", 
        description: "Proc. 2023.0001.2345 - Audiência realizada em 10/06", 
        status: "pending", 
        type: "upload_minutes", 
        relatedId: 1 
      },
      { 
        title: "Designar Advogado", 
        description: "Proc. 2023.9876.5432 - Audiência em 14/06", 
        status: "pending", 
        type: "assign_professional", 
        relatedId: 3 
      },
      { 
        title: "Pagamento Pendente", 
        description: "Dr. Rafael Almeida - 3 audiências concluídas", 
        status: "pending", 
        type: "payment", 
        relatedId: 3 
      }
    ];
    
    tasks.forEach(t => this.createTask(t));
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
  
  // Professional operations
  async getProfessional(id: number): Promise<Professional | undefined> {
    return this.professionals.get(id);
  }
  
  async getProfessionals(): Promise<Professional[]> {
    return Array.from(this.professionals.values());
  }
  
  async getProfessionalsByJurisdiction(jurisdiction: string): Promise<Professional[]> {
    return Array.from(this.professionals.values()).filter(
      p => p.jurisdictions.includes(jurisdiction)
    );
  }
  
  async getProfessionalsByType(type: string): Promise<Professional[]> {
    return Array.from(this.professionals.values()).filter(
      p => p.type === type
    );
  }
  
  async createProfessional(professional: InsertProfessional): Promise<Professional> {
    const id = this.professionalIdCounter++;
    const newProfessional: Professional = { ...professional, id };
    this.professionals.set(id, newProfessional);
    return newProfessional;
  }
  
  async updateProfessional(id: number, professional: Partial<Professional>): Promise<Professional | undefined> {
    const existingProfessional = this.professionals.get(id);
    if (!existingProfessional) return undefined;
    
    const updatedProfessional = { ...existingProfessional, ...professional };
    this.professionals.set(id, updatedProfessional);
    return updatedProfessional;
  }
  
  async deleteProfessional(id: number): Promise<boolean> {
    return this.professionals.delete(id);
  }
  
  // Jurisdiction operations
  async getJurisdiction(id: number): Promise<Jurisdiction | undefined> {
    return this.jurisdictions.get(id);
  }
  
  async getJurisdictions(): Promise<Jurisdiction[]> {
    return Array.from(this.jurisdictions.values());
  }
  
  async createJurisdiction(jurisdiction: InsertJurisdiction): Promise<Jurisdiction> {
    const id = this.jurisdictionIdCounter++;
    const newJurisdiction: Jurisdiction = { ...jurisdiction, id };
    this.jurisdictions.set(id, newJurisdiction);
    return newJurisdiction;
  }
  
  async updateJurisdiction(id: number, jurisdiction: Partial<Jurisdiction>): Promise<Jurisdiction | undefined> {
    const existingJurisdiction = this.jurisdictions.get(id);
    if (!existingJurisdiction) return undefined;
    
    const updatedJurisdiction = { ...existingJurisdiction, ...jurisdiction };
    this.jurisdictions.set(id, updatedJurisdiction);
    return updatedJurisdiction;
  }
  
  async deleteJurisdiction(id: number): Promise<boolean> {
    return this.jurisdictions.delete(id);
  }
  
  // Hearing operations
  async getHearing(id: number): Promise<Hearing | undefined> {
    return this.hearings.get(id);
  }
  
  async getHearings(): Promise<Hearing[]> {
    return Array.from(this.hearings.values());
  }
  
  async getHearingsByDate(date: string): Promise<Hearing[]> {
    return Array.from(this.hearings.values()).filter(
      h => h.date.toString().split('T')[0] === date
    );
  }
  
  async getHearingsByProfessional(professionalId: number): Promise<Hearing[]> {
    return Array.from(this.hearings.values()).filter(
      h => h.professionalId === professionalId
    );
  }
  
  async getHearingsByJurisdiction(jurisdictionId: number): Promise<Hearing[]> {
    return Array.from(this.hearings.values()).filter(
      h => h.jurisdictionId === jurisdictionId
    );
  }
  
  async getHearingsByStatus(status: string): Promise<Hearing[]> {
    return Array.from(this.hearings.values()).filter(
      h => h.status === status
    );
  }
  
  async getUpcomingHearings(): Promise<Hearing[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.hearings.values())
      .filter(h => {
        const hearingDate = new Date(h.date);
        hearingDate.setHours(0, 0, 0, 0);
        return hearingDate >= today;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date.toString().split('T')[0]}T${a.time}`);
        const dateB = new Date(`${b.date.toString().split('T')[0]}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }
  
  async getPendingAssignmentHearings(): Promise<Hearing[]> {
    return Array.from(this.hearings.values()).filter(
      h => h.status === "pending"
    );
  }
  
  async createHearing(hearing: InsertHearing): Promise<Hearing> {
    const id = this.hearingIdCounter++;
    const newHearing: Hearing = { 
      ...hearing, 
      id, 
      minutesUploaded: false, 
      paymentStatus: "pending", 
      createdAt: new Date() 
    };
    this.hearings.set(id, newHearing);
    return newHearing;
  }
  
  async updateHearing(id: number, hearing: Partial<Hearing>): Promise<Hearing | undefined> {
    const existingHearing = this.hearings.get(id);
    if (!existingHearing) return undefined;
    
    const updatedHearing = { ...existingHearing, ...hearing };
    this.hearings.set(id, updatedHearing);
    return updatedHearing;
  }
  
  async deleteHearing(id: number): Promise<boolean> {
    return this.hearings.delete(id);
  }
  
  // Payment operations
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }
  
  async getPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }
  
  async getPaymentsByProfessional(professionalId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      p => p.professionalId === professionalId
    );
  }
  
  async getPaymentsByStatus(status: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      p => p.status === status
    );
  }
  
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    const newPayment: Payment = { ...payment, id, createdAt: new Date() };
    this.payments.set(id, newPayment);
    
    // Update hearing payment status
    const hearing = this.hearings.get(payment.hearingId);
    if (hearing) {
      hearing.paymentStatus = payment.status;
      hearing.paymentAmount = payment.amount;
      this.hearings.set(hearing.id, hearing);
    }
    
    return newPayment;
  }
  
  async updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined> {
    const existingPayment = this.payments.get(id);
    if (!existingPayment) return undefined;
    
    const updatedPayment = { ...existingPayment, ...payment };
    this.payments.set(id, updatedPayment);
    
    // Update hearing payment status if changed
    if (payment.status && existingPayment.status !== payment.status) {
      const hearing = this.hearings.get(existingPayment.hearingId);
      if (hearing) {
        hearing.paymentStatus = payment.status;
        this.hearings.set(hearing.id, hearing);
      }
    }
    
    return updatedPayment;
  }
  
  async deletePayment(id: number): Promise<boolean> {
    return this.payments.delete(id);
  }
  
  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }
  
  async getTasksByStatus(status: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      t => t.status === status
    );
  }
  
  async getTasksByType(type: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      t => t.type === type
    );
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const newTask: Task = { ...task, id, createdAt: new Date() };
    this.tasks.set(id, newTask);
    return newTask;
  }
  
  async updateTask(id: number, task: Partial<Task>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { ...existingTask, ...task };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  // Statistics and reports
  async getHearingStats(): Promise<{ 
    todayCount: number; 
    pendingAssignment: number; 
    pendingMinutes: number; 
    pendingPayments: number 
  }> {
    const today = new Date().toISOString().split('T')[0];
    const hearings = Array.from(this.hearings.values());
    
    const todayCount = hearings.filter(h => h.date.toString().split('T')[0] === today).length;
    const pendingAssignment = hearings.filter(h => h.status === "pending").length;
    const pendingMinutes = hearings.filter(h => h.status === "completed" && !h.minutesUploaded).length;
    const pendingPayments = hearings.filter(h => h.status === "completed" && h.paymentStatus === "pending").length;
    
    return { 
      todayCount, 
      pendingAssignment, 
      pendingMinutes, 
      pendingPayments 
    };
  }
  
  async getFinancialSummary(period = "month"): Promise<{ 
    total: number; 
    pending: number; 
    paid: number 
  }> {
    const payments = Array.from(this.payments.values());
    
    let filteredPayments = payments;
    
    if (period === "week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filteredPayments = payments.filter(p => new Date(p.createdAt) >= oneWeekAgo);
    } else if (period === "month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      filteredPayments = payments.filter(p => new Date(p.createdAt) >= oneMonthAgo);
    }
    
    const total = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const pending = filteredPayments
      .filter(p => p.status === "pending")
      .reduce((sum, payment) => sum + payment.amount, 0);
    const paid = filteredPayments
      .filter(p => p.status === "paid")
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    return { total, pending, paid };
  }
}

export const storage = new MemStorage();
