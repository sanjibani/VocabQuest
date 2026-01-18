
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_PATH = path.join(__dirname, '../content/wpmae/remaining_chapters.json');

function main() {
    let content = fs.readFileSync(FILE_PATH, 'utf8');

    // Fix specific known corruptions based on logs
    const replacements = [
        { pattern: /o\\u0000spring/g, replacement: "offspring" },
        { pattern: /\\u0000ourishing/g, replacement: "flourishing" },
        { pattern: /\\u0000uent/g, replacement: "fluent" },
        { pattern: /\\u0000ghting/g, replacement: "fighting" },
        { pattern: /o\\u0000ce/g, replacement: "office" },
        { pattern: /o\\u0000ense/g, replacement: "offense" },
        { pattern: /\\u0000xed/g, replacement: "fixed" },
        { pattern: /a\\u0000icted/g, replacement: "afflicted" },
        { pattern: /in\\u0000uence/g, replacement: "influence" },
        { pattern: /\\u0000atter/g, replacement: "flatter" },
        { pattern: /\\u0000ag-waver/g, replacement: "flag-waver" }, // guess
        { pattern: /su\\u0000erer/g, replacement: "sufferer" },
        { pattern: /bene\\u0000ts/g, replacement: "benefits" },
        { pattern: /di\\u0000erent/g, replacement: "different" },
        { pattern: /self-sacri\\u0000ce/g, replacement: "self-sacrifice" },

        // General fallback: if \u0000 is left, it's likely 'fi' or 'fl' or 'ff'
        // But let's try to target specific context
    ];

    replacements.forEach(r => {
        content = content.replace(r.pattern, r.replacement);
    });

    // Also remove any remaining \u0000 just in case to prevent DB error, replacing with nothing or ?
    // Check if any remain
    if (content.includes('\\u0000')) {
        console.warn("⚠️ Still found \\u0000 characters. Replacing remaining with 'fi' (guess)...");
        content = content.replace(/\\u0000/g, 'fi');
    }

    fs.writeFileSync(FILE_PATH, content);
    console.log("✅ Fixed unicode issues in remaining_chapters.json");
}

main();
