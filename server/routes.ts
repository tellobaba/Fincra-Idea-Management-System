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

// Middleware to check if user has admin role
const checkAdminRole = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (!['admin', 'reviewer', 'transformer', 'implementer'].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden - Admin role required" });
  }
  
  next();
};

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
      } = {};
      
      if (req.query.status) {
        filters.status = req.query.status as string;
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
      
      // Validate request body
      const validationResult = insertIdeaSchema.safeParse({
        ...req.body,
        submittedById: req.user.id,
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid idea data", errors: validationResult.error.errors });
      }
      
      const idea = await dbStorage.createIdea(validationResult.data);
      
      res.status(201).json(idea);
    } catch (error) {
      res.status(500).json({ message: "Failed to create idea" });
    }
  });

  // Update idea
  app.patch("/api/ideas/:id", async (req, res) => {
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
      
      // Remove fields that shouldn't be updated directly
      const updates = { ...req.body };
      delete updates.id;
      delete updates.submittedById;
      delete updates.createdAt;
      
      const updatedIdea = await dbStorage.updateIdea(id, updates);
      
      res.json(updatedIdea);
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
  
  // Get idea volume data for charts
  app.get("/api/ideas/volume", async (req, res) => {
    try {
      // For demo purposes, return static data for chart
      // In a real implementation, this would be aggregated from database
      res.json([
        { name: "5D", value: 10 },
        { name: "2W", value: 35 },
        { name: "1M", value: 80 },
        { name: "6M", value: 120 },
        { name: "1Y", value: 210 }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch idea volume data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}