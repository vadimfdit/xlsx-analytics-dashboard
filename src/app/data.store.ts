import { Injectable, computed, effect, signal } from '@angular/core';
import { openDB, type IDBPDatabase } from 'idb';
import type { DailyReport, ReportIndex, ProjectType } from './types';

const DB_NAME = 'analytics-db-v1';
const DB_STORE = 'reports';

@Injectable({ providedIn: 'root' })
export class DataStoreService {
  private db: IDBPDatabase | null = null;
  private reportsMap = signal<ReportIndex>({});

  readonly dates = computed(() => Object.keys(this.reportsMap()).sort());
  readonly reports = computed(() => this.dates().map(d => this.reportsMap()[d]));

  constructor() {
    void this.init();
    // автосинк в IndexedDB
    effect(() => {
      const map = this.reportsMap();
      void this.persistAll(Object.values(map));
    });
  }

  private async init(): Promise<void> {
    this.db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE, { keyPath: 'id' });
        }
      },
    });
    await this.loadAll();
  }

  async loadAll(): Promise<void> {
    if (!this.db) return;
    const tx = this.db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const items = await store.getAll();
    const map: ReportIndex = {};
    for (const r of items as DailyReport[]) {
      map[r.id] = r;
    }
    this.reportsMap.set(map);
    console.log('📥 Загружено отчетів:', items.length);
    items.forEach(report => {
      console.log('  -', report.id, 'проект:', report.project, 'кампаній:', report.campaigns.length);
    });
  }

  async upsertReport(report: DailyReport): Promise<void> {
    console.log('💾 Сохраняем отчет:', report.id, 'проект:', report.project, 'кампаній:', report.campaigns.length);
    const map = { ...this.reportsMap() };
    map[report.id] = report;
    this.reportsMap.set(map);
    console.log('✅ Отчет сохранен успешно');
  }

  async deleteReport(dateId: string): Promise<void> {
    const map = { ...this.reportsMap() };
    delete map[dateId];
    this.reportsMap.set(map);
    if (!this.db) return;
    const tx = this.db.transaction(DB_STORE, 'readwrite');
    await tx.store.delete(dateId);
    await tx.done;
  }

  async clearAll(): Promise<void> {
    this.reportsMap.set({});
    if (!this.db) return;
    const tx = this.db.transaction(DB_STORE, 'readwrite');
    await tx.store.clear();
    await tx.done;
  }

  async getReportsByProject(project: ProjectType): Promise<DailyReport[]> {
    if (!this.db) return [];
    const tx = this.db.transaction(DB_STORE, 'readonly');
    const allReports = await tx.store.getAll();
    return allReports.filter(report => report.project === project);
  }

  private async persistAll(reports: DailyReport[]): Promise<void> {
    if (!this.db) return;
    const tx = this.db.transaction(DB_STORE, 'readwrite');
    for (const r of reports) {
      await tx.store.put(r);
    }
    await tx.done;
  }
}


