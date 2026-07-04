export type Platform = "tiktok" | "linkedin";

export interface NormalizedPost {
  platform: Platform;
  platformPostId: string;
  title?: string;
  caption?: string;
  durationSeconds?: number;
  publishedAt: string;
  metrics: {
    reach?: number;
    impressions?: number;
    views?: number;
    fullViews?: number;
    completionRate?: number;
    avgWatchTime?: number;
    retentionCurve?: number[];
    ctr?: number;
    shares?: number;
    saves?: number;
    comments?: number;
    likes?: number;
    newFollowers?: number;
    profileClicks?: number;
  };
  raw: unknown;
}
