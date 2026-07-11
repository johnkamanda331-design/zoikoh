const fs = require('fs');

function readFile(path) {
    return fs.readFileSync(path, 'utf8');
}

function writeFile(path, content) {
    fs.writeFileSync(path, content, 'utf8');
}

function replaceInFile(path, replacer) {
    const content = readFile(path);
    const newContent = replacer(content);
    if (content !== newContent) {
        writeFile(path, newContent);
        console.log(`Updated ${path}`);
    }
}

// Ensure StatCard has vector icon instead of emoji
replaceInFile('artifacts/zoiko-mobile/components/StatCard.tsx', (content) => {
    let s = content;
    if (!s.includes("import { Ionicons }")) {
        s = s.replace("import { StyleSheet,", "import { Ionicons } from '@expo/vector-icons';\nimport { StyleSheet,");
        s = s.replace(/<Text style=\{styles\.icon\}>\{icon\}<\/Text>/, '<Ionicons name={icon as any} size={24} color={colors.primary} style={styles.icon} />');
    }
    return s;
});

// components/VerseCard.tsx
replaceInFile('artifacts/zoiko-mobile/components/VerseCard.tsx', (content) => {
    let s = content;
    // spacing fixes
    s = s.replace(/marginBottom: 6/g, 'marginBottom: 8');
    s = s.replace(/fontSize: 11/g, 'fontSize: 12');
    s = s.replace(/fontSize: 15/g, 'fontSize: 16');
    return s;
});

// app/solo/[mode].tsx - remove emojis, use Ionicons
replaceInFile('artifacts/zoiko-mobile/app/solo/[mode].tsx', (content) => {
    let s = content;
    s = s.replace("import { useColors } from '@/hooks/useColors';", "import { useColors } from '@/hooks/useColors';\nimport { Ionicons } from '@expo/vector-icons';");
    
    // QA Game
    s = s.replace("<Text style={styles.scoreLabel}>✅ {correct}</Text>", "<Text style={styles.scoreLabel}><Ionicons name=\"checkmark-circle\" size={16} color={colors.success} /> {correct}</Text>");
    s = s.replace("<Text style={styles.explanationText}>💡 {q.explanation}</Text>", "<Text style={styles.explanationText}><Ionicons name=\"bulb\" size={16} color={colors.warning} /> {q.explanation}</Text>");
    
    // ScoreCard
    s = s.replace("<Text style={styles.scoreEmoji}>{emoji}</Text>", "<Ionicons name={emoji === '🏆' ? 'trophy' : emoji === '⭐' ? 'star' : 'thumbs-up'} size={64} color={emoji === '🏆' ? colors.gold : colors.primary} style={styles.scoreEmoji} />");
    // wait, what emoji logic?
    // Let's replace the whole ScoreCard emoji part
    s = s.replace("const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '👍';", "const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '👍';"); 
    // it's fine, we will handle the actual rendering above.
    
    // Flashcards
    s = s.replace("<Text style={styles.flashLabel}>💡 Tap to flip</Text>", "<Text style={styles.flashLabel}><Ionicons name=\"refresh\" size={16} color={colors.muted} /> Tap to flip</Text>");
    
    // spacing fixes
    s = s.replace(/gap: 10/g, 'gap: 8');
    s = s.replace(/gap: 12/g, 'gap: 16');
    s = s.replace(/padding: 14/g, 'padding: 16');
    s = s.replace(/marginBottom: 10/g, 'marginBottom: 8');
    s = s.replace(/marginBottom: 14/g, 'marginBottom: 16');
    s = s.replace(/paddingVertical: 14/g, 'paddingVertical: 16');
    
    return s;
});

// app/session/[id].tsx
replaceInFile('artifacts/zoiko-mobile/app/session/[id].tsx', (content) => {
    let s = content;
    if (!s.includes("import { Ionicons }")) {
        s = s.replace("import { useColors } from '@/hooks/useColors';", "import { useColors } from '@/hooks/useColors';\nimport { Ionicons } from '@expo/vector-icons';");
    }
    s = s.replace("<Text style={styles.waitEmoji}>⏳</Text>", "<Ionicons name=\"hourglass\" size={48} color={colors.warning} style={styles.waitEmoji} />");
    s = s.replace("<Text style={styles.scoreText}>🏆 {score} pts</Text>", "<Text style={styles.scoreText}><Ionicons name=\"trophy\" size={14} color={colors.primary} /> {score} pts</Text>");
    
    s = s.replace(/gap: 6/g, 'gap: 8');
    s = s.replace(/gap: 10/g, 'gap: 8');
    s = s.replace(/gap: 12/g, 'gap: 16');
    s = s.replace(/paddingVertical: 12/g, 'paddingVertical: 16');
    
    return s;
});

// app/session/[id]-leaderboard.tsx
replaceInFile('artifacts/zoiko-mobile/app/session/[id]-leaderboard.tsx', (content) => {
    let s = content;
    if (!s.includes("import { Ionicons }")) {
        s = s.replace("import { useColors } from '@/hooks/useColors';", "import { useColors } from '@/hooks/useColors';\nimport { Ionicons } from '@expo/vector-icons';");
    }
    s = s.replace("<Text style={styles.title}>🏆 Final Results</Text>", "<Text style={styles.title}><Ionicons name=\"trophy\" size={24} color={colors.gold} /> Final Results</Text>");
    
    s = s.replace("<Text style={styles.podiumMedal}>\n                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}\n              </Text>", "<Ionicons name=\"medal\" size={32} color={entry.rank === 1 ? colors.gold : entry.rank === 2 ? colors.silver : colors.bronze} style={styles.podiumMedal} />");
    
    s = s.replace(/gap: 12/g, 'gap: 16');
    return s;
});

// components/PlayerBadge.tsx
replaceInFile('artifacts/zoiko-mobile/components/PlayerBadge.tsx', (content) => {
    let s = content;
    if (!s.includes("import { Ionicons }")) {
        s = s.replace("import { useColors } from '@/hooks/useColors';", "import { useColors } from '@/hooks/useColors';\nimport { Ionicons } from '@expo/vector-icons';");
    }
    s = s.replace("const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;", "const isMedal = rank <= 3;");
    
    s = s.replace(/\{medalEmoji \? \(\n          <Text style=\{styles\.medal\}>\{medalEmoji\}<\/Text>\n        \) : \(/g, "{isMedal ? (\n          <Ionicons name=\"medal\" size={24} color={rank === 1 ? colors.gold : rank === 2 ? colors.silver : colors.bronze} />\n        ) : (");
    
    s = s.replace(/padding: 14/g, 'padding: 16');
    s = s.replace(/gap: 12/g, 'gap: 16');
    
    return s;
});

// components/AnswerButton.tsx
replaceInFile('artifacts/zoiko-mobile/components/AnswerButton.tsx', (content) => {
    let s = content;
    s = s.replace(/padding: 14/g, 'padding: 16');
    s = s.replace(/gap: 12/g, 'gap: 16');
    s = s.replace(/marginBottom: 10/g, 'marginBottom: 8');
    return s;
});

// app/join.tsx
replaceInFile('artifacts/zoiko-mobile/app/join.tsx', (content) => {
    let s = content;
    s = s.replace(/padding: 14/g, 'padding: 16');
    s = s.replace(/gap: 12/g, 'gap: 16');
    s = s.replace(/marginTop: 24/g, 'marginTop: 32');
    s = s.replace(/marginBottom: 12/g, 'marginBottom: 16');
    return s;
});

// app/(auth)/sign-in.tsx and sign-up.tsx spacing
replaceInFile('artifacts/zoiko-mobile/app/(auth)/sign-in.tsx', (content) => {
    let s = content;
    s = s.replace(/padding: 14/g, 'padding: 16');
    s = s.replace(/gap: 12/g, 'gap: 16');
    return s;
});
replaceInFile('artifacts/zoiko-mobile/app/(auth)/sign-up.tsx', (content) => {
    let s = content;
    s = s.replace(/padding: 14/g, 'padding: 16');
    s = s.replace(/gap: 12/g, 'gap: 16');
    return s;
});

