
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const textPath = path.join(__dirname, '../content/wpmae/book_text.txt');
const text = fs.readFileSync(textPath, 'utf8');
const lines = text.split('\n');

const targets = ['Session 11', 'Session 12', 'Session 13', 'Session 14'];

targets.forEach(target => {
    lines.forEach((line, index) => {
        if (line.includes(target)) {
            console.log(`Found "${target}" at line ${index + 1}: ${line.substring(0, 50)}...`);
        }
    });
});
