
import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { GovernmentNotice } from './types';

// --- CONFIGURATION ---
const BIZINFO_BASE_URL = 'https://www.bizinfo.go.kr';
const BIZINFO_LIST_URL = 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/list.do';
const KSTARTUP_BASE_URL = 'https://www.k-startup.go.kr';

const DATA_GO_KR_API_KEY = process.env.DATA_GO_KR_API_KEY || '';

// Updated Endpoint based on research
const OPEN_API_URL = 'http://apis.data.go.kr/1421000/mssBizService_v2/getbizList_v2';

// --- REAL CRAWLERS ---

export async function fetchFromOpenAPI(): Promise<GovernmentNotice[]> {
    if (!DATA_GO_KR_API_KEY) return [];
    // ... (existing code for fetchFromOpenAPI) ...
    try {
        console.log(`[OpenAPI] Fetching from mssBizService_v2...`);
        const params = new URLSearchParams({
            serviceKey: DATA_GO_KR_API_KEY,
            pageNo: '1',
            numOfRows: '500', // Increased limit to 500
        });
        // ... (existing axios call) ...
        const response = await axios.get(`${OPEN_API_URL}?${params.toString()}`, { timeout: 8000 });
        const $ = cheerio.load(response.data, { xmlMode: true });

        // ... (existing parsing) ...
        const notices: GovernmentNotice[] = [];
        // Check error...
        const headerCode = $('header > resultCode').text() || $('cmmMsgHeader > returnReasonCode').text();
        if (headerCode && headerCode !== '00' && headerCode !== 'NORMAL_SERVICE') {
            // console.error...
            return [];
        }

        $('item').each((i, el) => {
            const title = $(el).find('sj').text() || $(el).find('title').text() || $(el).find('bizNm').text();
            if (!title) return;

            const agency = $(el).find('dept').text() || $(el).find('writer').text() || '중소벤처기업부';
            const dateRaw = $(el).find('regDt').text() || $(el).find('writngDt').text();

            let url = $(el).find('url').text() || $(el).find('link').text();
            if (!url) url = `https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/list.do?keyword=${encodeURIComponent(title.trim())}`;

            notices.push({
                id: `api-mss-${i}-${Date.now()}`,
                title: title.trim(),
                agency: agency.trim(),
                region: '전국', // API doesn't give region well
                category: '지원사업',
                startDate: dateRaw ? dateRaw.split(' ')[0] : new Date().toISOString().split('T')[0],
                endDate: null,
                url,
                source: '중소벤처기업부(API)',
                description: '공공데이터포털(중소벤처기업부)을 통해 수집된 공고입니다.',
                fetchedAt: new Date()
            });
        });
        return notices;
    } catch (e) {
        console.error("[OpenAPI] MSS Failed", e);
        return [];
    }
}

const KSTARTUP_API_KEY = process.env.KSTARTUP_API_KEY || ''; // User provided same key
const KSTARTUP_ENDPOINT = 'http://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementList';

export async function fetchFromKStartup(): Promise<GovernmentNotice[]> {
    if (!KSTARTUP_API_KEY) return [];

    try {
        console.log(`[OpenAPI] Fetching from K-Startup...`);
        // Manually constructing query to avoid double-encoding issues with ServiceKey
        const queryString = `serviceKey=${KSTARTUP_API_KEY}&pageNo=1&numOfRows=300&startDate=20240101&endDate=20241231`;
        // Adding date range might be needed for some calls, but let's try basic first with manual key string.

        const response = await axios.get(`${KSTARTUP_ENDPOINT}?${queryString}`, { timeout: 8000 });
        const $ = cheerio.load(response.data, { xmlMode: true });

        const notices: GovernmentNotice[] = [];

        // K-Startup usually returns <item>
        $('item').each((i, el) => {
            // Fields: bizNm per search
            const title = $(el).find('bizNm').text() || $(el).find('title').text();
            if (!title) return;

            const agency = $(el).find('orgNm').text() || $(el).find('supportAgency').text() || '창업진흥원';
            const dateRaw = $(el).find('postDt').text() || $(el).find('regDt').text();
            const endDateRaw = $(el).find('endDt').text(); // sometimes provided

            let url = $(el).find('detailUrl').text() || $(el).find('url').text();
            // fallback URL
            if (!url) {
                const id = $(el).find('pbancId').text();
                if (id) url = `https://www.k-startup.go.kr/web/contents/bizPbanc.do?schM=view&pbancId=${id}`;
                else url = `https://www.k-startup.go.kr/common/search/totalSearch.do?searchWord=${encodeURIComponent(title.trim())}`;
            }

            notices.push({
                id: `api-kstartup-${i}-${Date.now()}`,
                title: title.trim(),
                agency: agency.trim(),
                region: '전국',
                category: '창업지원',
                startDate: dateRaw ? dateRaw.split(' ')[0] : new Date().toISOString().split('T')[0],
                endDate: endDateRaw ? endDateRaw.split(' ')[0] : null,
                url,
                source: 'K-Startup(API)',
                description: 'K-Startup 창업지원포털에서 수집된 공고입니다.',
                fetchedAt: new Date()
            });
        });

        console.log(`[OpenAPI] K-Startup fetched ${notices.length} items.`);
        return notices;

    } catch (e) {
        console.error(`[OpenAPI] K-Startup Failed`, e);
        return [];
    }
}

export async function crawlKStartup(): Promise<GovernmentNotice[]> {
    return [];
}


// ... (previous code)

const KOCCA_API_KEY = process.env.KOCCA_API_KEY || '';
const KOCCA_ENDPOINT = 'https://kocca.kr/api/pims/List.do';

export async function fetchFromKocca(): Promise<GovernmentNotice[]> {
    if (!KOCCA_API_KEY) return [];

    try {
        console.log(`[OpenAPI] Fetching from KOCCA...`);
        // KOCCA uses query params directly 
        const params = new URLSearchParams({
            serviceKey: KOCCA_API_KEY,
            pageNo: '1',
            numOfRows: '100', // Max limit based on docs might be 100
            // viewStartDt: '20240101' // Optional, can add if needed
        });

        const response = await axios.get(`${KOCCA_ENDPOINT}?${params.toString()}`, { timeout: 8000 });
        const data = response.data;

        // Response structure: { list: [ ... ] } or { INFO: { list: [...] } } based on different docs.
        // User screenshot shows the JSON structure directly has "list" inside root or "INFO" wrapper?
        // Screenshot shows: { "INFO": { ..., "list": [ ... ] } }
        // Let's handle both just in case.

        const list = data.list || (data.INFO && data.INFO.list) || [];
        const notices: GovernmentNotice[] = [];

        if (Array.isArray(list)) {
            list.forEach((item: any, index: number) => {
                // Date format YYYYMMDD -> YYYY-MM-DD
                const formatDate = (d: string) => d && d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : null;

                const startDate = formatDate(item.startDt);
                const endDate = formatDate(item.endDt);

                notices.push({
                    id: `api-kocca-${item.intcNoSeq || index}-${Date.now()}`,
                    title: item.title,
                    agency: '한국콘텐츠진흥원',
                    region: '전국', // KOCCA is national
                    category: item.cate || '콘텐츠지원',
                    startDate: startDate || new Date().toISOString().split('T')[0],
                    endDate: endDate,
                    url: item.link,
                    source: '한국콘텐츠진흥원(API)',
                    description: `${item.boardTitle || '지원사업'} 공고입니다.`,
                    fetchedAt: new Date()
                });
            });
        }

        console.log(`[OpenAPI] KOCCA fetched ${notices.length} items.`);
        return notices;

    } catch (e) {
        console.error(`[OpenAPI] KOCCA Failed`, e);
        return [];
    }
}

// --- ROBUST MOCK COMPONENT ---

export async function fetchMockNotices(): Promise<GovernmentNotice[]> {
    // Generates 20+ realistic looking notices to simulate "Rich Data" state
    const agencies = ['중소벤처기업부', '소상공인시장진흥공단', '경기도경제과학진흥원', '서울산업진흥원', '부산경제진흥원', '정보통신산업진흥원', '창업진흥원', '한국콘텐츠진흥원'];
    const categories = ['R&D', '금융/자금', '판로/수출', '인력/채용', '창업/벤처', '경영/컨설팅', '기타'];
    const regions = ['전국', '서울', '경기', '부산', '대구', '대전', '광주', '인천', '강원', '제주'];
    const titles = [
        "2024년 창업성장기술개발사업 제1차 시행계획 공고",
        "소상공인 스마트상점 기술보급사업 모집 공고",
        "중소기업 정책자금(운전/시설) 융자계획 공고",
        "글로벌 강소기업 1000+ 프로젝트 참여기업 모집",
        "지역특화산업육성(R&D) 기술개발 지원사업 공고",
        "청년창업사관학교 14기 입교생 모집",
        "데이터바우처 지원사업 수요기업 모집 공고",
        "AI 바우처 지원사업 사업공고",
        "비대면 서비스 바우처 수요기업 모집",
        "수출바우처사업 참여기업 1차 모집공고",
        "소공인 클린제조환경 조성사업 모집 공고",
        "전통시장 활성화 지원사업 통합공고"
    ];

    const notices: GovernmentNotice[] = [];
    const baseDate = new Date();

    for (let i = 0; i < 30; i++) {
        const agency = agencies[Math.floor(Math.random() * agencies.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const region = regions[Math.floor(Math.random() * regions.length)];
        const titleBase = titles[Math.floor(Math.random() * titles.length)];

        // Randomize date (Simulate notices from the last 30 days to today)
        const startOffset = Math.floor(Math.random() * 30) * -1; // -30 to 0 days from now

        const endOffset = Math.floor(Math.random() * 60) + 14;

        const startDate = new Date(baseDate);
        startDate.setDate(baseDate.getDate() + startOffset);

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + endOffset);

        const searchUrl = `https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/list.do?keyword=${encodeURIComponent(titleBase.split('(')[0])}`;

        notices.push({
            id: `mock-${i}`,
            title: `[${region}] ${titleBase} (${i + 1}차)`,
            agency: agency,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            region: region,
            category: category,
            url: searchUrl,
            source: Math.random() > 0.5 ? '기업마당' : 'K-Startup',
            description: `${agency}에서 주관하는 ${category} 분야 지원사업입니다. 자세한 내용은 공고문을 참조하세요.`,
            fetchedAt: new Date()
        });
    }

    return notices.sort((a, b) => new Date(b.startDate || '').getTime() - new Date(a.startDate || '').getTime());
}
