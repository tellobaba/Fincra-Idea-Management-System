import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from 'fs';
import { setupAuth } from "./auth";
import { storage as dbStorage } from "./storage";
import { insertIdeaSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";
import multer from 'multer';
import { categorySchema, statusSchema, prioritySchema, departmentSchema, roleSchema } from '@shared/schema';

// Middleware to check if user is admin
const checkAdminRole = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  next();
};

// Setup for file uploads
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Create multer upload instance
const upload = multer({ 
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, pdfs, and common office document types
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mpeg|pdf|doc|docx|xls|xlsx|ppt|pptx/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (ext && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only images, videos, PDFs and office documents are allowed.'));
  }
});

// This middleware was moved to the top of the file

// Serve uploaded files
const serveUploads = (app: Express) => {
  const uploadDir = path.join(process.cwd(), 'uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Serve files from the uploads directory
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    res.sendFile(filePath, err => {
      if (err) next();
    });
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup upload handling
  serveUploads(app);
  // Serve assets from the client/src/assets directory
  app.use('/assets', (req, res, next) => {
    const assetPath = path.join(process.cwd(), 'client/src/assets', req.path);
    res.sendFile(assetPath, err => {
      if (err) next();
    });
  });

  // Authentication routes
  setupAuth(app);

  // Ideas routes
  // Get all ideas (with optional filters)
  app.get("/api/ideas", async (req, res) => {
    try {
      const filters: { 
        status?: string; 
        submittedById?: number; 
        category?: string; 
        department?: string;
        priority?: string;
        search?: string;
      } = {};
      
      // For admin users with 'all=true' parameter, don't apply status filter by default
      // This allows admins to see all ideas regardless of status
      if (!req.query.all && req.query.status) {
        filters.status = req.query.status as string;
      } else if (!req.query.all && !req.isAuthenticated()) {
        // Default filter for unauthenticated users or when 'all' is not specified
        // Only show ideas with status that should be visible to regular users
        filters.status = 'submitted';
      }
      
      // For admin dashboard with 'all=true', allow full access without filtering
      // But check that the user has admin rights
      if (req.query.all === 'true') {
        // Verify user has admin role
        if (!req.isAuthenticated() || !['admin', 'reviewer', 'transformer', 'implementer'].includes(req.user.role)) {
          return res.status(403).json({ message: "Admin access required" });
        }
        // If admin, don't apply the default status filter
      }
      
      if (req.query.submittedById && !isNaN(Number(req.query.submittedById))) {
        filters.submittedById = Number(req.query.submittedById);
      }
      
      if (req.query.category) {
        filters.category = req.query.category as string;
      }
      
      if (req.query.department) {
        filters.department = req.query.department as string;
      }
      
      if (req.query.priority) {
        filters.priority = req.query.priority as string;
      }
      
      const ideas = await dbStorage.getIdeas(filters);
      
      // Attach user info to each idea
      const ideasWithUsers = await Promise.all(
        ideas.map(async (idea) => {
          const submitter = await dbStorage.getUser(idea.submittedById);
          let assignedTo = null;
          
          if (idea.assignedToId) {
            assignedTo = await dbStorage.getUser(idea.assignedToId);
          }
          
          return {
            ...idea,
            submitter: submitter ? {
              id: submitter.id,
              displayName: submitter.displayName,
              department: submitter.department,
              avatarUrl: submitter.avatarUrl,
            } : null,
            assignedTo: assignedTo ? {
              id: assignedTo.id,
              displayName: assignedTo.displayName,
              department: assignedTo.department,
              avatarUrl: assignedTo.avatarUrl,
            } : null,
          };
        })
      );
      
      res.json(ideasWithUsers);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      res.status(500).json({ message: "Failed to fetch ideas" });
    }
  });

  // Get top ideas
  app.get("/api/ideas/top", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const ideas = await dbStorage.getTopIdeas(limit);
      
      // Attach user info to each idea
      const ideasWithUsers = await Promise.all(
        ideas.map(async (idea) => {
          const submitter = await dbStorage.getUser(idea.submittedById);
          
          return {
            ...idea,
            submitter: submitter ? {
              id: submitter.id,
              displayName: submitter.displayName,
              department: submitter.department,
              avatarUrl: submitter.avatarUrl,
            } : null,
          };
        })
      );
      
      res.json(ideasWithUsers);
    } catch (error) {
      console.error('Error fetching top ideas:', error);
      res.status(500).json({ message: "Failed to fetch top ideas" });
    }
  });

  // Get ideas for review (admin)
  app.get("/api/ideas/review", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user has admin role
      if (!['admin', 'reviewer', 'transformer', 'implementer'].includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const ideas = await dbStorage.getIdeasForReview();
      
      // Attach user info to each idea
      const ideasWithUsers = await Promise.all(
        ideas.map(async (idea) => {
          const submitter = await dbStorage.getUser(idea.submittedById);
          
          return {
            ...idea,
            submitter: submitter ? {
              id: submitter.id,
              displayName: submitter.displayName,
              department: submitter.department,
              avatarUrl: submitter.avatarUrl,
            } : null,
          };
        })
      );
      
      res.json(ideasWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ideas for review" });
    }
  });

  // Get single idea
  app.get("/api/ideas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const idea = await dbStorage.getIdea(id);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      // Attach user info
      const submitter = await dbStorage.getUser(idea.submittedById);
      let assignedTo = null;
      
      if (idea.assignedToId) {
        assignedTo = await dbStorage.getUser(idea.assignedToId);
      }
      
      // Get comments for the idea
      const comments = await dbStorage.getComments(id);
      
      // Attach user info to comments
      const commentsWithUsers = await Promise.all(
        comments.map(async (comment) => {
          const user = await dbStorage.getUser(comment.userId);
          
          return {
            ...comment,
            user: user ? {
              id: user.id,
              displayName: user.displayName,
              department: user.department,
              avatarUrl: user.avatarUrl,
              role: user.role,
            } : null,
          };
        })
      );
      
      res.json({
        ...idea,
        submitter: submitter ? {
          id: submitter.id,
          displayName: submitter.displayName,
          department: submitter.department,
          avatarUrl: submitter.avatarUrl,
        } : null,
        assignedTo: assignedTo ? {
          id: assignedTo.id,
          displayName: assignedTo.displayName,
          department: assignedTo.department,
          avatarUrl: assignedTo.avatarUrl,
        } : null,
        comments: commentsWithUsers,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch idea" });
    }
  });

  // Create new idea with file upload
  app.post("/api/ideas", upload.array('media', 5), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Process uploaded files if any
      const mediaUrls = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const fileUrl = `/uploads/${file.filename}`;
          const fileType = file.mimetype.split('/')[0]; // 'image', 'video', 'application'
          mediaUrls.push({
            type: fileType,
            url: fileUrl
          });
        }
      }
      
      // Validate request body
      const validationResult = insertIdeaSchema.safeParse({
        ...req.body,
        submittedById: req.user.id,
        mediaUrls: mediaUrls.length ? mediaUrls : undefined
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid idea data", errors: validationResult.error.errors });
      }
      
      const idea = await dbStorage.createIdea(validationResult.data);
      
      // Attach submitter info to response
      const submitter = await dbStorage.getUser(idea.submittedById);
      
      res.status(201).json({
        ...idea,
        submitter: submitter ? {
          id: submitter.id,
          displayName: submitter.displayName,
          department: submitter.department,
          avatarUrl: submitter.avatarUrl,
        } : null
      });
    } catch (error) {
      console.error('Error creating idea:', error);
      res.status(500).json({ message: "Failed to create idea" });
    }
  });

  // Update idea with file upload
  app.patch("/api/ideas/:id", upload.array('media', 5), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const idea = await dbStorage.getIdea(id);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      // Only allow updates if user is submitter or has admin role
      if (idea.submittedById !== req.user.id && 
          !['admin', 'reviewer', 'transformer', 'implementer'].includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Process uploaded files if any
      const mediaUrls = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const fileUrl = `/uploads/${file.filename}`;
          const fileType = file.mimetype.split('/')[0]; // 'image', 'video', 'application'
          mediaUrls.push({
            type: fileType,
            url: fileUrl
          });
        }
      }
      
      // Remove fields that shouldn't be updated directly
      const updates = { ...req.body };
      delete updates.id;
      delete updates.submittedById;
      delete updates.createdAt;
      
      // Add media URLs if any were uploaded
      if (mediaUrls.length > 0) {
        // Append to existing media or create new array
        const existingMedia = idea.mediaUrls || [];
        updates.mediaUrls = [...existingMedia, ...mediaUrls];
      }
      
      const updatedIdea = await dbStorage.updateIdea(id, updates);
      
      if (!updatedIdea) {
        return res.status(500).json({ message: "Failed to update idea" });
      }
      
      // Attach user info
      const submitter = await dbStorage.getUser(updatedIdea.submittedById);
      let assignedTo = null;
      
      if (updatedIdea.assignedToId) {
        assignedTo = await dbStorage.getUser(updatedIdea.assignedToId);
      }
      
      res.json({
        ...updatedIdea,
        submitter: submitter ? {
          id: submitter.id,
          displayName: submitter.displayName,
          department: submitter.department,
          avatarUrl: submitter.avatarUrl,
        } : null,
        assignedTo: assignedTo ? {
          id: assignedTo.id,
          displayName: assignedTo.displayName,
          department: assignedTo.department,
          avatarUrl: assignedTo.avatarUrl,
        } : null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update idea" });
    }
  });

  // Vote for an idea
  app.post("/api/ideas/:id/vote", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const idea = await dbStorage.getIdea(id);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      const updatedIdea = await dbStorage.voteIdea(id);
      
      if (!updatedIdea) {
        return res.status(500).json({ message: "Failed to vote for idea" });
      }
      
      res.json(updatedIdea);
    } catch (error) {
      res.status(500).json({ message: "Failed to vote for idea" });
    }
  });

  // Add comment to an idea
  app.post("/api/ideas/:id/comments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const ideaId = parseInt(req.params.id);
      
      if (isNaN(ideaId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const idea = await dbStorage.getIdea(ideaId);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      // Validate request body
      const validationResult = insertCommentSchema.safeParse({
        ...req.body,
        ideaId,
        userId: req.user.id,
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid comment data", errors: validationResult.error.errors });
      }
      
      const comment = await dbStorage.createComment(validationResult.data);
      
      // Attach user info
      const user = await dbStorage.getUser(comment.userId);
      
      res.status(201).json({
        ...comment,
        user: user ? {
          id: user.id,
          displayName: user.displayName,
          department: user.department,
          avatarUrl: user.avatarUrl,
          role: user.role,
        } : null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboard = await dbStorage.getLeaderboard();
      
      // Map to simplified response
      const response = leaderboard.map(entry => ({
        user: {
          id: entry.user.id,
          displayName: entry.user.displayName,
          department: entry.user.department,
          avatarUrl: entry.user.avatarUrl,
        },
        ideasSubmitted: entry.ideasSubmitted,
        ideasImplemented: entry.ideasImplemented,
        impactScore: entry.impactScore,
      }));
      
      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Admin endpoint to assign reviewer/implementer
  app.post("/api/ideas/:id/assign", checkAdminRole, async (req, res) => {
    try {
      const { userId } = req.body;
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const idea = await dbStorage.getIdea(id);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      const user = await dbStorage.getUser(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedIdea = await dbStorage.assignIdea(id, parseInt(userId));
      
      if (!updatedIdea) {
        return res.status(500).json({ message: "Failed to assign idea" });
      }
      
      // Attach user info
      const assignedTo = updatedIdea.assignedToId ? await dbStorage.getUser(updatedIdea.assignedToId) : null;
      
      res.json({
        ...updatedIdea,
        assignedTo: assignedTo ? {
          id: assignedTo.id,
          displayName: assignedTo.displayName,
          department: assignedTo.department,
          avatarUrl: assignedTo.avatarUrl,
          role: assignedTo.role,
        } : null,
      });
    } catch (error) {
      console.error('Error assigning idea:', error);
      res.status(500).json({ message: "Failed to assign idea" });
    }
  });

  // Admin endpoint to change idea status
  app.post("/api/ideas/:id/status", checkAdminRole, async (req, res) => {
    try {
      const { status } = req.body;
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      if (!status || !statusSchema.safeParse(status).success) {
        return res.status(400).json({ 
          message: "Invalid status", 
          allowedValues: statusSchema.options
        });
      }
      
      const idea = await dbStorage.getIdea(id);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      const updatedIdea = await dbStorage.changeIdeaStatus(id, status);
      
      if (!updatedIdea) {
        return res.status(500).json({ message: "Failed to change idea status" });
      }
      
      res.json(updatedIdea);
    } catch (error) {
      console.error('Error changing idea status:', error);
      res.status(500).json({ message: "Failed to change idea status" });
    }
  });

  // Admin endpoint to get ideas by category
  app.get("/api/admin/ideas/category/:category", checkAdminRole, async (req, res) => {
    try {
      const { category } = req.params;
      
      if (!category || !categorySchema.safeParse(category).success) {
        return res.status(400).json({ 
          message: "Invalid category", 
          allowedValues: categorySchema.options
        });
      }
      
      const ideas = await dbStorage.getIdeasByCategory(category);
      
      // Attach user info to each idea
      const ideasWithUsers = await Promise.all(
        ideas.map(async (idea) => {
          const submitter = await dbStorage.getUser(idea.submittedById);
          let assignedTo = null;
          
          if (idea.assignedToId) {
            assignedTo = await dbStorage.getUser(idea.assignedToId);
          }
          
          return {
            ...idea,
            submitter: submitter ? {
              id: submitter.id,
              displayName: submitter.displayName,
              department: submitter.department,
              avatarUrl: submitter.avatarUrl,
            } : null,
            assignedTo: assignedTo ? {
              id: assignedTo.id,
              displayName: assignedTo.displayName,
              department: assignedTo.department,
              avatarUrl: assignedTo.avatarUrl,
            } : null,
          };
        })
      );
      
      res.json(ideasWithUsers);
    } catch (error) {
      console.error('Error fetching ideas by category:', error);
      res.status(500).json({ message: "Failed to fetch ideas by category" });
    }
  });

  // Admin endpoint to get ideas by status
  app.get("/api/admin/ideas/status/:status", checkAdminRole, async (req, res) => {
    try {
      const { status } = req.params;
      
      if (!status || !statusSchema.safeParse(status).success) {
        return res.status(400).json({ 
          message: "Invalid status", 
          allowedValues: statusSchema.options
        });
      }
      
      const ideas = await dbStorage.getIdeasByStatus(status);
      
      // Attach user info to each idea
      const ideasWithUsers = await Promise.all(
        ideas.map(async (idea) => {
          const submitter = await dbStorage.getUser(idea.submittedById);
          let assignedTo = null;
          
          if (idea.assignedToId) {
            assignedTo = await dbStorage.getUser(idea.assignedToId);
          }
          
          return {
            ...idea,
            submitter: submitter ? {
              id: submitter.id,
              displayName: submitter.displayName,
              department: submitter.department,
              avatarUrl: submitter.avatarUrl,
            } : null,
            assignedTo: assignedTo ? {
              id: assignedTo.id,
              displayName: assignedTo.displayName,
              department: assignedTo.department,
              avatarUrl: assignedTo.avatarUrl,
            } : null,
          };
        })
      );
      
      res.json(ideasWithUsers);
    } catch (error) {
      console.error('Error fetching ideas by status:', error);
      res.status(500).json({ message: "Failed to fetch ideas by status" });
    }
  });

  // Get KPI metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const ideas = await dbStorage.getIdeas();
      
      const metrics = {
        ideasSubmitted: ideas.length,
        inReview: ideas.filter(idea => idea.status === 'in-review').length,
        implemented: ideas.filter(idea => idea.status === 'implemented').length,
        costSaved: ideas
          .filter(idea => idea.costSaved !== null && idea.costSaved !== undefined)
          .reduce((sum, idea) => sum + (idea.costSaved || 0), 0),
        revenueGenerated: ideas
          .filter(idea => idea.revenueGenerated !== null && idea.revenueGenerated !== undefined)
          .reduce((sum, idea) => sum + (idea.revenueGenerated || 0), 0),
      };
      
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });
  
  // Ideas by Category
  app.get("/api/ideas/by-category", async (req, res) => {
    try {
      const allIdeas = await dbStorage.getIdeas();
      
      // Group the ideas by category and count them
      const categoryCounts: Record<string, number> = {};
      allIdeas.forEach(idea => {
        if (!categoryCounts[idea.category]) {
          categoryCounts[idea.category] = 0;
        }
        categoryCounts[idea.category]++;
      });
      
      // Format data for the frontend chart
      const result = Object.entries(categoryCounts).map(([category, count]) => ({
        name: category,
        value: count,
      }));
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching ideas by category:', error);
      res.status(500).json({ message: "Failed to fetch ideas by category" });
    }
  });
  
  // Ideas Volume Over Time
  app.get("/api/ideas/volume", async (req, res) => {
    try {
      const ideas = await dbStorage.getIdeas();
      
      // Get today's date and calculate dates for periods
      const today = new Date();
      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(today.getDate() - 5);
      
      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(today.getDate() - 14);
      
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(today.getMonth() - 1);
      
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      
      // Count ideas in each period
      const fiveDaysCount = ideas.filter(idea => new Date(idea.createdAt) >= fiveDaysAgo).length;
      const twoWeeksCount = ideas.filter(idea => new Date(idea.createdAt) >= twoWeeksAgo).length;
      const oneMonthCount = ideas.filter(idea => new Date(idea.createdAt) >= oneMonthAgo).length;
      const sixMonthsCount = ideas.filter(idea => new Date(idea.createdAt) >= sixMonthsAgo).length;
      const oneYearCount = ideas.filter(idea => new Date(idea.createdAt) >= oneYearAgo).length;
      
      const volumeData = [
        { name: "5D", value: fiveDaysCount },
        { name: "2W", value: twoWeeksCount },
        { name: "1M", value: oneMonthCount },
        { name: "6M", value: sixMonthsCount },
        { name: "1Y", value: oneYearCount }
      ];
      
      res.json(volumeData);
    } catch (error) {
      console.error('Error fetching idea volume:', error);
      res.status(500).json({ message: "Failed to fetch idea volume" });
    }
  });
  
  // Get recent activity (latest ideas)
  app.get("/api/ideas/recent-activity", async (req, res) => {
    try {
      const allIdeas = await dbStorage.getIdeas();
      
      // Sort by createdAt (descending) and take most recent 5
      const recentActivity = allIdeas
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(async (idea) => {
          const submitter = await dbStorage.getUser(idea.submittedById);
          
          return {
            id: idea.id,
            title: idea.title,
            description: idea.description,
            status: idea.status,
            createdAt: idea.createdAt,
            submitter: submitter ? {
              id: submitter.id,
              displayName: submitter.displayName,
              department: submitter.department,
              avatarUrl: submitter.avatarUrl,
            } : null,
          };
        });
      
      const results = await Promise.all(recentActivity);
      res.json(results);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });
  
  // Get leaderboard data (top contributors)
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const allIdeas = await dbStorage.getIdeas();
      const allUsers = await dbStorage.getUsers();
      
      // Count idea submissions per user
      const submissionCounts: Record<number, number> = {};
      allIdeas.forEach(idea => {
        const userId = idea.submittedById;
        if (!submissionCounts[userId]) {
          submissionCounts[userId] = 0;
        }
        submissionCounts[userId]++;
      });
      
      // Count implemented ideas per user
      const implementedCounts: Record<number, number> = {};
      allIdeas
        .filter(idea => idea.status === 'implemented')
        .forEach(idea => {
          const userId = idea.submittedById;
          if (!implementedCounts[userId]) {
            implementedCounts[userId] = 0;
          }
          implementedCounts[userId]++;
        });
      
      // Generate leaderboard entries
      const leaderboard = allUsers.map(user => ({
        user: {
          id: user.id,
          displayName: user.displayName,
          department: user.department,
          avatarUrl: user.avatarUrl
        },
        ideasSubmitted: submissionCounts[user.id] || 0,
        ideasImplemented: implementedCounts[user.id] || 0,
        impactScore: ((submissionCounts[user.id] || 0) * 10) + ((implementedCounts[user.id] || 0) * 25)
      }));
      
      // Sort by impact score descending
      leaderboard.sort((a, b) => b.impactScore - a.impactScore);
      
      res.json(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      res.status(500).json({ message: "Failed to fetch leaderboard data" });
    }
  });
  
  // Get ideas by status (for charts)
  app.get("/api/ideas/by-status", async (req, res) => {
    try {
      const ideas = await dbStorage.getIdeas();
      
      // Count ideas by status
      const statusCounts = {
        'submitted': ideas.filter(idea => idea.status === 'submitted').length,
        'in-review': ideas.filter(idea => idea.status === 'in-review').length,
        'merged': ideas.filter(idea => idea.status === 'merged').length,
        'parked': ideas.filter(idea => idea.status === 'parked').length,
        'implemented': ideas.filter(idea => idea.status === 'implemented').length,
      };
      
      // Format for chart display
      const result = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching ideas by status:', error);
      res.status(500).json({ message: "Failed to fetch ideas by status" });
    }
  });

  // Admin routes
  // Get all ideas (admin view)
  app.get("/api/admin/ideas", checkAdminRole, async (req, res) => {
    try {
      const ideas = await dbStorage.getIdeas(req.query);
      
      // Attach user info to each idea
      const ideasWithUsers = await Promise.all(
        ideas.map(async (idea) => {
          const submitter = await dbStorage.getUser(idea.submittedById);
          let assignedTo = null;
          
          if (idea.assignedToId) {
            assignedTo = await dbStorage.getUser(idea.assignedToId);
          }
          
          return {
            ...idea,
            submitter: submitter ? {
              id: submitter.id,
              displayName: submitter.displayName,
              department: submitter.department,
              avatarUrl: submitter.avatarUrl,
            } : null,
            assignedTo: assignedTo ? {
              id: assignedTo.id,
              displayName: assignedTo.displayName,
              department: assignedTo.department,
              avatarUrl: assignedTo.avatarUrl,
            } : null,
          };
        })
      );
      
      res.json(ideasWithUsers);
    } catch (error) {
      console.error('Error fetching ideas for admin:', error);
      res.status(500).json({ message: "Failed to fetch ideas" });
    }
  });

  // Update idea status (admin only)
  app.patch("/api/admin/ideas/:id/status", checkAdminRole, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const { status } = req.body;
      
      if (!status || !statusSchema.safeParse(status).success) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const updatedIdea = await dbStorage.changeIdeaStatus(id, status);
      
      if (!updatedIdea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      res.json(updatedIdea);
    } catch (error) {
      console.error('Error updating idea status:', error);
      res.status(500).json({ message: "Failed to update idea status" });
    }
  });

  // Assign idea to user (admin only)
  app.patch("/api/admin/ideas/:id/assign", checkAdminRole, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const { userId } = req.body;
      
      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const updatedIdea = await dbStorage.assignIdea(id, parseInt(userId));
      
      if (!updatedIdea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      res.json(updatedIdea);
    } catch (error) {
      console.error('Error assigning idea:', error);
      res.status(500).json({ message: "Failed to assign idea" });
    }
  });

  // Update idea with admin notes and impact (admin only)
  app.patch("/api/admin/ideas/:id", checkAdminRole, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const { adminNotes, impact, priority } = req.body;
      const updates: any = {};
      
      if (adminNotes !== undefined) {
        updates.adminNotes = adminNotes;
      }
      
      if (impact !== undefined) {
        updates.impact = impact;
      }
      
      if (priority !== undefined && prioritySchema.safeParse(priority).success) {
        updates.priority = priority;
      }
      
      const updatedIdea = await dbStorage.updateIdea(id, updates);
      
      if (!updatedIdea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      // Attach user info
      const submitter = await dbStorage.getUser(updatedIdea.submittedById);
      let assignedTo = null;
      
      if (updatedIdea.assignedToId) {
        assignedTo = await dbStorage.getUser(updatedIdea.assignedToId);
      }
      
      res.json({
        ...updatedIdea,
        submitter: submitter ? {
          id: submitter.id,
          displayName: submitter.displayName,
          department: submitter.department,
          avatarUrl: submitter.avatarUrl,
        } : null,
        assignedTo: assignedTo ? {
          id: assignedTo.id,
          displayName: assignedTo.displayName,
          department: assignedTo.department,
          avatarUrl: assignedTo.avatarUrl,
        } : null,
      });
    } catch (error) {
      console.error('Error updating idea:', error);
      res.status(500).json({ message: "Failed to update idea" });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", checkAdminRole, async (req, res) => {
    try {
      const role = typeof req.query.role === 'string' ? req.query.role : undefined;
      const users = await dbStorage.getUsers(role);
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}