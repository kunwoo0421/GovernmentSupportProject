
import React from 'react';
import { Calendar, MapPin, Building2, ExternalLink } from 'lucide-react';
import { GovernmentNotice } from '@/lib/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NoticeCardProps {
    notice: GovernmentNotice;
}

export function NoticeCard({ notice }: NoticeCardProps) {
    const formattedDate = notice.startDate ? format(new Date(notice.startDate), 'PPP', { locale: ko }) : '기간 미정';
    const deadline = notice.endDate ? format(new Date(notice.endDate), 'PPP', { locale: ko }) : '상시 모집';

    return (
        <div className="group relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {notice.source || 'Other'}
                        </span>
                        {notice.category && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {notice.category}
                            </span>
                        )}
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#27273f] transition-colors line-clamp-2">
                            <a href={notice.url} target="_blank" rel="noopener noreferrer" className="focus:outline-none">
                                <span className="absolute inset-0" aria-hidden="true" />
                                {notice.title}
                            </a>
                        </h3>
                    </div>
                    <div className="flex-shrink-0 text-gray-300 group-hover:text-[#27273f] transition-colors">
                        <ExternalLink className="w-5 h-5" />
                    </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">
                    {notice.description}
                </p>

                <div className="pt-4 flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-500 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{notice.agency}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{notice.region || '전국'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto text-xs font-medium text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{formattedDate} ~ {deadline}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
