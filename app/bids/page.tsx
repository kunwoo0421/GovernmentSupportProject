'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { NoticeListItem } from '@/components/NoticeListItem';
import { GovernmentNotice } from '@/lib/types';

export default function BidsPage() {
    const [bids, setBids] = useState<GovernmentNotice[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchBids = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const res = await fetch(`/api/bids?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setBids(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBids();
    }, []); // Initial load

    return (
        <main className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2 text-blue-800 hover:text-blue-600 font-bold text-lg">
                        ⬅ 메인으로 돌아가기
                    </a>
                    <h1 className="text-xl font-bold text-gray-900">나라장터 입찰공고 조회</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search & Filter */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">공고명 검색</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchBids()}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="입찰 공고명 입력 (예: 용역, 공사)"
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-auto">
                            <label className="block text-sm font-medium text-gray-700 mb-1">조회 시작일</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>

                        <div className="w-full md:w-auto">
                            <label className="block text-sm font-medium text-gray-700 mb-1">조회 종료일</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>

                        <button
                            onClick={fetchBids}
                            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            조회하기
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">
                            검색 결과 <span className="text-blue-600 ml-1">{bids.length}</span>건
                        </h2>
                        <span className="text-sm text-gray-500">* 최근 1개월 공고 기준 (날짜 선택 가능)</span>
                    </div>

                    {loading ? (
                        <div className="space-y-3 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-white rounded-xl border border-gray-100"></div>
                            ))}
                        </div>
                    ) : bids.length > 0 ? (
                        <div className="space-y-3">
                            {bids.map((bid) => (
                                <NoticeListItem key={bid.id} notice={bid} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                            <p className="text-gray-500">조회된 입찰 공고가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
