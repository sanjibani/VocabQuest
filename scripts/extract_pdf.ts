
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const pdf = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ExtractedWord {
    term: string;
    definition: string;
    pronunciation: string;
    partOfSpeech: string;
    etymology: string;
}

interface ExtractedSession {
    sessionNumber: number;
    title: string;
    words: ExtractedWord[];
}

async function extractContent() {
    const pdfPath = path.join(__dirname, '../content/wpmae/book.pdf');
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    const text = data.text;

    console.log('📖 PDF Loaded. Total Length:', text.length);

    // Strategy:
    // The book has "Session X" headers.
    // Inside sessions, words are often introduced in a list or matching exercise.
    // However, extracting structured "Term - Definition" from unbroken text is heuristic.
    // Let's look for the "Ten Words" lists often found at the start or summary of sessions.
    // Or simpler: Look for patterns like "1. egoist" inside sessions.

    // Limits for now: Let's try to extract ONE session (e.g. Session 7) to test.

    const session7Start = text.indexOf('Session 7');
    if (session7Start === -1) {
        console.log('Session 7 not found.');
        return;
    }

    // Arbitrary length to capture the session
    const session7Text = text.substring(session7Start, session7Start + 10000);
    console.log('\n--- SESSION 7 TEXT SAMPLE ---');
    console.log(session7Text.substring(0, 1000));

    // Regex to find words (Heuristic based on book format)
    // Often format is:
    // 1. orthopedist
    // 2. cardiologist
    // ...
    const wordListRegex = /(\d+)\.\s+([a-z]+)/g;
    let match;
    const words: string[] = [];

    while ((match = wordListRegex.exec(session7Text)) !== null) {
        // Filter out "page" numbers or unrelated lists
        if (match[2].length > 4) {
            words.push(match[2]);
        }
    }

    console.log('\n--- EXTRACTED CANDIDATE WORDS FOR SESSION 7 ---');
    console.log(unique(words)); // Dedupe
}

function unique(arr: string[]) {
    return [...new Set(arr)];
}

extractContent();
