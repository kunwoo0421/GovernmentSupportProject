
const { createClient } = require('@supabase/supabase-js');
const { fetchFromOpenAPI, fetchFromKStartup, fetchFromKocca } = require('./lib/crawler');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// We need to bypass the TS compilation or modify import to work without TS compilation.
// However, 'lib/crawler.ts' is TypeScript.
// This script needs to be run with `tsx` or `ts-node`.
// So imports from './lib/crawler' (which is .ts) ARE allowed.

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Missing Supabase Env Vars");
    process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    console.log("=== STARTING RESET & CRAWL ===");

    // 1. DELETE ALL
    console.log("1. Deleting all existing notices in DB...");
    // Just deleting all rows. Assuming `id` is primary key or similar.
    // .delete().neq('id', 'mock') won't work if ID is uuid.
    // Use .not('id', 'is', null)

    const { error: delErr, count } = await supabase.from('notices').delete().neq('description', 'DUMMY_IMPOSSIBLE_VALUE');
    // Wait, delete without where logic matching all rows is blocked by Supabase default policy usually?
    // But .neq description dummy value matches everything.
    // Or just .gte('id', 0) if integer ID.
    // Or .not('url', 'is', null).

    // Let's try to delete where url is not null.
    const { error: delErr2 } = await supabase.from('notices').delete().not('url', 'is', null);

    if (delErr2) {
        console.error("Delete failed:", delErr2);
    } else {
        console.log("Deleted all rows.");
    }

    // 2. CRAWL
    console.log("2. Fetching from APIs (Max Limits)...");

    // We import from TS files, so we expect 'fetchFromOpenAPI' etc.
    // But wait, are they exported as named exports? Yes.

    const mss = await fetchFromOpenAPI();
    const kstartup = await fetchFromKStartup();
    const kocca = await fetchFromKocca();

    const allNotices = [...mss, ...kstartup, ...kocca];

    console.log(`Fetched total: ${allNotices.length} items.`);
    console.log(`- MSS: ${mss.length}`);
    console.log(`- K-Startup: ${kstartup.length}`);
    console.log(`- KOCCA: ${kocca.length}`);

    if (allNotices.length === 0) {
        console.log("No data fetched. Aborting upsert.");
        return;
    }

    // 3. UPSERT
    console.log("3. Saving to Supabase...");

    // Batch upsert in chunks of 100 to avoid request size limits
    const CHUNK_SIZE = 100;
    for (let i = 0; i < allNotices.length; i += CHUNK_SIZE) {
        const chunk = allNotices.slice(i, i + CHUNK_SIZE);

        const { error } = await supabase.from('notices').upsert(
            chunk.map(n => ({
                title: n.title,
                agency: n.agency,
                start_date: n.startDate,
                end_date: n.endDate,
                region: n.region,
                category: n.category,
                url: n.url,
                source: n.source,
                description: n.description,
                fetched_at: n.fetchedAt
            })),
            { onConflict: 'url' }
        );

        if (error) console.error(`Upsert error at chunk ${i}:`, error);
        else console.log(`Upserted chunk ${i} - ${i + chunk.length}`);
    }

    console.log("=== DONE ===");
}

run();
