import { pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import { sessionsTable } from "./sessions";

/**
 * Server-verified identity binding for a session participant. This is the
 * source of truth for "who is answering" — session answers are attributed
 * by looking up the caller's verified Clerk user id here, never by trusting
 * a client-supplied player name, which prevents one player from submitting
 * answers under another player's identity.
 */
export const sessionParticipantsTable = pgTable(
  "session_participants",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => sessionsTable.id),
    userId: text("user_id").notNull(),
    displayName: text("display_name").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.sessionId, t.userId)],
);

export type SessionParticipant = typeof sessionParticipantsTable.$inferSelect;
export type InsertSessionParticipant = typeof sessionParticipantsTable.$inferInsert;
