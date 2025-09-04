import { Component, inject, signal } from '@angular/core';
import { DataStoreService } from './data.store';
import { parseDailyReport, parseAllSheets } from './xlsx.parser';
import { ToastrService } from 'ngx-toastr';
import { ConfirmModalComponent } from './confirm-modal.component';
import { ProjectType } from './types';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [ConfirmModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Режим загрузки -->
      <div class="flex items-center justify-center space-x-4 mb-6">
        <button 
          class="px-4 py-2 rounded-lg transition-all duration-200"
          [class]="uploadMode() === 'single' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
          (click)="setUploadMode('single')"
        >
          Один файл
        </button>
        <button 
          class="px-4 py-2 rounded-lg transition-all duration-200"
          [class]="uploadMode() === 'multiple' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
          (click)="setUploadMode('multiple')"
        >
          Несколько файлов
        </button>
      </div>

      <!-- Одиночный режим -->
      @if (uploadMode() === 'single') {
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
      }

      <!-- Множественный режим -->
      @if (uploadMode() === 'multiple') {
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Выберите файлы XLSX</label>
            <input type="file" accept=".xlsx,.xls" multiple (change)="onMultipleFiles($event)" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          
          <div class="flex items-center space-x-4">
            <button class="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md" [disabled]="selectedFiles().length === 0" (click)="importMultiple()">
              <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
              </svg>
              Импортировать все ({{ selectedFiles().length }})
            </button>
            <button class="px-6 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md" (click)="clearAll()">
              <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Очистить БД
            </button>
          </div>
          
          @if (selectedFiles().length > 0) {
            <div class="space-y-2">
              <h4 class="text-sm font-medium text-gray-700">Выбранные файлы:</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                @for (fileInfo of selectedFiles(); track fileInfo.file.name) {
                  <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="flex items-center justify-between">
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-blue-800 truncate">{{ fileInfo.file.name }}</p>
                        <p class="text-xs text-blue-600">{{ (fileInfo.file.size / 1024).toFixed(1) }} KB</p>
                      </div>
                      <button 
                        class="ml-2 text-red-500 hover:text-red-700"
                        (click)="removeFile(fileInfo.file.name)"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                    <div class="mt-2">
                      <label class="block text-xs font-medium text-gray-600 mb-1">Дата отчета:</label>
                      <input 
                        type="date" 
                        class="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                        [value]="fileInfo.date" 
                        (change)="updateFileDate(fileInfo.file.name, $event)"
                      />
                    </div>
                  </div>
                }
              </div>
            </div>
          }
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
  protected uploadMode = signal<'single' | 'multiple'>('single');
  protected selectedFiles = signal<Array<{file: File, date: string}>>([]);

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.file.set(f);
  }

  onDate(e: Event) {
    const input = e.target as HTMLInputElement;
    this.date.set(input.value);
  }

  setUploadMode(mode: 'single' | 'multiple') {
    this.uploadMode.set(mode);
    if (mode === 'single') {
      this.selectedFiles.set([]);
    }
  }

  onMultipleFiles(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    
    const fileInfos = files.map(file => ({
      file,
      date: new Date().toISOString().slice(0, 10)
    }));
    
    this.selectedFiles.set(fileInfos);
  }

  removeFile(fileName: string) {
    const currentFiles = this.selectedFiles();
    const filteredFiles = currentFiles.filter(f => f.file.name !== fileName);
    this.selectedFiles.set(filteredFiles);
  }

  updateFileDate(fileName: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const newDate = input.value;
    
    const currentFiles = this.selectedFiles();
    const updatedFiles = currentFiles.map(f => 
      f.file.name === fileName ? { ...f, date: newDate } : f
    );
    this.selectedFiles.set(updatedFiles);
  }

  async importMultiple() {
    const files = this.selectedFiles();
    if (files.length === 0) return;
    
    try {
      let totalImported = 0;
      let totalReports = 0;
      
      for (const fileInfo of files) {
        try {
          const reports = await parseAllSheets(fileInfo.file, fileInfo.date);
          
          // Сохраняем все отчеты
          for (const report of reports) {
            await this.store.upsertReport(report);
            totalReports++;
          }
          
          totalImported++;
          
        } catch (error) {
          console.error(`Ошибка при импорте файла ${fileInfo.file.name}:`, error);
          this.toastr.error(`Ошибка при импорте файла ${fileInfo.file.name}`);
        }
      }
      
      // Очищаем список файлов
      this.selectedFiles.set([]);
      
      // Обновляем данные в store
      await this.store.loadAll();
      
      // Показываем уведомление об успехе
      this.toastr.success(`Успешно импортировано ${totalImported} файлов, ${totalReports} отчетов`);
      
      // Перезагружаем страницу для обновления данных
      window.location.reload();
      
    } catch (error) {
      console.error('Ошибка при массовом импорте:', error);
      this.toastr.error('Ошибка при массовом импорте файлов');
    }
  }

  async import() {
    const f = this.file();
    if (!f) return;
    
    try {
      const reports = await parseAllSheets(f, this.date());
      
      // Сохраняем все отчеты
      for (const report of reports) {
        await this.store.upsertReport(report);
      }
      
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


