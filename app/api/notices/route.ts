import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchMockNotices, fetchFromOpenAPI, fetchFromKStartup, fetchFromKocca } from '@/lib/crawler';
import { GovernmentNotice } from '@/lib/types';
import { compareDesc, compareAsc } from 'date-fns';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const region = searchParams.get('region');
    const category = searchParams.get('category');

    // Date Filters
    const startDateFrom = searchParams.get('startDateFrom');
    const startDateTo = searchParams.get('startDateTo');
    const endDateFrom = searchParams.get('endDateFrom');
    const endDateTo = searchParams.get('endDateTo');

    // Sorting: 'recent' (default), 'deadline', 'crawled'
    const sort = searchParams.get('sort') || 'recent';

    let notices: GovernmentNotice[] = [];

    // Priority 1: Real Open API Data (MSS + K-Startup + KOCCA)
    // Run in parallel for speed, combine results
    const [mssData, kStartupData, koccaData] = await Promise.all([
        fetchFromOpenAPI(),
        fetchFromKStartup(),
        fetchFromKocca()
    ]);

    const apiData = [...mssData, ...kStartupData, ...koccaData];

    if (apiData.length > 0) {
        notices = apiData;

        // Save to Supabase (Upsert)
        // Check if Supabase is configured
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            try {
                const { error } = await supabase
                    .from('notices')
                    .upsert(
                        apiData.map(n => ({
                            title: n.title,
                            agency: n.agency,
                            start_date: n.startDate, // format YYYY-MM-DD
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

                if (error) {
                    console.error('Supabase Upsert Error:', error);
                } else {
                    console.log(`Saved ${apiData.length} notices to Supabase.`);
                }
            } catch (dbErr) {
                console.error('Supabase Operation Failed:', dbErr);
            }
        }
    } else {
        // Fallback if APIs fail or return empty (e.g. key issue)
        // Use Robust Mock Data
        const mockData = await fetchMockNotices();
        notices = [...mockData];
    }

    // 2. Filter Logic (In-Memory for now as API filtering is limited)
    // Keyword
    if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        notices = notices.filter(n =>
            n.title.toLowerCase().includes(lowerKeyword) ||
            (n.description && n.description.toLowerCase().includes(lowerKeyword)) ||
            n.agency.toLowerCase().includes(lowerKeyword)
        );
    }

    // Region
    if (region && region !== '전체 지역') {
        notices = notices.filter(n => n.region === region);
    }

    // Category
    if (category && category !== '전체 분야') {
        notices = notices.filter(n => n.category && n.category.includes(category));
    }

    // Announcement Date Range (공고일)
    if (startDateFrom || startDateTo) {
        notices = notices.filter(n => {
            if (!n.startDate) return false;
            const date = new Date(n.startDate);
            const start = startDateFrom ? new Date(startDateFrom) : new Date('1970-01-01');
            const end = startDateTo ? new Date(startDateTo) : new Date('2099-12-31');
            return date >= start && date <= end;
        });
    }

    // Deadline Date Range (마감일)
    if (endDateFrom || endDateTo) {
        notices = notices.filter(n => {
            if (!n.endDate) return false; // If no deadline, exclude? Or keep? Usually strict filter excludes.
            const date = new Date(n.endDate);
            const start = endDateFrom ? new Date(endDateFrom) : new Date('1970-01-01');
            const end = endDateTo ? new Date(endDateTo) : new Date('2099-12-31');
            return date >= start && date <= end;
        });
    }

    // 3. Sorting Logic
    notices.sort((a, b) => {
        switch (sort) {
            case 'deadline': // 마감임박순 (Deadline Ascending, but ignore past)
                if (!a.endDate) return 1;
                if (!b.endDate) return -1;
                return compareAsc(new Date(a.endDate), new Date(b.endDate));
            case 'crawled': // 수집일순 (FetchedAt Descending)
                return compareDesc(new Date(a.fetchedAt), new Date(b.fetchedAt));
            case 'recent': // 최신공고순 (StartDate Descending)
            default:
                // Handle null start dates
                const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
                const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
                return compareDesc(dateA, dateB);
        }
    });

    return NextResponse.json(notices);
}
