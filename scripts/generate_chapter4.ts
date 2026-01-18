
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Word {
    term: string;
    definition: string;
    pronunciation?: string;
    part_of_speech?: string;
    etymology?: string;
    root_words?: string[];
    exampleSentence?: string;
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
const OUT_PATH = path.join(__dirname, '../content/wpmae/chapter4.json');

function main() {
    console.log('📖 processing Chapter 4...');
    const text = fs.readFileSync(TEXT_PATH, 'utf8');

    const sessions: Session[] = [];

    // SESSION 11
    // Range: approx 4507 to 4648
    // "Can you recall" section: 4623 - 4647
    // KEY: 4645
    sessions.push(extractSession(text, 11, "Science and Scientists I", 4500, 4650));

    // SESSION 12
    // Range: 4650 to 5003
    // "Can you recall" (I): 4940
    // "Can you recall" (II): 4972
    sessions.push(extractSession(text, 12, "Science and Scientists II", 4650, 5005));

    // SESSION 13
    // Range: 5005 to 5528
    sessions.push(extractSession(text, 13, "Science and Scientists III", 5005, 5530));

    const chapter: Chapter = {
        chapterNumber: 4,
        title: "How to Talk About Science and Scientists",
        sessions: sessions
    };

    fs.writeFileSync(OUT_PATH, JSON.stringify(chapter, null, 4));
    console.log(`✅ Written to ${OUT_PATH}`);
}

function extractSession(fullText: string, sessionNum: number, title: string, startLineHint: number, endLineHint: number): Session {
    const lines = fullText.split('\n');
    // Extract chunk
    const chunk = lines.slice(startLineHint, endLineHint).join('\n');

    // Strategy: Look for "Can you recall the words?" sections
    // They are typically followed by numbered items: "1. [Initial]______"
    // And ends with "KEY: ..."

    const words: Word[] = [];

    // Find all "KEY:" lines to build a map of Index -> Term
    // Note: There might be multiple KEY lines (one for each exercise).
    // We want the KEYs that correspond to "recall the words".
    // Or we can just grab ALL keys in the chunk and try to match them.

    // Better: parse the "KEY:" lines first to get candidate words.
    // Format: "KEY: 1–entomologist, 2–philologist..."
    // or "KEY: 1–e, 2–g..." (we ignore single letters)

    const keyRegex = /KEY:\s*((?:\d+–[a-zA-Z]+(?:, )?)+)/g;
    let match;
    const candidateTerms: string[] = [];

    while ((match = keyRegex.exec(chunk)) !== null) {
        const content = match[1];
        const pairs = content.split(/,\s*/);
        for (const p of pairs) {
            // "1–entomologist"
            const parts = p.split('–');
            if (parts.length === 2) {
                const val = parts[1].trim();
                // Ignore single letters (matching pointers)
                if (val.length > 2) {
                    candidateTerms.push(val);
                }
            }
        }
    }

    // Dedupe
    const uniqueTerms = [...new Set(candidateTerms)];

    // Now try to find definitions.
    // In "Can you recall", the definition is on the line BEFORE the numbered item.
    // ITEM: "1. E__________________"
    // PREV LINE: "insects"

    // Let's iterate lines in the chunk
    const chunkLines = chunk.split('\n');

    // Helper to find definition for a term
    for (const term of uniqueTerms) {
        // We know the term (e.g. "entomologist").
        // Look for "1. E______" where E is the first letter.
        // Actually, just looking for the definition line is hard without knowing WHICH number it is.
        // But the KEY tells us the number! "1–entomologist".
        // So we scan the KEY lines again, mapping Num -> Term.
        // Then find "Num. [Initial]" in text and take prev line.
    }

    // Re-scan keys with context
    let keyMatch;
    // We need to match specific KEY lines to specific "recall" sections if there are multiple.
    // But usually "Can you recall" is at the end.

    // Let's just fuzzy match:
    // If we have "1–entomologist" in a key.
    // Find "1. E" (case insensitive) in the text?
    // There might be "1. anthropology" in a pronunciation list or "1. graphology" in a matching list.
    // The "recall" list is distinct because it has underscores "______".

    const recallRegex = /(\d+)\.\s+([A-Z])_+/g; // "1. E_______"
    let recallMatch;

    // Store found locations of blanks
    const blanks: { num: number, initial: string, lineIndex: number }[] = [];

    chunkLines.forEach((line, idx) => {
        const m = line.match(/^(\d+)\.\s+([A-Z])\s*_+/i); // Start of line
        if (m) {
            // checking if line looks like blank
            if (line.includes('_')) {
                blanks.push({
                    num: parseInt(m[1]),
                    initial: m[2],
                    lineIndex: idx
                });
            }
        } else {
            // Try match with leading spaces
            const m2 = line.trim().match(/^(\d+)\.\s+([A-Z])\s*_+/i);
            if (m2 && line.includes('_')) {
                blanks.push({
                    num: parseInt(m2[1]),
                    initial: m2[2],
                    lineIndex: idx
                });
            }
        }
    });

    // Now map blanks to words from KEY
    // We need the KEY that appears AFTER these blanks.
    // Simplification: Just find the word in uniqueTerms that starts with that Initial and matches!
    // If multiple matches? (e.g. "astronomy", "astrology" both A).
    // We need the KEY mapping.

    // Complex mapping:
    // 1. Find all KEY lines.
    // 2. See which KEY line is near the blanks.

    // Let's rely on uniqueTerms list we extracted.
    // And try to find definitions in the text "Ideas" section or "Recall" section.

    // For "Recall":
    // Definition is at `chunkLines[lineIndex - 1]` or `-2`.

    // Actually, let's just use the `uniqueTerms` and do a best-effort lookup of definitions from the "Ideas" section which is cleaner?
    // "1. whither mankind? ... The field is ... An anthropologist"
    // Pattern: 
    // "1. [Concept]"
    // "[Definition Text]"
    // "An [Term]"

    // This seems robust for Session 11.
    // Session 12 doesn't have "Ideas".

    // So "Recall" is the common denominator.

    for (const b of blanks) {
        // Definition is usually the line before.
        let defLine = chunkLines[b.lineIndex - 1].trim();
        // Sometimes valid text is 2 lines up if prev line is empty.
        if (!defLine) defLine = chunkLines[b.lineIndex - 2]?.trim();

        if (!defLine) continue;

        // Find matching term from candidate words
        // Must start with b.initial
        const possibleTerms = uniqueTerms.filter(t => t.toUpperCase().startsWith(b.initial.toUpperCase()));

        // If we have explicit key mapping, use it.
        // We can parse the key that follows this block.
        // Find first KEY line after b.lineIndex
        const keyLine = chunkLines.slice(b.lineIndex).find(l => l.trim().startsWith('KEY:'));

        let foundTerm = '';
        if (keyLine) {
            // Parse "1–term"
            const p = keyLine.match(new RegExp(`${b.num}–([a-zA-Z]+)`));
            if (p) {
                foundTerm = p[1];
            }
        }

        // Fallback: if only one possible term
        if (!foundTerm && possibleTerms.length === 1) {
            foundTerm = possibleTerms[0];
        }

        if (foundTerm) {
            // Check if we already added it
            if (!words.find(w => w.term === foundTerm)) {
                words.push({
                    term: foundTerm,
                    definition: defLine,
                    part_of_speech: 'noun' // default
                });
            }
        }
    }

    // If no words found via Recall (fallback), try Ideas (Session 11 style)
    if (words.length === 0) {
        // Try extract "An [Term]" at end of paragraphs?
        // Too risky.
        // Let's assume uniqueTerms are valid and provide generic def if missing.
        for (const t of uniqueTerms) {
            if (!words.find(w => w.term === t)) {
                words.push({
                    term: t,
                    definition: "Definition not extracted.",
                    part_of_speech: "noun"
                });
            }
        }
    }

    return {
        sessionNumber: sessionNum,
        title: title,
        words: words,
        exercises: []
    };
}

main();
