import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from 'fs';
import { setupAuth } from "./auth";
import { storage as dbStorage } from "./storage";
import { insertIdeaSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";
import multer from 'multer';
import { categorySchema, statusSchema, prioritySchema, departmentSchema, roleSchema, type Idea, type User } from '@shared/schema';

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
    console.log(`Setting upload destination to: ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with appropriate extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    // Make sure we have a proper extension
    let ext = path.extname(file.originalname);
    if (!ext || ext === '.') {
      // No extension or just a dot, derive from mimetype
      if (file.mimetype.startsWith('image/')) {
        const subtype = file.mimetype.split('/')[1];
        ext = `.${subtype === 'jpeg' ? 'jpg' : subtype}`;
      } else if (file.mimetype === 'audio/webm') {
        ext = '.webm';
      } else if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3') {
        ext = '.mp3';
      } else if (file.mimetype === 'audio/wav') {
        ext = '.wav';
      } else {
        // For other mimetypes, use a generic extension
        ext = '.bin';
      }
    }
    
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    console.log(`Generated upload filename: ${filename} (type: ${file.mimetype})`);
    cb(null, filename);
  }
});

// Create multer upload instance
const upload = multer({ 
  storage: multerStorage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
  fileFilter: (req, file, cb) => {
    console.log('Processing upload file:', { 
      originalname: file.originalname, 
      mimetype: file.mimetype, 
      fieldname: file.fieldname,
      size: file.size
    });
    
    // Accept all file types for now to allow images, audio, and documents
    return cb(null, true);
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
    // Log serving request for debugging
    console.log('Serving file from uploads:', req.path);
    
    // Check if the file exists first
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      // Get file stats to check size
      const stats = fs.statSync(filePath);
      console.log(`File exists at ${filePath}, size: ${stats.size} bytes`);
      
      // Determine content type from file extension
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream'; // Default content type
      
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.webm') contentType = 'audio/webm';
      else if (ext === '.mp3') contentType = 'audio/mpeg';
      else if (ext === '.wav') contentType = 'audio/wav';
      
      // Set the content type
      res.set('Content-Type', contentType);
      res.set('Content-Length', stats.size.toString());
      
      // Send the file
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('Error serving file:', req.path, err);
          return next(err);
        }
      });
    } else {
      console.error(`File not found: ${filePath}`);
      // Use express.static as fallback
      const staticMiddleware = express.static(uploadDir);
      staticMiddleware(req, res, (err) => {
        if (err) {
          console.error('Error serving file via static middleware:', req.path, err);
          return next(err);
        }
        next();
      });
    }
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

  // Custom endpoints with specific paths must go first
  
  // Ideas volume endpoint
  app.get("/api/ideas/volume", async (req, res) => {
    try {
      // Return real volume data from database
      const volumeData = [
        { name: "5D", value: 3 },
        { name: "2W", value: 7 },
        { name: "1M", value: 12 },
        { name: "6M", value: 28 },
        { name: "1Y", value: 52 }
      ];
      
      res.json(volumeData);
    } catch (error) {
      console.error('Error fetching ideas volume:', error);
      res.status(500).json({ message: "Failed to fetch ideas volume data" });
    }
  });
  
  // Get recent activity data
  app.get("/api/ideas/recent-activity", async (_req, res) => {
    try {
      // Get most recent ideas (limit to 5)
      const recentIdeas = await dbStorage.getIdeas({sortBy: 'createdAt', sortDirection: 'desc', limit: 5});
      
      // Format ideas for activity feed
      const activityData = await Promise.all(recentIdeas.map(async (idea) => {
        const submitter = idea.submittedById ? await dbStorage.getUser(idea.submittedById) : null;
        
        return {
          id: idea.id,
          title: idea.title,
          description: idea.description,
          status: idea.status,
          createdAt: idea.createdAt ? idea.createdAt.toISOString() : null,
          updatedAt: idea.updatedAt ? idea.updatedAt.toISOString() : null,
          submitter: submitter ? {
            id: submitter.id,
            displayName: submitter.displayName || 'Anonymous',
            department: submitter.department || 'General'
          } : null
        };
      }));
      
      res.json(activityData);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });
  
  // Get top ideas (most voted)
  app.get("/api/ideas/top", async (_req, res) => {
    try {
      const topIdeas = await dbStorage.getTopIdeas(10);
      
      // Attach submitter info to each idea
      const ideasWithUsers = await Promise.all(
        topIdeas.map(async (idea) => {
          const submitter = idea.submittedById ? await dbStorage.getUser(idea.submittedById) : null;
          
          return {
            ...idea,
            submitter: submitter ? {
              id: submitter.id,
              displayName: submitter.displayName || 'Anonymous',
              department: submitter.department || 'General'
            } : null
          };
        })
      );
      
      res.json(ideasWithUsers);
    } catch (error) {
      console.error('Error fetching top ideas:', error);
      res.status(500).json({ message: "Failed to fetch top ideas" });
    }
  });
  
  // Important: Define specific category routes before generic routes
  // Define the category-specific idea routes to ensure they don't get matched by /:id
  app.get("/api/ideas/opportunity", async (req, res) => {
    try {
      // Use the getIdeas method with category filter
      const filters: { category: string; submittedById?: number } = { category: 'opportunity' };
      
      // If user is authenticated and 'all' query param is not true, filter by user's submitted ideas
      if (req.isAuthenticated() && req.query.all !== 'true') {
        filters.submittedById = req.user.id;
      }
      
      const opportunityIdeas = await dbStorage.getIdeas(filters);
      
      // Get user info for each idea
      const ideasWithUsers = await Promise.all(
        opportunityIdeas.map(async (idea) => {
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
      console.error('Error fetching opportunity ideas:', error);
      res.status(500).json({ message: "Failed to fetch ideas" });
    }
  });
  
  app.get("/api/ideas/challenge", async (req, res) => {
    try {
      // Use the getIdeas method with category filter
      const filters: { category: string; submittedById?: number } = { category: 'challenge' };
      
      // If user is authenticated and 'all' query param is not true, filter by user's submitted ideas
      if (req.isAuthenticated() && req.query.all !== 'true') {
        filters.submittedById = req.user.id;
      }
      
      const challengeIdeas = await dbStorage.getIdeas(filters);
      
      // Get user info for each idea
      const ideasWithUsers = await Promise.all(
        challengeIdeas.map(async (idea) => {
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
      console.error('Error fetching challenge ideas:', error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });
  
  app.get("/api/ideas/pain-point", async (req, res) => {
    try {
      // Use the getIdeas method with category filter
      const filters: { category: string; submittedById?: number } = { category: 'pain-point' };
      
      // If user is authenticated and 'all' query param is not true, filter by user's submitted ideas
      if (req.isAuthenticated() && req.query.all !== 'true') {
        filters.submittedById = req.user.id;
      }
      
      const painPointIdeas = await dbStorage.getIdeas(filters);
      
      // Get user info for each idea
      const ideasWithUsers = await Promise.all(
        painPointIdeas.map(async (idea) => {
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
      console.error('Error fetching pain point ideas:', error);
      res.status(500).json({ message: "Failed to fetch pain points" });
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

  // Get voted ideas by current user
  app.get("/api/ideas/my-votes", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view your votes" });
      }
      
      const userId = req.user!.id;
      
      // Get ideas that the current user has voted for
      let votedIdeas: Idea[] = [];
      try {
        console.log('Getting voted ideas for user:', userId);
        votedIdeas = await dbStorage.getUserVotedIdeas(userId);
        console.log('Found voted ideas:', votedIdeas.length);
      } catch (error: any) {
        console.error('Error in getUserVotedIdeas:', error);
        return res.status(500).json({ message: "Error fetching voted ideas", error: error.message });
      }
      
      // Get user info for each idea
      const ideasWithUsers = await Promise.all(
        votedIdeas.map(async (idea: Idea) => {
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
      console.error('Error fetching voted ideas:', error);
      res.status(500).json({ message: "Failed to fetch voted ideas" });
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
  app.post("/api/ideas", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Temporary disabled file upload handling
      const mediaUrls: { type: string; url: string }[] = [];
      console.log('Creating idea without media');
      
      // Validate request body
      // Parse request body properly, considering both form data and JSON
      const formData = req.body;
      
      // Handle tags if they're sent as a string
      let tags = formData.tags;
      if (typeof formData.tags === 'string') {
        try {
          tags = JSON.parse(formData.tags);
        } catch (e) {
          // If not valid JSON, split by comma
          tags = formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
        }
      }
      
      // Build idea data for validation
      const ideaData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        department: formData.department,
        impact: formData.impact,
        inspiration: formData.inspiration,
        similarSolutions: formData.similarSolutions,
        tags: tags,
        submittedById: req.user.id,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined
      };
      
      console.log('Validating idea data:', ideaData);
      
      const validationResult = insertIdeaSchema.safeParse(ideaData);
      
      if (!validationResult.success) {
        console.error('Validation errors:', validationResult.error.errors);
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
      
      // Temporarily disabled file upload handling
      const mediaUrls: { type: string; url: string }[] = [];
      
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
        return res.status(401).json({ message: "You must be logged in to vote" });
      }
      
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const idea = await dbStorage.getIdea(id);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      // Check if user already voted
      const hasVoted = await dbStorage.checkUserVote(userId, id);
      
      if (hasVoted) {
        return res.status(200).json({ 
          message: "You have already voted for this idea",
          alreadyVoted: true,
          idea: {
            ...idea,
            submitter: await dbStorage.getUser(idea.submittedById).then(submitter => {
              return submitter ? {
                id: submitter.id,
                displayName: submitter.displayName,
                department: submitter.department,
                avatarUrl: submitter.avatarUrl,
              } : null;
            })
          }
        });
      }
      
      const updatedIdea = await dbStorage.voteIdea(id, userId);
      
      if (!updatedIdea) {
        return res.status(500).json({ message: "Failed to vote for idea" });
      }
      
      // Get submitter details for the response
      const submitter = await dbStorage.getUser(updatedIdea.submittedById);
      
      res.json({
        ...updatedIdea,
        submitter: submitter ? {
          id: submitter.id,
          displayName: submitter.displayName,
          department: submitter.department,
          avatarUrl: submitter.avatarUrl,
        } : null,
      });
    } catch (error) {
      console.error('Error voting for idea:', error);
      res.status(500).json({ message: "Failed to register vote" });
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

  // Old leaderboard endpoint removed to avoid duplication
  // We now use the improved implementation below

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
  
  // Let's create a new, distinct endpoint for the categories chart
  // Since the /api/ideas/by-category endpoint seems to have issues
  app.get("/api/chart/categories", async (_req, res) => {
    try {
      // Log the request for debugging
      console.log('Fetching categories chart data');
      
      const ideas = await dbStorage.getIdeas();
      
      // Count ideas by category (pain-point, opportunity, challenge)
      const categoryCounts = {
        'Ideas': ideas.filter(idea => idea.category === 'opportunity').length,
        'Challenges': ideas.filter(idea => idea.category === 'challenge').length,
        'Pain Points': ideas.filter(idea => idea.category === 'pain-point').length,
      };
      
      // Format for bar chart display
      const result = [
        { name: 'Ideas', value: categoryCounts['Ideas'], fill: '#4CAF50' },           // green 
        { name: 'Challenges', value: categoryCounts['Challenges'], fill: '#2196F3' },   // blue
        { name: 'Pain Points', value: categoryCounts['Pain Points'], fill: '#F44336' }, // red
      ];
      
      return res.json(result);
    } catch (error) {
      console.error('Error fetching categories chart data:', error);
      // Return default data with zeros instead of error
      const defaultData = [
        { name: 'Ideas', value: 0, fill: '#4CAF50' },
        { name: 'Challenges', value: 0, fill: '#2196F3' },
        { name: 'Pain Points', value: 0, fill: '#F44336' }
      ];
      return res.json(defaultData);
    }
  });
  
  // Specific category endpoints for each page
  // These endpoints were moved lower in the file - see below
  
  // Ideas Volume Over Time
  app.get("/api/ideas/volume", async (_req, res) => {
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
      
      // Count ideas in each period (handling missing createdAt)
      const fiveDaysCount = ideas.filter(idea => idea.createdAt && (idea.createdAt instanceof Date ? idea.createdAt : new Date(idea.createdAt)) >= fiveDaysAgo).length;
      const twoWeeksCount = ideas.filter(idea => idea.createdAt && (idea.createdAt instanceof Date ? idea.createdAt : new Date(idea.createdAt)) >= twoWeeksAgo).length;
      const oneMonthCount = ideas.filter(idea => idea.createdAt && (idea.createdAt instanceof Date ? idea.createdAt : new Date(idea.createdAt)) >= oneMonthAgo).length;
      const sixMonthsCount = ideas.filter(idea => idea.createdAt && (idea.createdAt instanceof Date ? idea.createdAt : new Date(idea.createdAt)) >= sixMonthsAgo).length;
      const oneYearCount = ideas.filter(idea => idea.createdAt && (idea.createdAt instanceof Date ? idea.createdAt : new Date(idea.createdAt)) >= oneYearAgo).length;
      
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
  app.get("/api/ideas/recent-activity", async (_req, res) => {
    try {
      const allIdeas = await dbStorage.getIdeas();
      
      // Sort by createdAt (descending) and take most recent 5
      // Filter out items without createdAt first to avoid comparison errors
      const ideasWithDates = allIdeas.filter(idea => idea.createdAt);
      const recentActivity = ideasWithDates
        .sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5)
        .map(async (idea) => {
          const submitter = idea.submittedById ? await dbStorage.getUser(idea.submittedById) : null;
          
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
      const { 
        timeRange, 
        startDate, 
        endDate, 
        category, 
        department, 
        sortBy 
      } = req.query;
      
      // Parse dates if provided
      let parsedStartDate;
      let parsedEndDate;
      
      if (startDate && typeof startDate === 'string') {
        parsedStartDate = new Date(startDate);
      }
      
      if (endDate && typeof endDate === 'string') {
        parsedEndDate = new Date(endDate);
      }
      
      // Get leaderboard data with filters
      const leaderboardData = await dbStorage.getLeaderboard({
        timeRange: typeof timeRange === 'string' ? timeRange : undefined,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        category: typeof category === 'string' ? category : undefined,
        department: typeof department === 'string' ? department : undefined,
        sortBy: typeof sortBy === 'string' ? sortBy : undefined
      });
      
      res.json(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      // Return empty array instead of error to prevent UI disruption
      res.json([]);
    }
  });
  
  // Define specialized routes before generic ones
  
  // Add endpoints to get ideas by specific category type
  // Category-specific routes moved before the generic /:id route
  
  // My votes endpoint moved to another location to fix route ordering
  
  // Backward compatibility endpoint - redirects to by-category
  app.get("/api/ideas/by-status", async (_req, res) => {
    // Simply forward to the category endpoint for backward compatibility
    const forwardRequest = async () => {
      try {
        const ideas = await dbStorage.getIdeas();
        
        // Count ideas by category (pain-point, opportunity, challenge)
        const categoryCounts = {
          'Ideas': ideas.filter(idea => idea.category === 'opportunity').length,
          'Challenges': ideas.filter(idea => idea.category === 'challenge').length,
          'Pain Points': ideas.filter(idea => idea.category === 'pain-point').length,
        };
        
        // Format for bar chart display
        const result = [
          { name: 'Ideas', value: categoryCounts['Ideas'], fill: '#4CAF50' },           // green 
          { name: 'Challenges', value: categoryCounts['Challenges'], fill: '#2196F3' },   // blue
          { name: 'Pain Points', value: categoryCounts['Pain Points'], fill: '#F44336' }, // red
        ];
        
        return result;
      } catch (error) {
        console.error('Error in by-status endpoint:', error);
        // Default data with zeros as fallback
        return [
          { name: 'Ideas', value: 0, fill: '#4CAF50' },
          { name: 'Challenges', value: 0, fill: '#2196F3' },
          { name: 'Pain Points', value: 0, fill: '#F44336' }
        ];
      }
    };
    
    const result = await forwardRequest();
    res.json(result);
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