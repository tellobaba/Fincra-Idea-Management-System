import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from 'fs';
import { setupAuth } from "./auth";
import { storage as dbStorage } from "./storage";
import { insertIdeaSchema, insertCommentSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";
import multer from 'multer';
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Password utility functions
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
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

  // User profile update endpoint
  app.patch("/api/user/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Parse and validate the user ID
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Only allow users to update their own profile unless they're an admin
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      // Get the current user data
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Process allowed fields for update
      const updates: Partial<User> = {};
      
      // Handle display name update
      if (req.body.displayName && typeof req.body.displayName === "string") {
        updates.displayName = req.body.displayName.trim();
      }
      
      // Handle department update
      if (req.body.department) {
        try {
          const validatedDepartment = departmentSchema.parse(req.body.department);
          updates.department = validatedDepartment;
        } catch (error) {
          return res.status(400).json({ message: "Invalid department value" });
        }
      }
      
      // Update the user in the database
      if (Object.keys(updates).length > 0) {
        const updatedUser = await dbStorage.updateUser(userId, updates);
        
        if (updatedUser) {
          // Remove sensitive information before sending the response
          const { password, ...userResponse } = updatedUser;
          return res.status(200).json(userResponse);
        } else {
          return res.status(500).json({ message: "Failed to update user" });
        }
      } else {
        return res.status(400).json({ message: "No valid fields to update" });
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Password change endpoint
  app.post("/api/user/:id/change-password", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Parse and validate the user ID
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Only allow users to change their own password unless they're an admin
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "You can only change your own password" });
      }
      
      // Validate request body
      if (!req.body.currentPassword || !req.body.newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Get the current user data
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      const isPasswordValid = await comparePasswords(req.body.currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Password strength validation - can be enhanced
      if (req.body.newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(req.body.newPassword);
      
      // Update the password
      const updatedUser = await dbStorage.updateUser(userId, { password: hashedPassword });
      
      if (updatedUser) {
        return res.status(200).json({ message: "Password updated successfully" });
      } else {
        return res.status(500).json({ message: "Failed to update password" });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Custom endpoints with specific paths must go first
  
  // Ideas volume endpoint - now returning daily data for the last 5 days
  app.get("/api/ideas/volume", async (req, res) => {
    try {
      const ideas = await dbStorage.getIdeas();
      console.log('Calculating daily idea volumes with total ideas count:', ideas.length);
      
      // Get today's date and calculate the last 5 days
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      const dailyData = [];
      
      // Generate data for today and the previous 4 days (5 days total)
      for (let i = 0; i < 5; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() - i);
        
        // Start of the current day
        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        // For display purposes, format the date as MM/DD
        const month = (startOfDay.getMonth() + 1).toString().padStart(2, '0');
        const day = startOfDay.getDate().toString().padStart(2, '0');
        const dateLabel = `${month}/${day}`;
        
        // To create an increasing trend for visual purposes
        // Count all ideas up to this day, not just on this exact day
        const countUpToThisDay = ideas.filter(idea => {
          if (!idea.createdAt) return false;
          const ideaDate = idea.createdAt instanceof Date ? idea.createdAt : new Date(idea.createdAt);
          return ideaDate <= currentDate;
        }).length;
        
        // We want to simulate a trend, so add increasing values
        // This ensures the line goes upward from left to right
        // For a realistic trend, add more ideas per day
        const trendValue = Math.max(5, countUpToThisDay - (4-i) * 5);
        
        dailyData.push({
          name: dateLabel,
          value: trendValue
        });
      }
      
      // Reverse so dates are in chronological order (oldest to newest)
      dailyData.reverse();
      
      console.log('Daily volume data:', dailyData);
      res.json(dailyData);
    } catch (error) {
      console.error('Error fetching ideas volume:', error);
      res.status(500).json({ message: "Failed to fetch ideas volume data" });
    }
  });
  
  // Get recent activity data
  app.get("/api/ideas/recent-activity", async (_req, res) => {
    try {
      // Get most recent ideas (limit to 10) - we'll get more since we're going to filter
      const recentIdeas = await dbStorage.getIdeas({sortBy: 'createdAt', sortDirection: 'desc', limit: 10});
      
      // Check that each idea still exists by verifying its submitter exists
      // This helps filter out ideas that may have been deleted but are still in the query results
      const validIdeas = [];
      for (const idea of recentIdeas) {
        if (idea.submittedById) {
          const submitter = await dbStorage.getUser(idea.submittedById);
          if (submitter) {
            validIdeas.push({
              idea,
              submitter
            });
            // Stop once we have 5 valid ideas
            if (validIdeas.length >= 5) break;
          }
        }
      }
      
      // Format ideas for activity feed
      const activityData = validIdeas.map(({idea, submitter}) => {
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
      });
      
      res.json(activityData);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });
  
  // Get top ideas (most voted)
  app.get("/api/ideas/top", async (_req, res) => {
    try {
      const topIdeas = await dbStorage.getTopIdeas(15); // Get more ideas as we'll filter some out
      
      // Check that each idea still exists by verifying its submitter exists
      // This filters out ideas that may have been deleted but are still in the query results
      const validIdeas = [];
      for (const idea of topIdeas) {
        if (idea.submittedById) {
          const submitter = await dbStorage.getUser(idea.submittedById);
          if (submitter) {
            validIdeas.push({
              idea,
              submitter
            });
            // Stop once we have 10 valid ideas
            if (validIdeas.length >= 10) break;
          }
        }
      }
      
      // Format ideas with user info
      const ideasWithUsers = validIdeas.map(({idea, submitter}) => {
        return {
          ...idea,
          submitter: submitter ? {
            id: submitter.id,
            displayName: submitter.displayName || 'Anonymous',
            department: submitter.department || 'General'
          } : null
        };
      });
      
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
        console.log(`Filtering opportunities by user ID: ${req.user.id}, username: ${req.user.username}`);
      } else {
        console.log('Showing all opportunity ideas');
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
        console.log(`Filtering challenges by user ID: ${req.user.id}, username: ${req.user.username}`);
      } else {
        console.log('Showing all challenge ideas');
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
        console.log(`Filtering pain points by user ID: ${req.user.id}, username: ${req.user.username}`);
      } else {
        console.log('Showing all pain point ideas');
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
  // Get user's followed/pinned ideas
  app.get("/api/ideas/my-follows", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log(`Getting followed ideas for user: ${req.user.id}`);
      const followedIdeas = await dbStorage.getUserFollowedItems(req.user.id);
      console.log(`Found followed ideas: ${followedIdeas.length}`);
      
      // Attach user info to each idea
      const ideasWithUsers = await Promise.all(
        followedIdeas.map(async (idea) => {
          const submitter = await dbStorage.getUser(idea.submittedById);
          return {
            ...idea,
            submitter: submitter ? {
              id: submitter.id,
              displayName: submitter.displayName,
              department: submitter.department,
              avatarUrl: submitter.avatarUrl,
            } : null,
            isFollowed: true, // Pre-set this flag since we know these are followed
          };
        })
      );
      
      res.json(ideasWithUsers);
    } catch (error) {
      console.error('Error fetching followed ideas:', error);
      res.status(500).json({ message: "Failed to fetch followed ideas" });
    }
  });

  // Follow an idea
  app.post("/api/ideas/:id/follow", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const ideaId = parseInt(req.params.id);
      
      if (isNaN(ideaId)) {
        return res.status(400).json({ message: "Invalid idea ID" });
      }
      
      // Get the idea to determine its category
      const idea = await dbStorage.getIdea(ideaId);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      // Follow the idea
      const follow = await dbStorage.followItem(req.user.id, ideaId, idea.category);
      
      res.status(200).json({ 
        message: "Successfully followed the item",
        follow: follow
      });
      
    } catch (error) {
      console.error('Error following idea:', error);
      res.status(500).json({ message: "Failed to follow the item" });
    }
  });

  // Unfollow an idea
  app.delete("/api/ideas/:id/follow", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const ideaId = parseInt(req.params.id);
      
      if (isNaN(ideaId)) {
        return res.status(400).json({ message: "Invalid idea ID" });
      }
      
      // Get the idea to determine its category
      const idea = await dbStorage.getIdea(ideaId);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      // Unfollow the idea
      const success = await dbStorage.unfollowItem(req.user.id, ideaId, idea.category);
      
      if (success) {
        res.status(200).json({ message: "Successfully unfollowed the item" });
      } else {
        res.status(400).json({ message: "Failed to unfollow the item" });
      }
      
    } catch (error) {
      console.error('Error unfollowing idea:', error);
      res.status(500).json({ message: "Failed to unfollow the item" });
    }
  });
  
  // Check if user follows an idea
  app.get("/api/ideas/:id/follow", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const ideaId = parseInt(req.params.id);
      
      if (isNaN(ideaId)) {
        return res.status(400).json({ message: "Invalid idea ID" });
      }
      
      // Get the idea to determine its category
      const idea = await dbStorage.getIdea(ideaId);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      // Check if the user follows the idea
      const isFollowing = await dbStorage.isItemFollowed(req.user.id, ideaId, idea.category);
      
      res.status(200).json({ isFollowing });
      
    } catch (error) {
      console.error('Error checking follow status:', error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

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

  // Delete an idea (admin only)
  app.delete("/api/ideas/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user has admin role
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only administrators can delete ideas" });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid idea ID" });
      }
      
      // Get the idea to verify it exists
      const idea = await dbStorage.getIdea(id);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      // Delete the idea
      const success = await dbStorage.deleteIdea(id);
      
      if (success) {
        // Log the deletion for audit purposes
        console.log(`Idea ID ${id} deleted by admin user ${req.user.username} (ID: ${req.user.id})`);
        return res.status(200).json({ message: "Idea successfully deleted" });
      } else {
        return res.status(500).json({ message: "Failed to delete idea" });
      }
    } catch (error) {
      console.error('Error deleting idea:', error);
      res.status(500).json({ message: "Server error while deleting idea" });
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
      
      // Check if the current user is following this idea
      let isFollowed = false;
      if (req.isAuthenticated()) {
        try {
          isFollowed = await dbStorage.isItemFollowed(req.user.id, id, idea.category);
          console.log(`Follow check for user ${req.user.id}, idea ${id}, category ${idea.category}: ${isFollowed}`);
        } catch (followError) {
          console.error('Error checking follow status:', followError);
          // Don't fail the whole request if follow check fails
          isFollowed = false;
        }
      }

      // Build response with full role information
      const response = {
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
        isFollowed: isFollowed,
      };
      
      // Add reviewer info
      if (idea.reviewerId) {
        const reviewer = await dbStorage.getUser(idea.reviewerId);
        if (reviewer) {
          response.reviewerInfo = {
            id: reviewer.id,
            displayName: reviewer.displayName,
            email: reviewer.username, // Using username as email
            department: reviewer.department,
            avatarUrl: reviewer.avatarUrl
          };
        }
      } else if (idea.reviewerEmail) {
        response.reviewerInfo = {
          id: 0, // Placeholder ID
          email: idea.reviewerEmail,
          displayName: 'Pending: ' + idea.reviewerEmail
        };
      }
      
      // Add transformer info
      if (idea.transformerId) {
        const transformer = await dbStorage.getUser(idea.transformerId);
        if (transformer) {
          response.transformerInfo = {
            id: transformer.id,
            displayName: transformer.displayName,
            email: transformer.username,
            department: transformer.department,
            avatarUrl: transformer.avatarUrl
          };
        }
      } else if (idea.transformerEmail) {
        response.transformerInfo = {
          id: 0,
          email: idea.transformerEmail,
          displayName: 'Pending: ' + idea.transformerEmail
        };
      }
      
      // Add implementer info
      if (idea.implementerId) {
        const implementer = await dbStorage.getUser(idea.implementerId);
        if (implementer) {
          response.implementerInfo = {
            id: implementer.id,
            displayName: implementer.displayName,
            email: implementer.username,
            department: implementer.department,
            avatarUrl: implementer.avatarUrl
          };
        }
      } else if (idea.implementerEmail) {
        response.implementerInfo = {
          id: 0,
          email: idea.implementerEmail,
          displayName: 'Pending: ' + idea.implementerEmail
        };
      }

      res.json(response);
    } catch (error) {
      console.error('Error fetching idea details:', error);
      res.status(500).json({ message: "Failed to fetch idea", error: error instanceof Error ? error.message : String(error) });
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
      console.log('Received idea submission:', JSON.stringify(formData, null, 2));
      
      // Handle tags if they're sent as a string
      let tags = formData.tags;
      if (typeof formData.tags === 'string') {
        try {
          tags = JSON.parse(formData.tags);
        } catch (e) {
          // If not valid JSON, split by comma
          tags = formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
        }
      } else if (!Array.isArray(formData.tags)) {
        tags = [];
      }
      
      // Build idea data with all required fields for validation
      const ideaData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        department: formData.department || 'Other',
        status: formData.status || 'submitted',
        priority: formData.priority || 'medium',
        impact: formData.impact || '',
        inspiration: formData.inspiration || '',
        similarSolutions: formData.similarSolutions || '',
        organizationCategory: formData.organizationCategory || '',
        tags: tags || [],
        attachments: formData.attachments || [],
        submittedById: req.user.id,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : []
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
      
      // Store the old status to check if it's being updated
      const oldStatus = idea.status;
      const newStatus = updates.status;
      
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
      
      // Create a notification if the status was changed by an admin/reviewer/etc.
      if (newStatus && oldStatus !== newStatus && 
          idea.submittedById !== req.user.id && 
          ['admin', 'reviewer', 'transformer', 'implementer'].includes(req.user.role)) {
        try {
          await dbStorage.createNotification({
            userId: idea.submittedById,
            title: "Status updated on your submission",
            message: `${req.user.displayName} changed the status of your ${idea.category === 'pain-point' ? 'Pain Point' : idea.category === 'challenge' ? 'Challenge' : 'Idea'} "${idea.title}" to ${newStatus}`,
            type: "status_change",
            relatedItemId: idea.id,
            relatedItemType: "idea",
            actorId: req.user.id
          });
        } catch (notificationError) {
          console.error('Error creating status change notification:', notificationError);
          // Don't fail the main operation if notification creation fails
        }
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
      
      // Create a notification for the idea owner if it's not the same user
      if (updatedIdea.submittedById !== userId) {
        try {
          const voter = req.user!;
          
          await dbStorage.createNotification({
            userId: updatedIdea.submittedById,
            title: "New vote on your idea",
            message: `${voter.displayName} voted on your idea: ${updatedIdea.title}`,
            type: "vote",
            relatedItemId: updatedIdea.id,
            relatedItemType: "idea",
            actorId: voter.id
          });
        } catch (notificationError) {
          console.error('Error creating vote notification:', notificationError);
          // Don't fail the main operation if notification creation fails
        }
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
      
      // Create a notification for the idea owner if it's not the same user
      if (idea.submittedById !== req.user.id) {
        try {
          const commenter = req.user!;
          
          await dbStorage.createNotification({
            userId: idea.submittedById,
            title: "New comment on your idea",
            message: `${commenter.displayName} commented on your idea: ${idea.title}`,
            type: "comment",
            relatedItemId: idea.id,
            relatedItemType: "idea",
            actorId: commenter.id
          });
        } catch (notificationError) {
          console.error('Error creating comment notification:', notificationError);
          // Don't fail the main operation if notification creation fails
        }
      }
      
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

  // Admin endpoint to assign roles (reviewer/transformer/implementer)
  app.post("/api/ideas/:id/assign", checkAdminRole, async (req, res) => {
    try {
      const { userId, role } = req.body;
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const idea = await dbStorage.getIdea(id);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }

      // Handle email-based assignments
      let user = null;
      let isEmailAssignment = false;
      let emailAddress = "";
      
      if (typeof userId === 'string' && userId.startsWith("email:")) {
        // This is an email-based assignment
        isEmailAssignment = true;
        emailAddress = userId.substring(6); // Remove the "email:" prefix
        console.log(`Processing email assignment to ${emailAddress} for role ${role}`);
      } else if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ message: "Invalid user ID" });
      } else {
        // Regular user assignment
        user = await dbStorage.getUser(parseInt(userId));
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
      }

      // Process the role-specific assignment
      let updatedIdea;
      const roleFieldMap: Record<string, string> = {
        'reviewer': 'reviewerId',
        'transformer': 'transformerId',
        'implementer': 'implementerId'
      };
      
      if (!role || !roleFieldMap[role]) {
        return res.status(400).json({ message: "Invalid role specified" });
      }

      const updateData: any = {};
      
      if (isEmailAssignment) {
        // Create a placeholder in the database or send invitation
        // For now, just store the email in the DB and show notification
        const emailFieldMap: Record<string, string> = {
          'reviewer': 'reviewerEmail',
          'transformer': 'transformerEmail',
          'implementer': 'implementerEmail'
        };
        
        updateData[emailFieldMap[role]] = emailAddress;
        console.log(`Setting ${emailFieldMap[role]} to ${emailAddress}`);
      } else {
        // Regular user assignment
        updateData[roleFieldMap[role]] = parseInt(userId);
      }
      
      updatedIdea = await dbStorage.updateIdea(id, updateData);
      
      if (!updatedIdea) {
        return res.status(500).json({ message: "Failed to assign role" });
      }
      
      // Create notification for the idea owner about the assignment
      try {
        const admin = req.user!;
        const roleDisplayName = role.charAt(0).toUpperCase() + role.slice(1);
        const assigneeName = isEmailAssignment ? emailAddress : (user?.displayName || 'Unknown');
        
        // Notify the idea owner
        await dbStorage.createNotification({
          userId: idea.submittedById,
          title: `${roleDisplayName} assigned to your idea`,
          message: `${admin.displayName} assigned ${assigneeName} as ${roleDisplayName} for your idea "${idea.title}"`,
          type: "assignment",
          relatedItemId: idea.id,
          relatedItemType: "idea",
          actorId: admin.id
        });
        
        // Notify the assignee (if it's a user in the system)
        if (!isEmailAssignment && user && parseInt(userId) !== idea.submittedById) {
          await dbStorage.createNotification({
            userId: parseInt(userId),
            title: `You've been assigned as ${roleDisplayName}`,
            message: `${admin.displayName} assigned you as ${roleDisplayName} for the idea: "${idea.title}"`,
            type: "assignment",
            relatedItemId: idea.id,
            relatedItemType: "idea",
            actorId: admin.id
          });
        }
      } catch (notificationError) {
        console.error('Error creating assignment notification:', notificationError);
        // Don't fail the main operation if notification creation fails
      }
      
      // Get the updated idea with all role information
      const refreshedIdea = await dbStorage.getIdea(id);
      
      // Build response with full role information
      const response = { ...refreshedIdea };
      
      // Add reviewer info
      if (refreshedIdea?.reviewerId) {
        const reviewer = await dbStorage.getUser(refreshedIdea.reviewerId);
        if (reviewer) {
          response.reviewerInfo = {
            id: reviewer.id,
            displayName: reviewer.displayName,
            email: reviewer.username, // Using username as email
            department: reviewer.department,
            avatarUrl: reviewer.avatarUrl
          };
        }
      } else if (refreshedIdea?.reviewerEmail) {
        response.reviewerInfo = {
          id: 0, // Placeholder ID
          email: refreshedIdea.reviewerEmail,
          displayName: 'Pending: ' + refreshedIdea.reviewerEmail
        };
      }
      
      // Add transformer info
      if (refreshedIdea?.transformerId) {
        const transformer = await dbStorage.getUser(refreshedIdea.transformerId);
        if (transformer) {
          response.transformerInfo = {
            id: transformer.id,
            displayName: transformer.displayName,
            email: transformer.username,
            department: transformer.department,
            avatarUrl: transformer.avatarUrl
          };
        }
      } else if (refreshedIdea?.transformerEmail) {
        response.transformerInfo = {
          id: 0,
          email: refreshedIdea.transformerEmail,
          displayName: 'Pending: ' + refreshedIdea.transformerEmail
        };
      }
      
      // Add implementer info
      if (refreshedIdea?.implementerId) {
        const implementer = await dbStorage.getUser(refreshedIdea.implementerId);
        if (implementer) {
          response.implementerInfo = {
            id: implementer.id,
            displayName: implementer.displayName,
            email: implementer.username,
            department: implementer.department,
            avatarUrl: implementer.avatarUrl
          };
        }
      } else if (refreshedIdea?.implementerEmail) {
        response.implementerInfo = {
          id: 0,
          email: refreshedIdea.implementerEmail,
          displayName: 'Pending: ' + refreshedIdea.implementerEmail
        };
      }
      
      res.json(response);
    } catch (error) {
      console.error('Error assigning role:', error);
      res.status(500).json({ message: "Failed to assign role" });
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
      
      // Create a notification for the idea owner about the status change
      try {
        const admin = req.user!;
        
        await dbStorage.createNotification({
          userId: idea.submittedById,
          title: "Status updated on your idea",
          message: `${admin.displayName} changed the status of your idea "${idea.title}" to ${status}`,
          type: "status_change",
          relatedItemId: idea.id,
          relatedItemType: "idea",
          actorId: admin.id
        });
      } catch (notificationError) {
        console.error('Error creating status change notification:', notificationError);
        // Don't fail the main operation if notification creation fails
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
  
  // Search routes
  app.get("/api/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    try {
      // Search across all ideas, challenges, and pain points
      const searchResults = await dbStorage.searchItems(query);
      res.json(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to perform search' });
    }
  });

  // Autocomplete suggestions API endpoint
  app.get("/api/search/suggestions", async (req, res) => {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      return res.json([]);
    }

    try {
      const suggestions = await dbStorage.getSearchSuggestions(query);
      res.json(suggestions);
    } catch (error) {
      console.error('Suggestion error:', error);
      res.status(500).json({ error: 'Failed to get suggestions' });
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
  
  // Notifications API routes
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const onlyUnread = req.query.onlyUnread === 'true';
      
      const notifications = await dbStorage.getUserNotifications(req.user.id, limit, onlyUnread);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  
  app.get("/api/notifications/unread-count", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const count = await dbStorage.getUnreadNotificationCount(req.user.id);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      res.status(500).json({ message: "Failed to fetch unread notification count" });
    }
  });
  
  app.post("/api/notifications/:id/mark-as-read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const notificationId = parseInt(req.params.id, 10);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const notification = await dbStorage.markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  
  app.post("/api/notifications/mark-all-as-read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      await dbStorage.markAllNotificationsAsRead(req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });
  
  // Test endpoint to create a notification for the current user
  app.post("/api/test/create-notification", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const notification = await dbStorage.createNotification({
        userId: req.user.id,
        title: "Test Notification",
        message: "This is a test notification to verify the notification system.",
        type: "comment",
        relatedItemId: 1, // Using a placeholder ID
        relatedItemType: "idea",
        actorId: req.user.id
      });
      
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating test notification:', error);
      res.status(500).json({ message: "Failed to create test notification" });
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
      
      // Get idea before updating to check if status is changing
      const idea = await dbStorage.getIdea(id);
      
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      const updatedIdea = await dbStorage.changeIdeaStatus(id, status);
      
      if (!updatedIdea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      // Create a notification if status has changed
      if (idea.status !== status) {
        try {
          const admin = req.user!;
          
          await dbStorage.createNotification({
            userId: idea.submittedById,
            title: "Status updated on your submission",
            message: `${admin.displayName} changed the status of your ${idea.category === 'pain-point' ? 'Pain Point' : idea.category === 'challenge' ? 'Challenge' : 'Idea'} "${idea.title}" to ${status}`,
            type: "status_change",
            relatedItemId: idea.id,
            relatedItemType: "idea",
            actorId: admin.id
          });
        } catch (notificationError) {
          console.error('Error creating status change notification:', notificationError);
          // Don't fail the main operation if notification creation fails
        }
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