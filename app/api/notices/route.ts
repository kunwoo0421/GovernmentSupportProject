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
    const agency = searchParams.get('agency');

    // Date Filters
    const startDateFrom = searchParams.get('startDateFrom');
    const startDateTo = searchParams.get('startDateTo');
    const endDateFrom = searchParams.get('endDateFrom');
    const endDateTo = searchParams.get('endDateTo');

    // Sorting: 'recent' (default), 'deadline', 'crawled'
    const sort = searchParams.get('sort') || 'recent';

    let notices: GovernmentNotice[] = [];

    // Priority: Fetch from Supabase DB (Populated by Cron)
    const { data: dbData, error } = await supabase.from('notices').select('*');

    if (error) {
        console.error('Supabase Fetch Error:', error);
    }

    if (dbData && dbData.length > 0) {
        notices = dbData.map((row: any) => ({
            id: row.id || row.url, // Use DB ID if available
            title: row.title,
            agency: row.agency,
            startDate: row.start_date,
            endDate: row.end_date,
            region: row.region,
            category: row.category,
            url: row.url,
            source: row.source,
            description: row.description,
            fetchedAt: row.fetched_at ? new Date(row.fetched_at) : new Date()
        })).filter(n => n.url && (n.url.startsWith('http://') || n.url.startsWith('https://')) && !n.url.includes('selectSIIA200View.do'));
    } else {
        // Fallback: Use Robust Mock Data if DB is empty (e.g. first run before Cron)
        console.log('DB empty, using mock data.');
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

    // Agency
    if (agency) {
        notices = notices.filter(n => n.agency.includes(agency));
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
