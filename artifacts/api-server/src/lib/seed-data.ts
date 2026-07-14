/**
 * Database seeding utilities for questions and categories
 */

export const CATEGORIES = [
  { id: 1, name: 'General', description: 'General Bible trivia' },
  { id: 2, name: 'Old Testament', description: 'Stories, characters, and prophecies from the OT' },
  { id: 3, name: 'New Testament', description: 'Gospels, epistles, and Acts' },
  { id: 4, name: 'Jesus & Gospels', description: 'Life, teachings, and miracles of Jesus' },
  { id: 5, name: 'Characters', description: 'Major Biblical figures and personalities' },
  { id: 6, name: 'Books of the Bible', description: 'Names, order, and authorship of Bible books' },
  { id: 7, name: 'Psalms & Proverbs', description: 'Wisdom literature and devotional writings' },
  { id: 8, name: 'Miracles & Prophecies', description: 'Supernatural events and fulfillment' },
];

export const SEED_QUESTIONS = [
  // Easy - Old Testament
  {
    text: "Who was swallowed by a large fish?",
    options: ["Jonah", "Moses", "Elijah", "Daniel"],
    correctAnswer: "Jonah",
    difficulty: "easy",
    categoryId: 2,
    explanation: "Jonah was swallowed by a great fish after fleeing from God's call to preach to Nineveh.",
    book: "Jonah 1-2"
  },
  {
    text: "How many days did it take to create the world?",
    options: ["6 days", "7 days", "5 days", "10 days"],
    correctAnswer: "6 days",
    difficulty: "easy",
    categoryId: 6,
    explanation: "God created the world in 6 days and rested on the 7th, establishing the Sabbath.",
    book: "Genesis 1-2"
  },
  {
    text: "Who was the first king of Israel?",
    options: ["Saul", "David", "Solomon", "Samuel"],
    correctAnswer: "Saul",
    difficulty: "easy",
    categoryId: 5,
    explanation: "Saul was anointed by the prophet Samuel as the first king of Israel.",
    book: "1 Samuel 10"
  },
  {
    text: "What animal did Noah bring pairs of onto the ark?",
    options: ["All animals", "Only clean animals", "Two of every kind", "Only domesticated animals"],
    correctAnswer: "Two of every kind",
    difficulty: "easy",
    categoryId: 2,
    explanation: "Noah brought two of every kind of animal (male and female) to preserve all species.",
    book: "Genesis 7:2"
  },
  {
    text: "How many sons did Jacob have?",
    options: ["10", "12", "8", "7"],
    correctAnswer: "12",
    difficulty: "easy",
    categoryId: 5,
    explanation: "Jacob had 12 sons, who became the founders of the 12 tribes of Israel.",
    book: "Genesis 35:22-26"
  },

  // Medium - General & Jesus
  {
    text: "What is the shortest verse in the Bible?",
    options: ["Jesus wept", "God is love", "Fear not", "Be still"],
    correctAnswer: "Jesus wept",
    difficulty: "medium",
    categoryId: 1,
    explanation: "John 11:35 — 'Jesus wept' is the shortest verse in the Bible, showing Jesus' compassion at Lazarus' death.",
    book: "John 11:35"
  },
  {
    text: "Who wrote the book of Revelation?",
    options: ["John", "Paul", "Peter", "James"],
    correctAnswer: "John",
    difficulty: "medium",
    categoryId: 3,
    explanation: "The Apostle John wrote Revelation while exiled on the island of Patmos.",
    book: "Revelation 1:1-4"
  },
  {
    text: "How many books are in the New Testament?",
    options: ["27", "39", "66", "24"],
    correctAnswer: "27",
    difficulty: "medium",
    categoryId: 6,
    explanation: "The New Testament contains 27 books: 4 Gospels, Acts, Paul's epistles, other epistles, and Revelation.",
    book: "New Testament overview"
  },
  {
    text: "What was the first miracle Jesus performed?",
    options: ["Turning water into wine", "Healing a blind man", "Walking on water", "Feeding 5000"],
    correctAnswer: "Turning water into wine",
    difficulty: "medium",
    categoryId: 4,
    explanation: "Jesus turned water into wine at a wedding in Cana of Galilee, revealing His divine power.",
    book: "John 2:1-11"
  },
  {
    text: "Which of these books is in the Old Testament?",
    options: ["Acts", "Leviticus", "Corinthians", "Philippians"],
    correctAnswer: "Leviticus",
    difficulty: "medium",
    categoryId: 6,
    explanation: "Leviticus is the third book of the Old Testament, containing laws and regulations for the Israelites.",
    book: "Leviticus 1:1"
  },

  // Hard - Deep Knowledge
  {
    text: "Who betrayed Jesus for 30 pieces of silver?",
    options: ["Judas Iscariot", "Peter", "Thomas", "Pontius Pilate"],
    correctAnswer: "Judas Iscariot",
    difficulty: "hard",
    categoryId: 4,
    explanation: "Judas Iscariot, one of Jesus' twelve apostles, betrayed Him to the chief priests for 30 pieces of silver.",
    book: "Matthew 26:14-16"
  },
  {
    text: "What was the name of the high priest who condemned Jesus?",
    options: ["Caiaphas", "Annas", "Herod", "Pontius Pilate"],
    correctAnswer: "Caiaphas",
    difficulty: "hard",
    categoryId: 4,
    explanation: "Caiaphas was the high priest of the Sanhedrin who orchestrated Jesus' condemnation.",
    book: "Matthew 26:57-68"
  },
  {
    text: "How long did the Israelites wander in the desert?",
    options: ["30 years", "40 years", "50 years", "20 years"],
    correctAnswer: "40 years",
    difficulty: "hard",
    categoryId: 2,
    explanation: "The Israelites wandered in the wilderness for 40 years before entering the Promised Land.",
    book: "Numbers 14:33-34"
  },
  {
    text: "What was the name of Jonah's plant that God provided for shade?",
    options: ["Gourd", "Fig tree", "Palm tree", "Acacia"],
    correctAnswer: "Gourd",
    difficulty: "hard",
    categoryId: 8,
    explanation: "God provided a gourd to give Jonah shade, demonstrating God's care and teaching a lesson about mercy.",
    book: "Jonah 4:6-7"
  },
  {
    text: "Which disciple was a tax collector before following Jesus?",
    options: ["Matthew", "Mark", "Luke", "Peter"],
    correctAnswer: "Matthew",
    difficulty: "hard",
    categoryId: 5,
    explanation: "Matthew (also called Levi) was a tax collector when Jesus called him to be an apostle.",
    book: "Matthew 9:9; Mark 2:14"
  },
];

export async function seedDatabase(client: any) {
  try {
    // Seed categories
    for (const category of CATEGORIES) {
      await client.query(
        `INSERT INTO categories (id, name, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET name = $2, description = $3`,
        [category.id, category.name, category.description]
      );
    }

    // Seed questions
    const { rows: existingQuestions } = await client.query('SELECT COUNT(*)::int as count FROM questions');
    
    if ((existingQuestions[0]?.count ?? 0) < 15) {
      for (const question of SEED_QUESTIONS) {
        await client.query(
          `INSERT INTO questions (text, options, correct_answer, difficulty, category_id, explanation, book)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            question.text,
            question.options,
            question.correctAnswer,
            question.difficulty,
            question.categoryId,
            question.explanation,
            question.book
          ]
        );
      }
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
