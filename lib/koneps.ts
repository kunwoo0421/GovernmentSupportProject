import axios from 'axios';
import { GovernmentNotice } from './types';

// Using JSON output from BidPublicInfoService
// Base URL from user provided: https://apis.data.go.kr/1230000/ad/BidPublicInfoService
// But standard modern endpoint is BidPublicInfoService04. We will try 04.
const KONEPS_BASE_URL = 'http://apis.data.go.kr/1230000/BidPublicInfoService04';

const KONEPS_API_KEY = process.env.KONEPS_API_KEY || '';

// Operation for Goods
const OP_THNG = 'getBidPblancListInfoThng';
// Operation for Services
const OP_SERVC = 'getBidPblancListInfoServc';
// Operation for Construction
const OP_CNST = 'getBidPblancListInfoCnstwk';

export async function fetchKonepsBids(
    keyword?: string,
    startDate?: string,
    endDate?: string
): Promise<GovernmentNotice[]> {
    if (!KONEPS_API_KEY) return [];

    const notices: GovernmentNotice[] = [];

    // Helper to fetch one type
    const fetchType = async (operation: string, typeName: string) => {
        try {
            // Manual query string for key safety
            // inqryDiv=1 (Search by Notification Date)
            const bgnDate = startDate ? startDate.replace(/-/g, '') + '0000' : getRecentDate(30);
            const endDateParam = endDate ? endDate.replace(/-/g, '') + '2359' : getRecentDate(0, true);

            let query = `serviceKey=${KONEPS_API_KEY}&numOfRows=50&pageNo=1&type=json`;
            query += `&inqryDiv=1&inqryBgnDt=${bgnDate}&inqryEndDt=${endDateParam}`;

            if (keyword) {
                query += `&bidNtceNm=${encodeURIComponent(keyword)}`;
            }

            const url = `${KONEPS_BASE_URL}/${operation}?${query}`;
            console.log(`[KONEPS] Fetching ${typeName} from ${url.substring(0, 60)}...`);

            const response = await axios.get(url, { timeout: 10000 });
            const body = response.data?.response?.body;

            if (!body || !body.items) {
                // console.log(`[KONEPS] No items for ${typeName}`);
                return;
            }

            const items = Array.isArray(body.items) ? body.items : [body.items];

            items.forEach((item: any) => {
                // Mapping KONEPS fields
                // bidNtceNo (Conf No), bidNtceOrd (Ord), bidNtceNm (Title), dminsttNm (Agency), bidNtceDt (Date)
                // bidClseDt (Deadline), bidNtceDtlUrl (URL)

                notices.push({
                    id: `koneps-${item.bidNtceNo}-${item.bidNtceOrd}`,
                    title: item.bidNtceNm,
                    agency: item.dminsttNm,
                    region: item.inrdRgnNm || '전국',
                    category: typeName, // '물품', '용역', '공사'
                    startDate: item.bidNtceDt ? item.bidNtceDt.substring(0, 10) : new Date().toISOString().split('T')[0],
                    endDate: item.bidClseDt ? item.bidClseDt.substring(0, 10) : null,
                    url: item.bidNtceDtlUrl,
                    source: '나라장터(KONEPS)',
                    description: `[${typeName}] ${item.dminsttNm} 공고`,
                    fetchedAt: new Date()
                });
            });

        } catch (e) {
            console.error(`[KONEPS] Error fetching ${typeName}`, e);
        }
    };

    // Parallel fetch for Goods and Services (Construction maybe later)
    await Promise.all([
        fetchType(OP_THNG, '물품'),
        fetchType(OP_SERVC, '용역'),
        fetchType(OP_CNST, '공사')
    ]);

    // Sort by date desc
    return notices.sort((a, b) => new Date(b.startDate || '').getTime() - new Date(a.startDate || '').getTime());
}

function getRecentDate(daysAgo: number, isEnd = false): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${isEnd ? '2359' : '0000'}`;
}
