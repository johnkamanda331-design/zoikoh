import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { categoriesTable } from "./categories";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  options: text("options").array().notNull(),
  correctAnswer: text("correct_answer").notNull(),
  difficulty: text("difficulty").notNull(), // easy | medium | hard
  categoryId: integer("category_id")
    .notNull()
    .references(() => categoriesTable.id),
  explanation: text("explanation"),
  book: text("book"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Question = typeof questionsTable.$inferSelect;
export type InsertQuestion = typeof questionsTable.$inferInsert;
