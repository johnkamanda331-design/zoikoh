import { createDb } from "./index";

const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("NEON_DATABASE_URL (or DATABASE_URL) must be set to run the seed script.");
}
const { db, pool } = createDb(dbUrl);
import { categoriesTable, questionsTable } from "./schema";

type SeedQuestion = {
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: "easy" | "medium" | "hard";
  explanation?: string;
  book?: string;
};

const CATEGORIES: { name: string; description: string; questions: SeedQuestion[] }[] = [
  {
    name: "Old Testament",
    description: "Stories, people, and events from Genesis through Malachi",
    questions: [
      {
        text: "Who was thrown into a den of lions but was unharmed?",
        options: ["Daniel", "Joseph", "Samson", "Elijah"],
        correctAnswer: "Daniel",
        difficulty: "easy",
        explanation: "Daniel was protected by God after being thrown into the lions' den for praying.",
        book: "Daniel",
      },
      {
        text: "How many days and nights did it rain during the flood?",
        options: ["7", "40", "90", "120"],
        correctAnswer: "40",
        difficulty: "easy",
        explanation: "Genesis 7:12 says it rained for forty days and forty nights.",
        book: "Genesis",
      },
      {
        text: "Who led the Israelites out of Egypt?",
        options: ["Moses", "Aaron", "Joshua", "Abraham"],
        correctAnswer: "Moses",
        difficulty: "easy",
        book: "Exodus",
      },
      {
        text: "What did God create on the first day?",
        options: ["Light", "Animals", "Plants", "Man"],
        correctAnswer: "Light",
        difficulty: "easy",
        book: "Genesis",
      },
      {
        text: "Who was sold into slavery by his brothers?",
        options: ["Joseph", "Benjamin", "Reuben", "Judah"],
        correctAnswer: "Joseph",
        difficulty: "easy",
        book: "Genesis",
      },
      {
        text: "What sea did Moses part to escape Pharaoh's army?",
        options: ["Red Sea", "Dead Sea", "Sea of Galilee", "Mediterranean Sea"],
        correctAnswer: "Red Sea",
        difficulty: "medium",
        book: "Exodus",
      },
      {
        text: "Who was known for his great strength, tied to his uncut hair?",
        options: ["Samson", "Goliath", "David", "Saul"],
        correctAnswer: "Samson",
        difficulty: "medium",
        book: "Judges",
      },
      {
        text: "Which prophet was taken to heaven in a chariot of fire?",
        options: ["Elijah", "Elisha", "Isaiah", "Jeremiah"],
        correctAnswer: "Elijah",
        difficulty: "medium",
        book: "2 Kings",
      },
      {
        text: "Who interpreted Pharaoh's dreams about seven fat and seven lean cows?",
        options: ["Joseph", "Daniel", "Moses", "Aaron"],
        correctAnswer: "Joseph",
        difficulty: "medium",
        book: "Genesis",
      },
      {
        text: "What was the name of the giant Philistine David defeated?",
        options: ["Goliath", "Og", "Sisera", "Agag"],
        correctAnswer: "Goliath",
        difficulty: "easy",
        book: "1 Samuel",
      },
      {
        text: "Which king had a dream about a statue with a head of gold, interpreted by Daniel?",
        options: ["Nebuchadnezzar", "Belshazzar", "Cyrus", "Darius"],
        correctAnswer: "Nebuchadnezzar",
        difficulty: "hard",
        book: "Daniel",
      },
      {
        text: "Who was the first king of Israel?",
        options: ["Saul", "David", "Solomon", "Samuel"],
        correctAnswer: "Saul",
        difficulty: "medium",
        book: "1 Samuel",
      },
      {
        text: "What did God ask Abraham to sacrifice on Mount Moriah?",
        options: ["Isaac", "Ishmael", "Jacob", "Esau"],
        correctAnswer: "Isaac",
        difficulty: "medium",
        book: "Genesis",
      },
      {
        text: "Which judge defeated the Midianites with only 300 men?",
        options: ["Gideon", "Deborah", "Ehud", "Barak"],
        correctAnswer: "Gideon",
        difficulty: "hard",
        book: "Judges",
      },
      {
        text: "Who built the ark according to God's instructions?",
        options: ["Noah", "Shem", "Ham", "Japheth"],
        correctAnswer: "Noah",
        difficulty: "easy",
        book: "Genesis",
      },
    ],
  },
  {
    name: "New Testament",
    description: "The life of Jesus, the apostles, and the early church",
    questions: [
      {
        text: "In which town was Jesus born?",
        options: ["Bethlehem", "Nazareth", "Jerusalem", "Capernaum"],
        correctAnswer: "Bethlehem",
        difficulty: "easy",
        book: "Luke",
      },
      {
        text: "How many disciples did Jesus choose?",
        options: ["12", "10", "7", "70"],
        correctAnswer: "12",
        difficulty: "easy",
        book: "Matthew",
      },
      {
        text: "Who betrayed Jesus for thirty pieces of silver?",
        options: ["Judas Iscariot", "Peter", "Thomas", "Matthew"],
        correctAnswer: "Judas Iscariot",
        difficulty: "easy",
        book: "Matthew",
      },
      {
        text: "What was Jesus' first recorded miracle?",
        options: ["Turning water into wine", "Walking on water", "Healing a blind man", "Feeding the 5000"],
        correctAnswer: "Turning water into wine",
        difficulty: "medium",
        book: "John",
      },
      {
        text: "Who denied knowing Jesus three times?",
        options: ["Peter", "John", "James", "Andrew"],
        correctAnswer: "Peter",
        difficulty: "easy",
        book: "Matthew",
      },
      {
        text: "On which road did Paul have his conversion experience?",
        options: ["Road to Damascus", "Road to Emmaus", "Road to Jericho", "Road to Antioch"],
        correctAnswer: "Road to Damascus",
        difficulty: "medium",
        book: "Acts",
      },
      {
        text: "Who baptized Jesus in the Jordan River?",
        options: ["John the Baptist", "Peter", "Andrew", "Philip"],
        correctAnswer: "John the Baptist",
        difficulty: "easy",
        book: "Matthew",
      },
      {
        text: "Which apostle was known as 'doubting' after questioning the resurrection?",
        options: ["Thomas", "Philip", "Bartholomew", "James"],
        correctAnswer: "Thomas",
        difficulty: "easy",
        book: "John",
      },
      {
        text: "How many loaves and fish fed the 5000?",
        options: ["5 loaves, 2 fish", "2 loaves, 5 fish", "7 loaves, 3 fish", "3 loaves, 7 fish"],
        correctAnswer: "5 loaves, 2 fish",
        difficulty: "medium",
        book: "Matthew",
      },
      {
        text: "Who was the Roman governor who presided over Jesus' trial?",
        options: ["Pontius Pilate", "Herod Antipas", "Caiaphas", "Felix"],
        correctAnswer: "Pontius Pilate",
        difficulty: "medium",
        book: "Matthew",
      },
      {
        text: "Which book of the New Testament was written as a letter to believers about faith and works?",
        options: ["James", "Jude", "Titus", "Philemon"],
        correctAnswer: "James",
        difficulty: "hard",
        book: "James",
      },
      {
        text: "Who was stoned to death for his faith and is considered the first Christian martyr?",
        options: ["Stephen", "James", "Paul", "Peter"],
        correctAnswer: "Stephen",
        difficulty: "hard",
        book: "Acts",
      },
      {
        text: "What did Jesus say was the greatest commandment?",
        options: ["Love God with all your heart", "Honor your parents", "Do not steal", "Keep the Sabbath"],
        correctAnswer: "Love God with all your heart",
        difficulty: "medium",
        book: "Matthew",
      },
      {
        text: "Who wrote most of the letters (epistles) in the New Testament?",
        options: ["Paul", "Peter", "John", "James"],
        correctAnswer: "Paul",
        difficulty: "medium",
        book: "Romans",
      },
      {
        text: "On what island was John exiled when he received the visions of Revelation?",
        options: ["Patmos", "Crete", "Cyprus", "Malta"],
        correctAnswer: "Patmos",
        difficulty: "hard",
        book: "Revelation",
      },
    ],
  },
  {
    name: "Parables & Teachings",
    description: "The stories and lessons Jesus taught",
    questions: [
      {
        text: "In the Parable of the Good Samaritan, who did the Samaritan help?",
        options: ["A man beaten by robbers", "A blind beggar", "A tax collector", "A widow"],
        correctAnswer: "A man beaten by robbers",
        difficulty: "easy",
        book: "Luke",
      },
      {
        text: "In the Parable of the Prodigal Son, what did the father do when his son returned?",
        options: ["Ran to embrace him", "Sent him away", "Made him a servant", "Ignored him"],
        correctAnswer: "Ran to embrace him",
        difficulty: "easy",
        book: "Luke",
      },
      {
        text: "What did the mustard seed parable illustrate?",
        options: ["The growth of the kingdom of heaven", "Faith moving mountains", "Patience", "Forgiveness"],
        correctAnswer: "The growth of the kingdom of heaven",
        difficulty: "medium",
        book: "Matthew",
      },
      {
        text: "In the Parable of the Talents, how many talents did the servant who was punished bury?",
        options: ["One", "Two", "Five", "Ten"],
        correctAnswer: "One",
        difficulty: "medium",
        book: "Matthew",
      },
      {
        text: "In the Parable of the Sower, what happened to seed that fell on rocky ground?",
        options: ["It sprang up quickly but withered", "It grew into a large plant", "Birds ate it", "It was choked by thorns"],
        correctAnswer: "It sprang up quickly but withered",
        difficulty: "hard",
        book: "Matthew",
      },
      {
        text: "How many wise and foolish virgins were there in the parable of the ten virgins?",
        options: ["5 wise, 5 foolish", "3 wise, 7 foolish", "7 wise, 3 foolish", "10 wise, 0 foolish"],
        correctAnswer: "5 wise, 5 foolish",
        difficulty: "hard",
        book: "Matthew",
      },
      {
        text: "What did the shepherd do when he found his one lost sheep?",
        options: ["Rejoiced and celebrated", "Scolded it", "Left it to find its way", "Punished the flock"],
        correctAnswer: "Rejoiced and celebrated",
        difficulty: "easy",
        book: "Luke",
      },
      {
        text: "In the Beatitudes, who did Jesus say would inherit the earth?",
        options: ["The meek", "The rich", "The powerful", "The proud"],
        correctAnswer: "The meek",
        difficulty: "medium",
        book: "Matthew",
      },
    ],
  },
  {
    name: "People of the Bible",
    description: "Key figures and their stories",
    questions: [
      {
        text: "Who was the wife of Abraham?",
        options: ["Sarah", "Rebekah", "Rachel", "Leah"],
        correctAnswer: "Sarah",
        difficulty: "easy",
        book: "Genesis",
      },
      {
        text: "Who was known as the wisest king of Israel?",
        options: ["Solomon", "David", "Saul", "Hezekiah"],
        correctAnswer: "Solomon",
        difficulty: "easy",
        book: "1 Kings",
      },
      {
        text: "Which prophet was swallowed by a great fish?",
        options: ["Jonah", "Elijah", "Ezekiel", "Amos"],
        correctAnswer: "Jonah",
        difficulty: "easy",
        book: "Jonah",
      },
      {
        text: "Who was the mother of Jesus?",
        options: ["Mary", "Martha", "Elizabeth", "Anna"],
        correctAnswer: "Mary",
        difficulty: "easy",
        book: "Luke",
      },
      {
        text: "Which queen risked her life to save the Jewish people from Haman's plot?",
        options: ["Esther", "Ruth", "Deborah", "Jezebel"],
        correctAnswer: "Esther",
        difficulty: "medium",
        book: "Esther",
      },
      {
        text: "Who was Ruth's mother-in-law, whom she famously refused to leave?",
        options: ["Naomi", "Orpah", "Rebekah", "Rachel"],
        correctAnswer: "Naomi",
        difficulty: "medium",
        book: "Ruth",
      },
      {
        text: "Which judge and prophetess led Israel to victory over the Canaanites?",
        options: ["Deborah", "Miriam", "Huldah", "Anna"],
        correctAnswer: "Deborah",
        difficulty: "hard",
        book: "Judges",
      },
      {
        text: "Who was the father of John the Baptist?",
        options: ["Zechariah", "Zebedee", "Joseph", "Simeon"],
        correctAnswer: "Zechariah",
        difficulty: "hard",
        book: "Luke",
      },
      {
        text: "Which disciple was a tax collector before following Jesus?",
        options: ["Matthew", "Peter", "Andrew", "Nathanael"],
        correctAnswer: "Matthew",
        difficulty: "medium",
        book: "Matthew",
      },
    ],
  },
];

async function seed() {
  const existing = await db.select().from(categoriesTable).limit(1);
  if (existing.length > 0) {
    console.log("Database already has categories — skipping seed.");
    return;
  }

  await db.transaction(async (tx) => {
    for (const category of CATEGORIES) {
      const [inserted] = await tx
        .insert(categoriesTable)
        .values({ name: category.name, description: category.description })
        .returning();

      await tx.insert(questionsTable).values(
        category.questions.map((q) => ({
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          categoryId: inserted.id,
          explanation: q.explanation,
          book: q.book,
        }))
      );

      console.log(`Seeded "${category.name}" with ${category.questions.length} questions.`);
    }
  });

  console.log("Seed complete.");
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Seed failed:", err);
    pool.end();
    process.exit(1);
  });
