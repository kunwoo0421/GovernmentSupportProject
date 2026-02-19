
import { NextResponse } from 'next/server';
import { fetchKonepsBids } from '@/lib/koneps';
import { supabase } from '@/lib/supabase';

// API Route for Bids
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // Fetch from KONEPS API
    const bids = await fetchKonepsBids(keyword, startDate, endDate);

    // Save to Supabase (Upsert) - Optional, but good for caching
    if (bids.length > 0 && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        try {
            await supabase
                .from('notices') // Using same table or create 'bids' table?
                // Let's use same table but differentiate by source, or just fetch live for now.
                // Since user asked for a separate page and we have a unified schema, 
                // we can store them in the same table if schema matches.
                // Our schema: url is unique key.
                .upsert(
                    bids.map(b => ({
                        title: b.title,
                        agency: b.agency,
                        start_date: b.startDate,
                        end_date: b.endDate,
                        region: b.region,
                        category: b.category,
                        url: b.url,
                        source: b.source,
                        description: b.description
                        // fetch_at default
                    })),
                    { onConflict: 'url' }
                );
        } catch (e) {
            console.error('Bids DB Upsert Error', e);
        }
    }

    return NextResponse.json(bids);
}
