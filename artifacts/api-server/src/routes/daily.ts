import { Router } from "express";
import { db } from "../lib/db.js";
// `questionsTable` import can be problematic during TS resolution in some setups.
// Fall back to generated sample questions when the compiled schema export isn't available.
import type { Request, Response } from 'express';

const router = Router();

interface DailyVerse {
  verse: string;
  verseReference: string;
  challenge: string;
  memoryVerse: string;
  summary: string;
}

const DAILY_VERSES: DailyVerse[] = [
  {
    verse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    verseReference: "John 3:16",
    challenge: "Name all 4 gospels",
    memoryVerse: "Trust in the LORD with all your heart",
    summary: "God's love is so deep that He gave His Son so everyone who believes can have eternal life.",
  },
  {
    verse: "I can do all this through him who gives me strength.",
    verseReference: "Philippians 4:13",
    challenge: "Recite the 23rd Psalm",
    memoryVerse: "Be strong and courageous",
    summary: "Christ gives the strength we need to face every challenge with courage and faith.",
  },
  {
    verse: "The LORD is my shepherd, I lack nothing.",
    verseReference: "Psalm 23:1",
    challenge: "Name 5 books of the Old Testament",
    memoryVerse: "The Lord is my light and my salvation",
    summary: "God provides, guides, and cares for His people so they will never lack what truly matters.",
  },
  {
    verse: "And we know that in all things God works for the good of those who love him.",
    verseReference: "Romans 8:28",
    challenge: "List the 10 commandments",
    memoryVerse: "Love the Lord your God with all your heart",
    summary: "Even hard seasons can be used by God for good when we trust Him and remain faithful.",
  },
  {
    verse: "Be strong and courageous. Do not be afraid; do not be discouraged.",
    verseReference: "Joshua 1:9",
    challenge: "Name 3 prophets",
    memoryVerse: "For where your treasure is, there your heart will be also",
    summary: "God calls His people to live courageously, trusting that He is with them wherever they go.",
  },
  {
    verse: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.",
    verseReference: "Matthew 6:33",
    challenge: "Name the 12 apostles",
    memoryVerse: "I am the way and the truth and the life",
    summary: "When we place God's kingdom first, He faithfully provides for what we truly need.",
  },
  {
    verse: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
    verseReference: "Philippians 4:6",
    challenge: "Name the fruit of the Spirit",
    memoryVerse: "Come to me, all you who are weary",
    summary: "Prayer and gratitude replace anxiety as we bring every concern to God with trust.",
  },
  {
    verse: "For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you.",
    verseReference: "Jeremiah 29:11",
    challenge: "Name 5 books of the New Testament",
    memoryVerse: "The peace of God, which transcends all understanding",
    summary: "God's plans for us are good and hopeful, even when we cannot yet see the full picture.",
  },
  {
    verse: "Love the Lord your God with all your heart and with all your soul and with all your mind.",
    verseReference: "Matthew 22:37",
    challenge: "Name the 7 days of creation",
    memoryVerse: "Your word is a lamp for my feet",
    summary: "The greatest command is to love God fully with every part of our being.",
  },
  {
    verse: "Trust in the LORD with all your heart and lean not on your own understanding.",
    verseReference: "Proverbs 3:5",
    challenge: "Name 3 miracles of Jesus",
    memoryVerse: "Be still and know that I am God",
    summary: "Trusting God rather than our own understanding keeps us on the right path.",
  },
  {
    verse: "The LORD is my light and my salvation—whom shall I fear?",
    verseReference: "Psalm 27:1",
    challenge: "Recite the Lord's Prayer",
    memoryVerse: "I have hidden your word in my heart",
    summary: "God's presence is our light and salvation, so fear loses its grip in Him.",
  },
  {
    verse: "Come to me, all you who are weary and burdened, and I will give you rest.",
    verseReference: "Matthew 11:28",
    challenge: "Name 5 Psalms by number",
    memoryVerse: "For it is by grace you have been saved",
    summary: "Jesus invites the weary to come to Him and find rest for their souls.",
  },
  {
    verse: "I am the way and the truth and the life. No one comes to the Father except through me.",
    verseReference: "John 14:6",
    challenge: "Name the books of Moses",
    memoryVerse: "And the truth will set you free",
    summary: "Jesus is the only way to the Father and the source of truth and life.",
  },
  {
    verse: "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God.",
    verseReference: "Ephesians 2:8",
    challenge: "Name 4 kings of Israel",
    memoryVerse: "This is the day the LORD has made",
    summary: "Salvation is a gift of grace received through faith, not something we earn ourselves.",
  },
  {
    verse: "The steadfast love of the LORD never ceases; his mercies never come to an end.",
    verseReference: "Lamentations 3:22",
    challenge: "Name 3 women in the Bible",
    memoryVerse: "His mercies are new every morning",
    summary: "God's unfailing love and mercy are renewed every day, even when life feels heavy.",
  },
  {
    verse: "Let everything that has breath praise the LORD.",
    verseReference: "Psalm 150:6",
    challenge: "Name 5 books of Psalms",
    memoryVerse: "Praise the LORD",
    summary: "Every living thing is invited to praise God and celebrate His goodness.",
  },
  {
    verse: "Be still, and know that I am God.",
    verseReference: "Psalm 46:10",
    challenge: "Name 3 attributes of God",
    memoryVerse: "The LORD will fight for you",
    summary: "Stillness before God helps us remember that He is sovereign and in control.",
  },
  {
    verse: "I have told you these things, so that in me you may have peace.",
    verseReference: "John 16:33",
    challenge: "Name 4 parables of Jesus",
    memoryVerse: "Peace I leave with you",
    summary: "Jesus offers peace that remains even when life is full of trouble and uncertainty.",
  },
  {
    verse: "The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control.",
    verseReference: "Galatians 5:22-23",
    challenge: "Name 9 fruits of the Spirit",
    memoryVerse: "Walk by the Spirit",
    summary: "The Holy Spirit shapes our lives by producing godly character and lasting fruit.",
  },
  {
    verse: "And we have this hope as an anchor for the soul, firm and secure.",
    verseReference: "Hebrews 6:19",
    challenge: "Name 3 letters of Paul",
    memoryVerse: "Hold unswervingly to the hope we profess",
    summary: "Hope in Christ is steady and secure, giving our souls a firm anchor.",
  },
  {
    verse: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!",
    verseReference: "2 Corinthians 5:17",
    challenge: "Name 2 Corinthians chapters",
    memoryVerse: "Be transformed by the renewing of your mind",
    summary: "In Christ, we are renewed and made new, leaving the old life behind.",
  },
  {
    verse: "The LORD is good to those whose hope is in him, to the one who seeks him.",
    verseReference: "Lamentations 3:25",
    challenge: "Name 3 major prophets",
    memoryVerse: "The LORD is near to the brokenhearted",
    summary: "God is especially near to those who seek Him with sincere hope and trust.",
  },
  {
    verse: "Cast all your anxiety on him because he cares for you.",
    verseReference: "1 Peter 5:7",
    challenge: "Name 5 epistles",
    memoryVerse: "Humble yourselves before the Lord",
    summary: "God invites us to give Him every worry because He truly cares for us.",
  },
  {
    verse: "For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.",
    verseReference: "2 Timothy 1:7",
    challenge: "Name 4 books of the New Testament letters",
    memoryVerse: "Fan into flame the gift of God",
    summary: "The Spirit empowers us with courage, love, and self-control instead of fear.",
  },
  {
    verse: "I can do all things through Christ who strengthens me.",
    verseReference: "Philippians 4:13",
    challenge: "Name 3 missionary journeys",
    memoryVerse: "Rejoice in the Lord always",
    summary: "Christ supplies the strength we need to endure and overcome all things.",
  },
  {
    verse: "Let your light shine before others, that they may see your good deeds and glorify your Father in heaven.",
    verseReference: "Matthew 5:16",
    challenge: "Name the 8 beatitudes",
    memoryVerse: "Blessed are the peacemakers",
    summary: "Our lives should reflect God's goodness so others see Him through us.",
  },
  {
    verse: "He gives strength to the weary and increases the power of the weak.",
    verseReference: "Isaiah 40:29",
    challenge: "Name 5 books of the Torah",
    memoryVerse: "Those who hope in the LORD will renew their strength",
    summary: "God renews our strength when we are exhausted and feel powerless.",
  },
  {
    verse: "The Lord will fight for you; you need only to be still.",
    verseReference: "Exodus 14:14",
    challenge: "Name 10 plagues of Egypt",
    memoryVerse: "I am the LORD your God",
    summary: "God fights on our behalf when we trust Him and stay calm in faith.",
  },
  {
    verse: "Delight yourself in the LORD, and he will give you the desires of your heart.",
    verseReference: "Psalm 37:4",
    challenge: "Name 3 kings of Israel",
    memoryVerse: "The LORD will guide you always",
    summary: "Delighting in God aligns our hearts with His purposes and His good gifts.",
  },
  {
    verse: "Your word is a lamp for my feet, a light on my path.",
    verseReference: "Psalm 119:105",
    challenge: "Name 5 books in the wisdom section",
    memoryVerse: "I will meditate on your statutes",
    summary: "God's Word gives direction and clarity as we walk through life.",
  },
  {
    verse: "God is not unjust; he will not forget your work and the love you have shown him.",
    verseReference: "Hebrews 6:10",
    challenge: "Name 3 women who supported Paul",
    memoryVerse: "Faith without works is dead",
    summary: "God remembers and honors faithful service done in love and obedience.",
  },
  {
    verse: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.",
    verseReference: "Colossians 3:23",
    challenge: "Name 3 books of poetry",
    memoryVerse: "Set your minds on things above",
    summary: "Everything we do should be done with excellence and devotion to God.",
  },
  {
    verse: "Pray without ceasing.",
    verseReference: "1 Thessalonians 5:17",
    challenge: "Name 5 church letters",
    memoryVerse: "Rejoice always",
    summary: "Prayer keeps us connected to God throughout the day, in every season.",
  },
  {
    verse: "For where your treasure is, there your heart will be also.",
    verseReference: "Matthew 6:21",
    challenge: "Name 7 deadly sins",
    memoryVerse: "Store up treasure in heaven",
    summary: "What we value most shapes the direction of our hearts and priorities.",
  },
  {
    verse: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
    verseReference: "Galatians 6:9",
    challenge: "Name 3 books of history",
    memoryVerse: "Bear one another's burdens",
    summary: "Faithfulness in doing good will eventually bring lasting reward and harvest.",
  },
  {
    verse: "Whoever believes in him shall not perish but have eternal life.",
    verseReference: "John 3:16",
    challenge: "Name 4 gospel writers",
    memoryVerse: "God loved the world",
    summary: "Faith in Jesus brings eternal life and everlasting hope.",
  },
  {
    verse: "Blessed are the pure in heart, for they will see God.",
    verseReference: "Matthew 5:8",
    challenge: "Name 3 Beatitudes",
    memoryVerse: "Blessed are the meek",
    summary: "A pure heart opens the way to deeper communion with God.",
  },
  {
    verse: "The righteous person may have many troubles, but the LORD delivers him from them all.",
    verseReference: "Psalm 34:19",
    challenge: "Name 3 psalms of deliverance",
    memoryVerse: "Taste and see that the LORD is good",
    summary: "God faithfully rescues His people even when troubles surround them.",
  },
  {
    verse: "And my God will meet all your needs according to the riches of his glory in Christ Jesus.",
    verseReference: "Philippians 4:19",
    challenge: "Name 4 books in the minor prophets",
    memoryVerse: "Nothing can separate us from the love of God",
    summary: "God meets every need according to His abundant provision in Christ.",
  },
  {
    verse: "This is the day the LORD has made; let us rejoice and be glad in it.",
    verseReference: "Psalm 118:24",
    challenge: "Name 3 songs of ascent",
    memoryVerse: "Give thanks to the LORD",
    summary: "Each day is a gift from God, and we are invited to rejoice in it.",
  },
  {
    verse: "The Lord is near to all who call on him, to all who call on him in truth.",
    verseReference: "Psalm 145:18",
    challenge: "Name 3 psalms of praise",
    memoryVerse: "The LORD is gracious and compassionate",
    summary: "God draws near to those who call on Him sincerely and faithfully.",
  },
  {
    verse: "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.",
    verseReference: "Ephesians 4:32",
    challenge: "Name 4 kindness habits",
    memoryVerse: "Forgive as the Lord forgave you",
    summary: "Compassion and forgiveness reflect the grace God has shown us.",
  },
  {
    verse: "For God has not given us a spirit of fear, but of power and of love and of a sound mind.",
    verseReference: "2 Timothy 1:7",
    challenge: "Name 3 gifts of the Spirit",
    memoryVerse: "The Spirit of power",
    summary: "God's Spirit gives us courage, love, and clear thinking rather than fear.",
  },
  {
    verse: "I have chosen you and have not rejected you.",
    verseReference: "Isaiah 41:9",
    challenge: "Name 2 books of Kings",
    memoryVerse: "Do not fear, for I am with you",
    summary: "God's people are chosen and held by Him, never abandoned or forgotten.",
  },
  {
    verse: "The Lord is my shepherd; I shall not want.",
    verseReference: "Psalm 23:1",
    challenge: "Name 5 shepherd metaphors",
    memoryVerse: "He restores my soul",
    summary: "God shepherds His people so they lack nothing essential in life.",
  },
  {
    verse: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.",
    verseReference: "Joshua 1:9",
    challenge: "Name 4 wilderness events",
    memoryVerse: "The LORD your God goes with you",
    summary: "God's presence gives courage and assurance wherever life leads us.",
  },
  {
    verse: "For I am convinced that neither death nor life, neither angels nor demons... will be able to separate us from the love of God.",
    verseReference: "Romans 8:38-39",
    challenge: "Name 4 things that cannot separate us",
    memoryVerse: "Nothing can separate us from God's love",
    summary: "Nothing can break the steadfast love of God for those who belong to Him.",
  },
  {
    verse: "The Lord watches over the way of the righteous.",
    verseReference: "Psalm 1:6",
    challenge: "Name 3 righteous examples",
    memoryVerse: "Blessed is the one who delights in the law",
    summary: "God watches over and protects those who choose His way.",
  },
  {
    verse: "If you remain in me and my words remain in you, ask whatever you wish, and it will be done for you.",
    verseReference: "John 15:7",
    challenge: "Name 4 vine metaphors",
    memoryVerse: "Abide in me",
    summary: "Abiding in Christ aligns our prayers with His will and purpose.",
  },
  {
    verse: "Let the morning bring me word of your unfailing love, for I have put my trust in you.",
    verseReference: "Psalm 143:8",
    challenge: "Name 3 morning prayers",
    memoryVerse: "Teach me your way",
    summary: "Morning devotion reminds us to begin the day anchored in God's faithful love.",
  },
  {
    verse: "Because of the LORD's great love we are not consumed, for his compassions never fail.",
    verseReference: "Lamentations 3:22",
    challenge: "Name 4 ways God shows compassion",
    memoryVerse: "His mercies are new every morning",
    summary: "God's compassion is endless and keeps us from being overwhelmed by despair.",
  },
  {
    verse: "The one who walks with the wise grows wise, but a companion of fools suffers harm.",
    verseReference: "Proverbs 13:20",
    challenge: "Name 3 wise friendships",
    memoryVerse: "Wisdom is better than gold",
    summary: "The people we walk with shape our character and direction.",
  },
  {
    verse: "In all your ways acknowledge him, and he will make your paths straight.",
    verseReference: "Proverbs 3:6",
    challenge: "Name 3 paths in life",
    memoryVerse: "Trust in the LORD with all your heart",
    summary: "Acknowledging God in every decision brings clarity and direction.",
  },
  {
    verse: "The fear of the LORD is the beginning of wisdom.",
    verseReference: "Proverbs 9:10",
    challenge: "Name 3 wisdom books",
    memoryVerse: "Wisdom calls aloud",
    summary: "Reverence for God is the first step toward true wisdom and understanding.",
  },
  {
    verse: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.",
    verseReference: "Galatians 5:22",
    challenge: "Name 8 fruits of the Spirit",
    memoryVerse: "Live by the Spirit",
    summary: "The Spirit produces a life marked by love, peace, and godly character.",
  },
  {
    verse: "He who began a good work in you will carry it on to completion until the day of Christ Jesus.",
    verseReference: "Philippians 1:6",
    challenge: "Name 3 prayers of Paul",
    memoryVerse: "Press on toward the goal",
    summary: "God is faithfully completing the work He has started in us.",
  },
  {
    verse: "The LORD your God is with you, the Mighty Warrior who saves.",
    verseReference: "Zephaniah 3:17",
    challenge: "Name 3 minor prophets",
    memoryVerse: "He will take great delight in you",
    summary: "God surrounds His people with saving strength and joyful presence.",
  },
];

router.get("/daily/content", async (req: any, res: any) => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % DAILY_VERSES.length;
  const content = DAILY_VERSES[index];

  (res as any).json({
    ...content,
    summary: content.summary,
    date: today.toISOString().split("T")[0],
  });
});

router.get("/daily/challenge", async (req: any, res: any) => {
  try {
    const today = new Date();
    const seed = Math.floor(today.getTime() / 86400000);

    let questions: any[];
    try {
      if ((db as any).$client && typeof (db as any).$client.query === 'function') {
        const result = await (db as any).$client.query(
          `SELECT id, text, options, correct_answer as "correctAnswer", difficulty, category_id as "categoryId", explanation, book, created_at as "createdAt" FROM questions LIMIT 50`
        );
        questions = result.rows.map((r: any) => ({
          id: r.id,
          text: r.text,
          options: r.options,
          correctAnswer: r.correctAnswer,
          difficulty: r.difficulty,
          categoryId: r.categoryId,
          explanation: r.explanation,
          book: r.book,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        }));
      } else {
        throw new Error('no db client');
      }
    } catch (e) {
      questions = DAILY_VERSES.map((v, i) => ({
        id: i + 1,
        text: v.challenge,
        options: [v.verseReference],
        correctAnswer: v.verseReference,
        difficulty: 'easy',
        categoryId: 1,
        explanation: null,
        book: v.verseReference,
        createdAt: new Date(),
      }));
    }

    const shuffled = [...questions].sort((a, b) => {
      const ha = ((a.id * seed) ^ (a.id << 4)) & 0xffff;
      const hb = ((b.id * seed) ^ (b.id << 4)) & 0xffff;
      return ha - hb;
    });

    const daily = shuffled.slice(0, 15).map((q) => ({
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

    return (res as any).json(daily);
  } catch (err) {
    (req as any).log.error({ err }, "Failed to get daily challenge");
    return (res as any).status(500).json({ error: "Failed to get daily challenge" });
  }
});

export default router;
