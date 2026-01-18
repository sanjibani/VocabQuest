import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { promises as fs } from 'fs';
import path from 'path';
import { type BookData } from '@/lib/types';

export async function POST(request: NextRequest) {
    // Check secret
    const secret = request.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.IMPORT_SECRET || 'dev-secret';

    if (secret !== expectedSecret) {
        return NextResponse.json(
            { error: 'Unauthorized: Invalid import secret' },
            { status: 401 }
        );
    }

    try {
        // Read book.json
        const bookPath = path.join(process.cwd(), 'content/wpmae/book.json');
        const bookContent = await fs.readFile(bookPath, 'utf-8');
        const bookData: BookData = JSON.parse(bookContent);

        const supabase = createAdminClient();

        // Counters
        let chaptersCount = 0;
        let sessionsCount = 0;
        let wordsCount = 0;
        let exercisesCount = 0;

        // 1. Upsert book
        const { error: bookError } = await supabase
            .from('books')
            .upsert({
                id: bookData.bookId,
                title: bookData.title,
            }, {
                onConflict: 'id',
            });

        if (bookError) {
            throw new Error(`Failed to upsert book: ${bookError.message}`);
        }

        // 2. Process chapters
        for (const chapter of bookData.chapters) {
            // Upsert chapter
            const { data: chapterData, error: chapterError } = await supabase
                .from('chapters')
                .upsert({
                    book_id: bookData.bookId,
                    chapter_number: chapter.chapterNumber,
                    title: chapter.title,
                }, {
                    onConflict: 'book_id,chapter_number',
                })
                .select('id')
                .single();

            if (chapterError) {
                throw new Error(`Failed to upsert chapter ${chapter.chapterNumber}: ${chapterError.message}`);
            }

            chaptersCount++;
            const chapterId = chapterData.id;

            // 3. Process sessions
            for (const session of chapter.sessions) {
                // Upsert session
                const { data: sessionData, error: sessionError } = await supabase
                    .from('sessions')
                    .upsert({
                        book_id: bookData.bookId,
                        chapter_id: chapterId,
                        session_number: session.sessionNumber,
                        title: session.title,
                        is_published: true, // Mark as published on import
                    }, {
                        onConflict: 'book_id,session_number',
                    })
                    .select('id')
                    .single();

                if (sessionError) {
                    throw new Error(`Failed to upsert session ${session.sessionNumber}: ${sessionError.message}`);
                }

                sessionsCount++;
                const sessionId = sessionData.id;

                // 4. Process words
                for (const word of session.words) {
                    const { error: wordError } = await supabase
                        .from('words')
                        .upsert({
                            book_id: bookData.bookId,
                            session_id: sessionId,
                            term: word.term,
                            definition: word.definition,
                            example_sentence: word.exampleSentence || null,
                            tags: word.tags || null,
                        }, {
                            onConflict: 'book_id,session_id,term',
                        });

                    if (wordError) {
                        throw new Error(`Failed to upsert word "${word.term}": ${wordError.message}`);
                    }

                    wordsCount++;
                }

                // 5. Process exercises
                // First, delete existing exercises for this session to avoid duplicates
                await supabase
                    .from('exercise_items')
                    .delete()
                    .eq('session_id', sessionId);

                let orderIndex = 0;
                for (const exercise of session.exercises) {
                    for (const item of exercise.items) {
                        const { error: exerciseError } = await supabase
                            .from('exercise_items')
                            .insert({
                                book_id: bookData.bookId,
                                session_id: sessionId,
                                type: exercise.type,
                                payload: {
                                    wordTerm: item.wordTerm,
                                    question: item.question,
                                    correctAnswer: item.correctAnswer,
                                    choices: item.choices,
                                },
                                order_index: orderIndex++,
                            });

                        if (exerciseError) {
                            throw new Error(`Failed to insert exercise item: ${exerciseError.message}`);
                        }

                        exercisesCount++;
                    }
                }
            }
        }

        return NextResponse.json({
            message: 'Import completed successfully!',
            details: {
                chapters: chaptersCount,
                sessions: sessionsCount,
                words: wordsCount,
                exercises: exercisesCount,
            },
        });

    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error occurred' },
            { status: 500 }
        );
    }
}
