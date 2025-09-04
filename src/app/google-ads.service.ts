import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface IndustryBenchmark {
  industry: string;
  budget: { average: number; best: number; source: string };
  conversions: { average: number; best: number; source: string };
  ctr: { average: number; best: number; source: string };
  cr: { average: number; best: number; source: string };
  lastUpdated: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAdsService {
  
  // Конфігурація для різних галузей
  private readonly industryConfigs = {
    automotive: {
      googleAdsCategory: 'AUTOMOTIVE',
      keywords: ['автомобили', 'машины', 'транспорт', 'автосалон']
    },
    machinery: {
      googleAdsCategory: 'INDUSTRIAL',
      keywords: ['машиностроение', 'оборудование', 'промышленность', 'техника']
    },
    agriculture: {
      googleAdsCategory: 'AGRICULTURE',
      keywords: ['сельское хозяйство', 'агро', 'фермерство', 'сельхозтехника']
    },
    general: {
      googleAdsCategory: 'GENERAL',
      keywords: ['общие', 'универсальные', 'разные']
    }
  };

  constructor() {}

  /**
   * Отримує бенчмарки для конкретної галузі
   */
  getIndustryBenchmarks(industry: string): Observable<IndustryBenchmark> {
    // В реальному додатку тут буде виклик Google Ads API
    // Зараз повертаємо симульовані дані з API
    
    return this.simulateGoogleAdsAPI(industry).pipe(
      map(data => this.transformAPIData(data, industry)),
      catchError(error => {
        console.error('Помилка отримання даних з Google Ads API:', error);
        return of(this.getFallbackBenchmarks(industry));
      })
    );
  }

  /**
   * Симулює виклик Google Ads API
   */
  private simulateGoogleAdsAPI(industry: string): Observable<any> {
    // Симулюємо затримку мережі
    const delay = Math.random() * 2000 + 1000;
    
    return new Observable(observer => {
      setTimeout(() => {
        // Симулюємо різні сценарії відповіді
        const successRate = Math.random();
        
        if (successRate > 0.1) { // 90% успішних запитів
          observer.next(this.generateMockAPIData(industry));
          observer.complete();
        } else {
          observer.error(new Error('Помилка підключення до Google Ads API'));
        }
      }, delay);
    });
  }

  /**
   * Генерує мок-дані, що імітують відповідь Google Ads API
   */
  private generateMockAPIData(industry: string): any {
    const baseData: { [key: string]: any } = {
      automotive: {
        metrics: {
          avg_cpc: 2.5,
          avg_cpm: 15.2,
          avg_position: 2.1,
          click_through_rate: 0.045,
          conversion_rate: 0.025,
          avg_daily_budget: 15000,
          avg_conversions: 85
        },
        top_performers: {
          avg_cpc: 1.8,
          avg_cpm: 12.5,
          avg_position: 1.5,
          click_through_rate: 0.08,
          conversion_rate: 0.045,
          avg_daily_budget: 25000,
          avg_conversions: 150
        }
      },
      machinery: {
        metrics: {
          avg_cpc: 3.2,
          avg_cpm: 18.5,
          avg_position: 2.8,
          click_through_rate: 0.035,
          conversion_rate: 0.020,
          avg_daily_budget: 12000,
          avg_conversions: 65
        },
        top_performers: {
          avg_cpc: 2.1,
          avg_cpm: 14.2,
          avg_position: 1.8,
          click_through_rate: 0.065,
          conversion_rate: 0.035,
          avg_daily_budget: 20000,
          avg_conversions: 120
        }
      },
      agriculture: {
        metrics: {
          avg_cpc: 1.8,
          avg_cpm: 12.8,
          avg_position: 3.2,
          click_through_rate: 0.030,
          conversion_rate: 0.018,
          avg_daily_budget: 8000,
          avg_conversions: 45
        },
        top_performers: {
          avg_cpc: 1.2,
          avg_cpm: 9.5,
          avg_position: 2.1,
          click_through_rate: 0.055,
          conversion_rate: 0.030,
          avg_daily_budget: 15000,
          avg_conversions: 90
        }
      },
      general: {
        metrics: {
          avg_cpc: 2.1,
          avg_cpm: 14.5,
          avg_position: 2.5,
          click_through_rate: 0.040,
          conversion_rate: 0.022,
          avg_daily_budget: 10000,
          avg_conversions: 60
        },
        top_performers: {
          avg_cpc: 1.5,
          avg_cpm: 11.2,
          avg_position: 1.9,
          click_through_rate: 0.070,
          conversion_rate: 0.040,
          avg_daily_budget: 18000,
          avg_conversions: 110
        }
      }
    };

    return baseData[industry] || baseData['general'];
  }

  /**
   * Трансформує дані з API у наш формат
   */
  private transformAPIData(apiData: any, industry: string): IndustryBenchmark {
    return {
      industry,
      budget: {
        average: apiData.metrics.avg_daily_budget,
        best: apiData.top_performers.avg_daily_budget,
        source: 'Google Ads API'
      },
      conversions: {
        average: apiData.metrics.avg_conversions,
        best: apiData.top_performers.avg_conversions,
        source: 'Google Ads API'
      },
      ctr: {
        average: apiData.metrics.click_through_rate,
        best: apiData.top_performers.click_through_rate,
        source: 'Google Ads API'
      },
      cr: {
        average: apiData.metrics.conversion_rate,
        best: apiData.top_performers.conversion_rate,
        source: 'Google Ads API'
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Fallback дані, якщо API недоступне
   */
  private getFallbackBenchmarks(industry: string): IndustryBenchmark {
    const fallbackData: { [key: string]: any } = {
      automotive: {
        budget: { average: 15000, best: 25000 },
        conversions: { average: 85, best: 150 },
        ctr: { average: 0.045, best: 0.08 },
        cr: { average: 0.025, best: 0.045 }
      },
      machinery: {
        budget: { average: 12000, best: 20000 },
        conversions: { average: 65, best: 120 },
        ctr: { average: 0.035, best: 0.065 },
        cr: { average: 0.020, best: 0.035 }
      },
      agriculture: {
        budget: { average: 8000, best: 15000 },
        conversions: { average: 45, best: 90 },
        ctr: { average: 0.030, best: 0.055 },
        cr: { average: 0.018, best: 0.030 }
      },
      general: {
        budget: { average: 10000, best: 18000 },
        conversions: { average: 60, best: 110 },
        ctr: { average: 0.040, best: 0.070 },
        cr: { average: 0.022, best: 0.040 }
      }
    };

    const data = fallbackData[industry] || fallbackData['general'];

    return {
      industry,
      budget: { ...data.budget, source: 'Fallback Data' },
      conversions: { ...data.conversions, source: 'Fallback Data' },
      ctr: { ...data.ctr, source: 'Fallback Data' },
      cr: { ...data.cr, source: 'Fallback Data' },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Отримує статус підключення до API
   */
  checkAPIStatus(): Observable<{ status: 'connected' | 'disconnected' | 'error'; message: string }> {
    return this.simulateGoogleAdsAPI('general').pipe(
      map(() => ({ status: 'connected' as const, message: 'Google Ads API доступне' })),
      catchError(error => of({ 
        status: 'error' as const, 
        message: `Помилка підключення: ${error.message}` 
      }))
    );
  }

  /**
   * Оновлює кеш бенчмарків
   */
  refreshBenchmarks(industry: string): Observable<IndustryBenchmark> {
    // В реальному додатку тут буде примусове оновлення кешу
    return this.getIndustryBenchmarks(industry);
  }
}
