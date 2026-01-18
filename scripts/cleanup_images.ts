import fs from 'fs';
import path from 'path';
import { BookData } from '../src/lib/types';

const BOOK_PATH = path.join(process.cwd(), 'content/wpmae/book.json');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

async function main() {
    console.log('🧹 Cleaning up broken image links...');

    const rawData = fs.readFileSync(BOOK_PATH, 'utf-8');
    const bookData: BookData = JSON.parse(rawData);
    let cleanedCount = 0;

    for (const chapter of bookData.chapters) {
        for (const session of chapter.sessions) {
            for (const word of session.words) {
                if (word.imageUrl && word.imageUrl.startsWith('/vocab/')) {
                    const filePath = path.join(PUBLIC_DIR, word.imageUrl);
                    if (!fs.existsSync(filePath)) {
                        console.log(`  x Removing broken link for ${word.term}`);
                        delete word.imageUrl;
                        cleanedCount++;
                    }
                }
            }
        }
    }

    if (cleanedCount > 0) {
        fs.writeFileSync(BOOK_PATH, JSON.stringify(bookData, null, 2));
        console.log(`✅ Cleaned ${cleanedCount} broken links.`);
    } else {
        console.log('✨ No broken links found.');
    }
}

main();
