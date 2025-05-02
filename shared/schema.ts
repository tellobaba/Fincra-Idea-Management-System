import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  department: text("department"),
  role: text("role").default("user").notNull(),
  avatarUrl: text("avatar_url"),
});

export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'pain-point', 'opportunity', 'challenge'
  tags: text("tags").array(),
  department: text("department"), // 'Organisation Health', 'Tech & Systems', 'Commercial & Strategy', etc.
  status: text("status").default("submitted").notNull(), // 'submitted', 'in-review', 'merged', 'parked', 'implemented'
  priority: text("priority"), // 'high', 'medium', 'low'
  votes: integer("votes").default(0).notNull(),
  submittedById: integer("submitted_by_id").notNull(),
  assignedToId: integer("assigned_to_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  impactScore: integer("impact_score"),
  costSaved: integer("cost_saved"),
  revenueGenerated: integer("revenue_generated"),
  attachments: json("attachments").$type<string[]>(),
  mediaUrls: json("media_urls").$type<{type: string, url: string}[]>(), // For images, videos, voice notes
  impact: text("impact"), // Impact description
  adminNotes: text("admin_notes"), // Admin notes
  attachmentUrl: text("attachment_url"), // Single attachment URL for simpler implementation
  organizationCategory: text("organization_category"), // 'Organisation Health', 'Technology & Systems', 'Commercial & Strategy', 'Process', 'Cost Leadership', 'Other'
  inspiration: text("inspiration"), // Inspiration or context behind the submission
  similarSolutions: text("similar_solutions"), // Awareness of similar solutions
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  ideaId: integer("idea_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  parentId: integer("parent_id"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  department: true,
  role: true,
  avatarUrl: true,
});

export const insertIdeaSchema = createInsertSchema(ideas).pick({
  title: true,
  description: true,
  category: true,
  tags: true,
  department: true,
  priority: true,
  submittedById: true,
  attachments: true,
  mediaUrls: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  ideaId: true,
  userId: true,
  content: true,
  parentId: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertIdea = z.infer<typeof insertIdeaSchema>;
export type Idea = typeof ideas.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

// Category type
export const categorySchema = z.enum(['pain-point', 'opportunity', 'challenge']);
export type Category = z.infer<typeof categorySchema>;

// Status type
export const statusSchema = z.enum(['submitted', 'in-review', 'merged', 'parked', 'implemented']);
export type Status = z.infer<typeof statusSchema>;

// Priority type
export const prioritySchema = z.enum(['high', 'medium', 'low']);
export type Priority = z.infer<typeof prioritySchema>;

// Export values for easier usage in frontend
export const categoryValues = categorySchema.options;
export const statusValues = statusSchema.options;
export const priorityValues = prioritySchema.options;

// Department type
export const departmentSchema = z.enum([
  'Organisation Health', 
  'Tech & Systems', 
  'Commercial & Strategy', 
  'Operations',
  'Finance',
  'Marketing',
  'Sales',
  'Product',
  'Other'
]);
export type Department = z.infer<typeof departmentSchema>;

// Role type
export const roleSchema = z.enum(['user', 'reviewer', 'transformer', 'implementer', 'admin']);
export type Role = z.infer<typeof roleSchema>;
