
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
    console.log('🌱 Starting seed process...');

    const bookId = 'wpmae';
    const bookTitle = 'Word Power Made Easy';

    try {
        // 1. Insert Book
        const { error: bookError } = await supabase
            .from('books')
            .upsert({
                id: bookId,
                title: bookTitle,
            })
            .select()
            .single();

        if (bookError) throw new Error(`Error seeding book: ${bookError.message}`);

        // Files to process
        const files = ['book.json', 'chapter3.json', 'chapter4.json', 'remaining_chapters.json'];

        for (const filename of files) {
            const filePath = path.join(__dirname, `../content/wpmae/${filename}`);
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ Skipping ${filename} (not found)`);
                continue;
            }

            console.log(`📄 Processing file: ${filename}`);
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);

            // Handle both full book format (chapters[]) and single chapter format (data IS the chapter)
            let chaptersToProcess: any[] = [];

            if (data.chapters) {
                chaptersToProcess = data.chapters;
            } else if (data.chapterNumber) {
                chaptersToProcess = [data]; // It's a single chapter file
            }

            for (const chapter of chaptersToProcess) {
                const chapNum = chapter.chapterNumber;
                const chapTitle = chapter.title;

                console.log(`  📂 Processing Chapter ${chapNum}: ${chapTitle}`);

                let chapterId: string;

                // Find or Create Chapter
                const { data: existingChapter } = await supabase
                    .from('chapters')
                    .select('id')
                    .eq('book_id', bookId)
                    .eq('chapter_number', chapNum)
                    .single();

                if (existingChapter) {
                    chapterId = existingChapter.id;
                    await supabase
                        .from('chapters')
                        .update({ title: chapTitle })
                        .eq('id', chapterId);
                } else {
                    const { data: newChapter, error: createChapterError } = await supabase
                        .from('chapters')
                        .insert({
                            book_id: bookId,
                            chapter_number: chapNum,
                            title: chapTitle,
                        })
                        .select('id')
                        .single();

                    if (createChapterError) throw new Error(`Error creating chapter: ${createChapterError.message}`);
                    chapterId = newChapter.id;
                }

                // Sessions
                for (const session of chapter.sessions) {
                    console.log(`    📝 Processing Session ${session.sessionNumber}: ${session.title}`);

                    let sessionId: string;
                    const { data: existingSession } = await supabase
                        .from('sessions')
                        .select('id')
                        .eq('book_id', bookId)
                        .eq('session_number', session.sessionNumber)
                        .single();

                    if (existingSession) {
                        sessionId = existingSession.id;
                        await supabase.from('sessions').update({
                            title: session.title,
                            chapter_id: chapterId,
                            is_published: true
                        }).eq('id', sessionId);
                    } else {
                        const { data: newSession, error: createSessionError } = await supabase
                            .from('sessions')
                            .insert({
                                book_id: bookId,
                                chapter_id: chapterId,
                                session_number: session.sessionNumber,
                                title: session.title,
                                is_published: true,
                            })
                            .select('id')
                            .single();

                        if (createSessionError) throw new Error(`Error creating session: ${createSessionError.message}`);
                        sessionId = newSession.id;
                    }

                    // Words
                    if (session.words) {
                        for (const word of session.words) {
                            const { error: wordError } = await supabase
                                .from('words')
                                .upsert({
                                    book_id: bookId,
                                    session_id: sessionId,
                                    term: word.term,
                                    definition: word.definition,
                                    example_sentence: word.exampleSentence || null,
                                    tags: word.tags || null,
                                    // New fields
                                    etymology: word.etymology || null,
                                    root_words: word.root_words || null,
                                    part_of_speech: word.part_of_speech || null,
                                    pronunciation: word.pronunciation || null
                                }, { onConflict: 'book_id,session_id,term' });

                            if (wordError) console.error(`      ❌ Error upserting word ${word.term}:`, wordError.message);
                        }
                    }

                    // Exercises (Optional)
                    if (session.exercises) {
                        // Start fresh for exercises to ensure order/content
                        await supabase.from('exercise_items').delete().eq('session_id', sessionId);
                        let orderIndex = 0;
                        for (const exercise of session.exercises) {
                            for (const item of exercise.items) {
                                await supabase.from('exercise_items').insert({
                                    book_id: bookId,
                                    session_id: sessionId,
                                    type: exercise.type,
                                    payload: item,
                                    order_index: orderIndex++
                                });
                            }
                        }
                    }
                }
            }
        }
        console.log('✅ Seed completed successfully!');
    } catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    }
}

seed();
