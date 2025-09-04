export type MoneyEur = number; // значення у євро

export interface CampaignRowMetrics {
  budgetEur: MoneyEur;
  conversions: number;
  sendNewMessage: number;
  salesFullTel: number;
  buttonMessenger: number;
  impressions: number;
  clicks: number;
  cpmEur: number; // за 1000 показів
  ctrPercent: number; // 0..100
  crPercent: number; // 0..100
}

export interface Subgroup extends CampaignRowMetrics {
  name: string; // підгрупа
}

export interface Campaign extends CampaignRowMetrics {
  name: string; // назва кампанії
  subgroups: Subgroup[];
}

export interface DailyReport {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  total: CampaignRowMetrics;
  campaigns: Campaign[];
}

export type ReportIndex = Record<string, DailyReport>; // by date

export interface DeltaMetric {
  value: number;
  absChange: number;
  pctChange: number; // -100..+∞
}

export interface CampaignRowWithDelta extends CampaignRowMetrics {
  deltas?: Partial<Record<keyof CampaignRowMetrics, DeltaMetric>>;
}


