
'use client';

import { useState, useEffect, Suspense } from 'react';
import { Search, MapPin, Filter, RefreshCw } from 'lucide-react';
import { NoticeListItem } from '@/components/NoticeListItem';
import { GovernmentNotice } from '@/lib/types';

export default function Home() {
  const [notices, setNotices] = useState<GovernmentNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState('');
  const [agency, setAgency] = useState('');

  // Advanced Filter State
  const [startDateFrom, setStartDateFrom] = useState('');
  const [startDateTo, setStartDateTo] = useState('');
  const [endDateFrom, setEndDateFrom] = useState('');
  const [endDateTo, setEndDateTo] = useState('');

  // Sorting
  const [sort, setSort] = useState('recent'); // recent, deadline, crawled
  const [showFilters, setShowFilters] = useState(false); // Toggle advanced filters

  // Debounce search
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
  const [debouncedAgency, setDebouncedAgency] = useState(agency);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setDebouncedAgency(agency);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, agency]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedKeyword) params.append('keyword', debouncedKeyword);
      if (region) params.append('region', region);
      if (category) params.append('category', category);
      if (debouncedAgency) params.append('agency', debouncedAgency);

      if (startDateFrom) params.append('startDateFrom', startDateFrom);
      if (startDateTo) params.append('startDateTo', startDateTo);
      if (endDateFrom) params.append('endDateFrom', endDateFrom);
      if (endDateTo) params.append('endDateTo', endDateTo);

      params.append('sort', sort);

      const res = await fetch(`/api/notices?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNotices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [debouncedKeyword, debouncedAgency, region, category, startDateFrom, startDateTo, endDateFrom, endDateTo, sort]);

  const regions = ['전국', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
  const categories = ['기술개발(R&D)', '금융/자금', '창업/벤처', '판로/수출', '인력/채용', '경영/컨설팅', '기타'];

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <div className="relative bg-[#27273f] pt-20 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-medium">
              중소기업을 위한 실시간 정부지원사업 통합 검색
            </span>
            <div className="flex items-center gap-1.5 select-none">
              <span className="text-blue-300/80 text-xs font-medium">by</span>
              <a
                href="https://withalice.team"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/withalice_logo.png" alt="WithAlice" className="h-6 w-auto object-contain" />
              </a>
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-8">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-100 to-purple-200">우리 회사에 맞는 공고</span>를 찾아보세요
          </h1>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto transform hover:scale-[1.01] transition-transform duration-300">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-16 pr-6 py-4 rounded-xl text-lg bg-white/95 backdrop-blur-md border border-white/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-xl transition-all"
              placeholder="관심 키워드 검색 (예: 소상공인, AI, 마케팅)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="mt-6 flex justify-center">
            <a href="/bids" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-indigo-100 text-sm font-medium transition-all backdrop-blur-sm">
              📢 나라장터 입찰공고 조회하기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-20">

        {/* Filters Panel */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 mb-8 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">

            {/* Left: Filters */}
            <div className="flex flex-col gap-3 w-full">
              <div className="flex flex-wrap items-center gap-3 w-full">
                <div className="flex items-center gap-2 text-gray-600 mr-2 shrink-0">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-semibold">필터</span>
                </div>

                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="form-select block w-full sm:w-auto min-w-[120px] pl-3 pr-8 py-2 text-sm border-gray-200 bg-gray-50 rounded-lg hover:bg-white focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
                >
                  <option value="">전체 지역</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-select block w-full sm:w-auto min-w-[120px] pl-3 pr-8 py-2 text-sm border-gray-200 bg-gray-50 rounded-lg hover:bg-white focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
                >
                  <option value="">전체 분야</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="form-select block w-full sm:w-auto min-w-[120px] pl-3 pr-8 py-2 text-sm border-gray-200 bg-gray-50 rounded-lg hover:bg-white focus:ring-2 focus:ring-blue-500 transition-colors font-medium text-blue-900 cursor-pointer"
                >
                  <option value="recent">최신 공고순</option>
                  <option value="deadline">마감 임박순</option>
                  <option value="crawled">수집 최신순</option>
                </select>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`text-sm px-3 py-2 rounded-lg transition-colors ml-auto md:ml-0 flex items-center gap-1 ${showFilters ? 'bg-[#27273f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  상세 검색 <span className="text-xs">{showFilters ? '▲' : '▼'}</span>
                </button>
              </div>

              {/* Advanced Filters (Toggle) */}
              {showFilters && (
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-gray-500">주관기관 (담당부처)</label>
                    <input
                      type="text"
                      value={agency}
                      onChange={(e) => setAgency(e.target.value)}
                      placeholder="예: 창업진흥원, 서울산업진흥원"
                      className="form-input block w-full text-sm border-gray-300 rounded-md p-2 placeholder-gray-400 focus:ring-2 focus:ring-[#27273f]/20 focus:border-[#27273f] transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">공고일 (기간)</label>
                    <div className="flex items-center gap-2">
                      <input type="date" value={startDateFrom} onChange={e => setStartDateFrom(e.target.value)} className="form-input block w-full text-sm border-gray-300 rounded-md p-2" />
                      <span className="text-gray-400">~</span>
                      <input type="date" value={startDateTo} onChange={e => setStartDateTo(e.target.value)} className="form-input block w-full text-sm border-gray-300 rounded-md p-2" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">마감일 (접수기간)</label>
                    <div className="flex items-center gap-2">
                      <input type="date" value={endDateFrom} onChange={e => setEndDateFrom(e.target.value)} className="form-input block w-full text-sm border-gray-300 rounded-md p-2" />
                      <span className="text-gray-400">~</span>
                      <input type="date" value={endDateTo} onChange={e => setEndDateTo(e.target.value)} className="form-input block w-full text-sm border-gray-300 rounded-md p-2" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* List Header / Meta */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm text-gray-500 mt-2">
            <span>총 <strong className="text-gray-900">{notices.length}</strong>건의 공고가 있습니다.</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchNotices()}
                className="flex items-center gap-1 hover:text-[#27273f] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>새로고침</span>
              </button>
            </div>
          </div>
        </div>

        {/* List View */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-white rounded-xl border border-gray-100 shadow-sm"></div>
            ))}
          </div>
        ) : notices.length > 0 ? (
          <div className="space-y-3">
            {notices.map((notice, idx) => (
              <NoticeListItem key={notice.id || idx} notice={notice} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-500">다른 키워드나 필터 조건을 변경해보세요.</p>
          </div>
        )}
      </div>
    </main>
  );
}
