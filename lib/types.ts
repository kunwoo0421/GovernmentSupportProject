
export interface GovernmentNotice {
    id: string; // Unique identifier from source
    title: string;
    agency: string;
    startDate: string | null;
    endDate: string | null;
    region: string | null;
    category: string | null;
    url: string;
    source: string;
    description: string | null;
    fetchedAt: Date;
}

export type NoticeFilter = {
    keyword?: string;
    region?: string;
    dateStart?: string;
    dateEnd?: string;
};
