import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage as dbStorage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import * as bcrypt from "bcryptjs";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  // Use bcrypt for new password hashes
  return bcrypt.hashSync(password, 10);
}

async function comparePasswords(supplied: string, stored: string) {
  console.log('Password comparison started');
  // Check if it's a bcrypt hash (starts with $2a$ or $2b$)
  if (stored.startsWith('$2')) {
    console.log('Using bcrypt comparison');
    try {
      const result = bcrypt.compareSync(supplied, stored);
      console.log(`bcrypt result: ${result}`);
      return result;
    } catch (error) {
      console.error('bcrypt comparison error:', error);
      return false;
    }
  }
  
  // Fallback to original scrypt method for any legacy passwords
  try {
    console.log('Using scrypt comparison');
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid password format:", stored);
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log(`scrypt result: ${result}`);
    return result;
  } catch (err) {
    console.error("Password comparison error:", err);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "fincra-ideas-management-secret",
    resave: false,
    saveUninitialized: false,
    store: dbStorage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Login attempt for user: ${username}`);
        const user = await dbStorage.getUserByUsername(username);
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false);
        }
        
        // Log password comparison details for debugging
        console.log(`Password stored type: ${user.password.substring(0, 6)}...`);
        console.log(`Password supplied: ${password.substring(0, 2)}...`);
        
        const isMatch = await comparePasswords(password, user.password);
        console.log(`Password match result: ${isMatch}`);
        
        if (isMatch) {
          console.log(`Login successful for: ${username}, role: ${user.role}`);
          return done(null, user);
        } else {
          console.log(`Invalid password for: ${username}`);
          return done(null, false);
        }
      } catch (err) {
        console.error(`Login error for ${username}:`, err);
        return done(err);
      }
    }),
  );
  
  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "/api/auth/google/callback",
      scope: ["profile", "email"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log(`Google login attempt for ${profile.emails?.[0]?.value || "unknown email"}`);
        
        // Get user email from Google profile
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"));
        }
        
        // Check if user already exists
        let user = await dbStorage.getUserByUsername(email);
        
        if (!user) {
          // Create new user if they don't exist
          console.log(`Creating new user for ${email} from Google login`);
          
          // Get profile data
          const displayName = profile.displayName || `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim();
          const avatarUrl = profile.photos?.[0]?.value || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;
          
          user = await dbStorage.createUser({
            username: email,
            // Create a secure random password since they're using OAuth
            password: await hashPassword(randomBytes(32).toString("hex")),
            displayName: displayName || email.split("@")[0],
            department: undefined,
            role: "user",
            avatarUrl
          });
        }
        
        console.log(`Google login successful for ${email}`);
        return done(null, user);
      } catch (err) {
        console.error("Google auth error:", err);
        return done(err as Error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await dbStorage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, displayName, department } = req.body;
      
      if (!username || !password || !displayName) {
        return res.status(400).json({ message: "Username, password, and display name are required" });
      }
      
      const existingUser = await dbStorage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await dbStorage.createUser({
        username,
        password: hashedPassword,
        displayName,
        department: department || undefined,
        role: "user",
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      });

      // Remove password from response
      const userResponse: any = { ...user };
      if (userResponse.password) {
        delete userResponse.password;
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userResponse);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove password from response
        const userResponse: any = { ...user };
        if (userResponse.password) {
          delete userResponse.password;
        }
        
        return res.status(200).json(userResponse);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Google OAuth routes
  app.get('/api/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: '/auth',
      successRedirect: '/'
    })
  );

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove password from response
    const userResponse: any = { ...req.user };
    if (userResponse.password) {
      delete userResponse.password;
    }
    
    res.json(userResponse);
  });
  
  // Special route for resetting the admin password - TEMPORARY, REMOVE IN PRODUCTION
  app.get("/api/admin/reset-password", async (req, res) => {
    try {
      const adminUser = await dbStorage.getUserByUsername("admin@fincra.com");
      if (!adminUser) {
        return res.status(404).json({ message: "Admin user not found" });
      }
      
      // Reset to a known password
      const newPassword = "adminpass";
      const hashedPassword = await hashPassword(newPassword);
      
      const updatedUser = await dbStorage.updateUser(adminUser.id, {
        password: hashedPassword
      });
      
      if (updatedUser) {
        return res.status(200).json({ 
          message: `Admin password reset successfully to '${newPassword}'` 
        });
      } else {
        return res.status(500).json({ message: "Failed to update admin password" });
      }
    } catch (err) {
      console.error("Admin password reset error:", err);
      return res.status(500).json({ message: "Server error during admin password reset" });
    }
  });
}
