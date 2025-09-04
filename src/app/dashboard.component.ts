import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DataStoreService } from './data.store';
import type { Campaign, ProjectType } from './types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    @if (hasData()) {
      <div class="space-y-6">
        <div class="p-6 rounded-lg bg-white shadow-lg border border-gray-100 mb-8">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">Фильтры</h3>
            <button class="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md flex items-center" (click)="showDeleteModal.set(true)">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Управление данными
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">От</label>
              <input type="date" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" [value]="from()" (change)="onFrom($event)" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">До</label>
              <input type="date" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" [value]="to()" (change)="onTo($event)" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Проект</label>
              <select class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" [value]="selectedProject()" (change)="onProject($event)">
                <option value="Autoline">Autoline</option>
                <option value="Machinery">Machinery</option>
                <option value="Agroline">Agroline</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Кампания</label>
              <select class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" (change)="onCampaign($event)">
                <option value="">Все</option>
                @for (c of campaignNames(); track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Подгруппа</label>
              <select class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" (change)="onSubgroup($event)" [disabled]="!selectedCampaign()">
                <option value="">Все</option>
                @for (sg of subgroupNames(); track sg) {
                  <option [value]="sg">{{ sg }}</option>
                }
              </select>
            </div>
          </div>
        </div>

      <div class="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
        <div class="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-sm">
          <div class="text-sm font-medium text-blue-600 mb-2">Бюджет текущий период</div>
          <div class="text-xl font-bold text-blue-800 break-words">€{{ totals().budget.toLocaleString('uk-UA') }}</div>
        </div>
        <div class="p-6 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200 shadow-sm">
          <div class="text-sm font-medium text-green-600 mb-2">Конверсии текущий период</div>
          <div class="text-xl font-bold text-green-800 break-words">{{ totals().conversions.toLocaleString('uk-UA') }}</div>
        </div>
        <div class="p-6 rounded-lg bg-gradient-to-br from-red-50 to-red-100 border border-red-200 shadow-sm">
          <div class="text-sm font-medium text-red-600 mb-2">send_new_message</div>
          <div class="text-xl font-bold text-red-800 break-words">{{ totals().sendNewMessage.toLocaleString('uk-UA') }}</div>
        </div>
        <div class="p-6 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 shadow-sm">
          <div class="text-sm font-medium text-orange-600 mb-2">sales_full_tel</div>
          <div class="text-xl font-bold text-orange-800 break-words">{{ totals().salesFullTel.toLocaleString('uk-UA') }}</div>
        </div>
        <div class="p-6 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 shadow-sm">
          <div class="text-sm font-medium text-yellow-600 mb-2">button_messenger</div>
          <div class="text-xl font-bold text-yellow-800 break-words">{{ totals().buttonMessenger.toLocaleString('uk-UA') }}</div>
        </div>
        <div class="p-6 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 shadow-sm">
          <div class="text-sm font-medium text-cyan-600 mb-2">Показы текущий период</div>
          <div class="text-xl font-bold text-cyan-800 break-words">{{ totals().impressions.toLocaleString('uk-UA') }}</div>
        </div>
        <div class="p-6 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 shadow-sm">
          <div class="text-sm font-medium text-purple-600 mb-2">Клики текущий период</div>
          <div class="text-xl font-bold text-purple-800 break-words">{{ totals().clicks.toLocaleString('uk-UA') }}</div>
        </div>
        <div class="p-6 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 shadow-sm">
          <div class="text-sm font-medium text-pink-600 mb-2">СРМ текущий период</div>
          <div class="text-xl font-bold text-pink-800 break-words">€{{ totals().cpmEur.toFixed(2) }}</div>
        </div>
        <div class="p-6 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 shadow-sm">
          <div class="text-sm font-medium text-indigo-600 mb-2">CTR текущий период</div>
          <div class="text-xl font-bold text-indigo-800 break-words">{{ (totals().ctrAvg * 100).toFixed(2) }}%</div>
        </div>
        <div class="p-6 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 shadow-sm">
          <div class="text-sm font-medium text-slate-600 mb-2">CR текущий период</div>
          <div class="text-xl font-bold text-slate-800 break-words">{{ (totals().crAvg * 100).toFixed(2) }}%</div>
        </div>
      </div>

      <div class="p-6 rounded-lg bg-white shadow-lg border border-gray-100">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-4">
            <h3 class="text-xl font-semibold text-gray-800">Динамика показателей</h3>
            <div class="text-sm text-gray-500">
              @if (filteredDates().length > 0) {
                {{ filteredDates().length }} {{ filteredDates().length === 1 ? 'день' : filteredDates().length < 5 ? 'дня' : 'дней' }}
              }
            </div>
          </div>
          <button
            class="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md flex items-center"
            (click)="exportChart()"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Экспорт графика
          </button>
        </div>
        <div class="h-96">
                      <canvas baseChart [type]="'line'" [data]="chartData()" [options]="chartOptions"></canvas>
        </div>
      </div>

            <div class="p-6 rounded-lg bg-white shadow-lg border border-gray-100">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-800">Кампании за период</h3>
          <div class="text-sm text-gray-500">
            {{ tableRows().length }} {{ tableRows().length === 1 ? 'кампания' : tableRows().length < 5 ? 'кампании' : 'кампаний' }}
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" (click)="sortTable('name')">
                  <div class="flex items-center justify-between">
                    <span>Название</span>
                    <span class="ml-1 text-lg" [class]="getSortClass('name')">{{ getSortIcon('name') }}</span>
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" (click)="sortTable('budgetEur')">
                  <div class="flex items-center justify-between">
                    <span>Бюджет</span>
                    <span class="ml-1 text-lg" [class]="getSortClass('budgetEur')">{{ getSortIcon('budgetEur') }}</span>
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" (click)="sortTable('conversions')">
                  <div class="flex items-center justify-between">
                    <span>Конверсии</span>
                    <span class="ml-1 text-lg" [class]="getSortClass('conversions')">{{ getSortIcon('conversions') }}</span>
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" (click)="sortTable('sendNewMessage')">
                  <div class="flex items-center justify-between">
                    <span>send_new_message</span>
                    <span class="ml-1 text-lg" [class]="getSortClass('sendNewMessage')">{{ getSortIcon('sendNewMessage') }}</span>
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" (click)="sortTable('salesFullTel')">
                  <div class="flex items-center justify-between">
                    <span>sales_full_tel</span>
                    <span class="ml-1 text-lg" [class]="getSortClass('salesFullTel')">{{ getSortIcon('salesFullTel') }}</span>
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" (click)="sortTable('buttonMessenger')">
                  <div class="flex items-center justify-between">
                    <span>button_messenger</span>
                    <span class="ml-1 text-lg" [class]="getSortClass('buttonMessenger')">{{ getSortIcon('buttonMessenger') }}</span>
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" (click)="sortTable('impressions')">
                  <div class="flex items-center justify-between">
                    <span>Показы</span>
                    <span class="ml-1 text-lg" [class]="getSortClass('impressions')">{{ getSortIcon('impressions') }}</span>
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" (click)="sortTable('clicks')">
                  <div class="flex items-center justify-between">
                    <span>Клики</span>
                    <span class="ml-1 text-lg" [class]="getSortClass('clicks')">{{ getSortIcon('clicks') }}</span>
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" (click)="sortTable('cpmEur')">
                  <div class="flex items-center justify-between">
                    <span>СРМ</span>
                    <span class="ml-1 text-lg" [class]="getSortClass('cpmEur')">{{ getSortIcon('cpmEur') }}</span>
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" (click)="sortTable('ctrPercent')">
                  <div class="flex items-center justify-between">
                    <span>CTR</span>
                    <span class="ml-1 text-lg" [class]="getSortClass('ctrPercent')">{{ getSortIcon('ctrPercent') }}</span>
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" (click)="sortTable('crPercent')">
                  <div class="flex items-center justify-between">
                    <span>CR</span>
                    <span class="ml-1 text-lg" [class]="getSortClass('crPercent')">{{ getSortIcon('crPercent') }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @for (row of tableRows(); track row.name) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ row.name }}</td>
                  <td class="px-4 py-3 text-gray-900">€{{ row.budgetEur.toLocaleString('uk-UA') }}</td>
                  <td class="px-4 py-3 text-gray-900">{{ row.conversions.toLocaleString('uk-UA') }}</td>
                  <td class="px-4 py-3 text-gray-900">{{ row.sendNewMessage.toLocaleString('uk-UA') }}</td>
                  <td class="px-4 py-3 text-gray-900">{{ row.salesFullTel.toLocaleString('uk-UA') }}</td>
                  <td class="px-4 py-3 text-gray-900">{{ row.buttonMessenger.toLocaleString('uk-UA') }}</td>
                  <td class="px-4 py-3 text-gray-900">{{ row.impressions.toLocaleString('uk-UA') }}</td>
                  <td class="px-4 py-3 text-gray-900">{{ row.clicks.toLocaleString('uk-UA') }}</td>
                  <td class="px-4 py-3 text-gray-900">€{{ row.cpmEur.toFixed(2) }}</td>
                  <td class="px-4 py-3 text-gray-900">{{ (row.ctrPercent * 100).toFixed(2) }}%</td>
                  <td class="px-4 py-3 text-gray-900">{{ (row.crPercent * 100).toFixed(2) }}%</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
    } @else {
      <div class="flex items-center justify-center min-h-96">
        <div class="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-lg">
          <div class="text-8xl mb-6">📊</div>
          <h3 class="text-2xl font-bold text-gray-800 mb-4">Нет данных для анализа</h3>
          <p class="text-gray-600 text-lg mb-6">Загрузите XLSX файл на вкладке "Загрузка" чтобы увидеть аналитику</p>
          <div class="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Перейдите на вкладку "Загрузка"
          </div>
        </div>
      </div>
    }

    <!-- Модальное окно управления данными -->
    @if (showDeleteModal()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
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
                (click)="showDeleteModal.set(false)"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Модальное окно с деталями точки графика -->
    @if (showDetailsModal()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">Детали за {{ selectedPointData()?.date }}</h3>
            <button class="text-gray-400 hover:text-gray-600" (click)="showDetailsModal.set(false)">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          @if (selectedPointData()) {
            <div class="space-y-6">
              <!-- Общая информация -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="p-4 bg-blue-50 rounded-lg">
                  <div class="text-sm font-medium text-blue-600">Метрика</div>
                  <div class="text-lg font-bold text-blue-800">{{ selectedPointData()?.metric }}</div>
                </div>
                <div class="p-4 bg-green-50 rounded-lg">
                  <div class="text-sm font-medium text-green-600">Значение</div>
                  <div class="text-lg font-bold text-green-800">
                    @if (selectedPointData()?.metric === 'Бюджет' || selectedPointData()?.metric === 'СРМ') {
                      €{{ selectedPointData()?.value?.toLocaleString() }}
                    } @else if (selectedPointData()?.metric === 'CTR' || selectedPointData()?.metric === 'CR') {
                      {{ (selectedPointData()?.value * 100)?.toFixed(2) }}%
                    } @else {
                      {{ selectedPointData()?.value?.toLocaleString() }}
                    }
                  </div>
                </div>
                <div class="p-4 bg-purple-50 rounded-lg">
                  <div class="text-sm font-medium text-purple-600">Проект</div>
                  <div class="text-lg font-bold text-purple-800">{{ selectedProject() }}</div>
                </div>
                <div class="p-4 bg-orange-50 rounded-lg">
                  <div class="text-sm font-medium text-orange-600">Кампаний</div>
                  <div class="text-lg font-bold text-orange-800">{{ selectedPointData()?.campaigns?.length || 0 }}</div>
                </div>
              </div>

              <!-- Таблица кампаний -->
              <div>
                <h4 class="text-md font-semibold text-gray-700 mb-3">Кампании</h4>
                <div class="overflow-x-auto">
                  <table class="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Бюджет</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Конверсии</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CR</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Подгруппы</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      @for (campaign of selectedPointData()?.campaigns; track campaign.name) {
                        <tr class="hover:bg-gray-50">
                          <td class="px-4 py-3 font-medium text-gray-900">{{ campaign.name }}</td>
                          <td class="px-4 py-3 text-gray-900">€{{ campaign.budgetEur?.toLocaleString() }}</td>
                          <td class="px-4 py-3 text-gray-900">{{ campaign.conversions?.toLocaleString() }}</td>
                          <td class="px-4 py-3 text-gray-900">{{ (campaign.ctrPercent * 100)?.toFixed(2) }}%</td>
                          <td class="px-4 py-3 text-gray-900">{{ (campaign.crPercent * 100)?.toFixed(2) }}%</td>
                          <td class="px-4 py-3 text-gray-900">{{ campaign.subgroups?.length || 0 }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Общие метрики -->
              <div>
                <h4 class="text-md font-semibold text-gray-700 mb-3">Общие метрики</h4>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="text-sm font-medium text-gray-600">Бюджет</div>
                    <div class="text-lg font-bold text-gray-800">€{{ selectedPointData()?.total?.budgetEur?.toLocaleString() }}</div>
                  </div>
                  <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="text-sm font-medium text-gray-600">Конверсии</div>
                    <div class="text-lg font-bold text-gray-800">{{ selectedPointData()?.total?.conversions?.toLocaleString() }}</div>
                  </div>
                  <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="text-sm font-medium text-gray-600">Показы</div>
                    <div class="text-lg font-bold text-gray-800">{{ selectedPointData()?.total?.impressions?.toLocaleString() }}</div>
                  </div>
                  <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="text-sm font-medium text-gray-600">Клики</div>
                    <div class="text-lg font-bold text-gray-800">{{ selectedPointData()?.total?.clicks?.toLocaleString() }}</div>
                  </div>
                  <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="text-sm font-medium text-gray-600">СРМ</div>
                    <div class="text-lg font-bold text-gray-800">€{{ selectedPointData()?.total?.cpmEur?.toFixed(2) }}</div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `:host{display:block}
     table{width:100%}
    `,
  ],
})
export class DashboardComponent {
  private store = inject(DataStoreService);
  protected from = signal<string>('');
  protected to = signal<string>('');
  protected selectedCampaign = signal<string>('');
  protected selectedSubgroup = signal<string>('');
  protected selectedProject = signal<ProjectType>('Autoline');
  protected sortColumn = signal<string>('');
  protected sortDirection = signal<'asc' | 'desc'>('asc');
  protected showDeleteModal = signal(false);
  protected selectedDeleteDate = signal('');
  protected showDetailsModal = signal(false);
  protected selectedPointData = signal<any>(null);

  protected availableDates = computed(() => {
    return this.store.dates();
  });

    protected chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 4,
        hoverRadius: 6
      }
    },
    onClick: (event, elements) => {
      console.log('Chart onClick triggered, elements:', elements);
      if (elements && elements.length > 0) {
        const dataIndex = elements[0].index;
        const datasetIndex = elements[0].datasetIndex;
        console.log('Clicking on dataIndex:', dataIndex, 'datasetIndex:', datasetIndex);
        this.showPointDetails(dataIndex, datasetIndex);
      }
    }
  };

  protected exportChart(): void {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `график_аналитики_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }

  protected campaignNames = computed(() => {
    const names = new Set<string>();
    const project = this.selectedProject();

    for (const r of this.store.reports()) {
      if (r.project !== project) continue;
      for (const c of r.campaigns) names.add(c.name);
    }
    return Array.from(names).sort();
  });

  protected subgroupNames = computed(() => {
    const set = new Set<string>();
    const camp = this.selectedCampaign();
    if (!camp) return [] as string[];
    for (const r of this.store.reports()) {
      const c = r.campaigns.find(x => x.name === camp);
      if (!c) continue;
      for (const sg of c.subgroups) set.add(sg.name);
    }
    return Array.from(set).sort();
  });

  protected filteredDates = computed(() => {
    const dates = this.store.dates();
    const from = this.from();
    const to = this.to();
    const project = this.selectedProject();

    let filteredDates = dates.filter(d => (!from || d >= from) && (!to || d <= to));

    // Всегда фильтруем по проекту
    filteredDates = filteredDates.filter(d => {
      const report = this.store.reports().find(r => r.id === d);
      return report?.project === project;
    });

    return filteredDates;
  });

  protected hasData = computed(() => {
    return this.store.reports().length > 0;
  });

  protected sortTable(column: string): void {
    if (this.sortColumn() === column) {
      // Если та же колонка - меняем направление
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // Новая колонка - устанавливаем по возрастанию
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  protected getSortIcon(column: string): string {
    if (this.sortColumn() !== column) {
      return '⇅'; // Нейтральная иконка
    }
    return this.sortDirection() === 'asc' ? '▲' : '▼';
  }

  protected getSortClass(column: string): string {
    if (this.sortColumn() !== column) {
      return 'text-gray-400 hover:text-gray-600';
    }
    return this.sortDirection() === 'asc' ? 'text-blue-600' : 'text-blue-600';
  }

  protected chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const labels = this.filteredDates();
    const selected = this.selectedCampaign();
    const subgroup = this.selectedSubgroup();
    const budgetSeries: number[] = [];
    const conversionsSeries: number[] = [];
    const sendNewMessageSeries: number[] = [];
    const salesFullTelSeries: number[] = [];
    const buttonMessengerSeries: number[] = [];
    const impressionsSeries: number[] = [];
    const clicksSeries: number[] = [];
    const cpmEurSeries: number[] = [];
    const ctrPercentSeries: number[] = [];
    const crPercentSeries: number[] = [];

    for (const d of labels) {
      const src = this.store.reports().find(x => x.id === d)!;
      let base = src.total;
      if (selected) {
        const camp = src.campaigns.find(c => c.name === selected);
        if (camp) {
          if (subgroup) {
            const sg = camp.subgroups.find(s => s.name === subgroup);
            if (sg) base = sg; else base = camp;
          } else {
            base = camp;
          }
        }
      }
      budgetSeries.push(base.budgetEur);
      conversionsSeries.push(base.conversions);
      sendNewMessageSeries.push(base.sendNewMessage);
      salesFullTelSeries.push(base.salesFullTel);
      buttonMessengerSeries.push(base.buttonMessenger);
      impressionsSeries.push(base.impressions);
      clicksSeries.push(base.clicks);
      cpmEurSeries.push(base.cpmEur);
      ctrPercentSeries.push(base.ctrPercent * 100); // Конвертируем в проценты
      crPercentSeries.push(base.crPercent * 100); // Конвертируем в проценты
    }

    return {
      labels,
      datasets: [
        {
          label: 'Бюджет текущий период',
          data: budgetSeries,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: false
        },
        {
          label: 'Конверсии текущий период',
          data: conversionsSeries,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: false
        },
        {
          label: 'send_new_message',
          data: sendNewMessageSeries,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: false
        },
        {
          label: 'sales_full_tel',
          data: salesFullTelSeries,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          borderWidth: 2,
          fill: false
        },
        {
          label: 'button_messenger',
          data: buttonMessengerSeries,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          fill: false
        },
        {
          label: 'Показы текущий период',
          data: impressionsSeries,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          borderWidth: 2,
          fill: false
        },
        {
          label: 'Клики текущий период',
          data: clicksSeries,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 2,
          fill: false
        },
        {
          label: 'СРМ текущий период',
          data: cpmEurSeries,
          borderColor: '#ec4899',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          borderWidth: 2,
          fill: false
        },
        {
          label: 'CTR текущий период',
          data: ctrPercentSeries,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          fill: false
        },
        {
          label: 'CR текущий период',
          data: crPercentSeries,
          borderColor: '#64748b',
          backgroundColor: 'rgba(100, 116, 139, 0.1)',
          borderWidth: 2,
          fill: false
        },
      ],
    };
  });

  protected totals = computed(() => {
    const labels = this.filteredDates();
    const selected = this.selectedCampaign();
    const subgroup = this.selectedSubgroup();
    let budget = 0, conversions = 0, clicks = 0, impressions = 0, ctrSum = 0;
    let sendNewMessage = 0, salesFullTel = 0, buttonMessenger = 0, cpmEur = 0, crSum = 0;
    for (const d of labels) {
      const report = this.store.reports().find(x => x.id === d)!;
      let base = report.total;
      if (selected) {
        const camp = report.campaigns.find(c => c.name === selected);
        if (camp) {
          if (subgroup) {
            const sg = camp.subgroups.find(s => s.name === subgroup);
            base = sg ?? camp;
          } else {
            base = camp;
          }
        }
      }
      budget += base.budgetEur;
      conversions += base.conversions;
      sendNewMessage += base.sendNewMessage;
      salesFullTel += base.salesFullTel;
      buttonMessenger += base.buttonMessenger;
      clicks += base.clicks;
      impressions += base.impressions;
      cpmEur += base.cpmEur;
      ctrSum += base.ctrPercent;
      crSum += base.crPercent;
    }
    const ctrAvg = labels.length ? ctrSum / labels.length : 0;
    const crAvg = labels.length ? crSum / labels.length : 0;
    return {
      budget, conversions, sendNewMessage, salesFullTel, buttonMessenger,
      clicks, impressions, cpmEur, ctrAvg, crAvg
    };
  });

  protected tableRows = computed(() => {
    const byName = new Map<string, {
      budgetEur: number; conversions: number; sendNewMessage: number; salesFullTel: number;
      buttonMessenger: number; impressions: number; clicks: number; cpmEur: number;
      ctrPercent: number; crPercent: number; days: number
    }>();
    const camp = this.selectedCampaign();
    const subgroup = this.selectedSubgroup();
    const project = this.selectedProject();

    for (const d of this.filteredDates()) {
      const report = this.store.reports().find(x => x.id === d)!;
      if (!camp) {
        // агрегируем кампании
        for (const r of report.campaigns) {
          const agg = byName.get(r.name) ?? {
            budgetEur: 0, conversions: 0, sendNewMessage: 0, salesFullTel: 0,
            buttonMessenger: 0, impressions: 0, clicks: 0, cpmEur: 0,
            ctrPercent: 0, crPercent: 0, days: 0
          };
          agg.budgetEur += r.budgetEur;
          agg.conversions += r.conversions;
          agg.sendNewMessage += r.sendNewMessage;
          agg.salesFullTel += r.salesFullTel;
          agg.buttonMessenger += r.buttonMessenger;
          agg.impressions += r.impressions;
          agg.clicks += r.clicks;
          agg.cpmEur += r.cpmEur;
          agg.ctrPercent += r.ctrPercent;
          agg.crPercent += r.crPercent;
          agg.days += 1;
          byName.set(r.name, agg);
        }
      } else {
        const c = report.campaigns.find(x => x.name === camp);
        if (!c) continue;
        if (!subgroup) {
          for (const sg of c.subgroups) {
            const agg = byName.get(sg.name) ?? {
              budgetEur: 0, conversions: 0, sendNewMessage: 0, salesFullTel: 0,
              buttonMessenger: 0, impressions: 0, clicks: 0, cpmEur: 0,
              ctrPercent: 0, crPercent: 0, days: 0
            };
            agg.budgetEur += sg.budgetEur;
            agg.conversions += sg.conversions;
            agg.sendNewMessage += sg.sendNewMessage;
            agg.salesFullTel += sg.salesFullTel;
            agg.buttonMessenger += sg.buttonMessenger;
            agg.impressions += sg.impressions;
            agg.clicks += sg.clicks;
            agg.cpmEur += sg.cpmEur;
            agg.ctrPercent += sg.ctrPercent;
            agg.crPercent += sg.crPercent;
            agg.days += 1;
            byName.set(sg.name, agg);
          }
        } else {
          const sg = c.subgroups.find(s => s.name === subgroup);
          if (!sg) continue;
          const agg = byName.get(sg.name) ?? {
            budgetEur: 0, conversions: 0, sendNewMessage: 0, salesFullTel: 0,
            buttonMessenger: 0, impressions: 0, clicks: 0, cpmEur: 0,
            ctrPercent: 0, crPercent: 0, days: 0
          };
          agg.budgetEur += sg.budgetEur;
          agg.conversions += sg.conversions;
          agg.sendNewMessage += sg.sendNewMessage;
          agg.salesFullTel += sg.salesFullTel;
          agg.buttonMessenger += sg.buttonMessenger;
          agg.impressions += sg.impressions;
          agg.clicks += sg.clicks;
          agg.cpmEur += sg.cpmEur;
          agg.ctrPercent += sg.ctrPercent;
          agg.crPercent += sg.crPercent;
          agg.days += 1;
          byName.set(sg.name, agg);
        }
      }
    }
    const rows = Array.from(byName.entries()).map(([name, v]) => ({
      name,
      budgetEur: v.budgetEur,
      conversions: v.conversions,
      sendNewMessage: v.sendNewMessage,
      salesFullTel: v.salesFullTel,
      buttonMessenger: v.buttonMessenger,
      impressions: v.impressions,
      clicks: v.clicks,
      cpmEur: v.days ? v.cpmEur / v.days : 0,
      ctrPercent: v.days ? v.ctrPercent / v.days : 0,
      crPercent: v.days ? v.crPercent / v.days : 0,
    }));

    // Сортировка
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();

    if (sortCol) {
      rows.sort((a, b) => {
        let aVal: any = a[sortCol as keyof typeof a];
        let bVal: any = b[sortCol as keyof typeof a];

        // Для строковых значений
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // По умолчанию сортируем по бюджету по убыванию
      rows.sort((a, b) => b.budgetEur - a.budgetEur);
    }

    return rows;
  });

  onFrom(e: Event) { this.from.set((e.target as HTMLInputElement).value); }
  onTo(e: Event) { this.to.set((e.target as HTMLSelectElement).value); }
  onCampaign(e: Event) { this.selectedCampaign.set((e.target as HTMLSelectElement).value); }
  onSubgroup(e: Event) { this.selectedSubgroup.set((e.target as HTMLSelectElement).value); }
  onProject(e: Event) { this.selectedProject.set((e.target as HTMLSelectElement).value as ProjectType); }
  
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
      this.showDeleteModal.set(false);
      this.selectedDeleteDate.set('');
      
      // Показываем уведомление об успехе
      alert(`Данные за ${date} успешно удалены!`);
      
    } catch (error) {
      alert('Ошибка при удалении данных');
    }
  }

  showPointDetails(dataIndex: number, datasetIndex: number) {
    console.log('showPointDetails called with:', { dataIndex, datasetIndex });
    
    const dates = this.filteredDates();
    console.log('Available dates:', dates);
    console.log('dataIndex:', dataIndex, 'dates length:', dates.length);
    
    const date = dates[dataIndex];
    const metricName = this.getMetricNameByDatasetIndex(datasetIndex);
    
    console.log('Found date:', date, 'metricName:', metricName);
    
    if (!date || !metricName) {
      console.log('Missing date or metricName');
      return;
    }
    
    // Извлекаем чистую дату без проекта
    const cleanDate = date.split('-').slice(0, 3).join('-'); // Берем только YYYY-MM-DD
    console.log('Clean date:', cleanDate);
    
    // Получаем данные для выбранной даты и метрики
    const reports = this.store.reports().filter(r => r.date === cleanDate);
    const projectData = reports.find(r => r.project === this.selectedProject());
    
    console.log('Found reports:', reports.length, 'projectData:', !!projectData);
    console.log('Selected project:', this.selectedProject());
    
    if (!projectData) {
      console.log('No project data found');
      return;
    }
    
    const pointData = {
      date: cleanDate,
      metric: metricName,
      value: this.getMetricValue(projectData, metricName),
      campaigns: projectData.campaigns,
      total: projectData.total
    };
    
    console.log('Point data:', pointData);
    
    this.selectedPointData.set(pointData);
    this.showDetailsModal.set(true);
    console.log('Modal should be open now');
  }

  private getMetricNameByDatasetIndex(datasetIndex: number): string {
    const metrics = [
      'Бюджет', 'Конверсии', 'send_new_message', 'sales_full_tel', 
      'button_messenger', 'Показы', 'Клики', 'СРМ', 'CTR', 'CR'
    ];
    console.log('getMetricNameByDatasetIndex:', { datasetIndex, metrics, result: metrics[datasetIndex] });
    return metrics[datasetIndex] || '';
  }

  private getMetricValue(report: any, metricName: string): number {
    const metricMap: { [key: string]: string } = {
      'Бюджет': 'budgetEur',
      'Конверсии': 'conversions',
      'send_new_message': 'sendNewMessage',
      'sales_full_tel': 'salesFullTel',
      'button_messenger': 'buttonMessenger',
      'Показы': 'impressions',
      'Клики': 'clicks',
      'СРМ': 'cpmEur',
      'CTR': 'ctrPercent',
      'CR': 'crPercent'
    };
    
    const field = metricMap[metricName];
    return field ? report.total[field] : 0;
  }



  constructor() {
    // дефолтный период — весь диапазон
    effect(() => {
      const dates = this.store.dates();
      if (dates.length && !this.from() && !this.to()) {
        this.from.set(dates[0]);
        this.to.set(dates[dates.length - 1]);
      }
    });
  }
}


