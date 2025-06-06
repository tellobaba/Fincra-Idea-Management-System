import { users, ideas, comments, userVotes, follows, notifications, challengeParticipants, type User, type InsertUser, type Idea, type InsertIdea, type Comment, type InsertComment, type InsertUserVote, type UserVote, type InsertFollow, type Follow, type InsertNotification, type Notification, type InsertChallengeParticipant, type ChallengeParticipant } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, asc, desc, and, or, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getUsers(role?: string): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;
  getUserSubmissions(userId: number): Promise<Idea[]>;
  
  // Idea operations
  createIdea(idea: InsertIdea): Promise<Idea>;
  getIdea(id: number): Promise<Idea | undefined>;
  getIdeas(filters?: { 
    status?: string; 
    submittedById?: number; 
    category?: string; 
    department?: string;
    priority?: string;
    search?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<Idea[]>;
  updateIdea(id: number, updates: Partial<Idea>): Promise<Idea | undefined>;
  deleteIdea(id: number): Promise<boolean>;
  voteIdea(id: number, userId: number): Promise<Idea | undefined>;
  getUserVotedIdeas(userId: number): Promise<Idea[]>;
  checkUserVote(userId: number, ideaId: number): Promise<boolean>;
  removeUserVote(userId: number, ideaId: number): Promise<boolean>;
  getTopIdeas(limit?: number): Promise<Idea[]>;
  assignIdea(id: number, userId: number): Promise<Idea | undefined>;
  changeIdeaStatus(id: number, status: string): Promise<Idea | undefined>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getComments(ideaId: number): Promise<Comment[]>;
  
  // Leaderboard
  getLeaderboard(filters?: { timeRange?: string; startDate?: Date; endDate?: Date; category?: string; department?: string; sortBy?: string }): Promise<{ user: User; ideasSubmitted: number; ideasImplemented: number; impactScore: number; votesReceived: number; lastSubmissionDate?: string; categoryBreakdown: { ideas: number; challenges: number; painPoints: number }; status?: string }[]>;
  
  // Admin operations
  getIdeasForReview(): Promise<Idea[]>;
  getIdeasByStatus(status: string): Promise<Idea[]>;
  getIdeasByDepartment(department: string): Promise<Idea[]>;
  getIdeasByPriority(priority: string): Promise<Idea[]>;
  getIdeasByCategory(category: string): Promise<Idea[]>;
  getIdeasAssignedTo(userId: number): Promise<Idea[]>;
  
  // Metrics
  getMetrics(): Promise<{ 
    ideasSubmitted: number; 
    inReview: number; 
    implemented: number; 
    costSaved: number; 
    revenueGenerated: number 
  }>;
  
  // Follow operations
  followItem(userId: number, itemId: number, itemType: string): Promise<Follow>;
  unfollowItem(userId: number, itemId: number, itemType: string): Promise<boolean>;
  isItemFollowed(userId: number, itemId: number, itemType: string): Promise<boolean>;
  getUserFollowedItems(userId: number): Promise<Idea[]>;
  
  // Search operations
  searchItems(query: string): Promise<{ 
    ideas: (Idea & { submitter?: { id: number; displayName: string; department: string; avatarUrl?: string; } })[], 
    challenges: (Idea & { submitter?: { id: number; displayName: string; department: string; avatarUrl?: string; } })[], 
    painPoints: (Idea & { submitter?: { id: number; displayName: string; department: string; avatarUrl?: string; } })[]
  }>;
  getSearchSuggestions(query: string): Promise<{ id: number; title: string; category: string }[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number, limit?: number, onlyUnread?: boolean): Promise<(Notification & { actor?: { id: number; displayName: string; avatarUrl?: string; } })[]>;
  markNotificationAsRead(id: number): Promise<Notification>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  
  // Challenge Participant operations
  addChallengeParticipant(userId: number, challengeId: number): Promise<ChallengeParticipant>;
  removeChallengeParticipant(userId: number, challengeId: number): Promise<boolean>;
  isChallengeParticipant(userId: number, challengeId: number): Promise<boolean>;
  getChallengeParticipants(challengeId: number): Promise<User[]>;
  getUserParticipatingChallenges(userId: number): Promise<Idea[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Add initial admin user if not exists
    this.initializeAdminUser().catch(err => {
      console.error("Failed to initialize admin user:", err);
    });
  }

  private async initializeAdminUser() {
    const adminUser = await this.getUserByUsername("admin@fincra.com");
    
    if (!adminUser) {
      await this.createUser({
        username: "admin@fincra.com",
        password: "$2b$10$ZWqrRTfv2E4p9TGvAzMiOO6k9oADxM/9Cl5qV.Vej/yPZD5QjC852", // "password"
        displayName: "Admin User",
        department: "Administration",
        role: "admin",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
      });
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
      
    return user;
  }
  
  async getUsers(role?: string): Promise<User[]> {
    let query = db.select().from(users);
    
    if (role) {
      query = query.where(eq(users.role, role));
    }
    
    return await query;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      // Begin a transaction to ensure all related records are deleted
      return await db.transaction(async (tx) => {
        // Delete user votes
        await tx.delete(userVotes).where(eq(userVotes.userId, id));
        
        // Delete user follows
        await tx.delete(follows).where(eq(follows.userId, id));
        
        // Delete notifications related to the user
        await tx.delete(notifications).where(eq(notifications.userId, id));
        
        // Delete comments made by the user
        await tx.delete(comments).where(eq(comments.userId, id));
        
        // Get user's ideas
        const userIdeas = await tx.select({ id: ideas.id })
          .from(ideas)
          .where(eq(ideas.submittedById, id));
        
        // Delete comments on user's ideas
        for (const idea of userIdeas) {
          await tx.delete(comments).where(eq(comments.ideaId, idea.id));
          
          // Delete votes on user's ideas
          await tx.delete(userVotes).where(eq(userVotes.ideaId, idea.id));
          
          // Delete follows on user's ideas
          await tx.delete(follows)
            .where(and(
              eq(follows.itemId, idea.id),
              eq(follows.itemType, 'idea')
            ));
        }
        
        // Delete user's ideas
        await tx.delete(ideas).where(eq(ideas.submittedById, id));
        
        // Finally, delete the user
        const result = await tx.delete(users).where(eq(users.id, id));
        
        return result.rowCount > 0;
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
  
  async getUserSubmissions(userId: number): Promise<Idea[]> {
    return await db.select()
      .from(ideas)
      .where(eq(ideas.submittedById, userId))
      .orderBy(desc(ideas.createdAt));
  }
  
  // Idea operations
  async createIdea(insertIdea: InsertIdea): Promise<Idea> {
    const now = new Date();
    
    const [idea] = await db.insert(ideas).values({
      ...insertIdea,
      status: 'submitted',
      votes: 0,
      createdAt: now,
      updatedAt: now,
      impactScore: null,
      costSaved: null,
      revenueGenerated: null,
      assignedToId: null,
    }).returning();
    
    return idea;
  }
  
  async getIdea(id: number): Promise<Idea | undefined> {
    const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
    return idea;
  }
  
  async getIdeas(filters?: { 
    status?: string; 
    submittedById?: number; 
    category?: string; 
    department?: string;
    priority?: string;
    search?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<Idea[]> {
    let query = db.select().from(ideas);
    
    if (filters) {
      const conditions = [];
      
      if (filters.status) {
        conditions.push(eq(ideas.status, filters.status));
      }
      
      if (filters.submittedById) {
        conditions.push(eq(ideas.submittedById, filters.submittedById));
      }
      
      if (filters.category) {
        conditions.push(eq(ideas.category, filters.category));
      }
      
      if (filters.department) {
        conditions.push(eq(ideas.department, filters.department));
      }
      
      if (filters.priority) {
        conditions.push(eq(ideas.priority, filters.priority));
      }
      
      // Future enhancement: Filter by related challenge ID
      
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        conditions.push(
          sql`(${ideas.title} ILIKE ${searchTerm} OR ${ideas.description} ILIKE ${searchTerm})`
        );
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Apply sorting
      if (filters.sortBy) {
        const column = this.getColumnForSort(filters.sortBy);
        const direction = filters.sortDirection === 'asc' ? asc : desc;
        query = query.orderBy(direction(column));
      } else {
        // Default to most recent first
        query = query.orderBy(desc(ideas.createdAt));
      }
      
      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
        
        if (filters.offset) {
          query = query.offset(filters.offset);
        }
      }
    } else {
      // Default to most recent first
      query = query.orderBy(desc(ideas.createdAt));
    }
    
    return await query;
  }
  
  // Helper to get the correct column for sorting
  private getColumnForSort(sortBy: string) {
    switch(sortBy) {
      case 'title': return ideas.title;
      case 'category': return ideas.category;
      case 'department': return ideas.department;
      case 'status': return ideas.status;
      case 'priority': return ideas.priority;
      case 'votes': return ideas.votes;
      case 'createdAt': return ideas.createdAt;
      case 'updatedAt': return ideas.updatedAt;
      default: return ideas.createdAt;
    }
  }
  
  async updateIdea(id: number, updates: Partial<Idea>): Promise<Idea | undefined> {
    const [idea] = await db
      .update(ideas)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(ideas.id, id))
      .returning();
    
    return idea;
  }
  
  async deleteIdea(id: number): Promise<boolean> {
    try {
      // Use a transaction to ensure all related records are deleted atomically
      await db.transaction(async (tx) => {
        // First delete all votes for this idea
        await tx.delete(userVotes).where(eq(userVotes.ideaId, id));
        
        // Then delete all comments for this idea
        await tx.delete(comments).where(eq(comments.ideaId, id));
        
        // Delete all follows for this idea (for all category types)
        await tx.delete(follows).where(eq(follows.itemId, id));
        
        // Delete all notifications related to this idea
        await tx.delete(notifications).where(and(
          eq(notifications.relatedItemId, id),
          eq(notifications.relatedItemType, 'idea')
        ));
        
        // Finally delete the idea itself
        await tx.delete(ideas).where(eq(ideas.id, id));
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting idea:", error);
      return false;
    }
  }
  
  async voteIdea(id: number, userId: number): Promise<Idea | undefined> {
    // Check if the user has already voted for this idea
    const hasVoted = await this.checkUserVote(userId, id);
    
    if (hasVoted) {
      // User already voted, return the idea without changes
      return await this.getIdea(id);
    }
    
    // Start a transaction to ensure both the vote count update and the user vote record are created atomically
    return await db.transaction(async (tx) => {
      // Increment the idea's vote count
      const [idea] = await tx
        .update(ideas)
        .set({ 
          votes: sql`${ideas.votes} + 1`,
          updatedAt: new Date()
        })
        .where(eq(ideas.id, id))
        .returning();
      
      // Record the user's vote
      await tx
        .insert(userVotes)
        .values({
          userId,
          ideaId: id,
        });
      
      return idea;
    });
  }
  
  async checkUserVote(userId: number, ideaId: number): Promise<boolean> {
    const votes = await db
      .select()
      .from(userVotes)
      .where(
        and(
          eq(userVotes.userId, userId),
          eq(userVotes.ideaId, ideaId)
        )
      );
    
    return votes.length > 0;
  }
  
  async getUserVotedIdeas(userId: number): Promise<Idea[]> {
    // Get all ideas voted by the user using a join between userVotes and ideas
    const result = await db
      .select({
        id: ideas.id,
        title: ideas.title,
        description: ideas.description,
        category: ideas.category,
        tags: ideas.tags,
        department: ideas.department,
        status: ideas.status,
        priority: ideas.priority,
        votes: ideas.votes,
        submittedById: ideas.submittedById,
        assignedToId: ideas.assignedToId,
        createdAt: ideas.createdAt,
        updatedAt: ideas.updatedAt,
        impactScore: ideas.impactScore,
        costSaved: ideas.costSaved,
        revenueGenerated: ideas.revenueGenerated,
        attachments: ideas.attachments,
        mediaUrls: ideas.mediaUrls,
        impact: ideas.impact,
        adminNotes: ideas.adminNotes,
        attachmentUrl: ideas.attachmentUrl,
        organizationCategory: ideas.organizationCategory,
        inspiration: ideas.inspiration,
        similarSolutions: ideas.similarSolutions
      })
      .from(ideas)
      .innerJoin(userVotes, eq(ideas.id, userVotes.ideaId))
      .where(eq(userVotes.userId, userId))
      .orderBy(desc(ideas.createdAt));
      
    return result;
  }
  
  async removeUserVote(userId: number, ideaId: number): Promise<boolean> {
    // Check if the user has voted for this idea
    const hasVoted = await this.checkUserVote(userId, ideaId);
    
    if (!hasVoted) {
      return false; // User hasn't voted, nothing to remove
    }
    
    // Start a transaction to ensure both the vote count update and the user vote record are removed atomically
    try {
      await db.transaction(async (tx) => {
        // Decrement the idea's vote count
        await tx
          .update(ideas)
          .set({ 
            votes: sql`${ideas.votes} - 1`,
            updatedAt: new Date()
          })
          .where(eq(ideas.id, ideaId));
        
        // Remove the user's vote record
        await tx
          .delete(userVotes)
          .where(
            and(
              eq(userVotes.userId, userId),
              eq(userVotes.ideaId, ideaId)
            )
          );
      });
      
      return true;
    } catch (error) {
      console.error("Error removing user vote:", error);
      return false;
    }
  }
  
  async getTopIdeas(limit: number = 5): Promise<Idea[]> {
    return await db
      .select()
      .from(ideas)
      .orderBy(desc(ideas.votes))
      .limit(limit);
  }
  
  // Comment operations
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({
        ...insertComment,
        createdAt: new Date(),
      })
      .returning();
    
    return comment;
  }
  
  async getComments(ideaId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.ideaId, ideaId))
      .orderBy(asc(comments.createdAt));
  }
  
  // Leaderboard
  async getLeaderboard(filters?: { timeRange?: string, startDate?: Date, endDate?: Date, category?: string, department?: string, sortBy?: string }): Promise<{ user: User; ideasSubmitted: number; ideasImplemented: number; impactScore: number; votesReceived: number; lastSubmissionDate?: string; categoryBreakdown: { ideas: number; challenges: number; painPoints: number } }[]> {
    // Prepare date filters
    let startDate = new Date(0); // Default to epoch start
    let endDate = new Date(); // Default to current date
    
    if (filters?.timeRange) {
      const now = new Date();
      switch (filters.timeRange) {
        case 'this-week':
          startDate = new Date(now.setDate(now.getDate() - now.getDay()));
          break;
        case 'last-week':
          const lastWeekEnd = new Date(now.setDate(now.getDate() - now.getDay()));
          startDate = new Date(lastWeekEnd.setDate(lastWeekEnd.getDate() - 7));
          endDate = new Date(lastWeekEnd.setDate(lastWeekEnd.getDate() + 6));
          break;
        case 'this-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last-month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'this-year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'custom':
          if (filters.startDate) startDate = new Date(filters.startDate);
          if (filters.endDate) endDate = new Date(filters.endDate);
          break;
      }
    }
    
    // Construct the category filter
    let categoryFilter = "";
    if (filters?.category) {
      categoryFilter = `AND category = '${filters.category}'`;
    }
    
    // Construct the department filter
    let departmentJoin = "";
    if (filters?.department) {
      departmentJoin = `AND u.department = '${filters.department}'`;
    }
    
    // We need to use SQL for more complex queries like this
    const result = await db.execute(sql`
      WITH idea_counts AS (
        SELECT 
          "submitted_by_id",
          COUNT(*) AS ideas_submitted,
          COUNT(*) FILTER (WHERE status = 'implemented') AS ideas_implemented,
          SUM(votes) AS total_votes,
          COUNT(*) FILTER (WHERE category = 'opportunity') AS ideas_count,
          COUNT(*) FILTER (WHERE category = 'challenge') AS challenges_count,
          COUNT(*) FILTER (WHERE category = 'pain-point') AS pain_points_count,
          MAX("created_at") AS last_submission_date
        FROM ${ideas}
        WHERE "created_at" BETWEEN ${startDate} AND ${endDate}
        ${sql.raw(categoryFilter)}
        GROUP BY "submitted_by_id"
      )
      SELECT 
        u.*,
        COALESCE(ic.ideas_submitted, 0) AS ideas_submitted,
        COALESCE(ic.ideas_implemented, 0) AS ideas_implemented,
        COALESCE(ic.total_votes, 0) AS votes_received,
        COALESCE((ic.ideas_submitted * 2) + (ic.ideas_implemented * 5) + ic.total_votes, 0) AS impact_score,
        COALESCE(ic.ideas_count, 0) AS ideas_count,
        COALESCE(ic.challenges_count, 0) AS challenges_count,
        COALESCE(ic.pain_points_count, 0) AS pain_points_count,
        ic.last_submission_date
      FROM ${users} u
      LEFT JOIN idea_counts ic ON u.id = ic."submitted_by_id"
      WHERE (ic.ideas_submitted > 0 OR ic.ideas_implemented > 0)
      ${sql.raw(departmentJoin)}
      ORDER BY ${sql.raw(filters?.sortBy === 'votes' ? 'votes_received' : 
                     filters?.sortBy === 'approved' ? 'ideas_implemented' : 
                     filters?.sortBy === 'newest' ? 'last_submission_date' : 
                     'ideas_submitted')} DESC
    `);
    
    return result.rows.map((row: any) => {
      // Calculate contributor status
      let status: 'Top Contributor' | 'Active Contributor' | 'New Contributor' | undefined;
      const impactScore = parseInt(row.impact_score) || 0;
      const ideasSubmitted = parseInt(row.ideas_submitted) || 0;
      
      if (impactScore > 50) {
        status = 'Top Contributor';
      } else if (ideasSubmitted > 2) {
        status = 'Active Contributor';
      } else if (ideasSubmitted > 0) {
        status = 'New Contributor';
      }
      
      return {
        user: {
          id: row.id,
          username: row.username,
          displayName: row.display_name,
          department: row.department,
          role: row.role,
          avatarUrl: row.avatar_url,
          email: row.username, // Email is stored in username field
          password: row.password, // Not used in frontend, just for type compatibility
        },
        ideasSubmitted,
        ideasImplemented: parseInt(row.ideas_implemented) || 0,
        impactScore,
        votesReceived: parseInt(row.votes_received) || 0,
        lastSubmissionDate: row.last_submission_date ? new Date(row.last_submission_date).toISOString() : undefined,
        categoryBreakdown: {
          ideas: parseInt(row.ideas_count) || 0,
          challenges: parseInt(row.challenges_count) || 0,
          painPoints: parseInt(row.pain_points_count) || 0,
        },
        status
      };
    });
  }
  
  // Admin operations
  async getIdeasForReview(): Promise<Idea[]> {
    return await db
      .select()
      .from(ideas)
      .where(eq(ideas.status, 'submitted'))
      .orderBy(asc(ideas.createdAt));
  }

  async getIdeasByStatus(status: string): Promise<Idea[]> {
    return await db
      .select()
      .from(ideas)
      .where(eq(ideas.status, status))
      .orderBy(desc(ideas.updatedAt));
  }

  async getIdeasByDepartment(department: string): Promise<Idea[]> {
    return await db
      .select()
      .from(ideas)
      .where(eq(ideas.department, department))
      .orderBy(desc(ideas.createdAt));
  }

  async getIdeasByPriority(priority: string): Promise<Idea[]> {
    return await db
      .select()
      .from(ideas)
      .where(eq(ideas.priority, priority))
      .orderBy(desc(ideas.createdAt));
  }

  async getIdeasByCategory(category: string): Promise<Idea[]> {
    return await db
      .select()
      .from(ideas)
      .where(eq(ideas.category, category))
      .orderBy(desc(ideas.createdAt));
  }

  async getIdeasAssignedTo(userId: number): Promise<Idea[]> {
    return await db
      .select()
      .from(ideas)
      .where(eq(ideas.assignedToId, userId))
      .orderBy(desc(ideas.createdAt));
  }

  async assignIdea(id: number, userId: number): Promise<Idea | undefined> {
    const [idea] = await db
      .update(ideas)
      .set({ 
        assignedToId: userId,
        updatedAt: new Date()
      })
      .where(eq(ideas.id, id))
      .returning();
    
    return idea;
  }

  async changeIdeaStatus(id: number, status: string): Promise<Idea | undefined> {
    const [idea] = await db
      .update(ideas)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(ideas.id, id))
      .returning();
    
    return idea;
  }

  async getMetrics(): Promise<{ 
    ideasSubmitted: number; 
    inReview: number; 
    implemented: number; 
    costSaved: number; 
    revenueGenerated: number 
  }> {
    const allIdeas = await db.select().from(ideas);
    
    return {
      ideasSubmitted: allIdeas.length,
      inReview: allIdeas.filter(idea => idea.status === 'in-review').length,
      implemented: allIdeas.filter(idea => idea.status === 'implemented').length,
      costSaved: allIdeas
        .filter(idea => idea.costSaved !== null && idea.costSaved !== undefined)
        .reduce((sum, idea) => sum + (idea.costSaved || 0), 0),
      revenueGenerated: allIdeas
        .filter(idea => idea.revenueGenerated !== null && idea.revenueGenerated !== undefined)
        .reduce((sum, idea) => sum + (idea.revenueGenerated || 0), 0),
    };
  }

  // Follow operations
  async followItem(userId: number, itemId: number, itemType: string): Promise<Follow> {
    // Check if the user has already followed this item
    const isFollowed = await this.isItemFollowed(userId, itemId, itemType);
    
    if (isFollowed) {
      // User already follows the item, return the existing follow record
      const [follow] = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.userId, userId),
            eq(follows.itemId, itemId),
            eq(follows.itemType, itemType)
          )
        );
      return follow;
    }
    
    // Create a new follow record
    const [follow] = await db
      .insert(follows)
      .values({
        userId,
        itemId,
        itemType,
      })
      .returning();
    
    return follow;
  }
  
  async unfollowItem(userId: number, itemId: number, itemType: string): Promise<boolean> {
    // Delete the follow record if it exists
    try {
      const result = await db
        .delete(follows)
        .where(
          and(
            eq(follows.userId, userId),
            eq(follows.itemId, itemId),
            eq(follows.itemType, itemType)
          )
        );
      
      return true;
    } catch (error) {
      console.error("Error unfollowing item:", error);
      return false;
    }
  }
  
  async isItemFollowed(userId: number, itemId: number, itemType: string): Promise<boolean> {
    const followRecords = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.userId, userId),
          eq(follows.itemId, itemId),
          eq(follows.itemType, itemType)
        )
      );
    
    return followRecords.length > 0;
  }
  
  async getUserFollowedItems(userId: number): Promise<Idea[]> {
    // Get all items followed by the user using a join between follows and ideas
    const result = await db
      .select({
        id: ideas.id,
        title: ideas.title,
        description: ideas.description,
        category: ideas.category,
        tags: ideas.tags,
        department: ideas.department,
        status: ideas.status,
        priority: ideas.priority,
        votes: ideas.votes,
        submittedById: ideas.submittedById,
        assignedToId: ideas.assignedToId,
        createdAt: ideas.createdAt,
        updatedAt: ideas.updatedAt,
        impactScore: ideas.impactScore,
        costSaved: ideas.costSaved,
        revenueGenerated: ideas.revenueGenerated,
        attachments: ideas.attachments,
        mediaUrls: ideas.mediaUrls,
        impact: ideas.impact,
        adminNotes: ideas.adminNotes,
        attachmentUrl: ideas.attachmentUrl,
        organizationCategory: ideas.organizationCategory,
        inspiration: ideas.inspiration,
        similarSolutions: ideas.similarSolutions
      })
      .from(ideas)
      .innerJoin(follows, eq(ideas.id, follows.itemId))
      .where(
        and(
          eq(follows.userId, userId),
          // itemType field in follows matches category field in ideas
          // or is one of the specific categories we know about
          or(
            eq(follows.itemType, ideas.category),
            and(
              eq(follows.itemType, 'opportunity'),
              eq(ideas.category, 'opportunity')
            ),
            and(
              eq(follows.itemType, 'challenge'),
              eq(ideas.category, 'challenge')
            ),
            and(
              eq(follows.itemType, 'pain-point'),
              eq(ideas.category, 'pain-point')
            )
          )
        )
      )
      .orderBy(desc(ideas.createdAt));
    
    return result;
  }

  // Search operations
  async searchItems(query: string): Promise<{ 
    ideas: (Idea & { submitter?: { id: number; displayName: string; department: string; avatarUrl?: string; } })[], 
    challenges: (Idea & { submitter?: { id: number; displayName: string; department: string; avatarUrl?: string; } })[], 
    painPoints: (Idea & { submitter?: { id: number; displayName: string; department: string; avatarUrl?: string; } })[]
  }> {
    try {
      const searchTerm = `%${query}%`;
      
      // Create the search condition for title, description, and other searchable fields
      const searchCondition = or(
        sql`${ideas.title} ILIKE ${searchTerm}`,
        sql`${ideas.description} ILIKE ${searchTerm}`,
        sql`${ideas.impact} ILIKE ${searchTerm}`,
        sql`${ideas.adminNotes} ILIKE ${searchTerm}`
        // Removing the tags search as it's causing an error with the array type
      );
      
      // Get all matching ideas
      const allResults = await db
        .select()
        .from(ideas)
        .where(searchCondition)
        .orderBy(desc(ideas.createdAt));
      
      // Group results by category
      const results = {
        ideas: [] as (Idea & { submitter?: { id: number; displayName: string; department: string; avatarUrl?: string; } })[],
        challenges: [] as (Idea & { submitter?: { id: number; displayName: string; department: string; avatarUrl?: string; } })[],
        painPoints: [] as (Idea & { submitter?: { id: number; displayName: string; department: string; avatarUrl?: string; } })[]
      };
      
      // Attach user info to each idea and categorize
      for (const idea of allResults) {
        let submitter = undefined;
        
        if (idea.submittedById) {
          const user = await this.getUser(idea.submittedById);
          if (user) {
            submitter = {
              id: user.id,
              displayName: user.displayName || 'Anonymous',
              department: user.department || 'General',
              avatarUrl: user.avatarUrl
            };
          }
        }
        
        const ideaWithSubmitter = { ...idea, submitter };
        
        // Categorize by idea type
        if (idea.category === 'opportunity') {
          results.ideas.push(ideaWithSubmitter);
        } else if (idea.category === 'challenge') {
          results.challenges.push(ideaWithSubmitter);
        } else if (idea.category === 'pain-point') {
          results.painPoints.push(ideaWithSubmitter);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error searching items:', error);
      return { ideas: [], challenges: [], painPoints: [] };
    }
  }
  
  async getSearchSuggestions(query: string): Promise<{ id: number; title: string; category: string }[]> {
    try {
      if (!query || query.length < 2) {
        return [];
      }
      
      const searchTerm = `%${query}%`;
      
      // Search for ideas with matching titles for suggestions
      const suggestions = await db
        .select({
          id: ideas.id,
          title: ideas.title,
          category: ideas.category
        })
        .from(ideas)
        .where(sql`${ideas.title} ILIKE ${searchTerm}`)
        .orderBy(asc(ideas.title))
        .limit(10);
      
      return suggestions;
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }
  
  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      const [result] = await db
        .insert(notifications)
        .values({
          ...notification,
          isRead: false,
          createdAt: new Date()
        })
        .returning();
        
      return result;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
  
  async getUserNotifications(userId: number, limit: number = 10, onlyUnread: boolean = false): Promise<(Notification & { actor?: { id: number; displayName: string; avatarUrl?: string; } })[]> {
    try {
      let query = db
        .select({
          notification: notifications,
          actor: {
            id: users.id,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl
          }
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.actorId, users.id))
        .where(eq(notifications.userId, userId));
      
      if (onlyUnread) {
        query = query.where(eq(notifications.isRead, false));
      }
      
      const results = await query
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
        
      // Transform the results to match the expected return type
      return results.map(row => ({
        ...row.notification,
        actor: row.actor.id ? {
          id: row.actor.id,
          displayName: row.actor.displayName,
          avatarUrl: row.actor.avatarUrl
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }
  
  async markNotificationAsRead(id: number): Promise<Notification> {
    try {
      const [notification] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id))
        .returning();
        
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
  
  async getUnreadNotificationCount(userId: number): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
        
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  // Challenge Participant operations
  async addChallengeParticipant(userId: number, challengeId: number): Promise<ChallengeParticipant> {
    try {
      // Check if already a participant
      const existingParticipant = await db.select()
        .from(challengeParticipants)
        .where(and(
          eq(challengeParticipants.userId, userId),
          eq(challengeParticipants.challengeId, challengeId)
        ));
      
      if (existingParticipant.length > 0) {
        return existingParticipant[0];
      }

      // Add as participant
      const [participant] = await db.insert(challengeParticipants)
        .values({
          userId,
          challengeId
        })
        .returning();
      
      return participant;
    } catch (error) {
      console.error('Error adding challenge participant:', error);
      throw error;
    }
  }

  async removeChallengeParticipant(userId: number, challengeId: number): Promise<boolean> {
    try {
      await db.delete(challengeParticipants)
        .where(and(
          eq(challengeParticipants.userId, userId),
          eq(challengeParticipants.challengeId, challengeId)
        ));
      
      return true;
    } catch (error) {
      console.error('Error removing challenge participant:', error);
      return false;
    }
  }

  async isChallengeParticipant(userId: number, challengeId: number): Promise<boolean> {
    try {
      const result = await db.select()
        .from(challengeParticipants)
        .where(and(
          eq(challengeParticipants.userId, userId),
          eq(challengeParticipants.challengeId, challengeId)
        ));
      
      return result.length > 0;
    } catch (error) {
      console.error('Error checking if challenge participant:', error);
      return false;
    }
  }

  async getChallengeParticipants(challengeId: number): Promise<User[]> {
    try {
      const participants = await db.select()
        .from(challengeParticipants)
        .innerJoin(users, eq(challengeParticipants.userId, users.id))
        .where(eq(challengeParticipants.challengeId, challengeId));
      
      // Extract just the user data from each row
      return participants.map(p => ({
        id: p.users.id,
        username: p.users.username,
        password: p.users.password,
        displayName: p.users.displayName,
        department: p.users.department,
        role: p.users.role,
        avatarUrl: p.users.avatarUrl
      }));
    } catch (error) {
      console.error('Error getting challenge participants:', error);
      return [];
    }
  }

  async getUserParticipatingChallenges(userId: number): Promise<Idea[]> {
    try {
      const challenges = await db.select()
        .from(challengeParticipants)
        .innerJoin(ideas, eq(challengeParticipants.challengeId, ideas.id))
        .where(and(
          eq(challengeParticipants.userId, userId),
          eq(ideas.category, 'challenge')
        ));
      
      // Extract just the idea data from each row
      return challenges.map(c => ({
        id: c.ideas.id,
        title: c.ideas.title,
        description: c.ideas.description,
        category: c.ideas.category,
        tags: c.ideas.tags,
        department: c.ideas.department,
        status: c.ideas.status,
        priority: c.ideas.priority,
        votes: c.ideas.votes,
        submittedById: c.ideas.submittedById,
        assignedToId: c.ideas.assignedToId,
        reviewerId: c.ideas.reviewerId,
        reviewerEmail: c.ideas.reviewerEmail,
        transformerId: c.ideas.transformerId,
        transformerEmail: c.ideas.transformerEmail,
        implementerId: c.ideas.implementerId,
        implementerEmail: c.ideas.implementerEmail,
        createdAt: c.ideas.createdAt,
        updatedAt: c.ideas.updatedAt,
        impactScore: c.ideas.impactScore,
        costSaved: c.ideas.costSaved,
        revenueGenerated: c.ideas.revenueGenerated,
        attachments: c.ideas.attachments,
        mediaUrls: c.ideas.mediaUrls,
        impact: c.ideas.impact,
        adminNotes: c.ideas.adminNotes,
        attachmentUrl: c.ideas.attachmentUrl,
        organizationCategory: c.ideas.organizationCategory,
        inspiration: c.ideas.inspiration,
        similarSolutions: c.ideas.similarSolutions,
        workstream: c.ideas.workstream
      }));
    } catch (error) {
      console.error('Error getting user participating challenges:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
