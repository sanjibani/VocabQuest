
import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        console.error('❌ DATABASE_URL is missing in .env.local');
        // Don't error out hard if we are just checking, but for this script we need it.
        console.error('Please add DATABASE_URL=postgresql://... to your .env.local file.');
        process.exit(1);
    }

    // Supabase connection pooler port 6543 requires `ssl: { rejectUnauthorized: false }` sometimes, 
    // or simple connection string works. Let's try standard client.
    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();

        const sqlPath = path.join(__dirname, '../supabase/migrations/002_add_etymology.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('⚡ Applying migration from 002_add_etymology.sql...');
        await client.query(sql);

        console.log('✅ Migration applied successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
