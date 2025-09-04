import { Component, inject, signal } from '@angular/core';
import { DataStoreService } from './data.store';
import { parseDailyReport } from './xlsx.parser';
import { ToastrService } from 'ngx-toastr';
import { ConfirmModalComponent } from './confirm-modal.component';
import { ProjectType } from './types';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [ConfirmModalComponent],
  template: `
    <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Дата отчета</label>
            <input type="date" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" [value]="date()" (change)="onDate($event)" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">XLSX файл</label>
            <input type="file" accept=".xlsx,.xls" (change)="onFile($event)" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        <div class="flex items-end">
          <button class="w-full px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md" [disabled]="!file()" (click)="import()">
            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
            </svg>
            Импортировать
          </button>
        </div>
        <div class="flex items-end">
          <button class="w-full px-6 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md" (click)="clearAll()">
            <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Очистить БД
          </button>
        </div>
      </div>
      
      @if (file()) {
        <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-green-800 font-medium">Файл выбран: {{ file()?.name }}</span>
          </div>
        </div>
      }

      <app-confirm-modal
        [isOpen]="showConfirmModal()"
        title="Удаление всех данных"
        message="Вы уверены, что хотите удалить все сохраненные отчеты? Это действие нельзя отменить."
        confirmText="Удалить все"
        (confirm)="confirmClearAll()"
        (cancel)="cancelClearAll()"
      ></app-confirm-modal>
    </div>
  `,
})
export class UploadComponent {
  private store = inject(DataStoreService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  protected file = signal<File | null>(null);
  protected date = signal<string>(new Date().toISOString().slice(0, 10));
  protected showConfirmModal = signal<boolean>(false);

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.file.set(f);
  }

  onDate(e: Event) {
    const input = e.target as HTMLInputElement;
    this.date.set(input.value);
  }

  async import() {
    const f = this.file();
    if (!f) return;
    
    try {
      const report = await parseDailyReport(f, this.date());
      await this.store.upsertReport(report);
      this.file.set(null);
      
      // Обновляем данные в store
      await this.store.loadAll();
      
      // Показываем сообщение об успехе
      this.toastr.success('Данные успешно импортированы!', 'Успех', {
        timeOut: 3000,
        progressBar: true,
        closeButton: true,
      });
      
      // Перезагружаем страницу для обновления данных
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
   } catch (error) {
      this.toastr.error('Ошибка при импорте файла', 'Ошибка', {
        timeOut: 5000,
        progressBar: true,
        closeButton: true,
      });
    }
  }

  clearAll() {
    this.showConfirmModal.set(true);
  }

  async confirmClearAll() {
    try {
      const dates = this.store.dates();
      for (const d of dates) await this.store.deleteReport(d);
      this.toastr.success('Все данные успешно удалены!', 'Успех', {
        timeOut: 3000,
        progressBar: true,
        closeButton: true,
      });
    } catch (error) {
      this.toastr.error('Ошибка при удалении данных', 'Ошибка', {
        timeOut: 5000,
        progressBar: true,
        closeButton: true,
      });
    }
    this.showConfirmModal.set(false);
  }

  cancelClearAll() {
    this.showConfirmModal.set(false);
  }
}


