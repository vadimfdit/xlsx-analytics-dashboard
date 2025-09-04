export interface GoogleAdsConfig {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  customerId: string;
  refreshToken?: string;
  accessToken?: string;
}

// Конфігурація для різних галузей
export const INDUSTRY_CONFIGS = {
  automotive: {
    googleAdsCategory: 'AUTOMOTIVE',
    keywords: ['автомобили', 'машины', 'транспорт', 'автосалон', 'car', 'automotive'],
    industryId: '1001'
  },
  machinery: {
    googleAdsCategory: 'INDUSTRIAL',
    keywords: ['машиностроение', 'оборудование', 'промышленность', 'техника', 'machinery', 'industrial'],
    industryId: '1002'
  },
  agriculture: {
    googleAdsCategory: 'AGRICULTURE',
    keywords: ['сельское хозяйство', 'агро', 'фермерство', 'сельхозтехника', 'agriculture', 'farming'],
    industryId: '1003'
  },
  general: {
    googleAdsCategory: 'GENERAL',
    keywords: ['общие', 'универсальные', 'разные', 'general'],
    industryId: '1000'
  }
};

// Запити для різних метрик
export const GOOGLE_ADS_QUERIES = {
  // Отримання середніх показників по галузі
  industryMetrics: (industryId: string) => `
    SELECT 
      metrics.avg_cpc,
      metrics.avg_cpm,
      metrics.avg_position,
      metrics.click_through_rate,
      metrics.conversion_rate,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      campaign.advertising_channel_type
    FROM campaign 
    WHERE segments.industry_id = '${industryId}'
    AND campaign.status = 'ENABLED'
    AND metrics.impressions > 0
    ORDER BY metrics.impressions DESC
    LIMIT 100
  `,

  // Отримання топ-виконавців
  topPerformers: (industryId: string) => `
    SELECT 
      metrics.avg_cpc,
      metrics.avg_cpm,
      metrics.avg_position,
      metrics.click_through_rate,
      metrics.conversion_rate,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      campaign.advertising_channel_type
    FROM campaign 
    WHERE segments.industry_id = '${industryId}'
    AND campaign.status = 'ENABLED'
    AND metrics.impressions > 1000
    AND metrics.conversion_rate > 0.01
    ORDER BY metrics.conversion_rate DESC
    LIMIT 50
  `,

  // Отримання бюджетних даних
  budgetData: (industryId: string) => `
    SELECT 
      campaign_budget.amount_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      campaign.advertising_channel_type
    FROM campaign_budget
    WHERE segments.industry_id = '${industryId}'
    AND campaign_budget.status = 'ENABLED'
    ORDER BY campaign_budget.amount_micros DESC
    LIMIT 100
  `
};

// Трансформація даних з Google Ads API
export function transformGoogleAdsData(rawData: any[], queryType: string): any {
  if (!rawData || rawData.length === 0) {
    return null;
  }

  const metrics = rawData.reduce((acc, row) => {
    const data = row.results?.[0] || row;
    
    // Сумуємо метрики
    acc.avg_cpc += parseFloat(data.metrics?.avg_cpc || 0);
    acc.avg_cpm += parseFloat(data.metrics?.avg_cpm || 0);
    acc.avg_position += parseFloat(data.metrics?.avg_position || 0);
    acc.click_through_rate += parseFloat(data.metrics?.click_through_rate || 0);
    acc.conversion_rate += parseFloat(data.metrics?.conversion_rate || 0);
    acc.impressions += parseInt(data.metrics?.impressions || 0);
    acc.clicks += parseInt(data.metrics?.clicks || 0);
    acc.conversions += parseInt(data.metrics?.conversions || 0);
    
    // Бюджет (в мікрорах)
    if (data.campaign_budget?.amount_micros) {
      acc.budget_micros += parseInt(data.campaign_budget.amount_micros || 0);
    }
    
    return acc;
  }, {
    avg_cpc: 0,
    avg_cpm: 0,
    avg_position: 0,
    click_through_rate: 0,
    conversion_rate: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    budget_micros: 0
  });

  const count = rawData.length;
  
  return {
    avg_cpc: metrics.avg_cpc / count,
    avg_cpm: metrics.avg_cpm / count,
    avg_position: metrics.avg_position / count,
    click_through_rate: metrics.click_through_rate / count,
    conversion_rate: metrics.conversion_rate / count,
    avg_daily_budget: metrics.budget_micros / count / 1000000, // Конвертуємо в долари
    avg_conversions: metrics.conversions / count,
    total_impressions: metrics.impressions,
    total_clicks: metrics.clicks
  };
}
