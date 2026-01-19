
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDir = path.join(__dirname, '../content/wpmae');

const files = ['book.json', 'chapter3.json', 'chapter4.json', 'remaining_chapters.json'];

console.log('Checking All Sessions for Missing Etymology...');
console.log('============================================');

let totalMissing = 0;
let totalWords = 0;

for (const filename of files) {
    const filePath = path.join(contentDir, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Skipping ${filename} (not found)`);
        continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Normalize to array of chapters
    let chapters = [];
    if (data.chapters) {
        chapters = data.chapters;
    } else if (data.chapterNumber) {
        chapters = [data];
    }

    console.log(`\n📄 File: ${filename}`);

    for (const chapter of chapters) {
        for (const session of chapter.sessions) {
            let sessionMissing = 0;
            for (const word of session.words) {
                totalWords++;
                if (!word.etymology) {
                    sessionMissing++;
                    totalMissing++;
                }
            }

            if (sessionMissing > 0) {
                console.log(`  ❌ Session ${session.sessionNumber}: ${session.title} - Missing ${sessionMissing} / ${session.words.length} words`);
            } else {
                console.log(`  ✅ Session ${session.sessionNumber}: ${session.title}`);
            }
        }
    }
}

console.log('============================================');
if (totalMissing === 0) {
    console.log(`SUCCESS: All ${totalWords} words have etymology!`);
} else {
    console.log(`SUMMARY: ${totalMissing} out of ${totalWords} words are missing etymology.`);
}
