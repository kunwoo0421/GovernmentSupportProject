
import React from 'react';
import { ExternalLink, Calendar, MapPin, Tag } from 'lucide-react';
import { GovernmentNotice } from '@/lib/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NoticeListItemProps {
    notice: GovernmentNotice;
}

export function NoticeListItem({ notice }: NoticeListItemProps) {
    const formattedStart = notice.startDate ? format(new Date(notice.startDate), 'yyyy-MM-dd') : '-';
    const formattedEnd = notice.endDate ? format(new Date(notice.endDate), 'yyyy-MM-dd') : '상시';

    // Calculate D-Day if needed, or status
    const today = new Date();

    return (
        <div className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl border border-gray-100 hover:border-[#27273f]/50 hover:shadow-md transition-all duration-200">

            {/* Category/Status Badge Area */}
            <div className="flex flex-row sm:flex-col gap-2 min-w-[80px] sm:min-w-[100px] text-center">
                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 group-hover:bg-[#27273f]/10 group-hover:text-[#27273f] transition-colors">
                    {notice.category || '기타'}
                </span>
                <span className="text-xs text-gray-400 font-medium hidden sm:block">
                    {notice.agency}
                </span>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-2 mb-1 sm:hidden">
                    <span className="text-xs text-gray-400 truncate max-w-[100px]">{notice.agency}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-400">{notice.region || '전국'}</span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#27273f] transition-colors pr-8 sm:pr-0 line-clamp-1 sm:line-clamp-2 leading-tight">
                    <a href={notice.url} target="_blank" rel="noopener noreferrer" className="hover:underline focus:outline-none before:absolute before:inset-0 sm:before:hidden">
                        {notice.title}
                    </a>
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{notice.region || '전국'}</span>
                    </div>
                    <div className="hidden sm:block w-px h-3 bg-gray-300 mx-1" />
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedStart} ~ {formattedEnd}</span>
                    </div>
                    {/* Source Tag - Prominent Badge */}
                    <div className="ml-auto sm:ml-3 shrink-0">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border
                             ${notice.source?.includes('기업마당') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                notice.source?.includes('K-Startup') ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                    'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                        >
                            {notice.source}
                        </span>
                    </div>
                </div>
            </div>

            {/* Action/Link Icon (Desktop) */}
            <div className="hidden sm:flex flex-shrink-0 ml-4 self-center">
                <a
                    href={notice.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-[#27273f] hover:bg-[#27273f]/10 rounded-full transition-all"
                >
                    <ExternalLink className="w-5 h-5" />
                </a>
            </div>
        </div>
    );
}
