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

// 1. app/(tabs)/index.tsx
replaceInFile('artifacts/zoiko-mobile/app/(tabs)/index.tsx', (content) => {
    let s = content;
    // Replace emojis with Ionicons
    s = s.replace("import { useRouter } from 'expo-router';", "import { useRouter } from 'expo-router';\nimport { Ionicons } from '@expo/vector-icons';");
    s = s.replace("<Text style={styles.greeting}>👋 {playerName}</Text>", "<Text style={styles.greeting}><Ionicons name=\"hand-right\" size={16} color={colors.primary} /> {playerName}</Text>");
    s = s.replace("<Text style={styles.statText}>🔥 {player.streakCurrent} day streak</Text>", "<Text style={styles.statText}><Ionicons name=\"flame\" size={16} color={colors.gold} /> {player.streakCurrent} day streak</Text>");
    s = s.replace("<Text style={styles.statText}>✅ {player.correctAnswers} correct</Text>", "<Text style={styles.statText}><Ionicons name=\"checkmark-circle\" size={16} color={colors.success} /> {player.correctAnswers} correct</Text>");
    
    s = s.replace("<Text style={styles.challengeEmoji}>📖</Text>", "<Ionicons name=\"book\" size={28} color={colors.primary} />");
    s = s.replace("<Text style={styles.arrow}>›</Text>", "<Ionicons name=\"chevron-forward\" size={24} color={colors.primary} />");
    
    s = s.replace("<Text style={styles.joinEmoji}>👥</Text>", "<Ionicons name=\"people\" size={28} color=\"#7ab3ef\" />");
    s = s.replace("<Text style={styles.arrowBlue}>›</Text>", "<Ionicons name=\"chevron-forward\" size={24} color=\"#7ab3ef\" />");
    
    s = s.replace("<Text style={styles.quickPlayText}>⚡ Quick Play</Text>", "<Text style={styles.quickPlayText}><Ionicons name=\"flash\" size={20} color={colors.primaryForeground} /> Quick Play</Text>");
    
    // spacing fixes
    s = s.replace(/paddingBottom: insets\.bottom \+ 100/g, 'paddingBottom: insets.bottom + 96');
    s = s.replace(/marginBottom: 10/g, 'marginBottom: 8');
    s = s.replace(/marginBottom: 12/g, 'marginBottom: 16'); // 12 -> 16 or 8
    s = s.replace(/gap: 12/g, 'gap: 16');
    s = s.replace(/fontSize: 13/g, 'fontSize: 14');
    
    return s;
});

// 2. app/(tabs)/play.tsx
replaceInFile('artifacts/zoiko-mobile/app/(tabs)/play.tsx', (content) => {
    let s = content;
    // Spacing fixes
    s = s.replace(/paddingBottom: insets\.bottom \+ 100/g, 'paddingBottom: insets.bottom + 96');
    s = s.replace(/marginBottom: 20/g, 'marginBottom: 24');
    s = s.replace(/gap: 10/g, 'gap: 8');
    s = s.replace(/fontSize: 15/g, 'fontSize: 16');
    s = s.replace(/padding: 14/g, 'padding: 16');
    
    // Replace arrow
    s = s.replace("<Text style={styles.pinButtonText}>Enter PIN →</Text>", "<Text style={styles.pinButtonText}>Enter PIN <Ionicons name=\"arrow-forward\" size={16} color={colors.primaryForeground} /></Text>");
    return s;
});

// 3. app/(tabs)/bible.tsx
replaceInFile('artifacts/zoiko-mobile/app/(tabs)/bible.tsx', (content) => {
    let s = content;
    // Spacing fixes
    s = s.replace(/gap: 10/g, 'gap: 8');
    s = s.replace(/gap: 6/g, 'gap: 8');
    s = s.replace(/paddingVertical: 10/g, 'paddingVertical: 12');
    s = s.replace(/paddingVertical: 14/g, 'paddingVertical: 16');
    s = s.replace(/marginBottom: 14/g, 'marginBottom: 16');
    
    // Replace missing emojis or arrows if any, wait none obvious, mostly UI layout.
    // Ensure insets are used well
    // Wait, the verses list shouldn't be clipped at bottom
    if (!s.includes('contentContainerStyle={[styles.verseList, { paddingBottom: insets.bottom + 96 }]}')) {
        s = s.replace('style={styles.verseList}', 'contentContainerStyle={[styles.verseList, { paddingBottom: insets.bottom + 96 }]}');
        s = s.replace('contentContainerStyle={styles.verseList}', 'contentContainerStyle={[styles.verseList, { paddingBottom: insets.bottom + 96 }]}');
    }
    return s;
});

// 4. app/(tabs)/achievements.tsx
replaceInFile('artifacts/zoiko-mobile/app/(tabs)/achievements.tsx', (content) => {
    let s = content;
    // Emojis to Ionicons
    s = s.replace("import { useListAchievements } from '@workspace/api-client-react';", "import { useListAchievements } from '@workspace/api-client-react';\nimport { Ionicons } from '@expo/vector-icons';");
    
    s = s.replace(/function achievementEmoji[\s\S]+?\}\n\n/, '');
    s = s.replace("<Text style={styles.cardEmoji}>{achievementEmoji(item.type)}</Text>", `
              <Ionicons 
                name={item.type.includes('streak') || item.type.includes('fire') ? 'flame' : item.type.includes('star') || item.type.includes('perfect') ? 'star' : 'trophy'} 
                size={32} 
                color={item.type.includes('streak') || item.type.includes('fire') ? colors.danger : item.type.includes('star') || item.type.includes('perfect') ? colors.gold : colors.primary} 
              />`);
    
    s = s.replace("<Text style={styles.emptyEmoji}>🏆</Text>", "<Ionicons name=\"trophy\" size={56} color={colors.muted} />");
    
    s = s.replace(/paddingBottom: insets\.bottom \+ 100/g, 'paddingBottom: insets.bottom + 96');
    s = s.replace(/gap: 12/g, 'gap: 16');
    s = s.replace(/gap: 6/g, 'gap: 8');
    s = s.replace(/marginBottom: 12/g, 'marginBottom: 16');
    s = s.replace(/fontSize: 11/g, 'fontSize: 12');
    
    return s;
});

// 5. app/(tabs)/profile.tsx
replaceInFile('artifacts/zoiko-mobile/app/(tabs)/profile.tsx', (content) => {
    let s = content;
    s = s.replace("import { StatCard } from '@/components/StatCard';", "import { StatCard } from '@/components/StatCard';\nimport { Ionicons } from '@expo/vector-icons';");
    
    s = s.replace(/icon="✅"/g, 'icon="checkmark-circle"');
    s = s.replace(/icon="❓"/g, 'icon="help-circle"');
    s = s.replace(/icon="🎯"/g, 'icon="locate"');
    s = s.replace(/icon="🎮"/g, 'icon="game-controller"');
    s = s.replace(/icon="🏆"/g, 'icon="trophy"');
    s = s.replace(/icon="🔥"/g, 'icon="flame"');
    s = s.replace(/icon="⭐"/g, 'icon="star"');
    
    s = s.replace(/paddingBottom: insets\.bottom \+ 100/g, 'paddingBottom: insets.bottom + 96');
    s = s.replace(/gap: 12/g, 'gap: 16');
    s = s.replace(/marginBottom: 12/g, 'marginBottom: 16');
    s = s.replace(/marginBottom: 28/g, 'marginBottom: 32');
    
    return s;
});

