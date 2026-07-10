import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const playersTable = pgTable("players", {
  name: text("name").primaryKey(),
  // Verified Clerk user id that owns this player record. Null on legacy
  // rows created before login was required; once a row is claimed by a
  // signed-in user it can no longer be written to by anyone else.
  clerkUserId: text("clerk_user_id").unique(),
  correctAnswers: integer("correct_answers").notNull().default(0),
  totalAnswers: integer("total_answers").notNull().default(0),
  sessionsPlayed: integer("sessions_played").notNull().default(0),
  sessionsWon: integer("sessions_won").notNull().default(0),
  sessionsHosted: integer("sessions_hosted").notNull().default(0),
  streakCurrent: integer("streak_current").notNull().default(0),
  streakLongest: integer("streak_longest").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Player = typeof playersTable.$inferSelect;
export type InsertPlayer = typeof playersTable.$inferInsert;
