import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { sessionsTable } from "./sessions";
import { questionsTable } from "./questions";

export const sessionAnswersTable = pgTable("session_answers", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessionsTable.id),
  playerName: text("player_name").notNull(),
  questionId: integer("question_id")
    .notNull()
    .references(() => questionsTable.id),
  answer: text("answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  score: integer("score").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SessionAnswer = typeof sessionAnswersTable.$inferSelect;
export type InsertSessionAnswer = typeof sessionAnswersTable.$inferInsert;
