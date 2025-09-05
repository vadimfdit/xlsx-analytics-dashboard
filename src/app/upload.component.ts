import { Component, inject, signal, computed, effect } from '@angular/core';
import { DataStoreService } from './data.store';
import { parseDailyReport, parseAllSheets } from './xlsx.parser';
import { ToastrService } from 'ngx-toastr';
import { ProjectType } from './types';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [],
  template: `
    <div class="max-w-7xl mx-auto pl-6 pr-6">
      <!-- Весь блок згортається -->
      <div class="bg-white border border-gray-200 rounded-lg">
        <!-- Заголовок -->
        <div class="p-4 cursor-pointer hover:bg-gray-50" (click)="toggleCollapse()">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="inline-flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                </svg>
              </div>
              <div>
                <h1 class="text-xl font-semibold text-gray-900">Импорт ежедневного отчета</h1>
                <p class="text-gray-600 text-sm">Загрузите XLSX файлы для анализа данных</p>
              </div>
            </div>
            <div class="p-2 text-gray-500">
              <svg class="w-5 h-5 transition-transform" [class]="isCollapsed() ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Контент (згортається) -->
        @if (!isCollapsed()) {
        <div class="px-4 pb-4 space-y-4">
      <!-- Режим загрузки -->
      <div class="bg-white border border-gray-200 rounded-lg p-3">
        <div class="flex items-center justify-center space-x-1">
          <button
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            [class]="uploadMode() === 'single' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            (click)="setUploadMode('single')"
          >
            Один файл
          </button>
          <button
            class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            [class]="uploadMode() === 'multiple' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            (click)="setUploadMode('multiple')"
          >
            Несколько файлов
          </button>
        </div>
      </div>

      <!-- Одиночный режим -->
      @if (uploadMode() === 'single') {
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Дата отчета</label>
              <input type="date" class="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" [value]="date()" (change)="onDate($event)" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">XLSX файл</label>
              <input type="file" accept=".xlsx,.xls" (change)="onFile($event)" class="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div class="flex flex-col justify-end">
              <button class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" [disabled]="!file()" (click)="import()">
                Импортировать
              </button>
            </div>
            <div class="flex flex-col justify-end">
              <button class="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2" (click)="openDataManagement()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                <span>Управление данными</span>
              </button>
            </div>
          </div>
        </div>

        @if (file()) {
          <div class="bg-green-50 border border-green-200 rounded-lg p-3">
            <div class="flex items-center">
              <div class="p-1.5 bg-green-600 rounded-lg mr-2">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <span class="text-green-800 font-medium text-sm">Файл выбран</span>
                <p class="text-green-600 text-xs">{{ file()?.name }}</p>
              </div>
            </div>
          </div>
        }
      }

      <!-- Множественный режим -->
      @if (uploadMode() === 'multiple') {
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Выберите файлы XLSX</label>
              <div class="flex items-center space-x-2">
                <input type="file" accept=".xlsx,.xls" multiple (change)="onMultipleFiles($event)" class="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" [disabled]="selectedFiles().length === 0" (click)="importMultiple()">
                  Импортировать все ({{ selectedFiles().length }})
                </button>
              </div>
            </div>
          </div>
        </div>

          @if (selectedFiles().length > 0) {
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div class="space-y-3">
                <div class="flex items-center space-x-2">
                  <div class="p-1 bg-blue-600 rounded-lg">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <h4 class="text-sm font-medium text-blue-800">Выбранные файлы ({{ selectedFiles().length }})</h4>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  @for (fileInfo of selectedFiles(); track fileInfo.file.name) {
                    <div class="bg-white border border-gray-200 rounded-lg p-2">
                      <div class="flex items-center justify-between mb-1">
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-medium text-gray-900 truncate">{{ fileInfo.file.name }}</p>
                          <p class="text-xs text-gray-500">{{ (fileInfo.file.size / 1024).toFixed(1) }} KB</p>
                        </div>
                        <button
                          class="ml-1 p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          (click)="removeFile(fileInfo.file.name)"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-0.5">Дата отчета:</label>
                        <input
                          type="date"
                          class="w-full text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          [value]="fileInfo.date"
                          (change)="updateFileDate(fileInfo.file.name, $event)"
                        />
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
      }
        </div>
        }
      </div>

      <!-- Модальное окно управления данными -->
      @if (showDataManagementModal()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="showDataManagementModal.set(false)">
          <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Управление данными</h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Выберите дату для удаления</label>
                <select class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" (change)="onDeleteDateSelect($event)">
                  <option value="">Выберите дату</option>
                  @for (date of availableDates(); track date) {
                    <option [value]="date">{{ date }}</option>
                  }
                </select>
              </div>

              <div class="flex space-x-3">
                <button
                  class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  [disabled]="!selectedDeleteDate()"
                  (click)="deleteSelectedDate()"
                >
                  Удалить
                </button>
                <button
                  class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  (click)="showDataManagementModal.set(false)"
                >
                  Отмена
                </button>
              </div>

              <!-- Розділювач -->
              <div class="border-t border-gray-200 my-4"></div>

              <!-- Кнопка очищення всіх даних -->
              <div class="text-center">
                <p class="text-sm text-gray-600 mb-3">Для удаления всех данных из базы</p>
                <button
                  class="w-full px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors"
                  (click)="clearAllData()"
                >
                  Очистить все данные
                </button>
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class UploadComponent {
  private store = inject(DataStoreService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  protected file = signal<File | null>(null);
  protected date = signal<string>(new Date().toISOString().slice(0, 10));
  protected uploadMode = signal<'single' | 'multiple'>('single');
  protected selectedFiles = signal<Array<{file: File, date: string}>>([]);
  protected isCollapsed = signal<boolean>(true);
  protected showDataManagementModal = signal<boolean>(false);
  protected selectedDeleteDate = signal<string>('');

  // Перевіряємо чи є дані в store
  protected hasData = computed(() => {
    return this.store.dates().length > 0;
  });

  // Доступні дати для видалення
  protected availableDates = computed(() => {
    return this.store.dates();
  });

  constructor() {
    // Автоматично розгортаємо блок, якщо немає даних
    // Використовуємо setTimeout щоб дати час данним завантажитися
    setTimeout(() => {
      effect(() => {
        if (!this.hasData()) {
          this.isCollapsed.set(false);
        }
      });
    }, 100);
  }

  toggleCollapse() {
    this.isCollapsed.set(!this.isCollapsed());
  }

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

  openDataManagement() {
    this.showDataManagementModal.set(true);
  }

  onDeleteDateSelect(e: Event) {
    this.selectedDeleteDate.set((e.target as HTMLSelectElement).value);
  }

  async deleteSelectedDate() {
    const date = this.selectedDeleteDate();
    if (!date) return;

    try {
      // Находим все отчеты для выбранной даты
      const reports = this.store.reports().filter(r => r.date === date);

      // Удаляем каждый отчет
      for (const report of reports) {
        await this.store.deleteReport(report.id);
      }

      // Закрываем модальное окно
      this.showDataManagementModal.set(false);
      this.selectedDeleteDate.set('');

      // Показываем уведомление об успехе
      this.toastr.success(`Данные за ${date} успешно удалены!`, 'Успех', {
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
  }

  async clearAllData() {
    if (!confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить.')) {
      return;
    }

    try {
      // Очищаем все данные через store
      await this.store.clearAll();

      // Закрываем модальное окно
      this.showDataManagementModal.set(false);
      this.selectedDeleteDate.set('');

      // Показываем уведомление об успехе
      this.toastr.success('Все данные успешно удалены!', 'Успех', {
        timeOut: 3000,
        progressBar: true,
        closeButton: true,
      });

      // Перезагружаем страницу для обновления данных
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      this.toastr.error('Ошибка при удалении всех данных', 'Ошибка', {
        timeOut: 5000,
        progressBar: true,
        closeButton: true,
      });
    }
  }
}


