
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Word {
    term: string;
    definition: string;
    part_of_speech?: string;
    etymology?: string;
    root_words?: string[];
}

interface Session {
    sessionNumber: number;
    title: string;
    words: Word[];
    exercises: any[];
}

interface Chapter {
    chapterNumber: number;
    title: string;
    sessions: Session[];
}

const TEXT_PATH = path.join(__dirname, '../content/wpmae/book_text.txt');
const OUT_PATH = path.join(__dirname, '../content/wpmae/remaining_chapters.json');

// Chapter Mapping from TOC
const CHAPTER_MAP = [
    { num: 7, title: "How to Talk About Liars and Lying", sessions: [14, 15, 16, 17] },
    { num: 9, title: "How to Talk About Actions", sessions: [19, 20, 21, 22, 23] },
    { num: 10, title: "How to Talk About Various Speech Habits", sessions: [24, 25, 26, 27] },
    { num: 11, title: "How to Insult Your Enemies", sessions: [28, 29, 30, 31] },
    { num: 12, title: "How to Flatter Your Friends", sessions: [32, 33, 34, 35, 36, 37] },
    { num: 14, title: "How to Talk About Common Phenomena and Occurrences", sessions: [39, 40, 41] },
    { num: 15, title: "How to Talk About What Goes On", sessions: [42, 43, 44] },
    { num: 16, title: "How to Talk About a Variety of Personal Characteristics", sessions: [45, 46] }
];

// Note: Chapters 8, 13, 17 are Reviews/Tests, which we might skip for now or extract differently.
// Note: Session 18, 38, 47 are also review sessions.

function main() {
    console.log('📖 Processing Remaining Chapters...');
    const text = fs.readFileSync(TEXT_PATH, 'utf8');
    const lines = text.split('\n');

    const chapters: Chapter[] = [];

    for (const chap of CHAPTER_MAP) {
        console.log(`  📂 Generating Chapter ${chap.num}: ${chap.title}`);
        const sessions: Session[] = [];

        for (const sessionNum of chap.sessions) {
            // Find start and end of session
            const startMarker = `SESSION ${sessionNum}`;
            const endMarker = `(End of Session ${sessionNum})`;

            // Fuzzy find line index
            // Because sometimes "SESSION 14" might be "Session 14" or "SESSION 14 "
            const startIdx = lines.findIndex(l => l.trim().toUpperCase() === `SESSION ${sessionNum}`);
            const endIdx = lines.findIndex(l => l.includes(`(End of Session ${sessionNum})`));

            if (startIdx === -1) {
                console.warn(`    ⚠️ Could not find start of Session ${sessionNum}`);
                continue;
            }

            // If end not found, look for start of next session or known markers
            let actualEndIdx = endIdx;
            if (actualEndIdx === -1) {
                // Try finding start of next session
                const nextSession = sessionNum + 1;
                const nextStart = lines.findIndex(l => l.trim().toUpperCase() === `SESSION ${nextSession}`);
                if (nextStart !== -1) {
                    actualEndIdx = nextStart;
                } else {
                    // Fallback: +500 lines
                    actualEndIdx = Math.min(startIdx + 800, lines.length);
                }
            }

            console.log(`    📝 Parsing Session ${sessionNum} (Lines ${startIdx}-${actualEndIdx})`);

            const chunk = lines.slice(startIdx, actualEndIdx).join('\n');
            const words = extractWordsFromChunk(chunk, sessionNum);

            sessions.push({
                sessionNumber: sessionNum,
                title: `${chap.title} - Session ${sessionNum}`, // Placeholder title
                words: words,
                exercises: []
            });
        }

        if (sessions.length > 0) {
            chapters.push({
                chapterNumber: chap.num,
                title: chap.title,
                sessions: sessions
            });
        }
    }

    // Wrap in a structure compatible with our seed script
    // Our seed script expects either a single Chapter object or { chapters: [] }
    const output = {
        chapters: chapters
    };

    fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 4));
    console.log(`✅ Extracted ${chapters.length} chapters to ${OUT_PATH}`);
}

function extractWordsFromChunk(chunk: string, sessionNum: number): Word[] {
    const lines = chunk.split('\n');
    const words: Word[] = [];

    // Strategy 1: "Can you recall the words?"
    // Look for blanck patterns: "1. I__________"
    const blanks: { num: number, initial: string, lineIndex: number }[] = [];

    lines.forEach((line, idx) => {
        // Regex for "1. I____..." or "1. I  ____"
        const m = line.match(/^(\d+)\.\s+([A-Z])\s*_+/i);
        if (m && line.includes('_')) {
            blanks.push({ num: parseInt(m[1]), initial: m[2], lineIndex: idx });
        } else {
            // Try trimming
            const m2 = line.trim().match(/^(\d+)\.\s+([A-Z])\s*_+/i);
            if (m2 && line.includes('_')) {
                blanks.push({ num: parseInt(m2[1]), initial: m2[2], lineIndex: idx });
            }
        }
    });

    // Strategy 2: KEY at the end
    // "KEY: 1–iconoclast, 2–atheist..."
    const keyRegex = /KEY:\s*((?:\d+–[a-zA-Z]+(?:, )?)+)/g;
    let match;
    const keyMap = new Map<number, string>(); // Index -> Word

    while ((match = keyRegex.exec(chunk)) !== null) {
        const content = match[1];
        const pairs = content.split(/,\s*/);
        for (const p of pairs) {
            const parts = p.split('–');
            if (parts.length === 2) {
                const num = parseInt(parts[0]);
                const val = parts[1].trim();
                // Ignore single letters (matching pointers like 1-c)
                if (val.length > 2) {
                    keyMap.set(num, val);
                }
            }
        }
    }

    // Combine Key + Blanks to form words
    // If we have a blank at #1, and Key #1 says "notorious", and prev line says "well-known for badness"
    // Then Word: notorious, Def: well-known for badness.

    // Note: There might be multiple "Recalls" or Keys.
    // We should try to pair closest KEY to the blank?
    // Or just accumulate all unique words found in ANY key that match a blank?

    // Simpler approach:
    // Iterate through all found blanks.
    // Use the Key Map to find the word for that number. (Warning: Key numbers reset per exercise).
    // So we need to separate exercises.

    // Heuristic: If we have "Can you recall", those numbers (1-10) correspond to a KEY nearby.
    // But `keyMap` above blindly merges all keys.
    // Let's refine:

    // If `keyMap` has collision on #1, we have a problem.
    // But usually "Recall" is the FINAL exercise.

    // Let's use the definitions found near the blanks.
    for (const b of blanks) {
        // Definition is usually 1 or 2 lines before match
        let defLine = lines[b.lineIndex - 1]?.trim();
        if (!defLine) defLine = lines[b.lineIndex - 2]?.trim();

        if (!defLine) continue;

        // Do we have a word for this Number?
        // Note: This global keyMap might be wrong if there are multiple exercises.
        // Let's rely on Valid Words list + Initial match.
        // Extract ALL candidate words from ALL keys first.

        // Find candidate from KeyMap that starts with b.initial?
        // Actually, keyMap only stores the LAST seen value for a number if we overwrite.
        // This is imperfect.

        // Better: Scan specifically for the KEY line that follows the extracted blank.
        const relevantKeyLine = lines.slice(b.lineIndex).find(l => l.trim().startsWith('KEY:'));
        let foundWord = '';

        if (relevantKeyLine) {
            const p = relevantKeyLine.match(new RegExp(`${b.num}–([a-zA-Z]+)`));
            if (p && p[1].length > 2) {
                foundWord = p[1];
            }
        }

        if (foundWord && foundWord.toUpperCase().startsWith(b.initial.toUpperCase())) {
            // Good match
            if (!words.find(w => w.term === foundWord)) {
                words.push({
                    term: foundWord,
                    definition: defLine,
                    part_of_speech: 'noun' // default
                });
            }
        }
    }

    return words;
}

main();
