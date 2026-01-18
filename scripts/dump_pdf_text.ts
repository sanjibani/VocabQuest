
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const pdf = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function dumpText() {
    const pdfPath = path.join(__dirname, '../content/wpmae/book.pdf');
    const outputPath = path.join(__dirname, '../content/wpmae/book_text.txt');

    console.log(`Reading PDF from: ${pdfPath}`);
    const dataBuffer = fs.readFileSync(pdfPath);

    try {
        const data = await pdf(dataBuffer);
        const text = data.text;

        fs.writeFileSync(outputPath, text);
        console.log(`Successfully wrote ${text.length} characters to ${outputPath}`);
    } catch (error) {
        console.error('Error parsing PDF:', error);
    }
}

dumpText();
