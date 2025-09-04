import * as XLSX from 'xlsx';
import type { Campaign, CampaignRowMetrics, DailyReport, Subgroup, ProjectType } from './types';

function parseEuro(value: any): number {
  if (value == null || value === '-') return 0;
  const s = String(value).replace(/[^0-9,\.\-]/g, '').replace(',', '.');
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

function parsePercent(value: any): number {
  if (value == null || value === '-') return 0;
  const s = String(value).replace('%', '').replace(',', '.');
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

function parseIntSafe(value: any): number {
  if (value == null || value === '-') return 0;
  const s = String(value).replace(/[^0-9\-\.]/g, '');
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

function metricsFromRow(row: Record<string, any>): CampaignRowMetrics {
  return {
    budgetEur: parseEuro(row['F']), // Бюджет текущий период
    conversions: parseIntSafe(row['I']), // Конверсии текущий период
    sendNewMessage: parseIntSafe(row['J']), // send_new_message
    salesFullTel: parseIntSafe(row['K']), // sales_full_tel
    buttonMessenger: parseIntSafe(row['L']), // button_messenger
    impressions: parseIntSafe(row['M']), // Показы текущий период
    clicks: parseIntSafe(row['N']), // Клики текущий период
    cpmEur: parseEuro(row['O']), // СРМ текущий период
    ctrPercent: parsePercent(row['P']), // CTR текущий период
    crPercent: parsePercent(row['Q']), // CR текущий период
  };
}

export function parseDailyReport(file: File, dateId: string, project: ProjectType): Promise<DailyReport> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 'A' });

        // Находим все пустые строки
        const emptyRows = rows.map((row, i) => ({ index: i, name: row['A'] }))
          .filter(item => !item.name || item.name.toString().trim() === '');

        const campaigns: Campaign[] = [];
        let total: CampaignRowMetrics = {
          budgetEur: 0, conversions: 0, sendNewMessage: 0, salesFullTel: 0,
          buttonMessenger: 0, impressions: 0, clicks: 0, cpmEur: 0, ctrPercent: 0, crPercent: 0,
        };
        let totalParsed = false;

        // Ищем общий итог (ВСЕГО)
        for (const row of rows) {
          const name = String(row?.['A'] ?? '').trim();
          if (/^всего|total|итого/i.test(name)) {
            total = metricsFromRow(row);
            totalParsed = true;
            break;
          }
        }

        // Список ожидаемых кампаний
        const expectedCampaigns = [
          'Африка_Инфо_Автолайн', 'Африка_Французкий_Автолайн', 'Арабские_Автолайн', 'Anema-Клиент',
          'Чехия_Автолайн', 'Чехия_машины', 'Клиент Business Lease', 'Клиент glwlkw',
          'Германия_Автолайн', 'Испания_Автолайн', 'Франция_Автолайн', 'Венгрия_Автолайн',
          'Венгрия_машины', 'Италия_Автолайн', 'Нидерланды_Автолайн', 'Польша_Автолайн',
          'Португалия_Автолайн', 'Румыния_Автолайн', 'Словакия_машины', 'Словакия_Автолайн',
          'Турция_Автолайн', 'Украина_Автолайн', 'Великобритания_Автолайн'
        ];
        


        // Ищем кампании по названиям и структуре
        let i = 0;
        let previousWasEmpty = false;
        
        while (i < rows.length) {
          const row = rows[i];
          const name = String(row?.['A'] ?? '').trim();
          
          // Если пустая строка - устанавливаем флаг
          if (!name) {
            previousWasEmpty = true;
            i++;
            continue;
          }
          
          // Пропускаем заголовки
          if (/^всего|total|итого/i.test(name)) {
            previousWasEmpty = false;
            i++;
            continue;
          }
          
          // Проверяем является ли это кампанией
          const hasData = (row['F'] && parseEuro(row['F']) > 0) || 
                         (row['M'] && parseIntSafe(row['M']) > 0) ||
                         (row['I'] && parseIntSafe(row['I']) > 0);
          
          const isNotHeader = !/^всего|total|итого|бренд|brand/i.test(name);
          
          // Кампанія - це рядок з даними, який йде після порожнього рядка АБО є в списку очікуваних кампаній
          const isExpectedCampaign = expectedCampaigns.some(expected => 
            name.includes(expected) || expected.includes(name)
          );
          const isCampaign = hasData && isNotHeader && (previousWasEmpty || isExpectedCampaign);
          
          if (isCampaign) {
            const campaignMetrics = metricsFromRow(row);
            const campaign: Campaign = {
              name,
              ...campaignMetrics,
              subgroups: [],
            };

            // Ищем подгруппы до следующей пустой строки или кампании
            previousWasEmpty = false; // Сбрасываем флаг после нахождения кампании
            i++;
            
            while (i < rows.length) {
              const subRow = rows[i];
              const subName = String(subRow?.['A'] ?? '').trim();
              
              // Если пустая строка - выходим
              if (!subName) {
                break;
              }
              
              // Проверяем не является ли это следующей кампанией
              const subHasData = subRow['F'] || subRow['I'] || subRow['M'] || subRow['N'];
              const subIsExpectedCampaign = expectedCampaigns.some(expected => 
                subName.includes(expected) || expected.includes(subName)
              );
              
              // Если это следующая кампания - выходим
              if (subIsExpectedCampaign && subHasData) {
                break;
              }
              
              // Если подгруппа имеет данные - добавляем её
              if (subHasData && subName.trim()) {
                const subgroup: Subgroup = {
                  name: subName,
                  ...metricsFromRow(subRow),
                };
                campaign.subgroups.push(subgroup);
              }
              i++;
            }
            
            campaigns.push(campaign);
          } else {
            i++;
          }
        }

        const foundCampaigns = campaigns.map(c => c.name);
        const missingCampaigns = expectedCampaigns.filter(name => !foundCampaigns.includes(name));
        const extraCampaigns = foundCampaigns.filter(name => !expectedCampaigns.includes(name));

                 const report: DailyReport = {
           id: dateId,
           date: dateId,
           project,
           total,
           campaigns,
         };
        resolve(report);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}


