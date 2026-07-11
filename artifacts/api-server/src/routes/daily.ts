import { Router } from "express";
import { db } from "../lib/db.js";
import { questionsTable } from "@workspace/db";

const router = Router();

const DAILY_VERSES = [
  {
    verse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    verseReference: "John 3:16",
    challenge: "Name all 4 gospels",
    memoryVerse: "Trust in the LORD with all your heart",
  },
  {
    verse: "I can do all this through him who gives me strength.",
    verseReference: "Philippians 4:13",
    challenge: "Recite the 23rd Psalm",
    memoryVerse: "Be strong and courageous",
  },
  {
    verse: "The LORD is my shepherd, I lack nothing.",
    verseReference: "Psalm 23:1",
    challenge: "Name 5 books of the Old Testament",
    memoryVerse: "The Lord is my light and my salvation",
  },
  {
    verse: "And we know that in all things God works for the good of those who love him.",
    verseReference: "Romans 8:28",
    challenge: "List the 10 commandments",
    memoryVerse: "Love the Lord your God with all your heart",
  },
  {
    verse: "Be strong and courageous. Do not be afraid; do not be discouraged.",
    verseReference: "Joshua 1:9",
    challenge: "Name 3 prophets",
    memoryVerse: "For where your treasure is, there your heart will be also",
  },
  {
    verse: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.",
    verseReference: "Matthew 6:33",
    challenge: "Name the 12 apostles",
    memoryVerse: "I am the way and the truth and the life",
  },
  {
    verse: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
    verseReference: "Philippians 4:6",
    challenge: "Name the fruit of the Spirit",
    memoryVerse: "Come to me, all you who are weary",
  },
  {
    verse: "For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you.",
    verseReference: "Jeremiah 29:11",
    challenge: "Name 5 books of the New Testament",
    memoryVerse: "The peace of God, which transcends all understanding",
  },
  {
    verse: "Love the Lord your God with all your heart and with all your soul and with all your mind.",
    verseReference: "Matthew 22:37",
    challenge: "Name the 7 days of creation",
    memoryVerse: "Your word is a lamp for my feet",
  },
  {
    verse: "Trust in the LORD with all your heart and lean not on your own understanding.",
    verseReference: "Proverbs 3:5",
    challenge: "Name 3 miracles of Jesus",
    memoryVerse: "Be still and know that I am God",
  },
  {
    verse: "The LORD is my light and my salvation—whom shall I fear?",
    verseReference: "Psalm 27:1",
    challenge: "Recite the Lord's Prayer",
    memoryVerse: "I have hidden your word in my heart",
  },
  {
    verse: "Come to me, all you who are weary and burdened, and I will give you rest.",
    verseReference: "Matthew 11:28",
    challenge: "Name 5 Psalms by number",
    memoryVerse: "For it is by grace you have been saved",
  },
  {
    verse: "I am the way and the truth and the life. No one comes to the Father except through me.",
    verseReference: "John 14:6",
    challenge: "Name the books of Moses",
    memoryVerse: "And the truth will set you free",
  },
  {
    verse: "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God.",
    verseReference: "Ephesians 2:8",
    challenge: "Name 4 kings of Israel",
    memoryVerse: "This is the day the LORD has made",
  },
];

router.get("/daily/content", async (req, res) => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % DAILY_VERSES.length;
  const content = DAILY_VERSES[index];

  res.json({
    ...content,
    date: today.toISOString().split("T")[0],
  });
});

router.get("/daily/challenge", async (req, res) => {
  try {
    const today = new Date();
    const seed = Math.floor(today.getTime() / 86400000);

    const questions = await db.select().from(questionsTable).limit(50);

    // Deterministic seed-based shuffle
    const shuffled = [...questions].sort((a, b) => {
      const ha = ((a.id * seed) ^ (a.id << 4)) & 0xffff;
      const hb = ((b.id * seed) ^ (b.id << 4)) & 0xffff;
      return ha - hb;
    });

    const daily = shuffled.slice(0, 5).map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
      categoryId: q.categoryId,
      explanation: q.explanation ?? null,
      book: q.book ?? null,
      createdAt: q.createdAt.toISOString(),
    }));

    res.json(daily);
  } catch (err) {
    req.log.error({ err }, "Failed to get daily challenge");
    res.status(500).json({ error: "Failed to get daily challenge" });
  }
});

export default router;
