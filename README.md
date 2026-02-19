
# Government Support Notice Crawler (Draft)

이 프로젝트는 정부지원사업 공고를 모아서 보여주는 서비스의 초안입니다.

## 🚀 기능 (Features)
1. **공고 목록 리스팅**: 모의 데이터(Mock Data)를 통해 공고 리스트를 보여줍니다.
2. **검색 및 필터**: 키워드 및 지역별 필터링 기능을 제공합니다.
3. **법적 준수(Compliance)**: 
   - 기본적으로 `data.go.kr`의 Open API 사용을 권장하는 구조로 되어 있습니다.
   - 크롤링이 필요한 경우 `robots.txt`를 준수하도록 가이드합니다.

## 🛠️ 기술 스택 (Tech Stack)
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (Optional for draft)
- **Deployment**: Vercel

## 🏁 시작하기 (Getting Started)

### 1. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수를 설정하세요 (선택 사항):

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
DATA_GO_KR_API_KEY=your-open-api-key
```

### 2. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000`을 엽니다.

## 📂 프로젝트 구조
- `app/page.tsx`: 메인 페이지 (검색, 리스트 UI)
- `app/api/notices/route.ts`: API 엔드포인트 (Supabase 또는 Mock 데이터 반환)
- `lib/crawler.ts`: 데이터 수집 로직 (Mock 데이터 생성기 포함)
- `lib/supabase.ts`: Supabase 클라이언트 설정

## ⚠️ 주의사항
- 현재는 **Mock Data**를 반환하도록 설정되어 있습니다. 
- 실제 데이터를 사용하려면 `lib/crawler.ts`의 `fetchFromOpenAPI` 함수에 API 키를 연동하거나, Supabase에 데이터를 채워넣어야 합니다.
