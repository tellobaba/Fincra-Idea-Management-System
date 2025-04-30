import { users, ideas, comments, type User, type InsertUser, type Idea, type InsertIdea, type Comment, type InsertComment } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Idea operations
  createIdea(idea: InsertIdea): Promise<Idea>;
  getIdea(id: number): Promise<Idea | undefined>;
  getIdeas(filters?: { status?: string; submittedById?: number }): Promise<Idea[]>;
  updateIdea(id: number, updates: Partial<Idea>): Promise<Idea | undefined>;
  deleteIdea(id: number): Promise<boolean>;
  voteIdea(id: number): Promise<Idea | undefined>;
  getTopIdeas(limit?: number): Promise<Idea[]>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getComments(ideaId: number): Promise<Comment[]>;
  
  // Leaderboard
  getLeaderboard(): Promise<{ user: User; ideasSubmitted: number; ideasImplemented: number; impactScore: number }[]>;
  
  // Admin operations
  getIdeasForReview(): Promise<Idea[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private ideas: Map<number, Idea>;
  private comments: Map<number, Comment>;
  currentUserId: number;
  currentIdeaId: number;
  currentCommentId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.ideas = new Map();
    this.comments = new Map();
    this.currentUserId = 1;
    this.currentIdeaId = 1;
    this.currentCommentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
    
    // Add some initial data for testing
    this.createUser({
      username: "admin@fincra.com",
      password: "$2b$10$ZWqrRTfv2E4p9TGvAzMiOO6k9oADxM/9Cl5qV.Vej/yPZD5QjC852", // "password"
      displayName: "Admin User",
      department: "Administration",
      role: "admin",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Idea operations
  async createIdea(insertIdea: InsertIdea): Promise<Idea> {
    const id = this.currentIdeaId++;
    const now = new Date();
    
    const idea: Idea = {
      ...insertIdea,
      id,
      status: 'submitted',
      votes: 0,
      createdAt: now,
      updatedAt: now,
      impactScore: null,
      costSaved: null,
      revenueGenerated: null,
      assignedToId: null,
    };
    
    this.ideas.set(id, idea);
    return idea;
  }
  
  async getIdea(id: number): Promise<Idea | undefined> {
    return this.ideas.get(id);
  }
  
  async getIdeas(filters?: { status?: string; submittedById?: number }): Promise<Idea[]> {
    let result = Array.from(this.ideas.values());
    
    if (filters) {
      if (filters.status) {
        result = result.filter(idea => idea.status === filters.status);
      }
      
      if (filters.submittedById) {
        result = result.filter(idea => idea.submittedById === filters.submittedById);
      }
    }
    
    // Sort by most recent first
    return result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  async updateIdea(id: number, updates: Partial<Idea>): Promise<Idea | undefined> {
    const idea = this.ideas.get(id);
    
    if (!idea) return undefined;
    
    const updatedIdea: Idea = {
      ...idea,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.ideas.set(id, updatedIdea);
    return updatedIdea;
  }
  
  async deleteIdea(id: number): Promise<boolean> {
    return this.ideas.delete(id);
  }
  
  async voteIdea(id: number): Promise<Idea | undefined> {
    const idea = this.ideas.get(id);
    
    if (!idea) return undefined;
    
    const updatedIdea: Idea = {
      ...idea,
      votes: idea.votes + 1,
      updatedAt: new Date(),
    };
    
    this.ideas.set(id, updatedIdea);
    return updatedIdea;
  }
  
  async getTopIdeas(limit: number = 5): Promise<Idea[]> {
    const allIdeas = Array.from(this.ideas.values());
    return allIdeas
      .sort((a, b) => b.votes - a.votes)
      .slice(0, limit);
  }
  
  // Comment operations
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const now = new Date();
    
    const comment: Comment = {
      ...insertComment,
      id,
      createdAt: now,
    };
    
    this.comments.set(id, comment);
    return comment;
  }
  
  async getComments(ideaId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.ideaId === ideaId)
      .sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }
  
  // Leaderboard
  async getLeaderboard(): Promise<{ user: User; ideasSubmitted: number; ideasImplemented: number; impactScore: number }[]> {
    const users = Array.from(this.users.values());
    const ideas = Array.from(this.ideas.values());
    
    const leaderboard = users.map(user => {
      const userIdeas = ideas.filter(idea => idea.submittedById === user.id);
      const implementedIdeas = userIdeas.filter(idea => idea.status === 'implemented');
      
      // Calculate impact score (simplified for demonstration)
      let impactScore = userIdeas.length * 2; // 2 points per idea
      impactScore += implementedIdeas.length * 5; // 5 additional points per implemented idea
      
      // Add points based on votes
      const totalVotes = userIdeas.reduce((sum, idea) => sum + idea.votes, 0);
      impactScore += totalVotes;
      
      return {
        user,
        ideasSubmitted: userIdeas.length,
        ideasImplemented: implementedIdeas.length,
        impactScore,
      };
    });
    
    // Sort by impact score (highest first)
    return leaderboard.sort((a, b) => b.impactScore - a.impactScore);
  }
  
  // Admin operations
  async getIdeasForReview(): Promise<Idea[]> {
    return Array.from(this.ideas.values())
      .filter(idea => idea.status === 'submitted')
      .sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }
}

export const storage = new MemStorage();
