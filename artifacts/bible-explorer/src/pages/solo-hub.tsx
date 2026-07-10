import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useSearch } from 'wouter';
import {
  Target, Zap, RotateCcw, Brain, Clock, ChevronLeft,
  CheckCircle2, XCircle, BookMarked, Hash, Puzzle,
  MessageSquare, Flame, Star, Shield, RefreshCw, Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  useGetDailyChallenge, useListQuestions,
  getGetDailyChallengeQueryKey, getListQuestionsQueryKey,
} from '@workspace/api-client-react';
import {
  recordGamePlayed, recordFlashCard, recordScramble,
  recordSpeedRound, recordTrueFalse, recordCrossword, recordQuoteMatch,
  checkAndAward, pickUnseen, shuffle, ACHIEVEMENT_DEFS,
} from '@/hooks/use-achievements';

/* ─────────────────────────────────────────────────────────────────────────
   Static game data
───────────────────────────────────────────────────────────────────────── */

const TRUE_FALSE_QUESTIONS = [
  { id: 1,  s: 'Jesus was born in Bethlehem.',                                         a: true,  e: 'Luke 2:4-7' },
  { id: 2,  s: 'Moses received the Ten Commandments on Mount Calvary.',                a: false, e: 'It was Mount Sinai (Exodus 19–20).' },
  { id: 3,  s: 'David killed Goliath with a sling and a stone.',                       a: true,  e: '1 Samuel 17:49' },
  { id: 4,  s: 'Jonah was in the great fish for 3 days and 3 nights.',                a: true,  e: 'Jonah 1:17' },
  { id: 5,  s: 'The New Testament has 27 books.',                                      a: true,  e: 'From Matthew to Revelation.' },
  { id: 6,  s: "Samson's strength came from his long hair.",                           a: true,  e: 'Judges 16:17' },
  { id: 7,  s: 'Paul wrote the book of Revelation.',                                   a: false, e: 'Revelation was written by the Apostle John.' },
  { id: 8,  s: 'Ruth was from Moab.',                                                  a: true,  e: 'Ruth 1:4' },
  { id: 9,  s: 'The first plague on Egypt was locusts.',                               a: false, e: 'The first plague was water turning to blood (Exodus 7:17).' },
  { id: 10, s: 'Jesus performed his first miracle at the wedding in Cana.',            a: true,  e: 'John 2:1-11' },
  { id: 11, s: 'Solomon built the first temple in Jerusalem.',                         a: true,  e: '1 Kings 6' },
  { id: 12, s: 'Jesus had 12 apostles.',                                               a: true,  e: 'Matthew 10:1-4' },
  { id: 13, s: 'The Bible was originally written in Latin.',                           a: false, e: 'OT was mostly Hebrew; NT was written in Greek.' },
  { id: 14, s: 'Elijah was taken to heaven in a chariot of fire.',                     a: true,  e: '2 Kings 2:11' },
  { id: 15, s: 'Mary Magdalene was the first to see the risen Jesus.',                 a: true,  e: 'John 20:14-16' },
  { id: 16, s: 'The Tower of Babel was built in Egypt.',                               a: false, e: 'It was built in Babylon/Mesopotamia (Genesis 11:2-4).' },
  { id: 17, s: 'Peter walked on water with Jesus.',                                    a: true,  e: 'Matthew 14:29' },
  { id: 18, s: 'The book of Psalms has 150 chapters.',                                 a: true,  e: 'Psalms 1–150' },
  { id: 19, s: 'Lazarus was raised from the dead after 4 days in the tomb.',           a: true,  e: 'John 11:39' },
  { id: 20, s: 'Zacchaeus climbed a sycamore tree to see Jesus.',                     a: true,  e: 'Luke 19:4' },
  { id: 21, s: 'Judas betrayed Jesus for 40 pieces of silver.',                        a: false, e: 'It was 30 pieces of silver (Matthew 26:15).' },
  { id: 22, s: 'Paul was originally named Saul.',                                      a: true,  e: 'Acts 7:58; Acts 13:9' },
  { id: 23, s: 'Job had seven sons and three daughters.',                              a: true,  e: 'Job 1:2' },
  { id: 24, s: 'Daniel was thrown into a furnace of fire.',                            a: false, e: 'Shadrach, Meshach & Abednego were in the furnace; Daniel was in the lion\'s den.' },
  { id: 25, s: 'Jesus fasted for 40 days in the wilderness.',                          a: true,  e: 'Matthew 4:2' },
  { id: 26, s: 'Methuselah lived to be 969 years old.',                                a: true,  e: 'Genesis 5:27' },
  { id: 27, s: 'Esther was married to King Solomon.',                                  a: false, e: 'Esther married King Ahasuerus (Xerxes), not Solomon.' },
  { id: 28, s: 'The Beatitudes are found in the Sermon on the Mount.',                 a: true,  e: 'Matthew 5:3-12' },
  { id: 29, s: 'Nicodemus visited Jesus at night.',                                    a: true,  e: 'John 3:2' },
  { id: 30, s: 'The prodigal son had three brothers in the parable.',                  a: false, e: 'He had only one brother (Luke 15:11).' },
  { id: 31, s: 'Abraham was 100 years old when Isaac was born.',                       a: true,  e: 'Genesis 21:5' },
  { id: 32, s: 'Jesus rode into Jerusalem on a horse.',                                a: false, e: 'He rode on a donkey (Matthew 21:7).' },
  { id: 33, s: 'Noah had three sons: Shem, Ham, and Japheth.',                         a: true,  e: 'Genesis 5:32' },
  { id: 34, s: 'The Holy Spirit appeared as a dove at Jesus\' baptism.',               a: true,  e: 'Matthew 3:16' },
  { id: 35, s: 'The Good Samaritan parable was told by Jesus.',                        a: true,  e: 'Luke 10:25-37' },
  { id: 36, s: 'Isaiah prophesied the Messiah\'s birth in Bethlehem.',                 a: false, e: 'Bethlehem was prophesied by Micah 5:2; Isaiah prophesied other details.' },
  { id: 37, s: 'Stephen was the first Christian martyr.',                              a: true,  e: 'Acts 7:59-60' },
  { id: 38, s: 'Goliath was over 9 feet tall.',                                        a: true,  e: '1 Samuel 17:4 – six cubits and a span, approx. 9 ft 9 in.' },
  { id: 39, s: 'The feeding of the 5000 involved 5 loaves and 2 fish.',                a: true,  e: 'John 6:9' },
  { id: 40, s: 'Elisha parted the Jordan River.',                                      a: true,  e: '2 Kings 2:14' },
];

const BIBLE_WORDS: Array<{ word: string; hint: string }> = [
  { word: 'GENESIS',     hint: 'First book of the Bible' },
  { word: 'EXODUS',      hint: 'Israel\'s departure from Egypt' },
  { word: 'JERUSALEM',   hint: 'Holy city and capital of Israel' },
  { word: 'BETHLEHEM',   hint: 'Birthplace of Jesus' },
  { word: 'NAZARETH',    hint: 'Town where Jesus grew up' },
  { word: 'GALILEE',     hint: 'Region where Jesus ministered' },
  { word: 'ABRAHAM',     hint: 'Father of faith, first patriarch' },
  { word: 'MOSES',       hint: 'Led Israel out of Egypt' },
  { word: 'DAVID',       hint: 'Israel\'s greatest king and psalmist' },
  { word: 'SOLOMON',     hint: 'Wisest king who built the Temple' },
  { word: 'ELIJAH',      hint: 'Prophet taken to heaven in a chariot of fire' },
  { word: 'ISAIAH',      hint: 'Major prophet who foretold the Messiah' },
  { word: 'JEREMIAH',    hint: 'The weeping prophet of Judah' },
  { word: 'DANIEL',      hint: 'Survived the lion\'s den' },
  { word: 'JONAH',       hint: 'Swallowed by a great fish' },
  { word: 'MATTHEW',     hint: 'Tax collector turned apostle' },
  { word: 'LUKE',        hint: 'Physician who wrote the third Gospel' },
  { word: 'PETER',       hint: 'Rock on which Jesus built His church' },
  { word: 'PAUL',        hint: 'Apostle to the Gentiles' },
  { word: 'JOSEPH',      hint: 'Had a coat of many colours' },
  { word: 'JACOB',       hint: 'Wrestled with God; father of 12 tribes' },
  { word: 'NOAH',        hint: 'Built the ark for the great flood' },
  { word: 'ADAM',        hint: 'First man created by God' },
  { word: 'SARAH',       hint: 'Abraham\'s wife; mother of Isaac' },
  { word: 'ESTHER',      hint: 'Brave queen who saved her people' },
  { word: 'RUTH',        hint: 'Loyal Moabite; ancestor of David' },
  { word: 'PSALMS',      hint: 'Book of songs and prayers to God' },
  { word: 'PROVERBS',    hint: 'Book of wisdom and practical advice' },
  { word: 'REVELATION',  hint: 'Last book of the Bible' },
  { word: 'COVENANT',    hint: 'Sacred agreement between God and man' },
  { word: 'SABBATH',     hint: 'Day of rest commanded by God' },
  { word: 'APOSTLE',     hint: 'One sent out by Jesus' },
  { word: 'PARABLE',     hint: 'Short story with a spiritual lesson' },
  { word: 'BAPTISM',     hint: 'Symbolic act of washing and new life' },
  { word: 'SAMSON',      hint: 'The strongest man in the Bible' },
  { word: 'GOLIATH',     hint: 'Giant slain by David' },
  { word: 'LAZARUS',     hint: 'Man raised from the dead by Jesus' },
  { word: 'TIMOTHY',     hint: 'Young pastor mentored by Paul' },
  { word: 'STEPHEN',     hint: 'First Christian martyr' },
  { word: 'TABERNACLE',  hint: 'Portable worship tent in the wilderness' },
];

const FILL_IN_VERSES: Array<{ before: string; word: string; after: string; reference: string }> = [
  { before: 'For God so', word: 'loved', after: 'the world that he gave his one and only Son.', reference: 'John 3:16' },
  { before: 'The LORD is my', word: 'shepherd', after: ', I lack nothing.', reference: 'Psalm 23:1' },
  { before: 'I can do all this through him who gives me', word: 'strength', after: '.', reference: 'Philippians 4:13' },
  { before: 'Trust in the LORD with all your', word: 'heart', after: 'and lean not on your own understanding.', reference: 'Proverbs 3:5' },
  { before: 'Be strong and', word: 'courageous', after: '. Do not be afraid; do not be discouraged.', reference: 'Joshua 1:9' },
  { before: 'But seek first his', word: 'kingdom', after: 'and his righteousness.', reference: 'Matthew 6:33' },
  { before: 'Do not be', word: 'anxious', after: 'about anything, but in every situation, present your requests to God.', reference: 'Philippians 4:6' },
  { before: 'For I know the', word: 'plans', after: 'I have for you, declares the LORD.', reference: 'Jeremiah 29:11' },
  { before: 'Love the Lord your God with all your', word: 'heart', after: 'and with all your soul and with all your mind.', reference: 'Matthew 22:37' },
  { before: 'The LORD is my light and my', word: 'salvation', after: '— whom shall I fear?', reference: 'Psalm 27:1' },
  { before: 'Come to me, all you who are', word: 'weary', after: 'and burdened, and I will give you rest.', reference: 'Matthew 11:28' },
  { before: 'I am the way and the truth and the', word: 'life', after: '. No one comes to the Father except through me.', reference: 'John 14:6' },
  { before: 'For it is by', word: 'grace', after: 'you have been saved, through faith.', reference: 'Ephesians 2:8' },
  { before: 'In the beginning God', word: 'created', after: 'the heavens and the earth.', reference: 'Genesis 1:1' },
  { before: 'Your word is a', word: 'lamp', after: 'for my feet, a light on my path.', reference: 'Psalm 119:105' },
  { before: 'The wages of', word: 'sin', after: 'is death, but the gift of God is eternal life.', reference: 'Romans 6:23' },
  { before: 'For all have sinned and fall short of the', word: 'glory', after: 'of God.', reference: 'Romans 3:23' },
  { before: 'Be still and', word: 'know', after: 'that I am God.', reference: 'Psalm 46:10' },
  { before: 'Jesus', word: 'wept', after: '.', reference: 'John 11:35' },
  { before: 'God is', word: 'love', after: ', and whoever abides in love abides in God.', reference: '1 John 4:16' },
  { before: 'Delight yourself in the LORD, and he will give you the', word: 'desires', after: 'of your heart.', reference: 'Psalm 37:4' },
  { before: 'Do not conform to the pattern of this world but be', word: 'transformed', after: 'by the renewing of your mind.', reference: 'Romans 12:2' },
  { before: 'I have hidden your word in my', word: 'heart', after: 'that I might not sin against you.', reference: 'Psalm 119:11' },
  { before: 'This is the day the LORD has', word: 'made', after: '; we will rejoice and be glad in it.', reference: 'Psalm 118:24' },
  { before: 'Rejoice in the Lord', word: 'always', after: '. I will say it again: Rejoice!', reference: 'Philippians 4:4' },
];

const NUMBER_QUESTIONS: Array<{ q: string; options: string[]; answer: string; reference: string }> = [
  { q: 'How many days did Jesus fast in the wilderness?',             options: ['30','40','20','50'],  answer: '40',  reference: 'Matthew 4:2' },
  { q: 'How many books are in the New Testament?',                    options: ['27','39','66','24'],  answer: '27',  reference: 'NT canon' },
  { q: 'How many apostles did Jesus choose?',                         options: ['12','7','10','15'],   answer: '12',  reference: 'Matthew 10:1' },
  { q: 'How many days was Jonah in the great fish?',                  options: ['3','7','40','1'],     answer: '3',   reference: 'Jonah 1:17' },
  { q: 'How many plagues were sent upon Egypt?',                      options: ['10','7','9','12'],    answer: '10',  reference: 'Exodus 7–12' },
  { q: 'How many years did Israel wander in the wilderness?',         options: ['40','20','50','30'],  answer: '40',  reference: 'Numbers 14:33' },
  { q: 'How many chapters are in the book of Psalms?',                options: ['150','100','120','175'], answer: '150', reference: 'Psalms 1–150' },
  { q: 'How many pieces of silver was Jesus betrayed for?',           options: ['30','20','40','50'],  answer: '30',  reference: 'Matthew 26:15' },
  { q: 'How many days did it take God to create the world?',          options: ['6','7','5','10'],     answer: '6',   reference: 'Genesis 1' },
  { q: 'How many people were fed with 5 loaves and 2 fish?',          options: ['5000','4000','3000','10000'], answer: '5000', reference: 'John 6:10' },
  { q: 'How many times did the Israelites march around Jericho in total?', options: ['13','7','12','10'],  answer: '13', reference: 'Joshua 6:3-4 (6+7)' },
  { q: 'How many sons did Jacob have?',                               options: ['12','10','13','7'],   answer: '12',  reference: 'Genesis 35:22' },
  { q: 'How old was Noah when the flood started?',                    options: ['600','500','700','400'], answer: '600', reference: 'Genesis 7:6' },
  { q: 'How many times did Peter deny Jesus?',                        options: ['3','2','4','1'],      answer: '3',   reference: 'Mark 14:66-72' },
  { q: 'How many books of the Bible did Paul write?',                 options: ['13','10','7','12'],   answer: '13',  reference: 'Romans–Philemon' },
  { q: 'How many days after Jesus\'s death did he ascend to heaven?', options: ['40','30','7','50'],   answer: '40',  reference: 'Acts 1:3' },
  { q: 'How many times did Elisha ask Naaman to dip in the Jordan?',  options: ['7','3','5','10'],     answer: '7',   reference: '2 Kings 5:10' },
  { q: 'How many years did the Israelites spend in Egypt?',           options: ['430','400','350','500'], answer: '430', reference: 'Exodus 12:40' },
  { q: 'How many commandments did God give Moses?',                   options: ['10','7','12','6'],    answer: '10',  reference: 'Exodus 20' },
  { q: 'How many books does the entire Bible contain?',               options: ['66','39','73','60'],   answer: '66',  reference: 'Protestant canon' },
];

/* ─────────────────────────────────────────────────────────────────────────
   Quote match data
───────────────────────────────────────────────────────────────────────── */
const QUOTES: Array<{ id: number; question: string; quote: string; answer: string; options: string[]; reference: string }> = [
  { id: 1,  question: 'Who said this?',  quote: '"I am the way and the truth and the life. No one comes to the Father except through me."',                        answer: 'Jesus',             options: ['Jesus','Paul','Peter','Isaiah'],                                           reference: 'John 14:6' },
  { id: 2,  question: 'Who said this?',  quote: '"Come to me, all you who are weary and burdened, and I will give you rest."',                                       answer: 'Jesus',             options: ['Jesus','Isaiah','Paul','John'],                                            reference: 'Matthew 11:28' },
  { id: 3,  question: 'Who said this?',  quote: '"The LORD is my shepherd, I lack nothing."',                                                                         answer: 'David',             options: ['David','Solomon','Moses','Isaiah'],                                        reference: 'Psalm 23:1' },
  { id: 4,  question: 'Who said this?',  quote: '"I can do all this through him who gives me strength."',                                                             answer: 'Paul',              options: ['Paul','Peter','John','James'],                                             reference: 'Philippians 4:13' },
  { id: 5,  question: 'Who wrote this?', quote: '"In the beginning God created the heavens and the earth."',                                                          answer: 'Moses',             options: ['Moses','John','Isaiah','Ezra'],                                            reference: 'Genesis 1:1' },
  { id: 6,  question: 'Who said this?',  quote: '"Here I am! I stand at the door and knock."',                                                                        answer: 'Jesus',             options: ['Jesus','Paul','John','Peter'],                                             reference: 'Revelation 3:20' },
  { id: 7,  question: 'Who said this?',  quote: '"Do not be anxious about anything, but in every situation… present your requests to God."',                          answer: 'Paul',              options: ['Paul','James','Peter','Jude'],                                             reference: 'Philippians 4:6' },
  { id: 8,  question: 'Who said this?',  quote: '"Be still, and know that I am God."',                                                                                answer: 'God',               options: ['God','Moses','David','Joshua'],                                            reference: 'Psalm 46:10' },
  { id: 9,  question: 'Who said this?',  quote: '"Before I formed you in the womb I knew you."',                                                                      answer: 'God (to Jeremiah)', options: ['God (to Jeremiah)','God (to Isaiah)','God (to Moses)','God (to David)'],   reference: 'Jeremiah 1:5' },
  { id: 10, question: 'Who said this?',  quote: '"Though he slay me, yet will I hope in him."',                                                                       answer: 'Job',               options: ['Job','David','Jeremiah','Elijah'],                                         reference: 'Job 13:15' },
  { id: 11, question: 'Who said this?',  quote: '"Where you go I will go, and where you stay I will stay."',                                                          answer: 'Ruth',              options: ['Ruth','Esther','Mary','Deborah'],                                          reference: 'Ruth 1:16' },
  { id: 12, question: 'Who said this?',  quote: '"If God is for us, who can be against us?"',                                                                         answer: 'Paul',              options: ['Paul','David','Peter','John'],                                             reference: 'Romans 8:31' },
  { id: 13, question: 'Who said this?',  quote: '"I have been crucified with Christ and I no longer live, but Christ lives in me."',                                  answer: 'Paul',              options: ['Paul','Peter','John','James'],                                             reference: 'Galatians 2:20' },
  { id: 14, question: 'Who said this?',  quote: '"Your word is a lamp for my feet, a light on my path."',                                                             answer: 'David',             options: ['David','Solomon','Asaph','Hezekiah'],                                     reference: 'Psalm 119:105' },
  { id: 15, question: 'Who said this?',  quote: '"Blessed are the pure in heart, for they will see God."',                                                            answer: 'Jesus',             options: ['Jesus','Isaiah','Paul','John'],                                            reference: 'Matthew 5:8' },
  { id: 16, question: 'Who said this?',  quote: '"I am the resurrection and the life. The one who believes in me will live, even though they die."',                 answer: 'Jesus',             options: ['Jesus','Elijah','Paul','John'],                                            reference: 'John 11:25' },
  { id: 17, question: 'Who said this?',  quote: '"For the wages of sin is death, but the gift of God is eternal life in Christ Jesus."',                             answer: 'Paul',              options: ['Paul','John','Peter','James'],                                             reference: 'Romans 6:23' },
  { id: 18, question: 'Who said this?',  quote: '"Vanity of vanities! All is vanity."',                                                                               answer: 'Solomon',           options: ['Solomon','David','Job','Isaiah'],                                          reference: 'Ecclesiastes 1:2' },
  { id: 19, question: 'Who said this?',  quote: '"My soul glorifies the Lord and my spirit rejoices in God my Savior."',                                              answer: 'Mary',              options: ['Mary','Elizabeth','Anna','Miriam'],                                        reference: 'Luke 1:46-47' },
  { id: 20, question: 'Who said this?',  quote: '"It is finished."',                                                                                                  answer: 'Jesus',             options: ['Jesus','Paul','John','Peter'],                                             reference: 'John 19:30' },
  { id: 21, question: 'Who said this?',  quote: '"Lord, to whom shall we go? You have the words of eternal life."',                                                   answer: 'Peter',             options: ['Peter','John','Thomas','James'],                                           reference: 'John 6:68' },
  { id: 22, question: 'Who said this?',  quote: '"Am I my brother\'s keeper?"',                                                                                       answer: 'Cain',              options: ['Cain','Abel','Seth','Lamech'],                                             reference: 'Genesis 4:9' },
  { id: 23, question: 'Who said this?',  quote: '"Surely goodness and love will follow me all the days of my life."',                                                 answer: 'David',             options: ['David','Asaph','Solomon','Korah'],                                         reference: 'Psalm 23:6' },
  { id: 24, question: 'Who said this?',  quote: '"Do not be overcome by evil, but overcome evil with good."',                                                         answer: 'Paul',              options: ['Paul','James','Peter','John'],                                             reference: 'Romans 12:21' },
  { id: 25, question: 'Who said this?',  quote: '"Here am I. Send me!"',                                                                                              answer: 'Isaiah',            options: ['Isaiah','Jeremiah','Ezekiel','Moses'],                                     reference: 'Isaiah 6:8' },
];

/* ─────────────────────────────────────────────────────────────────────────
   Mode definitions
───────────────────────────────────────────────────────────────────────── */
const MODES = [
  { id: 'daily',        title: 'Daily Challenge',  desc: '5 date-seeded questions that reset every midnight.',              icon: Zap,         gradient: 'from-brand-orange to-red-500',     badge: 'Daily',    badgeVariant: 'orange'    as const, tags: ['5 Questions','Bonus Points'] },
  { id: 'qa',           title: 'Bible Q&A',         desc: 'Endless trivia across Old & New Testament.',                      icon: Target,      gradient: 'from-brand-purple to-indigo-500',  badge: 'Endless',  badgeVariant: 'purple'    as const, tags: ['Custom Diff','All Topics'] },
  { id: 'flash',        title: 'Flash Cards',       desc: 'Flip through key verses, names, and concepts.',                   icon: Brain,       gradient: 'from-brand-blue to-cyan-500',      badge: 'Practice', badgeVariant: 'blue'      as const, tags: ['Self-paced','Memory'] },
  { id: 'scramble',     title: 'Word Scramble',     desc: 'Unscramble Bible names and places in 45 seconds.',               icon: RotateCcw,   gradient: 'from-brand-green to-emerald-500',  badge: 'Mini-game',badgeVariant: 'green'     as const, tags: ['Speed','45 Seconds'] },
  { id: 'true-false',   title: 'True or False',     desc: 'Quick-fire true/false statements about Bible events.',           icon: Shield,      gradient: 'from-teal-500 to-green-600',       badge: 'Quick',    badgeVariant: 'green'     as const, tags: ['Fast paced','2 choices'] },
  { id: 'speed-round',  title: 'Speed Round',       desc: 'Answer as many questions as you can in 60 seconds.',            icon: Flame,       gradient: 'from-red-500 to-orange-600',       badge: '60 sec',   badgeVariant: 'orange'    as const, tags: ['60 Seconds','High Score'] },
  { id: 'verse-fill',   title: 'Verse Fill-In',     desc: 'Complete the missing word in famous Bible passages.',            icon: BookMarked,  gradient: 'from-pink-500 to-rose-500',        badge: 'Memory',   badgeVariant: 'secondary' as const, tags: ['Fill blanks','Key verses'] },
  { id: 'number-match', title: 'Bible Numbers',     desc: 'Match events, chapters, and counts to the correct number.',     icon: Hash,        gradient: 'from-violet-500 to-purple-600',    badge: 'Numbers',  badgeVariant: 'purple'    as const, tags: ['Trivia','Matching'] },
  { id: 'crossword',    title: 'Bible Crossword',   desc: 'Spell Bible names and places from clues — letter by letter.',  icon: Puzzle,      gradient: 'from-amber-500 to-orange-500',     badge: 'Puzzle',   badgeVariant: 'orange'    as const, tags: ['Themed','Puzzle'] },
  { id: 'quote-match',  title: 'Quote Match',       desc: 'Match famous Bible quotes to their speaker across scripture.',  icon: MessageSquare, gradient: 'from-sky-500 to-blue-600',      badge: 'Matching', badgeVariant: 'blue'      as const, tags: ['Quotes','Attribution'] },
];

const SUPPORTED = new Set(['daily','qa','flash','scramble','true-false','speed-round','verse-fill','number-match','crossword','quote-match']);

/* ─────────────────────────────────────────────────────────────────────────
   Hub grid
───────────────────────────────────────────────────────────────────────── */
export function SoloHub() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const activeMode = searchParams.get('mode');

  if (activeMode) {
    return <SoloGameView mode={activeMode} onBack={() => setLocation('/solo')} />;
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl md:text-5xl font-heading font-extrabold mb-2">Solo Play</h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
          Sharpen your scripture knowledge at your own pace. Ten modes to explore.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {MODES.map((mode, i) => {
          const supported = SUPPORTED.has(mode.id);
          return (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => setLocation(`/solo?mode=${mode.id}`)}
              className="solo-card group cursor-pointer"
            >
              <Card className="h-full relative overflow-hidden border-border/50 bg-card hover:border-border transition-all duration-200 rounded-3xl hover:shadow-md">
                <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${mode.gradient} rounded-full blur-[80px] opacity-0 group-hover:opacity-20 dark:group-hover:opacity-15 transition duration-500 -translate-y-1/2 translate-x-1/3 pointer-events-none`} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mode.gradient} p-0.5 shadow-md`}>
                      <div className="w-full h-full bg-card rounded-[13px] flex items-center justify-center">
                        <mode.icon className="w-6 h-6 text-foreground" />
                      </div>
                    </div>
                    <Badge variant={mode.badgeVariant}>{mode.badge}</Badge>
                  </div>
                  <h3 className="solo-card-hover-title text-xl font-heading font-bold mb-1.5 text-foreground">{mode.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{mode.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mode.tags.map(tag => (
                      <span key={tag} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">{tag}</span>
                    ))}
                    {!supported && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">Coming soon</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Game view router
───────────────────────────────────────────────────────────────────────── */
function SoloGameView({ mode, onBack }: { mode: string; onBack: () => void }) {
  const modeData = MODES.find(m => m.id === mode);

  if (!SUPPORTED.has(mode)) {
    return (
      <div className="p-6 max-w-3xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center relative">
        <Button variant="ghost" onClick={onBack} className="absolute top-4 left-4 gap-2 text-muted-foreground">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${modeData?.gradient} p-1 mb-7 shadow-xl`}>
          <div className="w-full h-full bg-card rounded-[22px] flex items-center justify-center">
            {modeData?.icon && <modeData.icon className="w-10 h-10 text-foreground" />}
          </div>
        </div>
        <h1 className="text-4xl font-heading font-extrabold mb-3">{modeData?.title}</h1>
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary text-muted-foreground font-semibold text-sm mb-3">
          <Star className="w-4 h-4" /> Coming soon
        </div>
        <Button variant="outline" size="sm" onClick={onBack} className="mt-2 rounded-full">Back to Hub</Button>
      </div>
    );
  }

  if (mode === 'flash')        return <FlashCardGame onBack={onBack} />;
  if (mode === 'scramble')     return <WordScrambleGame onBack={onBack} />;
  if (mode === 'true-false')   return <TrueFalseGame onBack={onBack} />;
  if (mode === 'speed-round')  return <SpeedRoundGame onBack={onBack} />;
  if (mode === 'verse-fill')   return <VerseFillGame onBack={onBack} />;
  if (mode === 'number-match') return <BibleNumbersGame onBack={onBack} />;
  if (mode === 'crossword')    return <CrosswordGame onBack={onBack} />;
  if (mode === 'quote-match')  return <QuoteMatchGame onBack={onBack} />;
  return <QuizGame mode={mode} onBack={onBack} />;
}

/* ─────────────────────────────────────────────────────────────────────────
   Shared helpers
───────────────────────────────────────────────────────────────────────── */
function BackBtn({ onBack, label = 'Quit' }: { onBack: () => void; label?: string }) {
  return (
    <Button variant="ghost" onClick={onBack} className="gap-1.5 -ml-3 text-muted-foreground">
      <ChevronLeft className="w-4 h-4" /> {label}
    </Button>
  );
}

function PreGameScreen({
  modeData, onStart, cta = 'Start Game',
}: { modeData: typeof MODES[0]; onStart: () => void; cta?: string }) {
  return (
    <div className="p-6 max-w-3xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
      <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${modeData.gradient} p-1 mb-7 shadow-xl`}>
        <div className="w-full h-full bg-card rounded-[22px] flex items-center justify-center">
          <modeData.icon className="w-10 h-10 text-foreground" />
        </div>
      </div>
      <h1 className="text-4xl md:text-5xl font-heading font-extrabold mb-3">{modeData.title}</h1>
      <p className="text-lg text-muted-foreground max-w-lg mb-10">{modeData.desc}</p>
      <Button size="lg" className={`h-14 px-10 text-lg rounded-full bg-gradient-to-r ${modeData.gradient} text-white shadow-lg`} onClick={onStart}>
        {cta}
      </Button>
    </div>
  );
}

async function awardAndToast(progress: ReturnType<typeof recordGamePlayed>) {
  const newIds = await checkAndAward(progress);
  for (const id of newIds) {
    const def = ACHIEVEMENT_DEFS.find(a => a.id === id);
    if (def) toast.success(`🏆 Achievement unlocked: ${def.title}!`, { description: def.desc, duration: 5000 });
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Quiz Game (daily + qa)
───────────────────────────────────────────────────────────────────────── */
function QuizGame({ mode, onBack }: { mode: string; onBack: () => void }) {
  const modeData = MODES.find(m => m.id === mode)!;
  const [isPlaying, setIsPlaying] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('medium');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  const { data: dailyQuestions, isLoading: dailyLoading } = useGetDailyChallenge({
    query: { enabled: mode === 'daily' && isPlaying, queryKey: getGetDailyChallengeQueryKey() },
  });
  const { data: qaData, isLoading: qaLoading } = useListQuestions({ limit: 50, difficulty } as any, {
    query: { enabled: mode === 'qa' && isPlaying, queryKey: getListQuestionsQueryKey({ limit: 50, difficulty } as any) },
  });

  const allQuestions = mode === 'daily' ? dailyQuestions : mode === 'qa' ? qaData?.questions : [];
  const isLoading = mode === 'daily' ? dailyLoading : mode === 'qa' ? qaLoading : false;

  // Stable one-time question selection — NOT during render to avoid mutation on every re-render
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
  useEffect(() => {
    if (!isPlaying || selectedQuestions.length > 0 || !allQuestions || allQuestions.length === 0) return;
    setSelectedQuestions(pickUnseen(allQuestions as any[], mode, mode === 'daily' ? 5 : 10));
  }, [isPlaying, allQuestions, selectedQuestions.length, mode]);
  const questions = selectedQuestions;

  const handleAnswer = (answer: string) => {
    if (!questions || isFinished) return;
    const q = questions[currentQIndex];
    setAnswers(prev => ({ ...prev, [q.id]: answer }));
    if (answer === q.correctAnswer) setScore(s => s + 1);
    setTimeout(() => {
      if (currentQIndex < questions.length - 1) setCurrentQIndex(i => i + 1);
      else setIsFinished(true);
    }, 1400);
  };

  const handleFinished = useCallback(async () => {
    const total = questions?.length || 1;
    const perfect = score === total && total >= 10;
    const p = recordGamePlayed({ mode, correct: score, total, difficulty, perfect });
    await awardAndToast(p);
  }, [score, questions, mode, difficulty]);

  useEffect(() => {
    if (isFinished) handleFinished();
  }, [isFinished, handleFinished]);

  if (!isPlaying) {
    if (mode === 'qa') {
      return (
        <div className="p-6 max-w-3xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
          <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${modeData.gradient} p-1 mb-7 shadow-xl`}>
            <div className="w-full h-full bg-card rounded-[22px] flex items-center justify-center">
              <modeData.icon className="w-10 h-10 text-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-heading font-extrabold mb-3">{modeData.title}</h1>
          <p className="text-lg text-muted-foreground max-w-lg mb-6">{modeData.desc}</p>
          <div className="flex gap-2 mb-8 flex-wrap justify-center">
            {(['easy','medium','hard'] as const).map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border-2 capitalize ${difficulty === d ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground'}`}>
                {d}
              </button>
            ))}
          </div>
          <Button size="lg" className={`h-14 px-10 text-lg rounded-full bg-gradient-to-r ${modeData.gradient} text-white shadow-lg`} onClick={() => setIsPlaying(true)}>
            Start ({difficulty})
          </Button>
        </div>
      );
    }
    return <PreGameScreen modeData={modeData} onStart={() => setIsPlaying(true)} />;
  }

  if (isLoading) return <div className="p-10 text-center text-xl font-bold animate-pulse text-muted-foreground">Loading questions…</div>;

  if (isFinished) {
    const total = questions?.length || 1;
    const pct = Math.round((score / total) * 100);
    return (
      <div className="p-6 max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-5xl font-heading font-extrabold mb-4">Well done!</h2>
        <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-brand-purple to-brand-blue mb-2">
          {score}<span className="text-4xl text-muted-foreground">/{total}</span>
        </div>
        <p className="text-lg text-muted-foreground mb-8">{pct}% accuracy</p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Button variant="outline" size="lg" onClick={onBack} className="rounded-full px-8">Hub</Button>
          <Button variant="purple" size="lg" onClick={() => { setIsFinished(false); setCurrentQIndex(0); setScore(0); setAnswers({}); setSelectedQuestions([]); setIsPlaying(false); }} className="rounded-full px-8">Play Again</Button>
        </div>
      </div>
    );
  }

  const currentQ = questions?.[currentQIndex];
  const hasAnswered = currentQ && answers[currentQ.id] !== undefined;

  return (
    <div className="p-5 md:p-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <BackBtn onBack={onBack} />
        <span className="font-heading font-bold text-sm text-muted-foreground">{currentQIndex + 1} / {questions?.length}</span>
        <span className="font-heading font-bold text-sm text-brand-purple">Score: {score}</span>
      </div>
      <Progress value={(currentQIndex / (questions?.length || 1)) * 100} className="mb-10 h-2" indicatorColor={`bg-gradient-to-r ${modeData.gradient}`} />
      {currentQ && (
        <AnimatePresence mode="wait">
          <motion.div key={currentQ.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-6">
            <h2 className="text-2xl md:text-4xl font-heading font-bold leading-tight text-center pb-4">{currentQ.text}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentQ.options.map((opt: string, i: number) => {
                const isSelected = answers[currentQ.id] === opt;
                const isCorrectOption = opt === currentQ.correctAnswer;
                let cls = 'bg-card border-border hover:bg-secondary hover:border-border text-foreground';
                if (hasAnswered) {
                  if (isCorrectOption) cls = 'bg-brand-green/15 border-brand-green text-brand-green';
                  else if (isSelected) cls = 'bg-brand-orange/15 border-brand-orange text-brand-orange';
                  else cls = 'opacity-40 bg-card border-border text-muted-foreground';
                }
                return (
                  <button key={i} disabled={!!hasAnswered} onClick={() => handleAnswer(opt)}
                    className={`relative w-full p-5 text-left rounded-2xl border-2 transition-all duration-200 ${cls}`}>
                    <span className="text-base font-medium pr-8 block">{opt}</span>
                    {hasAnswered && isCorrectOption && <CheckCircle2 className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-green w-5 h-5" />}
                    {hasAnswered && isSelected && !isCorrectOption && <XCircle className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-orange w-5 h-5" />}
                  </button>
                );
              })}
            </div>
            {hasAnswered && currentQ.explanation && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-5 bg-primary/10 rounded-2xl border border-primary/20">
                <h4 className="font-heading font-bold text-primary mb-1.5 text-sm uppercase tracking-wide">Explanation</h4>
                <p className="text-foreground text-sm leading-relaxed">{currentQ.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Flash Cards
───────────────────────────────────────────────────────────────────────── */
function FlashCardGame({ onBack }: { onBack: () => void }) {
  const modeData = MODES.find(m => m.id === 'flash')!;
  const [isPlaying, setIsPlaying] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const { data: qaData, isLoading } = useListQuestions({ limit: 60 } as any, {
    query: { enabled: isPlaying, queryKey: getListQuestionsQueryKey({ limit: 60 } as any) },
  });

  useEffect(() => {
    if (qaData?.questions && isPlaying && cards.length === 0) {
      setCards(pickUnseen(qaData.questions as any[], 'flash', 15));
    }
  }, [qaData, isPlaying, cards.length]);

  const handleKnown = () => {
    setKnown(k => k + 1);
    advance();
  };
  const handleReview = () => advance();
  const advance = () => {
    if (idx < cards.length - 1) { setIdx(i => i + 1); setFlipped(false); }
    else setIsFinished(true);
  };

  useEffect(() => {
    if (isFinished) {
      const p = recordFlashCard(known);
      awardAndToast(p);
    }
  }, [isFinished, known]);

  if (!isPlaying) return <PreGameScreen modeData={modeData} onStart={() => setIsPlaying(true)} cta="Start Flipping" />;
  if (isLoading || cards.length === 0) return <div className="p-10 text-center text-xl font-bold animate-pulse text-muted-foreground">Loading cards…</div>;

  if (isFinished) {
    return (
      <div className="p-6 max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
        <Brain className="w-16 h-16 text-brand-blue mb-4" />
        <h2 className="text-5xl font-heading font-extrabold mb-4">Session done!</h2>
        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-brand-blue to-cyan-500 mb-2">
          {known}<span className="text-3xl text-muted-foreground">/{cards.length}</span>
        </div>
        <p className="text-muted-foreground mb-8">cards marked "Got it!"</p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Button variant="outline" size="lg" onClick={onBack} className="rounded-full px-8">Hub</Button>
          <Button variant="purple" size="lg" onClick={() => { setIdx(0); setFlipped(false); setKnown(0); setIsFinished(false); setCards([]); setIsPlaying(false); }} className="rounded-full px-8">Another Round</Button>
        </div>
      </div>
    );
  }

  const card = cards[idx];
  return (
    <div className="p-5 md:p-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <BackBtn onBack={onBack} />
        <span className="font-heading font-bold text-sm text-muted-foreground">{idx + 1} / {cards.length}</span>
        <span className="font-heading font-bold text-sm text-brand-blue">Known: {known}</span>
      </div>
      <Progress value={(idx / cards.length) * 100} className="mb-8 h-2" indicatorColor="bg-gradient-to-r from-brand-blue to-cyan-500" />

      {/* Flash card */}
      <div className="perspective-1000 mb-8 cursor-pointer" onClick={() => setFlipped(f => !f)}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative min-h-[220px] w-full"
        >
          {/* Front */}
          <div style={{ backfaceVisibility: 'hidden' }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-brand-blue/10 to-cyan-500/10 border-2 border-brand-blue/20">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-blue mb-4">Question</p>
            <p className="text-xl md:text-2xl font-heading font-bold text-center">{card.text}</p>
            <p className="text-xs text-muted-foreground mt-6">Tap to reveal answer</p>
          </div>
          {/* Back */}
          <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-brand-green/10 to-emerald-500/10 border-2 border-brand-green/20">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-green mb-4">Answer</p>
            <p className="text-xl md:text-2xl font-heading font-bold text-center text-brand-green">{card.correctAnswer}</p>
            {card.explanation && <p className="text-xs text-muted-foreground mt-4 text-center max-w-xs">{card.explanation}</p>}
          </div>
        </motion.div>
      </div>

      {flipped && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-center">
          <Button size="lg" variant="outline" onClick={handleReview} className="rounded-full px-8 border-brand-orange text-brand-orange hover:bg-brand-orange/10 gap-2">
            <RefreshCw className="w-4 h-4" /> Review again
          </Button>
          <Button size="lg" onClick={handleKnown} className="rounded-full px-8 bg-brand-green hover:bg-brand-green/90 text-white gap-2">
            <CheckCircle2 className="w-4 h-4" /> Got it!
          </Button>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Word Scramble
───────────────────────────────────────────────────────────────────────── */
function scrambleWord(w: string): string {
  let s: string;
  let tries = 0;
  do { s = w.split('').sort(() => Math.random() - 0.5).join(''); tries++; } while (s === w && tries < 10);
  return s;
}

function WordScrambleGame({ onBack }: { onBack: () => void }) {
  const modeData = MODES.find(m => m.id === 'scramble')!;
  const [isPlaying, setIsPlaying] = useState(false);
  const [words, setWords] = useState<typeof BIBLE_WORDS>([]);
  const [idx, setIdx] = useState(0);
  const [scrambled, setScrambled] = useState('');
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(45);
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startGame = () => {
    const picked = shuffle([...BIBLE_WORDS]).slice(0, 15);
    setWords(picked);
    setIsPlaying(true);
    setIdx(0);
    setScore(0);
    setTimeLeft(45);
    setScrambled(scrambleWord(picked[0].word));
    setInput('');
  };

  useEffect(() => {
    if (!isPlaying || isFinished) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); setIsFinished(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isPlaying, isFinished, idx]);

  const handleGuess = () => {
    if (!words[idx]) return;
    const correct = input.trim().toUpperCase() === words[idx].word;
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      setFeedback(null);
      setInput('');
      if (idx < words.length - 1) {
        const next = idx + 1;
        setIdx(next);
        setTimeLeft(45);
        setScrambled(scrambleWord(words[next].word));
      } else {
        setIsFinished(true);
      }
      inputRef.current?.focus();
    }, 800);
  };

  const handleSkip = () => {
    setFeedback(null);
    setInput('');
    if (idx < words.length - 1) {
      const next = idx + 1;
      setIdx(next);
      setTimeLeft(45);
      setScrambled(scrambleWord(words[next].word));
    } else {
      setIsFinished(true);
    }
  };

  useEffect(() => {
    if (isFinished) {
      const p = recordScramble(score);
      awardAndToast(p);
    }
  }, [isFinished, score]);

  if (!isPlaying) return <PreGameScreen modeData={modeData} onStart={startGame} cta="Start Scramble" />;

  if (isFinished) {
    return (
      <div className="p-6 max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
        <RotateCcw className="w-16 h-16 text-brand-green mb-4" />
        <h2 className="text-5xl font-heading font-extrabold mb-4">Scrambled!</h2>
        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-brand-green to-emerald-500 mb-2">
          {score}<span className="text-3xl text-muted-foreground">/{words.length}</span>
        </div>
        <p className="text-muted-foreground mb-8">words unscrambled correctly</p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Button variant="outline" size="lg" onClick={onBack} className="rounded-full px-8">Hub</Button>
          <Button variant="purple" size="lg" onClick={() => { setIsPlaying(false); setIsFinished(false); }} className="rounded-full px-8">Play Again</Button>
        </div>
      </div>
    );
  }

  const timerPct = (timeLeft / 45) * 100;
  const timerColor = timeLeft > 20 ? 'text-brand-green' : timeLeft > 10 ? 'text-brand-orange' : 'text-red-500';

  return (
    <div className="p-5 md:p-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <BackBtn onBack={onBack} />
        <div className={`flex items-center gap-1.5 font-heading font-black text-2xl ${timerColor}`}>
          <Timer className="w-5 h-5" />{timeLeft}s
        </div>
        <span className="font-heading font-bold text-sm text-brand-green">Score: {score}</span>
      </div>
      <Progress value={timerPct} className="mb-6 h-2" indicatorColor={timeLeft > 20 ? 'bg-brand-green' : timeLeft > 10 ? 'bg-brand-orange' : 'bg-red-500'} />

      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Word {idx + 1} of {words.length}</p>
        <p className="text-sm text-muted-foreground mb-6">{words[idx]?.hint}</p>
        <div className="flex justify-center gap-2 flex-wrap mb-6">
          {scrambled.split('').map((letter, i) => (
            <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary border-2 border-border flex items-center justify-center font-heading font-black text-xl">
              {letter}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          ref={inputRef} value={input} onChange={e => setInput(e.target.value.toUpperCase())}
          onKeyDown={e => { if (e.key === 'Enter') handleGuess(); }}
          placeholder="Type the unscrambled word…"
          className={`h-14 text-lg font-heading font-bold rounded-2xl border-2 text-center tracking-widest uppercase
            ${feedback === 'correct' ? 'border-brand-green bg-brand-green/10 text-brand-green'
              : feedback === 'wrong' ? 'border-brand-orange bg-brand-orange/10 text-brand-orange' : ''}`}
          maxLength={20} autoFocus autoComplete="off"
        />
        <Button onClick={handleGuess} size="lg" className="rounded-2xl px-6 bg-gradient-to-r from-brand-green to-emerald-500 text-white">
          Check
        </Button>
      </div>
      <div className="flex justify-center mt-4">
        <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground text-xs">Skip →</Button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   True or False
───────────────────────────────────────────────────────────────────────── */
function TrueFalseGame({ onBack }: { onBack: () => void }) {
  const modeData = MODES.find(m => m.id === 'true-false')!;
  const [isPlaying, setIsPlaying] = useState(false);
  const [questions, setQuestions] = useState<typeof TRUE_FALSE_QUESTIONS>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const startGame = () => {
    setQuestions(shuffle([...TRUE_FALSE_QUESTIONS]).slice(0, 20));
    setIsPlaying(true); setIdx(0); setScore(0); setFeedback(null); setIsFinished(false);
  };

  const handleAnswer = (answer: boolean) => {
    if (feedback !== null) return;
    const correct = answer === questions[idx].a;
    setFeedback(correct);
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      setFeedback(null);
      if (idx < questions.length - 1) setIdx(i => i + 1);
      else setIsFinished(true);
    }, 1200);
  };

  useEffect(() => {
    if (isFinished) {
      const p = recordTrueFalse(score, questions.length);
      awardAndToast(p);
    }
  }, [isFinished, score, questions.length]);

  if (!isPlaying) return <PreGameScreen modeData={modeData} onStart={startGame} cta="Start Round" />;

  if (isFinished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="p-6 max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
        <Shield className="w-16 h-16 text-teal-500 mb-4" />
        <h2 className="text-5xl font-heading font-extrabold mb-4">Round over!</h2>
        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-teal-500 to-green-500 mb-2">
          {score}<span className="text-3xl text-muted-foreground">/{questions.length}</span>
        </div>
        <p className="text-muted-foreground mb-8">{pct}% accuracy</p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Button variant="outline" size="lg" onClick={onBack} className="rounded-full px-8">Hub</Button>
          <Button variant="purple" size="lg" onClick={startGame} className="rounded-full px-8">Play Again</Button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  return (
    <div className="p-5 md:p-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <BackBtn onBack={onBack} />
        <span className="font-heading font-bold text-sm text-muted-foreground">{idx + 1} / {questions.length}</span>
        <span className="font-heading font-bold text-sm text-teal-500">Score: {score}</span>
      </div>
      <Progress value={(idx / questions.length) * 100} className="mb-10 h-2" indicatorColor="bg-gradient-to-r from-teal-500 to-green-500" />

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">True or False?</p>
            <p className="text-2xl md:text-3xl font-heading font-bold leading-snug">{q.s}</p>
          </div>

          {feedback !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`p-4 rounded-2xl text-center text-sm font-semibold ${feedback ? 'bg-brand-green/10 text-brand-green border border-brand-green/30' : 'bg-brand-orange/10 text-brand-orange border border-brand-orange/30'}`}>
              {feedback ? '✓ Correct!' : `✗ The answer was ${q.a ? 'TRUE' : 'FALSE'}`} — {q.e}
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button disabled={feedback !== null} onClick={() => handleAnswer(true)}
              className={`h-20 rounded-3xl border-2 text-xl font-heading font-black transition-all duration-200 flex items-center justify-center gap-2
                ${feedback === true && q.a ? 'bg-brand-green/15 border-brand-green text-brand-green' : feedback !== null ? 'opacity-40 border-border' : 'border-brand-green/40 text-brand-green hover:bg-brand-green/10 hover:border-brand-green'}`}>
              <CheckCircle2 className="w-6 h-6" /> TRUE
            </button>
            <button disabled={feedback !== null} onClick={() => handleAnswer(false)}
              className={`h-20 rounded-3xl border-2 text-xl font-heading font-black transition-all duration-200 flex items-center justify-center gap-2
                ${feedback === false && !q.a ? 'bg-brand-orange/15 border-brand-orange text-brand-orange' : feedback !== null ? 'opacity-40 border-border' : 'border-brand-orange/40 text-brand-orange hover:bg-brand-orange/10 hover:border-brand-orange'}`}>
              <XCircle className="w-6 h-6" /> FALSE
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Speed Round
───────────────────────────────────────────────────────────────────────── */
function SpeedRoundGame({ onBack }: { onBack: () => void }) {
  const modeData = MODES.find(m => m.id === 'speed-round')!;
  const [isPlaying, setIsPlaying] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [total, setTotal] = useState(0);

  const { data: qaData, isLoading } = useListQuestions({ limit: 60 } as any, {
    query: { enabled: isPlaying, queryKey: getListQuestionsQueryKey({ limit: 60 } as any) },
  });

  useEffect(() => {
    if (qaData?.questions && isPlaying && questions.length === 0) {
      setQuestions(shuffle([...qaData.questions as any[]]));
    }
  }, [qaData, isPlaying, questions.length]);

  useEffect(() => {
    if (!isPlaying || isFinished || questions.length === 0) return;
    const t = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { setIsFinished(true); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [isPlaying, isFinished, questions.length]);

  const handleAnswer = (opt: string) => {
    if (feedback !== null || isFinished) return;
    const q = questions[idx];
    const correct = opt === q.correctAnswer;
    setFeedback(correct ? 'correct' : 'wrong');
    setTotal(t => t + 1);
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      setFeedback(null);
      if (idx < questions.length - 1) setIdx(i => i + 1);
      else setIsFinished(true);
    }, 600);
  };

  useEffect(() => {
    if (isFinished) {
      const p = recordSpeedRound(score, total);
      awardAndToast(p);
    }
  }, [isFinished, score, total]);

  if (!isPlaying) return <PreGameScreen modeData={modeData} onStart={() => setIsPlaying(true)} cta="Start Timer!" />;
  if (isLoading || questions.length === 0) return <div className="p-10 text-center text-xl font-bold animate-pulse text-muted-foreground">Loading questions…</div>;

  if (isFinished) {
    const hi = parseInt(localStorage.getItem('zoiko_speed_hi') || '0');
    const newHi = Math.max(hi, score);
    localStorage.setItem('zoiko_speed_hi', String(newHi));
    return (
      <div className="p-6 max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
        <Flame className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-5xl font-heading font-extrabold mb-4">Time's up!</h2>
        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-orange-500 mb-2">{score}</div>
        <p className="text-muted-foreground mb-2">correct out of {total} answered</p>
        {score >= hi && score > 0 && <Badge variant="orange" className="mb-6">🔥 New high score!</Badge>}
        {hi > 0 && score < hi && <p className="text-xs text-muted-foreground mb-6">High score: {hi}</p>}
        <div className="flex gap-4 flex-wrap justify-center">
          <Button variant="outline" size="lg" onClick={onBack} className="rounded-full px-8">Hub</Button>
          <Button variant="purple" size="lg" onClick={() => { setIsPlaying(false); setIsFinished(false); setQuestions([]); setIdx(0); setScore(0); setTotal(0); setTimeLeft(60); }} className="rounded-full px-8">Play Again</Button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const timerColor = timeLeft > 30 ? 'text-brand-green' : timeLeft > 15 ? 'text-brand-orange' : 'text-red-500';
  return (
    <div className="p-5 md:p-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <BackBtn onBack={onBack} />
        <div className={`flex items-center gap-1.5 font-heading font-black text-3xl ${timerColor}`}>
          <Clock className="w-6 h-6" />{timeLeft}
        </div>
        <span className="font-heading font-bold text-sm text-red-500">✓ {score}</span>
      </div>
      <Progress value={(timeLeft / 60) * 100} className="mb-6 h-3" indicatorColor={timeLeft > 30 ? 'bg-brand-green' : timeLeft > 15 ? 'bg-brand-orange' : 'bg-red-500'} />
      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
          <h2 className="text-xl md:text-2xl font-heading font-bold text-center min-h-[80px] flex items-center justify-center">{q?.text}</h2>
          <div className="grid grid-cols-2 gap-2">
            {q?.options.map((opt: string, i: number) => (
              <button key={i} disabled={!!feedback} onClick={() => handleAnswer(opt)}
                className={`p-4 rounded-2xl border-2 text-sm font-semibold transition-all duration-150 text-left
                  ${feedback === 'correct' && opt === q.correctAnswer ? 'bg-brand-green/15 border-brand-green text-brand-green'
                    : feedback === 'wrong' && opt === q.correctAnswer ? 'bg-brand-green/10 border-brand-green/50'
                    : 'border-border bg-card hover:bg-secondary'}`}>
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Verse Fill-In
───────────────────────────────────────────────────────────────────────── */
function VerseFillGame({ onBack }: { onBack: () => void }) {
  const modeData = MODES.find(m => m.id === 'verse-fill')!;
  const [isPlaying, setIsPlaying] = useState(false);
  const [verses, setVerses] = useState<typeof FILL_IN_VERSES>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startGame = () => {
    setVerses(shuffle([...FILL_IN_VERSES]).slice(0, 10));
    setIsPlaying(true); setIdx(0); setScore(0); setInput(''); setFeedback(null); setIsFinished(false);
  };

  const handleCheck = () => {
    const v = verses[idx];
    const correct = input.trim().toLowerCase() === v.word.toLowerCase();
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      setFeedback(null); setInput('');
      if (idx < verses.length - 1) { setIdx(i => i + 1); inputRef.current?.focus(); }
      else setIsFinished(true);
    }, 1200);
  };

  useEffect(() => {
    if (isFinished) {
      const p = recordGamePlayed({ mode: 'verse-fill', correct: score, total: verses.length });
      awardAndToast(p);
    }
  }, [isFinished, score, verses.length]);

  if (!isPlaying) return <PreGameScreen modeData={modeData} onStart={startGame} cta="Start Filling" />;

  if (isFinished) {
    const pct = Math.round((score / verses.length) * 100);
    return (
      <div className="p-6 max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
        <BookMarked className="w-16 h-16 text-pink-500 mb-4" />
        <h2 className="text-5xl font-heading font-extrabold mb-4">Scripture filled!</h2>
        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-pink-500 to-rose-500 mb-2">
          {score}<span className="text-3xl text-muted-foreground">/{verses.length}</span>
        </div>
        <p className="text-muted-foreground mb-8">{pct}% correct</p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Button variant="outline" size="lg" onClick={onBack} className="rounded-full px-8">Hub</Button>
          <Button variant="purple" size="lg" onClick={startGame} className="rounded-full px-8">Play Again</Button>
        </div>
      </div>
    );
  }

  const v = verses[idx];
  return (
    <div className="p-5 md:p-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <BackBtn onBack={onBack} />
        <span className="font-heading font-bold text-sm text-muted-foreground">{idx + 1} / {verses.length}</span>
        <span className="font-heading font-bold text-sm text-pink-500">Score: {score}</span>
      </div>
      <Progress value={(idx / verses.length) * 100} className="mb-10 h-2" indicatorColor="bg-gradient-to-r from-pink-500 to-rose-500" />

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Complete the verse</p>
            <div className="p-6 rounded-3xl bg-secondary/40 border border-border/50">
              <p className="text-lg md:text-xl font-heading font-semibold leading-relaxed text-center">
                "{v.before}{' '}
                <span className={`inline-block min-w-[80px] border-b-2 border-dashed px-1 transition-colors ${
                  feedback === 'correct' ? 'border-brand-green text-brand-green' : feedback === 'wrong' ? 'border-brand-orange text-brand-orange' : 'border-muted-foreground text-muted-foreground'}`}>
                  {feedback ? v.word : input || '___'}
                </span>{' '}{v.after}"
              </p>
              <p className="text-xs text-muted-foreground mt-3">{v.reference}</p>
            </div>
          </div>

          {feedback && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`text-center font-semibold ${feedback === 'correct' ? 'text-brand-green' : 'text-brand-orange'}`}>
              {feedback === 'correct' ? '✓ Correct!' : `✗ The word was "${v.word}"`}
            </motion.p>
          )}

          <div className="flex gap-2">
            <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCheck(); }}
              placeholder="Type the missing word…"
              className="h-12 text-base rounded-2xl border-2 text-center"
              disabled={!!feedback} autoFocus autoComplete="off"
            />
            <Button onClick={handleCheck} disabled={!input.trim() || !!feedback} size="lg" className="rounded-2xl px-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
              Check
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Bible Numbers
───────────────────────────────────────────────────────────────────────── */
function BibleNumbersGame({ onBack }: { onBack: () => void }) {
  const modeData = MODES.find(m => m.id === 'number-match')!;
  const [isPlaying, setIsPlaying] = useState(false);
  const [questions, setQuestions] = useState<typeof NUMBER_QUESTIONS>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string|null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const startGame = () => {
    setQuestions(shuffle([...NUMBER_QUESTIONS]).slice(0, 15));
    setIsPlaying(true); setIdx(0); setScore(0); setSelected(null); setIsFinished(false);
  };

  const handlePick = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    if (opt === questions[idx].answer) setScore(s => s + 1);
    setTimeout(() => {
      setSelected(null);
      if (idx < questions.length - 1) setIdx(i => i + 1);
      else setIsFinished(true);
    }, 1300);
  };

  useEffect(() => {
    if (isFinished) {
      const p = recordGamePlayed({ mode: 'number-match', correct: score, total: questions.length });
      awardAndToast(p);
    }
  }, [isFinished, score, questions.length]);

  if (!isPlaying) return <PreGameScreen modeData={modeData} onStart={startGame} cta="Start Matching" />;

  if (isFinished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="p-6 max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
        <Hash className="w-16 h-16 text-violet-500 mb-4" />
        <h2 className="text-5xl font-heading font-extrabold mb-4">Numbers done!</h2>
        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-violet-500 to-purple-600 mb-2">
          {score}<span className="text-3xl text-muted-foreground">/{questions.length}</span>
        </div>
        <p className="text-muted-foreground mb-8">{pct}% correct</p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Button variant="outline" size="lg" onClick={onBack} className="rounded-full px-8">Hub</Button>
          <Button variant="purple" size="lg" onClick={startGame} className="rounded-full px-8">Play Again</Button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  return (
    <div className="p-5 md:p-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <BackBtn onBack={onBack} />
        <span className="font-heading font-bold text-sm text-muted-foreground">{idx + 1} / {questions.length}</span>
        <span className="font-heading font-bold text-sm text-violet-500">Score: {score}</span>
      </div>
      <Progress value={(idx / questions.length) * 100} className="mb-10 h-2" indicatorColor="bg-gradient-to-r from-violet-500 to-purple-600" />

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-center">{q.q}</h2>
          <p className="text-xs text-muted-foreground text-center">{q.reference}</p>
          <div className="grid grid-cols-2 gap-3">
            {q.options.map(opt => {
              const isCorrect = opt === q.answer;
              const isSelected = selected === opt;
              let cls = 'border-border bg-card hover:bg-secondary hover:border-border';
              if (selected) {
                if (isCorrect) cls = 'bg-brand-green/15 border-brand-green text-brand-green';
                else if (isSelected) cls = 'bg-brand-orange/15 border-brand-orange text-brand-orange';
                else cls = 'opacity-40';
              }
              return (
                <button key={opt} disabled={!!selected} onClick={() => handlePick(opt)}
                  className={`h-20 rounded-2xl border-2 text-3xl font-heading font-black transition-all duration-200 flex items-center justify-center ${cls}`}>
                  {opt}
                  {selected && isCorrect && <CheckCircle2 className="ml-2 w-5 h-5 text-brand-green" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Bible Crossword  (letter-by-letter word recall)
───────────────────────────────────────────────────────────────────────── */
function CrosswordGame({ onBack }: { onBack: () => void }) {
  const modeData = MODES.find(m => m.id === 'crossword')!;
  const [isPlaying, setIsPlaying] = useState(false);
  const [words, setWords] = useState<typeof BIBLE_WORDS>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const solvedRef = useRef(0);

  const startGame = () => {
    solvedRef.current = 0;
    const picked = shuffle([...BIBLE_WORDS]).slice(0, 12);
    setWords(picked);
    setIsPlaying(true); setIdx(0); setScore(0); setInput('');
    setFeedback(null); setIsFinished(false);
  };

  const advance = (correct: boolean) => {
    setTimeout(() => {
      setFeedback(null); setInput('');
      setIdx(prev => {
        if (prev < words.length - 1) {
          setTimeout(() => inputRef.current?.focus(), 50);
          return prev + 1;
        }
        setIsFinished(true);
        return prev;
      });
    }, correct ? 900 : 1300);
  };

  const handleCheck = () => {
    if (feedback || !input.trim()) return;
    const w = words[idx];
    const correct = input.trim().toUpperCase() === w.word.toUpperCase();
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) { setScore(s => s + 1); solvedRef.current++; }
    advance(correct);
  };

  const handleSkip = () => {
    if (feedback) return;
    setFeedback('wrong');
    advance(false);
  };

  useEffect(() => {
    if (isFinished) {
      const p = recordCrossword(solvedRef.current);
      awardAndToast(p);
    }
  }, [isFinished]);

  if (!isPlaying) return <PreGameScreen modeData={modeData} onStart={startGame} cta="Start Crossword" />;

  if (isFinished) {
    const pct = Math.round((score / words.length) * 100);
    return (
      <div className="p-6 max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
        <Puzzle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-5xl font-heading font-extrabold mb-4">Crossword done!</h2>
        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-500 to-orange-500 mb-2">
          {score}<span className="text-3xl text-muted-foreground">/{words.length}</span>
        </div>
        <p className="text-muted-foreground mb-8">{pct}% of words spelled correctly</p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Button variant="outline" size="lg" onClick={onBack} className="rounded-full px-8">Hub</Button>
          <Button variant="purple" size="lg" onClick={startGame} className="rounded-full px-8">Play Again</Button>
        </div>
      </div>
    );
  }

  const w = words[idx];
  return (
    <div className="p-5 md:p-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <BackBtn onBack={onBack} />
        <span className="font-heading font-bold text-sm text-muted-foreground">{idx + 1} / {words.length}</span>
        <span className="font-heading font-bold text-sm text-amber-500">Score: {score}</span>
      </div>
      <Progress value={(idx / words.length) * 100} className="mb-10 h-2" indicatorColor="bg-gradient-to-r from-amber-500 to-orange-500" />

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Crossword Clue</p>
            <div className="p-6 rounded-3xl bg-secondary/40 border border-border/50">
              <p className="text-xl md:text-2xl font-heading font-semibold">{w.hint}</p>
              <p className="text-xs text-muted-foreground mt-2">{w.word.length} letters</p>
            </div>
          </div>

          <div className="flex justify-center gap-1.5 flex-wrap">
            {w.word.split('').map((letter, i) => {
              const typedChar = input[i] ?? '';
              const isCorrectChar = typedChar.toUpperCase() === letter.toUpperCase();
              return (
                <div key={i}
                  className={`w-10 h-12 md:w-12 md:h-14 rounded-xl border-2 flex items-center justify-center font-heading font-black text-lg transition-colors
                    ${feedback === 'correct'
                      ? 'border-brand-green bg-brand-green/10 text-brand-green'
                      : feedback === 'wrong'
                        ? (isCorrectChar
                          ? 'border-brand-green bg-brand-green/10 text-brand-green'
                          : 'border-brand-orange bg-brand-orange/10 text-brand-orange')
                        : typedChar
                          ? 'border-border bg-secondary text-foreground'
                          : 'border-border/40 bg-card text-muted-foreground/20'}`}>
                  {feedback ? letter : typedChar || ''}
                </div>
              );
            })}
          </div>

          {feedback && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`text-center font-semibold ${feedback === 'correct' ? 'text-brand-green' : 'text-brand-orange'}`}>
              {feedback === 'correct' ? '✓ Correct!' : `✗ The answer was "${w.word}"`}
            </motion.p>
          )}

          <div className="flex gap-2">
            <Input
              ref={inputRef} value={input}
              onChange={e => setInput(e.target.value.toUpperCase().slice(0, w.word.length + 2))}
              onKeyDown={e => { if (e.key === 'Enter') handleCheck(); }}
              placeholder="Spell the answer…"
              className={`h-14 text-lg font-heading font-bold rounded-2xl border-2 text-center tracking-widest uppercase
                ${feedback === 'correct' ? 'border-brand-green bg-brand-green/10'
                  : feedback === 'wrong' ? 'border-brand-orange bg-brand-orange/10' : ''}`}
              maxLength={w.word.length + 2} autoFocus autoComplete="off" disabled={!!feedback}
            />
            <Button onClick={handleCheck} disabled={!input.trim() || !!feedback} size="lg"
              className="rounded-2xl px-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white shrink-0">
              Check
            </Button>
          </div>
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={handleSkip} disabled={!!feedback}
              className="text-muted-foreground text-xs">Skip →</Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Quote Match
───────────────────────────────────────────────────────────────────────── */
function QuoteMatchGame({ onBack }: { onBack: () => void }) {
  const modeData = MODES.find(m => m.id === 'quote-match')!;
  const [isPlaying, setIsPlaying] = useState(false);
  const [questions, setQuestions] = useState<typeof QUOTES>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);

  const startGame = () => {
    setQuestions(shuffle([...QUOTES]).slice(0, 10));
    setIsPlaying(true); setIdx(0); setScore(0);
    setSelected(null); setIsFinished(false); setTimeLeft(20);
  };

  useEffect(() => {
    if (!isPlaying || isFinished || selected !== null) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          setSelected('__timeout__');
          setTimeout(() => {
            setSelected(null);
            setTimeLeft(20);
            setIdx(i => {
              if (i < questions.length - 1) return i + 1;
              setIsFinished(true);
              return i;
            });
          }, 1200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isPlaying, isFinished, selected, idx, questions.length]);

  const handlePick = (opt: string) => {
    if (selected !== null) return;
    setSelected(opt);
    const correct = opt === questions[idx].answer;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      setSelected(null);
      setTimeLeft(20);
      if (idx < questions.length - 1) setIdx(i => i + 1);
      else setIsFinished(true);
    }, 1300);
  };

  useEffect(() => {
    if (isFinished) {
      const p = recordQuoteMatch(score, questions.length);
      awardAndToast(p);
    }
  }, [isFinished, score, questions.length]);

  if (!isPlaying) return <PreGameScreen modeData={modeData} onStart={startGame} cta="Start Matching" />;

  if (isFinished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="p-6 max-w-2xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
        <MessageSquare className="w-16 h-16 text-sky-500 mb-4" />
        <h2 className="text-5xl font-heading font-extrabold mb-4">Match complete!</h2>
        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-sky-500 to-blue-600 mb-2">
          {score}<span className="text-3xl text-muted-foreground">/{questions.length}</span>
        </div>
        <p className="text-muted-foreground mb-8">{pct}% correct</p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Button variant="outline" size="lg" onClick={onBack} className="rounded-full px-8">Hub</Button>
          <Button variant="purple" size="lg" onClick={startGame} className="rounded-full px-8">Play Again</Button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const timerColor = timeLeft > 12 ? 'text-brand-green' : timeLeft > 6 ? 'text-brand-orange' : 'text-red-500';

  return (
    <div className="p-5 md:p-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <BackBtn onBack={onBack} />
        <div className={`flex items-center gap-1.5 font-heading font-black text-2xl ${timerColor}`}>
          <Clock className="w-5 h-5" />{timeLeft}s
        </div>
        <span className="font-heading font-bold text-sm text-sky-500">Score: {score}</span>
      </div>
      <Progress value={(idx / questions.length) * 100} className="mb-8 h-2" indicatorColor="bg-gradient-to-r from-sky-500 to-blue-600" />

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">{q.question}</p>
            <div className="p-6 rounded-3xl bg-secondary/40 border border-border/50">
              <p className="text-lg md:text-xl font-heading font-semibold italic leading-relaxed">{q.quote}</p>
              <p className="text-xs text-muted-foreground mt-3">{q.reference}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map(opt => {
              const isCorrect = opt === q.answer;
              const isSelected = selected === opt;
              const timedOut = selected === '__timeout__';
              let cls = 'border-border bg-card hover:bg-secondary hover:border-border text-foreground';
              if (selected) {
                if (isCorrect)                   cls = 'bg-brand-green/15 border-brand-green text-brand-green';
                else if (isSelected || timedOut) cls = 'bg-brand-orange/15 border-brand-orange text-brand-orange opacity-60';
                else                             cls = 'opacity-30 border-border';
              }
              return (
                <button key={opt} disabled={selected !== null} onClick={() => handlePick(opt)}
                  className={`py-4 px-5 rounded-2xl border-2 text-sm font-semibold transition-all duration-200 text-left leading-snug ${cls}`}>
                  {opt}
                  {selected && isCorrect && <span className="ml-2">✓</span>}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
