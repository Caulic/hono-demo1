import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const githubUser = pgTable("github_user", {
  id: integer("id").primaryKey(), // GitHub user ID
  login: text("login").notNull(),
  name: text("name"),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  location: text("location"),
  company: text("company"),
  blog: text("blog"),
  publicRepos: integer("public_repos"),
  followers: integer("followers"),
  following: integer("following"),
  githubCreatedAt: text("github_created_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
