import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  pin: text("pin").notNull().unique(),
  hostCode: text("host_code").notNull(),
  status: text("status").notNull().default("waiting"), // waiting | active | completed
  // "group" is the classic host-controlled multiplayer session; "duel" is a
  // 1v1 head-to-head match where both participants play (no spectator host)
  // and the server auto-advances once both have answered.
  type: text("type").notNull().default("group"),
  hostUserId: text("host_user_id"), // verified Clerk user id of the creator
  difficulty: text("difficulty").notNull(),
  playStyle: text("play_style"),
  participants: text("participants").array().notNull().default([]),
  questionIds: text("question_ids").array().notNull().default([]),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  totalQuestions: integer("total_questions").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type Session = typeof sessionsTable.$inferSelect;
export type InsertSession = typeof sessionsTable.$inferInsert;
