
const axios = require('axios');
const cheerio = require('cheerio');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const DATA_GO_KR_API_KEY = process.env.DATA_GO_KR_API_KEY;
const OPEN_API_URL = 'http://apis.data.go.kr/1421000/mssBizService_v2/getbizList_v2';

async function debugMss() {
    console.log("Debug MSS API...");
    if (!DATA_GO_KR_API_KEY) {
        console.error("No API Key");
        return;
    }

    try {
        const queryString = `serviceKey=${DATA_GO_KR_API_KEY}&pageNo=1&numOfRows=1`;
        console.log(`Fetching ${OPEN_API_URL}?`);

        const response = await axios.get(`${OPEN_API_URL}?${queryString}`, { timeout: 10000 });
        console.log("Response Status:", response.status);

        const rawData = response.data;
        // console.log("--- RAW XML START ---");
        // console.log(rawData.substring(0, 2000)); // Print first 2000 chars (truncated)
        // console.log("--- RAW XML END ---");

        const $ = cheerio.load(rawData, { xmlMode: true });

        $('item').each((i, el) => {
            console.log(`\n--- ITEM ${i} ---`);
            const children = $(el.children).filter(n => n.type === 'tag');
            // Cheerio structure for children is tricky sometimes with whitespace text nodes.
            // Using .children() is safer.
            $(el).children().each((j, child) => {
                console.log(`${child.tagName}: ${$(child).text()}`);
            });
        });

    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error("Response:", e.response.data);
    }
}

debugMss();
