import fs from 'fs';
import path from 'path';
import { BookData, BookWord } from '../src/lib/types';

// Configuration
const BOOK_PATH = path.join(process.cwd(), 'content/wpmae/book.json');
const OUTPUT_DIR = path.join(process.cwd(), 'public/vocab');
const DELAY_MS = 15000; // 15s delay to avoid rate limits

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper: Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Generate Prompt
function generatePrompt(word: BookWord): string {
    // Strategy: Funny banana character acting out the concept
    // Style: Google Nano/Playful 3D style
    const basePrompt = `cute minimalist 3d banana character acting as a "${word.term}". Scene: ${word.definition}. Style: google playful 3d, bright colors, soft lighting, white background, high quality.`;
    return basePrompt;
}

// Main logic
async function main() {
    console.log(`🍌 Starting Banana Mnemonic Generator (Delay: ${DELAY_MS}ms)...`);

    // Read book.json
    const rawData = fs.readFileSync(BOOK_PATH, 'utf-8');
    const bookData: BookData = JSON.parse(rawData);
    let updatedCount = 0;
    let skippedCount = 0;

    // Iterate through all sessions and words
    for (const chapter of bookData.chapters) {
        for (const session of chapter.sessions) {
            console.log(`\nProcessing Session ${session.sessionNumber}: ${session.title}`);

            for (const word of session.words) {
                const outputFilename = `${word.term.replace(/\s+/g, '_')}.webp`;
                const existingPath = path.join(OUTPUT_DIR, outputFilename);
                const expectedUrl = `/vocab/${outputFilename}`;
                const hasUrlLinked = word.imageUrl === expectedUrl;

                // 1. Check if file exists
                if (fs.existsSync(existingPath)) {
                    if (!hasUrlLinked) {
                        console.log(`  ✓ Linking existing image for ${word.term}`);
                        word.imageUrl = expectedUrl;
                        // Incremental save
                        fs.writeFileSync(BOOK_PATH, JSON.stringify(bookData, null, 2));
                        updatedCount++;
                    } else {
                        // console.log(`  ✓ Skipping ${word.term} (done)`);
                        process.stdout.write('.');
                        skippedCount++;
                    }
                    continue;
                }

                // 2. Generate if missing
                console.log(`  🎨 Generating ${word.term}...`);

                try {
                    const prompt = generatePrompt(word);
                    const encodedPrompt = encodeURIComponent(prompt);
                    // Seed ensures variety but deterministic if re-run with same seed
                    const seed = Math.floor(Math.random() * 100000);
                    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true&seed=${seed}`;

                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

                    const buffer = await response.arrayBuffer();
                    fs.writeFileSync(existingPath, Buffer.from(buffer));

                    word.imageUrl = expectedUrl;
                    updatedCount++;

                    console.log(`    -> Saved to ${word.imageUrl}`);

                    // INCREMENTAL SAVE
                    fs.writeFileSync(BOOK_PATH, JSON.stringify(bookData, null, 2));

                    await delay(DELAY_MS);

                } catch (error) {
                    console.error(`    ❌ Failed to generate ${word.term}:`, error);
                }
            }
        }
    }

    console.log(`\n\n✅ Done! Updated ${updatedCount} words. Skipped ${skippedCount}.`);
}

main().catch(console.error);
