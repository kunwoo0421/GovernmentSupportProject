import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchFromOpenAPI, fetchFromKStartup, fetchFromKocca } from '@/lib/crawler';
import { fetchKonepsBids } from '@/lib/koneps';
import { GovernmentNotice } from '@/lib/types';

export const dynamic = 'force-dynamic'; // Static generation fails for cron

export async function GET(request: Request) {
    // Vercel Cron Job triggers this route.
    // Auth check: verify header 'Authorization' if needed, but Vercel sends a specific header 'x-vercel-cron'.
    // For simplicity, we assume it's publicly callable or protected by Vercel's firewall rules for crons.

    console.log('[Cron] Starting scheduled data fetch...');

    try {
        // 1. Fetch Government Support Notices
        const [mssData, kStartupData, koccaData] = await Promise.all([
            fetchFromOpenAPI(),
            fetchFromKStartup(),
            fetchFromKocca()
        ]);
        const supportNotices = [...mssData, ...kStartupData, ...koccaData];

        // 2. Fetch Bid Notices (KONEPS)
        // Fetch recent bids (last 2 days to catch new ones)
        // getRecentDate is internal to koneps.ts, so we pass undefined to use defaults.
        const bidNotices = await fetchKonepsBids();

        const allNotices = [...supportNotices, ...bidNotices];

        if (allNotices.length > 0 && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            const { error } = await supabase
                .from('notices')
                .upsert(
                    allNotices.map(n => ({
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

            if (error) throw error;
            console.log(`[Cron] Successfully upserted ${allNotices.length} notices.`);
        }

        return NextResponse.json({ success: true, count: allNotices.length });

    } catch (e: any) {
        console.error('[Cron] Failed:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
