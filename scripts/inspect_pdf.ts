
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function inspectPdf() {
    const pdfPath = path.join(__dirname, '../content/wpmae/book.pdf');

    if (!fs.existsSync(pdfPath)) {
        console.error('❌ PDF file not found at:', pdfPath);
        process.exit(1);
    }

    const dataBuffer = fs.readFileSync(pdfPath);

    try {
        const data = await pdf(dataBuffer);

        console.log('📄 PDF Info:');
        console.log('Pages:', data.numpages);

        const text = data.text;

        // Output a significant chunk to see headers/structure
        console.log('\n--- SAMPLE TEXT (Chars 1000-5000) ---');
        console.log(text.substring(1000, 5000));

        // Try to find Session patterns
        console.log('\n--- SESSION PATTERN SEARCH ---');
        // Look for "SESSION 1", "SESSION 2" etc.
        const sessionHeaders = text.match(/SESSION\s+\d+/gi);
        console.log('Session Headers found:', sessionHeaders ? sessionHeaders.slice(0, 5) : 'None');

        // Look for Chapter patterns
        const chapterHeaders = text.match(/CHAPTER\s+\d+/gi);
        console.log('Chapter Headers found:', chapterHeaders ? chapterHeaders.slice(0, 5) : 'None');

    } catch (e) {
        console.error('Error parsing PDF:', e);
    }
}

inspectPdf();
