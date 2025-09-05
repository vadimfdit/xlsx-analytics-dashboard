import { Component, computed, effect, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DataStoreService } from './data.store';
import type { Campaign, ProjectType } from './types';
import { ApexOptions } from 'apexcharts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    @if (hasData()) {
      <div class="max-w-7xl mx-auto p-6 space-y-6">
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-3">
              <div class="p-1.5 bg-blue-600 rounded-lg">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900">Фильтры и настройки</h3>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">От</label>
              <input type="date" class="w-full h-10 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" [value]="from()" (change)="onFrom($event)" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">До</label>
              <input type="date" class="w-full h-10 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" [value]="to()" (change)="onTo($event)" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Проект</label>
              <select class="w-full h-10 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" [value]="selectedProject()" (change)="onProject($event)">
                <option value="Autoline">Autoline</option>
                <option value="Machinery">Machinery</option>
                <option value="Agroline">Agroline</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Кампания</label>
              <select class="w-full h-10 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" (change)="onCampaign($event)">
                <option value="">Все</option>
                @for (c of campaignNames(); track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Подгруппа</label>
              <select class="w-full h-10 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" (change)="onSubgroup($event)" [disabled]="!selectedCampaign()">
                <option value="">Все</option>
                @for (sg of subgroupNames(); track sg) {
                  <option [value]="sg">{{ sg }}</option>
                }
              </select>
            </div>
          </div>
        </div>


      <!-- Табовая навигация -->
      <div class="bg-white border border-gray-200 rounded-lg">
        <nav class="flex overflow-x-auto px-4 py-2 scrollbar-hide" aria-label="Tabs">
          <button
            class="px-3 py-2 text-sm font-medium rounded-md transition-colors mr-1 whitespace-nowrap flex-shrink-0"
            [class]="activeTab() === 'detailed' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            (click)="activeTab.set('detailed')">
            Детальная аналитика
          </button>
          <button
            class="px-3 py-2 text-sm font-medium rounded-md transition-colors mr-1 whitespace-nowrap flex-shrink-0"
            [class]="activeTab() === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            (click)="activeTab.set('overview')">
            Общая статистика
          </button>
          <button
            class="px-3 py-2 text-sm font-medium rounded-md transition-colors mr-1 whitespace-nowrap flex-shrink-0"
            [class]="activeTab() === 'kpi' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            (click)="activeTab.set('kpi')">
            KPI дашборд
          </button>
          <button
            class="px-3 py-2 text-sm font-medium rounded-md transition-colors mr-1 whitespace-nowrap flex-shrink-0"
            [class]="activeTab() === 'trends' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            (click)="activeTab.set('trends')">
            Тренды и прогнозы
          </button>
          <button
            class="px-3 py-2 text-sm font-medium rounded-md transition-colors mr-1 whitespace-nowrap flex-shrink-0"
            [class]="activeTab() === 'comparison' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            (click)="activeTab.set('comparison')">
            Сравнение периодов
          </button>
          <button
            class="px-3 py-2 text-sm font-medium rounded-md transition-colors mr-1 whitespace-nowrap flex-shrink-0"
            [class]="activeTab() === 'anomalies' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            (click)="activeTab.set('anomalies')">
            Аномалии и рекомендации
          </button>
        </nav>
      </div>

      <!-- Общая статистика -->
      @if (activeTab() === 'overview') {
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-blue-600 rounded-lg">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900">Общая статистика</h3>
              <p class="text-gray-600 text-sm">Обзор ключевых показателей</p>
            </div>
          </div>
          <div class="px-3 py-1 bg-gray-100 border border-gray-200 rounded-md">
            <div class="text-sm font-medium text-gray-700">
              @if (filteredDates().length > 0) {
                {{ filteredDates().length }} {{ filteredDates().length === 1 ? 'день' : filteredDates().length < 5 ? 'дня' : 'дней' }}
              }
            </div>
          </div>
        </div>

        <!-- Основные метрики -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="p-1 bg-blue-600 rounded">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div class="text-xs font-medium text-blue-600">Общий бюджет</div>
            </div>
            <div class="text-xl font-semibold text-gray-900 mb-1">€{{ totals().budget.toLocaleString('uk-UA') }}</div>
            <div class="text-xs text-gray-500">За весь период</div>
          </div>

          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="p-1 bg-green-600 rounded">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div class="text-xs font-medium text-green-600">Общие конверсии</div>
            </div>
            <div class="text-xl font-semibold text-gray-900 mb-1">{{ totals().conversions.toLocaleString('uk-UA') }}</div>
            <div class="text-xs text-gray-500">За весь период</div>
          </div>

          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="p-1 bg-purple-600 rounded">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
              <div class="text-xs font-medium text-purple-600">Средний CTR</div>
            </div>
            <div class="text-xl font-semibold text-gray-900 mb-1">{{ (totals().ctrAvg * 100).toFixed(2) }}%</div>
            <div class="text-xs text-gray-500">За весь период</div>
          </div>

          <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="p-1 bg-orange-600 rounded">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div class="text-xs font-medium text-orange-600">Средний CR</div>
            </div>
            <div class="text-xl font-semibold text-gray-900 mb-1">{{ (totals().crAvg * 100).toFixed(2) }}%</div>
            <div class="text-xs text-gray-500">За весь период</div>
          </div>
        </div>

        <!-- Краткая сводка по кампаниям -->
        <div class="mt-6">
          <h4 class="text-md font-semibold text-gray-700 mb-3">Топ кампании по бюджету</h4>
          <div class="space-y-2">
            @for (campaign of tableRows().slice(0, 5); track campaign.name) {
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span class="font-medium text-gray-800">{{ campaign.name }}</span>
                <div class="flex items-center space-x-4 text-sm text-gray-600">
                  <span>€{{ campaign.budgetEur.toLocaleString('uk-UA') }}</span>
                  <span>{{ campaign.conversions.toLocaleString('uk-UA') }} конверсий</span>
                  <span>{{ (campaign.ctrPercent * 100).toFixed(2) }}% CTR</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
      }

      <!-- Секция трендов и прогнозов -->
      @if (activeTab() === 'trends') {
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-purple-600 rounded-lg">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-xl font-semibold text-gray-900">Тренды и прогнозы</h3>
                <div class="group relative">
                  <svg class="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-80 min-w-64 break-words pointer-events-none">
                    <div class="font-semibold mb-1">Тренды и прогнозы</div>
                    <div class="text-xs mb-2">Анализ динамики показателей и прогнозирование будущих значений</div>
                    <div class="text-xs">
                      <div><span class="font-medium text-blue-400">Тренд:</span> изменение показателя в % за день</div>
                      <div><span class="font-medium text-green-400">Текущее значение:</span> среднее за последний период</div>
                      <div><span class="font-medium text-purple-400">Прогноз:</span> ожидаемое значение на следующий день</div>
                      <div><span class="font-medium text-yellow-400">Период анализа:</span> количество дней для расчета тренда</div>
                    </div>
                  </div>
                </div>
              </div>
              <p class="text-gray-600 text-sm">Анализ динамики показателей</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-700">Период анализа:</span>
            <select class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" (change)="onTrendPeriod($event)">
              <option value="7">7 дней</option>
              <option value="14">14 дней</option>
              <option value="30" selected>30 дней</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Бюджет тренд -->
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-blue-600">Бюджет</span>
              <span class="text-xs px-2 py-1 rounded-full" [class]="getTrendClass(trends().budget.trend)">
                {{ getTrendIcon(trends().budget.trend) }} {{ trends().budget.trend > 0 ? '+' : '' }}{{ trends().budget.trend.toFixed(1) }}%
              </span>
            </div>
            <div class="text-lg font-semibold text-gray-900">€{{ trends().budget.current.toLocaleString() }}</div>
            <div class="text-xs text-gray-500 mt-1">
              Прогноз: €{{ trends().budget.forecast.toLocaleString() }}
            </div>
          </div>

          <!-- Конверсии тренд -->
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-green-600">Конверсии</span>
              <span class="text-xs px-2 py-1 rounded-full" [class]="getTrendClass(trends().conversions.trend)">
                {{ getTrendIcon(trends().conversions.trend) }} {{ trends().conversions.trend > 0 ? '+' : '' }}{{ trends().conversions.trend.toFixed(1) }}%
              </span>
            </div>
            <div class="text-lg font-semibold text-gray-900">{{ trends().conversions.current.toLocaleString() }}</div>
            <div class="text-xs text-green-600 mt-1">
              Прогноз: {{ trends().conversions.forecast.toLocaleString() }}
            </div>
          </div>

          <!-- CTR тренд -->
          <div class="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-indigo-600">CTR</span>
              <span class="text-xs px-2 py-1 rounded-full" [class]="getTrendClass(trends().ctr.trend)">
                {{ getTrendIcon(trends().ctr.trend) }} {{ trends().ctr.trend > 0 ? '+' : '' }}{{ trends().ctr.trend.toFixed(1) }}%
              </span>
            </div>
            <div class="text-lg font-semibold text-gray-900">{{ (trends().ctr.current * 100).toFixed(2) }}%</div>
            <div class="text-xs text-gray-500 mt-1">
              Прогноз: {{ (trends().ctr.forecast * 100).toFixed(2) }}%
            </div>
          </div>

          <!-- CR тренд -->
          <div class="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-purple-600">CR</span>
              <span class="text-xs px-2 py-1 rounded-full" [class]="getTrendClass(trends().cr.trend)">
                {{ getTrendIcon(trends().cr.trend) }} {{ trends().cr.trend > 0 ? '+' : '' }}{{ trends().cr.trend.toFixed(1) }}%
              </span>
            </div>
            <div class="text-lg font-semibold text-gray-900">{{ (trends().cr.current * 100).toFixed(2) }}%</div>
            <div class="text-xs text-gray-500 mt-1">
              Прогноз: {{ (trends().cr.forecast * 100).toFixed(2) }}%
            </div>
          </div>
        </div>

        <!-- График трендов -->
        <div class="mt-6">
          <h4 class="text-md font-semibold text-gray-700 mb-3">График трендов</h4>
          <div class="h-64">
            <apx-chart [series]="trendChartSeries()" [chart]="trendChartConfig" [xaxis]="trendChartXAxis()" [yaxis]="trendChartYAxis" [colors]="trendChartColors" [stroke]="trendChartStroke" [legend]="trendChartLegend" [tooltip]="trendChartTooltip"></apx-chart>
          </div>
        </div>
      </div>
      }

      <!-- Секция сравнения периодов -->
      @if (activeTab() === 'comparison') {
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-emerald-600 rounded-lg">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-xl font-semibold text-gray-900">Сравнение периодов</h3>
                <div class="group relative">
                  <svg class="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-80 min-w-64 break-words pointer-events-none">
                    <div class="font-semibold mb-1">Сравнение периодов</div>
                    <div class="text-xs mb-2">Сопоставление показателей текущего периода с предыдущими периодами</div>
                    <div class="text-xs">
                      <div><span class="font-medium text-green-400">Текущий период:</span> выбранные даты из фильтров</div>
                      <div><span class="font-medium text-blue-400">Предыдущая неделя:</span> тот же период прошлой недели</div>
                      <div><span class="font-medium text-purple-400">Предыдущий месяц:</span> тот же период прошлого месяца</div>
                      <div><span class="font-medium text-yellow-400">Прошлый год:</span> тот же период год назад</div>
                      <div><span class="font-medium text-red-400">Изменение:</span> разница в % между периодами</div>
                    </div>
                    <div class="text-xs mt-2">
                      <div><span class="font-medium text-green-400">Отлично:</span> рост >10%</div>
                      <div><span class="font-medium text-blue-400">Хорошо:</span> рост 0-10%</div>
                      <div><span class="font-medium text-orange-400">Требует внимания:</span> падение 0-10%</div>
                      <div><span class="font-medium text-red-400">Критично:</span> падение >10%</div>
                    </div>
                  </div>
                </div>
              </div>
              <p class="text-gray-600 text-sm">Сопоставление показателей</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-700">Сравнить с:</span>
            <select class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" (change)="onComparisonPeriod($event)">
              <option value="previous_week">Предыдущая неделя</option>
              <option value="previous_month" selected>Предыдущий месяц</option>
              <option value="same_period_last_year">Тот же период прошлого года</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Бюджет сравнение -->
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-blue-600">Бюджет</span>
              <span class="text-xs px-2 py-1 rounded-full" [class]="getComparisonClass(comparison().budget.change)">
                {{ getComparisonIcon(comparison().budget.change) }} {{ comparison().budget.change > 0 ? '+' : '' }}{{ comparison().budget.change.toFixed(1) }}%
              </span>
            </div>
            <div class="text-lg font-semibold text-gray-900">€{{ comparison().budget.current.toLocaleString() }}</div>
            <div class="text-xs text-gray-500 mt-1">
              vs €{{ comparison().budget.previous.toLocaleString() }}
            </div>
          </div>

          <!-- Конверсии сравнение -->
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-green-600">Конверсии</span>
              <span class="text-xs px-2 py-1 rounded-full" [class]="getComparisonClass(comparison().conversions.change)">
                {{ getComparisonIcon(comparison().conversions.change) }} {{ comparison().conversions.change > 0 ? '+' : '' }}{{ comparison().conversions.change.toFixed(1) }}%
              </span>
            </div>
            <div class="text-lg font-semibold text-gray-900">{{ comparison().conversions.current.toLocaleString() }}</div>
            <div class="text-xs text-gray-500 mt-1">
              vs {{ comparison().conversions.previous.toLocaleString() }}
            </div>
          </div>

          <!-- CTR сравнение -->
          <div class="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-indigo-600">CTR</span>
              <span class="text-xs px-2 py-1 rounded-full" [class]="getComparisonClass(comparison().ctr.change)">
                {{ getComparisonIcon(comparison().ctr.change) }} {{ comparison().ctr.change > 0 ? '+' : '' }}{{ comparison().ctr.change.toFixed(1) }}%
              </span>
            </div>
            <div class="text-lg font-semibold text-gray-900">{{ (comparison().ctr.current * 100).toFixed(2) }}%</div>
            <div class="text-xs text-gray-500 mt-1">
              vs {{ (comparison().ctr.previous * 100).toFixed(2) }}%
            </div>
          </div>

          <!-- CR сравнение -->
          <div class="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-purple-600">CR</span>
              <span class="text-xs px-2 py-1 rounded-full" [class]="getComparisonClass(comparison().cr.change)">
                {{ getComparisonIcon(comparison().cr.change) }} {{ comparison().cr.change > 0 ? '+' : '' }}{{ comparison().cr.change.toFixed(1) }}%
              </span>
            </div>
            <div class="text-lg font-semibold text-gray-900">{{ (comparison().cr.current * 100).toFixed(2) }}%</div>
            <div class="text-xs text-gray-500 mt-1">
              vs {{ (comparison().cr.previous * 100).toFixed(2) }}%
            </div>
          </div>
        </div>

        <!-- Детальная таблица сравнения -->
        <div class="mt-6">
          <h4 class="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            Детальное сравнение
          </h4>
          <div class="overflow-x-auto bg-white border border-gray-200 rounded-lg">
            <table class="min-w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Метрика</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Текущий период</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Предыдущий период</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Изменение</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr>
                  <td class="px-4 py-3 font-medium text-gray-900">Бюджет</td>
                  <td class="px-4 py-3 text-gray-900">€{{ comparison().budget.current.toLocaleString() }}</td>
                  <td class="px-4 py-3 text-gray-900">€{{ comparison().budget.previous.toLocaleString() }}</td>
                  <td class="px-4 py-3 text-gray-900">
                    <span [class]="comparison().budget.change > 0 ? 'text-green-600' : 'text-red-600'">
                      {{ comparison().budget.change > 0 ? '+' : '' }}{{ comparison().budget.change.toFixed(1) }}%
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs px-2 py-1 rounded-full" [class]="getComparisonClass(comparison().budget.change)">
                      {{ getComparisonStatus(comparison().budget.change) }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td class="px-4 py-3 font-medium text-gray-900">Конверсии</td>
                  <td class="px-4 py-3 text-gray-900">{{ comparison().conversions.current.toLocaleString() }}</td>
                  <td class="px-4 py-3 text-gray-900">{{ comparison().conversions.previous.toLocaleString() }}</td>
                  <td class="px-4 py-3 text-gray-900">
                    <span [class]="comparison().conversions.change > 0 ? 'text-green-600' : 'text-red-600'">
                      {{ comparison().conversions.change > 0 ? '+' : '' }}{{ comparison().conversions.change.toFixed(1) }}%
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs px-2 py-1 rounded-full" [class]="getComparisonClass(comparison().conversions.change)">
                      {{ getComparisonStatus(comparison().conversions.change) }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td class="px-4 py-3 font-medium text-gray-900">CTR</td>
                  <td class="px-4 py-3 text-gray-900">{{ (comparison().ctr.current * 100).toFixed(2) }}%</td>
                  <td class="px-4 py-3 text-gray-900">{{ (comparison().ctr.previous * 100).toFixed(2) }}%</td>
                  <td class="px-4 py-3 text-gray-900">
                    <span [class]="comparison().ctr.change > 0 ? 'text-green-600' : 'text-red-600'">
                      {{ comparison().ctr.change > 0 ? '+' : '' }}{{ comparison().ctr.change.toFixed(1) }}%
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs px-2 py-1 rounded-full" [class]="getComparisonClass(comparison().ctr.change)">
                      {{ getComparisonStatus(comparison().ctr.change) }}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td class="px-4 py-3 font-medium text-gray-900">CR</td>
                  <td class="px-4 py-3 text-gray-900">{{ (comparison().cr.current * 100).toFixed(2) }}%</td>
                  <td class="px-4 py-3 text-gray-900">{{ (comparison().cr.previous * 100).toFixed(2) }}%</td>
                  <td class="px-4 py-3 text-gray-900">
                    <span [class]="comparison().cr.change > 0 ? 'text-green-600' : 'text-red-600'">
                      {{ comparison().cr.change > 0 ? '+' : '' }}{{ comparison().cr.change.toFixed(1) }}%
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs px-2 py-1 rounded-full" [class]="getComparisonClass(comparison().cr.change)">
                      {{ getComparisonStatus(comparison().cr.change) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      }

      <!-- KPI дашборд -->
      @if (activeTab() === 'kpi') {
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-3">
            <div class="p-1.5 bg-orange-600 rounded-lg">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-xl font-semibold text-gray-900">KPI дашборд</h3>
                <div class="group relative">
                  <svg class="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-80 min-w-64 break-words pointer-events-none">
                    <div class="font-semibold mb-1">KPI (Key Performance Indicators)</div>
                    <div class="text-xs mb-2">Ключевые показатели эффективности для отслеживания достижения целей</div>
                    <div class="text-xs">
                      <div><span class="font-medium text-green-400">Отлично:</span> ≥100%</div>
                      <div><span class="font-medium text-blue-400">Хорошо:</span> 80-99%</div>
                      <div><span class="font-medium text-yellow-400">Требует внимания:</span> 60-79%</div>
                      <div><span class="font-medium text-red-400">Критично:</span> &lt;60%</div>
                    </div>
                  </div>
                </div>
              </div>
              <p class="text-gray-600 text-sm">Контроль ключевых показателей</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-700">Цели:</span>
            <button class="px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-medium" (click)="showKPISettings.set(true)">
              Настроить
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Бюджет KPI -->
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-1">
                <span class="text-sm font-medium text-blue-600">Бюджет</span>
                <div class="group relative">
                  <svg class="w-3 h-3 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-80 min-w-64 break-words pointer-events-none">
                    <div class="font-semibold mb-1">Бюджет KPI</div>
                    <div class="text-xs">Показывает процент использования выделенного бюджета на рекламу</div>
                    <div class="text-xs mt-1">
                      <div><span class="font-medium">Формула:</span> (Потрачено / Цель) × 100%</div>
                      <div><span class="font-medium">Цель:</span> Эффективное использование бюджета</div>
                    </div>
                  </div>
                </div>
              </div>
              <span class="text-xs px-2 py-1 rounded-full" [class]="getKPIClass(kpiMetrics().budget.achievement)">
                {{ kpiMetrics().budget.achievement.toFixed(0) }}%
              </span>
            </div>
            <div class="text-lg font-semibold text-gray-900">€{{ kpiMetrics().budget.current.toLocaleString() }}</div>
            <div class="text-xs text-gray-500 mt-1">
              Цель: €{{ kpiMetrics().budget.target.toLocaleString() }}
            </div>
            <div class="mt-2">
              <div class="w-full bg-blue-200 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                     [style.width.%]="Math.min(kpiMetrics().budget.achievement, 100)"></div>
              </div>
            </div>
          </div>

          <!-- Конверсии KPI -->
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-1">
                <span class="text-sm font-medium text-green-600">Конверсии</span>
                <div class="group relative">
                  <svg class="w-3 h-3 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-80 min-w-64 break-words pointer-events-none">
                    <div class="font-semibold mb-1">Конверсии KPI</div>
                    <div class="text-xs">Количество целевых действий (покупки, заявки, звонки)</div>
                    <div class="text-xs mt-1">
                      <div><span class="font-medium">Формула:</span> (Получено / Цель) × 100%</div>
                      <div><span class="font-medium">Цель:</span> Достижение планового количества конверсий</div>
                    </div>
                  </div>
                </div>
              </div>
              <span class="text-xs px-2 py-1 rounded-full" [class]="getKPIClass(kpiMetrics().conversions.achievement)">
                {{ kpiMetrics().conversions.achievement.toFixed(0) }}%
              </span>
            </div>
            <div class="text-lg font-semibold text-gray-900">{{ kpiMetrics().conversions.current.toLocaleString() }}</div>
            <div class="text-xs text-gray-500 mt-1">
              Цель: {{ kpiMetrics().conversions.target.toLocaleString() }}
            </div>
            <div class="mt-2">
              <div class="w-full bg-green-200 rounded-full h-2">
                <div class="bg-green-600 h-2 rounded-full transition-all duration-300"
                     [style.width.%]="Math.min(kpiMetrics().conversions.achievement, 100)"></div>
              </div>
            </div>
          </div>

          <!-- CTR KPI -->
          <div class="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-1">
                <span class="text-sm font-medium text-indigo-600">CTR</span>
                <div class="group relative">
                  <svg class="w-3 h-3 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-80 min-w-64 break-words pointer-events-none">
                    <div class="font-semibold mb-1">CTR (Click-Through Rate)</div>
                    <div class="text-xs">Процент кликов по объявлению от общего количества показов</div>
                    <div class="text-xs mt-1">
                      <div><span class="font-medium">Формула:</span> (Клики / Показы) × 100%</div>
                      <div><span class="font-medium">Цель:</span> Высокий CTR = релевантная реклама</div>
                    </div>
                  </div>
                </div>
              </div>
              <span class="text-xs px-2 py-1 rounded-full" [class]="getKPIClass(kpiMetrics().ctr.achievement)">
                {{ kpiMetrics().ctr.achievement.toFixed(0) }}%
              </span>
            </div>
            <div class="text-lg font-semibold text-gray-900">{{ (kpiMetrics().ctr.current * 100).toFixed(2) }}%</div>
            <div class="text-xs text-gray-500 mt-1">
              Цель: {{ (kpiMetrics().ctr.target * 100).toFixed(2) }}%
            </div>
            <div class="mt-2">
              <div class="w-full bg-indigo-200 rounded-full h-2">
                <div class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                     [style.width.%]="Math.min(kpiMetrics().ctr.achievement, 100)"></div>
              </div>
            </div>
          </div>

          <!-- CR KPI -->
          <div class="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-1">
                <span class="text-sm font-medium text-purple-600">CR</span>
                <div class="group relative">
                  <svg class="w-3 h-3 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-80 min-w-64 break-words pointer-events-none">
                    <div class="font-semibold mb-1">CR (Conversion Rate)</div>
                    <div class="text-xs">Процент посетителей, которые совершили целевое действие</div>
                    <div class="text-xs mt-1">
                      <div><span class="font-medium">Формула:</span> (Конверсии / Клики) × 100%</div>
                      <div><span class="font-medium">Цель:</span> Высокий CR = эффективный сайт</div>
                    </div>
                  </div>
                </div>
              </div>
              <span class="text-xs px-2 py-1 rounded-full" [class]="getKPIClass(kpiMetrics().cr.achievement)">
                {{ kpiMetrics().cr.achievement.toFixed(0) }}%
              </span>
            </div>
            <div class="text-lg font-semibold text-gray-900">{{ (kpiMetrics().cr.current * 100).toFixed(2) }}%</div>
            <div class="text-xs text-gray-500 mt-1">
              Цель: {{ (kpiMetrics().cr.target * 100).toFixed(2) }}%
            </div>
            <div class="mt-2">
              <div class="w-full bg-purple-200 rounded-full h-2">
                <div class="bg-purple-600 h-2 rounded-full transition-all duration-300"
                     [style.width.%]="Math.min(kpiMetrics().cr.achievement, 100)"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Сводка KPI -->
        <div class="mt-6">
          <h4 class="text-md font-semibold text-gray-700 mb-3">Сводка достижений</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-3 bg-gray-50 rounded-lg">
              <div class="text-sm font-medium text-gray-600">Достигнуто целей</div>
              <div class="text-lg font-bold text-gray-800">{{ kpiSummary().achieved }}/{{ kpiSummary().total }}</div>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg">
              <div class="text-sm font-medium text-gray-600">Средний прогресс</div>
              <div class="text-lg font-bold text-gray-800">{{ kpiSummary().averageProgress.toFixed(1) }}%</div>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg">
              <div class="text-sm font-medium text-gray-600">Статус</div>
              <div class="text-lg font-bold" [class]="getKPISummaryClass(kpiSummary().status)">
                {{ getKPISummaryStatus(kpiSummary().status) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      }

      <!-- Секция аномалий -->
      @if (activeTab() === 'anomalies') {
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-3">
            <div class="p-1.5 bg-red-600 rounded-lg">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-xl font-semibold text-gray-900">Аномалии и необычные изменения</h3>
                <div class="group relative">
                  <svg class="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-80 min-w-64 break-words pointer-events-none">
                    <div class="font-semibold mb-1">Аномалии и необычные изменения</div>
                    <div class="text-xs mb-2">Автоматическое выявление необычных отклонений в показателях</div>
                    <div class="text-xs">
                      <div><span class="font-medium text-red-400">Критично:</span> отклонение >40% (бюджет), >50% (конверсии)</div>
                      <div><span class="font-medium text-orange-400">Предупреждение:</span> отклонение >20% (бюджет), >30% (конверсии)</div>
                      <div><span class="font-medium text-blue-400">Информация:</span> отклонение >10% (CTR/CR)</div>
                      <div><span class="font-medium text-green-400">Чувствительность:</span> настройка порогов обнаружения</div>
                    </div>
                  </div>
                </div>
              </div>
              <p class="text-gray-600 text-sm">Выявление отклонений в данных</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-700">Чувствительность:</span>
            <select class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-red-500 focus:border-red-500" (change)="onAnomalySensitivity($event)">
              <option value="low">Низкая</option>
              <option value="medium" selected>Средняя</option>
              <option value="high">Высокая</option>
            </select>
          </div>
        </div>

        @if (anomalies().length > 0) {
          <div class="space-y-4">
            @for (anomaly of anomalies(); track anomaly.id) {
              <div class="p-4 border rounded-lg" [class]="getAnomalyClass(anomaly.severity)">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center mb-2">
                      <span class="text-lg mr-2">{{ getAnomalyIcon(anomaly.severity) }}</span>
                      <h4 class="font-semibold text-gray-800">{{ anomaly.title }}</h4>
                      <span class="ml-2 text-xs px-2 py-1 rounded-full" [class]="getAnomalySeverityClass(anomaly.severity)">
                        {{ getAnomalySeverityText(anomaly.severity) }}
                      </span>
                    </div>
                    <p class="text-gray-600 text-sm mb-2">{{ anomaly.description }}</p>
                    <div class="text-xs text-gray-500">
                      <span class="font-medium">Дата:</span> {{ anomaly.date }} |
                      <span class="font-medium">Проект:</span> {{ anomaly.project }} |
                      <span class="font-medium">Изменение:</span>
                      <span [class]="anomaly.change > 0 ? 'text-green-600' : 'text-red-600'">
                        {{ anomaly.change > 0 ? '+' : '' }}{{ anomaly.change.toFixed(1) }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="text-center py-8">
            <div class="text-4xl mb-4">✅</div>
            <h4 class="text-lg font-medium text-gray-800 mb-2">Аномалий не обнаружено</h4>
            <p class="text-gray-600 text-sm">Все показатели находятся в нормальном диапазоне</p>
          </div>
        }

        <!-- Статистика аномалий -->
        @if (anomalyStats().total > 0) {
          <div class="mt-6 pt-4 border-t border-gray-200">
            <h4 class="text-md font-semibold text-gray-700 mb-3">Статистика аномалий</h4>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="text-sm font-medium text-gray-600">Всего обнаружено</div>
                <div class="text-lg font-bold text-gray-800">{{ anomalyStats().total }}</div>
              </div>
              <div class="p-3 bg-red-50 rounded-lg">
                <div class="text-sm font-medium text-red-600">Критические</div>
                <div class="text-lg font-bold text-red-800">{{ anomalyStats().critical }}</div>
              </div>
              <div class="p-3 bg-yellow-50 rounded-lg">
                <div class="text-sm font-medium text-yellow-600">Предупреждения</div>
                <div class="text-lg font-bold text-yellow-800">{{ anomalyStats().warning }}</div>
              </div>
              <div class="p-3 bg-blue-50 rounded-lg">
                <div class="text-sm font-medium text-blue-600">Информационные</div>
                <div class="text-lg font-bold text-blue-800">{{ anomalyStats().info }}</div>
              </div>
            </div>
          </div>
        }
      </div>
      }

      <!-- Секция автоматических рекомендаций -->
      @if (activeTab() === 'anomalies') {
      <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-4">
            <div class="p-3 bg-blue-600 rounded-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-xl font-semibold text-gray-900">💡 Автоматические рекомендации</h3>
                <div class="group relative">
                  <svg class="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-80 min-w-64 break-words pointer-events-none">
                    <div class="font-semibold mb-1">Автоматические рекомендации</div>
                    <div class="text-xs mb-2">Умные предложения по улучшению показателей на основе анализа данных</div>
                    <div class="text-xs">
                      <div><span class="font-medium text-red-400">Высокий приоритет:</span> критические проблемы требующие немедленного внимания</div>
                      <div><span class="font-medium text-orange-400">Средний приоритет:</span> важные улучшения для оптимизации</div>
                      <div><span class="font-medium text-blue-400">Низкий приоритет:</span> дополнительные возможности для роста</div>
                      <div><span class="font-medium text-green-400">Фильтр:</span> настройка отображения по приоритету</div>
                    </div>
                  </div>
                </div>
              </div>
              <p class="text-gray-600 text-sm">Умные предложения по оптимизации</p>
            </div>
          </div>
            <div class="flex items-center space-x-3">
              <span class="text-sm font-semibold text-slate-700">Приоритет:</span>
              <select class="text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" (change)="onRecommendationPriority($event)">
                <option value="all">Все</option>
                <option value="high" selected>Высокий</option>
                <option value="medium">Средний</option>
                <option value="low">Низкий</option>
              </select>
            </div>
          </div>

        @if (recommendations().length > 0) {
          <div class="space-y-4">
            @for (recommendation of recommendations(); track recommendation.id) {
              <div class="p-4 border rounded-lg" [class]="getRecommendationClass(recommendation.priority)">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center mb-2">
                      <span class="text-lg mr-2">{{ getRecommendationIcon(recommendation.priority) }}</span>
                      <h4 class="font-semibold text-gray-800">{{ recommendation.title }}</h4>
                      <span class="ml-2 text-xs px-2 py-1 rounded-full" [class]="getRecommendationPriorityClass(recommendation.priority)">
                        {{ getRecommendationPriorityText(recommendation.priority) }}
                      </span>
                    </div>
                    <p class="text-gray-600 text-sm mb-3">{{ recommendation.description }}</p>

                    @if (recommendation.impact) {
                      <div class="text-xs text-gray-500 mb-2">
                        <span class="font-medium">Ожидаемый эффект:</span> {{ recommendation.impact }}
                      </div>
                    }

                    @if (recommendation.action) {
                      <div class="text-xs text-gray-500">
                        <span class="font-medium">Рекомендуемое действие:</span> {{ recommendation.action }}
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="text-center py-8">
            <div class="text-4xl mb-4">✅</div>
            <h4 class="text-lg font-medium text-gray-800 mb-2">Рекомендаций нет</h4>
            <p class="text-gray-600 text-sm">Все показатели находятся в оптимальном диапазоне</p>
          </div>
        }

        <!-- Статистика рекомендаций -->
        @if (recommendationStats().total > 0) {
          <div class="mt-6 pt-4 border-t border-gray-200">
            <h4 class="text-md font-semibold text-gray-700 mb-3">Статистика рекомендаций</h4>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="text-sm font-medium text-gray-600">Всего предложено</div>
                <div class="text-lg font-bold text-gray-800">{{ recommendationStats().total }}</div>
              </div>
              <div class="p-3 bg-red-50 rounded-lg">
                <div class="text-sm font-medium text-red-600">Высокий приоритет</div>
                <div class="text-lg font-bold text-red-800">{{ recommendationStats().high }}</div>
              </div>
              <div class="p-3 bg-yellow-50 rounded-lg">
                <div class="text-sm font-medium text-yellow-600">Средний приоритет</div>
                <div class="text-lg font-bold text-yellow-800">{{ recommendationStats().medium }}</div>
              </div>
              <div class="p-3 bg-blue-50 rounded-lg">
                <div class="text-sm font-medium text-blue-600">Низкий приоритет</div>
                <div class="text-lg font-bold text-blue-800">{{ recommendationStats().low }}</div>
              </div>
            </div>
          </div>
        }
      </div>
      }


      @if (activeTab() === 'detailed') {
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex items-center space-x-3 mb-6">
          <div class="p-2 bg-gray-600 rounded-lg">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-gray-900">Детальная аналитика</h3>
            <p class="text-gray-600 text-sm">Подробный анализ всех показателей</p>
          </div>
        </div>

        <!-- Глобальные тотали -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <div class="p-1.5 bg-blue-600 rounded-lg">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
              </div>
              <div class="text-xs font-medium text-blue-600 mb-1 whitespace-nowrap">Бюджет текущий период</div>
              <div class="text-base font-semibold text-gray-900">€{{ totals().budget.toLocaleString('uk-UA') }}</div>
            </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="p-1.5 bg-green-600 rounded-lg">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
          <div class="text-xs font-medium text-green-600 mb-1 whitespace-nowrap">Конверсии текущий период</div>
          <div class="text-base font-semibold text-gray-900">{{ totals().conversions.toLocaleString('uk-UA') }}</div>
        </div>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="p-1.5 bg-red-600 rounded-lg">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </div>
          </div>
          <div class="text-xs font-medium text-red-600 mb-1 whitespace-nowrap">send_new_message</div>
          <div class="text-base font-semibold text-gray-900">{{ totals().sendNewMessage.toLocaleString('uk-UA') }}</div>
        </div>
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="p-1.5 bg-orange-600 rounded-lg">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
            </div>
          </div>
          <div class="text-xs font-medium text-orange-600 mb-1 whitespace-nowrap">sales_full_tel</div>
          <div class="text-base font-semibold text-gray-900">{{ totals().salesFullTel.toLocaleString('uk-UA') }}</div>
        </div>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="p-1.5 bg-yellow-600 rounded-lg">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </div>
          </div>
          <div class="text-xs font-medium text-yellow-600 mb-1 whitespace-nowrap">button_messenger</div>
          <div class="text-base font-semibold text-gray-900">{{ totals().buttonMessenger.toLocaleString('uk-UA') }}</div>
        </div>
        <div class=" bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="p-1.5 bg-blue-600 rounded-lg">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </div>
            </div>
            <div class="text-xs font-medium text-cyan-600 mb-1 whitespace-nowrap">Показы текущий период</div>
            <div class="text-base font-semibold text-gray-900">{{ totals().impressions.toLocaleString('uk-UA') }}</div>
          </div>
        </div>
        <div class=" bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="p-1.5 bg-blue-600 rounded-lg">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
                </svg>
              </div>
            </div>
            <div class="text-xs font-medium text-purple-600 mb-1 whitespace-nowrap">Клики текущий период</div>
            <div class="text-base font-semibold text-gray-900">{{ totals().clicks.toLocaleString('uk-UA') }}</div>
          </div>
        </div>
        <div class=" bg-pink-50 border border-pink-200 rounded-lg p-4">
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="p-1.5 bg-blue-600 rounded-lg">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
            </div>
            <div class="text-xs font-medium text-pink-600 mb-1 whitespace-nowrap">СРМ текущий период</div>
            <div class="text-base font-semibold text-gray-900">€{{ totals().cpmEur.toFixed(2) }}</div>
          </div>
        </div>
        <div class=" bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="p-1.5 bg-blue-600 rounded-lg">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
            </div>
            <div class="text-xs font-medium text-indigo-600 mb-1 whitespace-nowrap">CTR текущий период</div>
            <div class="text-base font-semibold text-gray-900">{{ (totals().ctrAvg * 100).toFixed(2) }}%</div>
          </div>
        </div>
        <div class=" bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="p-1.5 bg-blue-600 rounded-lg">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
            </div>
            <div class="text-xs font-medium text-slate-600 mb-1 whitespace-nowrap">CR текущий период</div>
            <div class="text-base font-semibold text-gray-900">{{ (totals().crAvg * 100).toFixed(2) }}%</div>
          </div>
        </div>
      </div>

      <div class="p-6 rounded-lg bg-white border border-gray-200 mb-6">
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
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
            (click)="exportChart()"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Экспорт графика
          </button>
        </div>
        <div class="h-96">
          <apx-chart [series]="chartSeries()" [chart]="chartConfig" [xaxis]="chartXAxis()" [yaxis]="chartYAxis" [colors]="chartColors" [stroke]="chartStroke" [legend]="chartLegend" [tooltip]="chartTooltip"></apx-chart>
        </div>
      </div>

            <div class="p-6 rounded-lg bg-white border border-gray-200">
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
      }

    <!-- Модальные окна вынесены за основной контейнер -->
    <!-- Модальное окно управления данными -->
    @if (showDeleteModal()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="showDeleteModal.set(false)">
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
                (click)="showDeleteModal.set(false)"
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


    <!-- Модальное окно настройки KPI -->
    @if (showKPISettings()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">Настройка KPI целей</h3>
            <button class="text-gray-400 hover:text-gray-600" (click)="showKPISettings.set(false)">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Проект</label>
              <select class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" (change)="onKPISettingsProject($event)">
                <option value="Autoline">Autoline</option>
                <option value="Machinery">Machinery</option>
                <option value="Agroline">Agroline</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Бюджет (€)</label>
              <input type="number" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     [value]="kpiSettingsTargets().budget" (change)="onKPIBudgetChange($event)" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Конверсии</label>
              <input type="number" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     [value]="kpiSettingsTargets().conversions" (change)="onKPIConversionsChange($event)" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">CTR (%)</label>
              <input type="number" step="0.01" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     [value]="kpiSettingsTargets().ctr * 100" (change)="onKPICTRChange($event)" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">CR (%)</label>
              <input type="number" step="0.01" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     [value]="kpiSettingsTargets().cr * 100" (change)="onKPICRChange($event)" />
            </div>
          </div>

          <div class="flex space-x-3 mt-6">
            <button class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" (click)="saveKPISettings()">
              Сохранить
            </button>
            <button class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors" (click)="showKPISettings.set(false)">
              Отмена
            </button>
          </div>
        </div>
      </div>
    }
      </div>
    } @else {
      <div class="max-w-7xl mx-auto p-6">
        <div class="bg-white border border-gray-200 rounded-lg p-8">
          <div class="text-center">
            <!-- Іконка -->
            <div class="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
              <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            
            <!-- Заголовок -->
            <h2 class="text-2xl font-semibold text-gray-900 mb-3">Нет данных для анализа</h2>
            
            <!-- Опис -->
            <p class="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Загрузите XLSX файл на блоке "Импорт ежедневного отчета", чтобы увидеть детальную аналитику ваших кампаний
            </p>
            
            <!-- Інформація про підтримувані формати -->
            <div class="flex items-center justify-center text-sm text-gray-500 mb-8">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Поддерживаются файлы .xlsx и .xls
            </div>
            
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `:host{display:block}
     table{width:100%}
     .scrollbar-hide {
       -ms-overflow-style: none;
       scrollbar-width: none;
     }
     .scrollbar-hide::-webkit-scrollbar {
       display: none;
     }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private store = inject(DataStoreService);
  protected Math = Math;
  protected from = signal<string>('');
  protected to = signal<string>('');
  protected selectedCampaign = signal<string>('');
  protected selectedSubgroup = signal<string>('');
  protected selectedProject = signal<ProjectType>('Autoline');
  protected sortColumn = signal<string>('');
  protected sortDirection = signal<'asc' | 'desc'>('asc');
  protected showDeleteModal = signal(false);
  protected selectedDeleteDate = signal('');
  protected trendPeriod = signal<number>(30);
  protected comparisonPeriod = signal<'previous_week' | 'previous_month' | 'same_period_last_year'>('previous_month');
  protected showKPISettings = signal<boolean>(false);
  protected kpiSettingsProject = signal<ProjectType>('Autoline');
  protected kpiSettingsTargets = signal({
    budget: 10000,
    conversions: 100,
    ctr: 0.05,
    cr: 0.02
  });
  protected anomalySensitivity = signal<'low' | 'medium' | 'high'>('medium');
  protected recommendationPriority = signal<'all' | 'high' | 'medium' | 'low'>('high');
  protected activeTab = signal<'overview' | 'kpi' | 'trends' | 'comparison' | 'anomalies' | 'detailed'>('detailed');

  protected availableDates = computed(() => {
    return this.store.dates();
  });

  protected trends = computed(() => {
    const dates = this.filteredDates();
    const period = this.trendPeriod();

    if (dates.length < 2) {
      return {
        budget: { trend: 0, current: 0, forecast: 0 },
        conversions: { trend: 0, current: 0, forecast: 0 },
        ctr: { trend: 0, current: 0, forecast: 0 },
        cr: { trend: 0, current: 0, forecast: 0 }
      };
    }

    // Берем последние N дней для анализа
    const recentDates = dates.slice(-period);
    const project = this.selectedProject();

    // Получаем данные для каждого дня
    const dailyData = recentDates.map(date => {
      // Убираем суффикс проекта из даты для поиска
      const cleanDate = date.split('-').slice(0, 3).join('-');
      const reports = this.store.reports().filter(r => r.date === cleanDate && r.project === project);
      const total = reports.reduce((sum, r) => ({
        budget: sum.budget + r.total.budgetEur,
        conversions: sum.conversions + r.total.conversions,
        clicks: sum.clicks + r.total.clicks,
        impressions: sum.impressions + r.total.impressions
      }), { budget: 0, conversions: 0, clicks: 0, impressions: 0 });

      return {
        date,
        budget: total.budget,
        conversions: total.conversions,
        ctr: total.impressions > 0 ? total.clicks / total.impressions : 0,
        cr: total.clicks > 0 ? total.conversions / total.clicks : 0
      };
    });

    // Рассчитываем тренды
    const calculateTrend = (values: number[]) => {
      if (values.length < 2) return 0;

      const n = values.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = values.reduce((sum, val) => sum + val, 0);
      const sumXY = values.reduce((sum, val, i) => sum + val * i, 0);
      const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const avg = sumY / n;

      return avg > 0 ? (slope / avg) * 100 : 0;
    };

    const budgetTrend = calculateTrend(dailyData.map(d => d.budget));
    const conversionsTrend = calculateTrend(dailyData.map(d => d.conversions));
    const ctrTrend = calculateTrend(dailyData.map(d => d.ctr));
    const crTrend = calculateTrend(dailyData.map(d => d.cr));

    // Текущие значения (последний день)
    const current = dailyData[dailyData.length - 1];

    // Простой прогноз (линейная экстраполяция)
    const forecast = {
      budget: current.budget * (1 + budgetTrend / 100),
      conversions: current.conversions * (1 + conversionsTrend / 100),
      ctr: current.ctr * (1 + ctrTrend / 100),
      cr: current.cr * (1 + crTrend / 100)
    };

    const result = {
      budget: { trend: budgetTrend, current: current.budget, forecast: forecast.budget },
      conversions: { trend: conversionsTrend, current: current.conversions, forecast: forecast.conversions },
      ctr: { trend: ctrTrend, current: current.ctr, forecast: forecast.ctr },
      cr: { trend: crTrend, current: current.cr, forecast: forecast.cr }
    };
    
    return result;
  });

  protected comparison = computed(() => {
    const dates = this.filteredDates();
    const period = this.comparisonPeriod();

    if (dates.length === 0) {
      return {
        budget: { current: 0, previous: 0, change: 0 },
        conversions: { current: 0, previous: 0, change: 0 },
        ctr: { current: 0, previous: 0, change: 0 },
        cr: { current: 0, previous: 0, change: 0 }
      };
    }

    const project = this.selectedProject();

    // Определяем периоды для сравнения
    let currentPeriodDates: string[];
    let previousPeriodDates: string[];

          if (period === 'previous_week') {
        // Сравниваем с предыдущей неделей
        const cleanCurrentStart = dates[0].split('-').slice(0, 3).join('-');
        const cleanCurrentEnd = dates[dates.length - 1].split('-').slice(0, 3).join('-');
        const currentWeekStart = new Date(cleanCurrentStart);
        const currentWeekEnd = new Date(cleanCurrentEnd);
        const previousWeekStart = new Date(currentWeekStart);
        previousWeekStart.setDate(previousWeekStart.getDate() - 7);
        const previousWeekEnd = new Date(currentWeekEnd);
        previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);

        currentPeriodDates = dates;
        previousPeriodDates = this.store.dates().filter(date => {
          const cleanDate = date.split('-').slice(0, 3).join('-');
          const dateObj = new Date(cleanDate);
          return dateObj >= previousWeekStart && dateObj <= previousWeekEnd;
        });
          } else if (period === 'previous_month') {
        // Сравниваем с предыдущим месяцем
        const cleanCurrentStart = dates[0].split('-').slice(0, 3).join('-');
        const cleanCurrentEnd = dates[dates.length - 1].split('-').slice(0, 3).join('-');
        const currentMonthStart = new Date(cleanCurrentStart);
        const currentMonthEnd = new Date(cleanCurrentEnd);
        const previousMonthStart = new Date(currentMonthStart);
        previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
        const previousMonthEnd = new Date(currentMonthEnd);
        previousMonthEnd.setMonth(previousMonthEnd.getMonth() - 1);

        currentPeriodDates = dates;
        previousPeriodDates = this.store.dates().filter(date => {
          const cleanDate = date.split('-').slice(0, 3).join('-');
          const dateObj = new Date(cleanDate);
          return dateObj >= previousMonthStart && dateObj <= previousMonthEnd;
        });
          } else {
        // Сравниваем с тем же периодом прошлого года
        const cleanCurrentStart = dates[0].split('-').slice(0, 3).join('-');
        const cleanCurrentEnd = dates[dates.length - 1].split('-').slice(0, 3).join('-');
        const currentYearStart = new Date(cleanCurrentStart);
        const currentYearEnd = new Date(cleanCurrentEnd);
        const previousYearStart = new Date(currentYearStart);
        previousYearStart.setFullYear(previousYearStart.getFullYear() - 1);
        const previousYearEnd = new Date(currentYearEnd);
        previousYearEnd.setFullYear(previousYearEnd.getFullYear() - 1);

        currentPeriodDates = dates;
        previousPeriodDates = this.store.dates().filter(date => {
          const cleanDate = date.split('-').slice(0, 3).join('-');
          const dateObj = new Date(cleanDate);
          return dateObj >= previousYearStart && dateObj <= previousYearEnd;
        });
      }

    // Рассчитываем метрики для текущего периода
    const currentMetrics = this.calculatePeriodMetrics(currentPeriodDates, project);

    // Рассчитываем метрики для предыдущего периода
    const previousMetrics = this.calculatePeriodMetrics(previousPeriodDates, project);

    // Рассчитываем изменения
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      budget: {
        current: currentMetrics.budget,
        previous: previousMetrics.budget,
        change: calculateChange(currentMetrics.budget, previousMetrics.budget)
      },
      conversions: {
        current: currentMetrics.conversions,
        previous: previousMetrics.conversions,
        change: calculateChange(currentMetrics.conversions, previousMetrics.conversions)
      },
      ctr: {
        current: currentMetrics.ctr,
        previous: previousMetrics.ctr,
        change: calculateChange(currentMetrics.ctr, previousMetrics.ctr)
      },
      cr: {
        current: currentMetrics.cr,
        previous: previousMetrics.cr,
        change: calculateChange(currentMetrics.cr, previousMetrics.cr)
      }
    };
  });

  protected kpiMetrics = computed(() => {
    const currentTotals = this.totals();
    const project = this.selectedProject();

    // Получаем цели из localStorage или используем дефолтные
    const kpiTargets = this.getKPITargets(project);

    const calculateAchievement = (current: number, target: number) => {
      if (target === 0) return 0;
      return (current / target) * 100;
    };

    return {
      budget: {
        current: currentTotals.budget,
        target: kpiTargets.budget,
        achievement: calculateAchievement(currentTotals.budget, kpiTargets.budget)
      },
      conversions: {
        current: currentTotals.conversions,
        target: kpiTargets.conversions,
        achievement: calculateAchievement(currentTotals.conversions, kpiTargets.conversions)
      },
      ctr: {
        current: currentTotals.ctrAvg,
        target: kpiTargets.ctr,
        achievement: calculateAchievement(currentTotals.ctrAvg, kpiTargets.ctr)
      },
      cr: {
        current: currentTotals.crAvg,
        target: kpiTargets.cr,
        achievement: calculateAchievement(currentTotals.crAvg, kpiTargets.cr)
      }
    };
  });

  protected kpiSummary = computed(() => {
    const metrics = this.kpiMetrics();
    const achievements = [
      metrics.budget.achievement,
      metrics.conversions.achievement,
      metrics.ctr.achievement,
      metrics.cr.achievement
    ];

    const achieved = achievements.filter(a => a >= 100).length;
    const averageProgress = achievements.reduce((sum, a) => sum + a, 0) / achievements.length;

    let status: 'excellent' | 'good' | 'warning' | 'critical';
    if (averageProgress >= 100) status = 'excellent';
    else if (averageProgress >= 80) status = 'good';
    else if (averageProgress >= 60) status = 'warning';
    else status = 'critical';

    return {
      achieved,
      total: achievements.length,
      averageProgress,
      status
    };
  });

  protected anomalies = computed(() => {
    const dates = this.filteredDates();
    const project = this.selectedProject();
    const sensitivity = this.anomalySensitivity();

    if (dates.length < 2) return [];

    const anomalies: Array<{
      id: string;
      title: string;
      description: string;
      date: string;
      project: string;
      metric: string;
      change: number;
      severity: 'critical' | 'warning' | 'info';
    }> = [];

    // Получаем данные для анализа
    const dailyData = dates.map(date => {
      // Убираем суффикс проекта из даты для поиска
      const cleanDate = date.split('-').slice(0, 3).join('-');
      const reports = this.store.reports().filter(r => r.date === cleanDate && r.project === project);
      const total = reports.reduce((sum, r) => ({
        budget: sum.budget + r.total.budgetEur,
        conversions: sum.conversions + r.total.conversions,
        clicks: sum.clicks + r.total.clicks,
        impressions: sum.impressions + r.total.impressions
      }), { budget: 0, conversions: 0, clicks: 0, impressions: 0 });

      return {
        date,
        budget: total.budget,
        conversions: total.conversions,
        ctr: total.impressions > 0 ? total.clicks / total.impressions : 0,
        cr: total.clicks > 0 ? total.conversions / total.clicks : 0
      };
    });

    // Настраиваем пороги в зависимости от чувствительности
    const thresholds = {
      low: { budget: 50, conversions: 100, ctr: 20, cr: 50 },
      medium: { budget: 30, conversions: 50, ctr: 15, cr: 30 },
      high: { budget: 15, conversions: 25, ctr: 10, cr: 15 }
    };

    const currentThresholds = thresholds[sensitivity];

    // Анализируем каждую метрику
    for (let i = 1; i < dailyData.length; i++) {
      const current = dailyData[i];
      const previous = dailyData[i - 1];

      // Бюджет
      if (previous.budget > 0) {
        const change = ((current.budget - previous.budget) / previous.budget) * 100;
        if (Math.abs(change) > currentThresholds.budget) {
          anomalies.push({
            id: `budget-${current.date}`,
            title: 'Резкое изменение бюджета',
            description: `Бюджет изменился на ${Math.abs(change).toFixed(1)}% по сравнению с предыдущим днем`,
            date: current.date,
            project,
            metric: 'budget',
            change,
            severity: Math.abs(change) > currentThresholds.budget * 2 ? 'critical' : 'warning'
          });
        }
      }

      // Конверсии
      if (previous.conversions > 0) {
        const change = ((current.conversions - previous.conversions) / previous.conversions) * 100;
        if (Math.abs(change) > currentThresholds.conversions) {
          anomalies.push({
            id: `conversions-${current.date}`,
            title: 'Аномальное изменение конверсий',
            description: `Количество конверсий изменилось на ${Math.abs(change).toFixed(1)}%`,
            date: current.date,
            project,
            metric: 'conversions',
            change,
            severity: Math.abs(change) > currentThresholds.conversions * 2 ? 'critical' : 'warning'
          });
        }
      }

      // CTR
      if (previous.ctr > 0) {
        const change = ((current.ctr - previous.ctr) / previous.ctr) * 100;
        if (Math.abs(change) > currentThresholds.ctr) {
          anomalies.push({
            id: `ctr-${current.date}`,
            title: 'Изменение CTR',
            description: `CTR изменился на ${Math.abs(change).toFixed(1)}%`,
            date: current.date,
            project,
            metric: 'ctr',
            change,
            severity: Math.abs(change) > currentThresholds.ctr * 2 ? 'critical' : 'warning'
          });
        }
      }

      // CR
      if (previous.cr > 0) {
        const change = ((current.cr - previous.cr) / previous.cr) * 100;
        if (Math.abs(change) > currentThresholds.cr) {
          anomalies.push({
            id: `cr-${current.date}`,
            title: 'Изменение CR',
            description: `CR изменился на ${Math.abs(change).toFixed(1)}%`,
            date: current.date,
            project,
            metric: 'cr',
            change,
            severity: Math.abs(change) > currentThresholds.cr * 2 ? 'critical' : 'warning'
          });
        }
      }
    }

    return anomalies;
  });

  protected anomalyStats = computed(() => {
    const anomalies = this.anomalies();
    const critical = anomalies.filter(a => a.severity === 'critical').length;
    const warning = anomalies.filter(a => a.severity === 'warning').length;
    const info = anomalies.filter(a => a.severity === 'info').length;

    return {
      total: anomalies.length,
      critical,
      warning,
      info
    };
  });

  protected recommendations = computed(() => {
    const currentTotals = this.totals();
    const trends = this.trends();
    const comparison = this.comparison();
    const kpiMetrics = this.kpiMetrics();
    const priority = this.recommendationPriority();

    const recommendations: Array<{
      id: string;
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      impact?: string;
      action?: string;
    }> = [];

    // Анализируем бюджет
    if (kpiMetrics.budget.achievement < 80) {
      recommendations.push({
        id: 'budget-low',
        title: 'Низкий бюджет',
        description: `Текущий бюджет составляет ${kpiMetrics.budget.achievement.toFixed(1)}% от цели`,
        priority: kpiMetrics.budget.achievement < 50 ? 'high' : 'medium',
        impact: 'Увеличение бюджета может повысить конверсии на 15-25%',
        action: 'Рассмотрите увеличение бюджета на 20-30%'
      });
    }

    if (trends.budget.trend < -10) {
      recommendations.push({
        id: 'budget-declining',
        title: 'Снижение бюджета',
        description: `Бюджет снижается на ${Math.abs(trends.budget.trend).toFixed(1)}% в день`,
        priority: 'high',
        impact: 'Стабилизация бюджета может улучшить результаты',
        action: 'Проверьте настройки бюджета и оптимизируйте расходы'
      });
    }

    // Анализируем конверсии
    if (kpiMetrics.conversions.achievement < 70) {
      recommendations.push({
        id: 'conversions-low',
        title: 'Низкие конверсии',
        description: `Достигнуто только ${kpiMetrics.conversions.achievement.toFixed(1)}% от цели по конверсиям`,
        priority: 'high',
        impact: 'Улучшение конверсий может увеличить доход на 20-40%',
        action: 'Оптимизируйте целевые страницы и улучшите релевантность'
      });
    }

    if (trends.conversions.trend < -5) {
      recommendations.push({
        id: 'conversions-declining',
        title: 'Падение конверсий',
        description: `Конверсии снижаются на ${Math.abs(trends.conversions.trend).toFixed(1)}% в день`,
        priority: 'high',
        impact: 'Остановка падения может сохранить текущие результаты',
        action: 'Проверьте качество трафика и настройки рекламы'
      });
    }

    // Анализируем CTR
    if (kpiMetrics.ctr.achievement < 60) {
      recommendations.push({
        id: 'ctr-low',
        title: 'Низкий CTR',
        description: `CTR составляет ${kpiMetrics.ctr.achievement.toFixed(1)}% от цели`,
        priority: 'medium',
        impact: 'Улучшение CTR может снизить стоимость клика на 10-15%',
        action: 'Обновите креативы и улучшите таргетинг'
      });
    }

    if (trends.ctr.trend < -3) {
      recommendations.push({
        id: 'ctr-declining',
        title: 'Снижение CTR',
        description: `CTR снижается на ${Math.abs(trends.ctr.trend).toFixed(1)}% в день`,
        priority: 'medium',
        impact: 'Стабилизация CTR может улучшить эффективность',
        action: 'Обновите объявления и проверьте релевантность'
      });
    }

    // Анализируем CR
    if (kpiMetrics.cr.achievement < 50) {
      recommendations.push({
        id: 'cr-low',
        title: 'Низкий CR',
        description: `CR составляет ${kpiMetrics.cr.achievement.toFixed(1)}% от цели`,
        priority: 'high',
        impact: 'Улучшение CR может увеличить прибыль на 30-50%',
        action: 'Оптимизируйте воронку продаж и улучшите UX'
      });
    }

    if (trends.cr.trend < -2) {
      recommendations.push({
        id: 'cr-declining',
        title: 'Снижение CR',
        description: `CR снижается на ${Math.abs(trends.cr.trend).toFixed(1)}% в день`,
        priority: 'high',
        impact: 'Остановка падения CR критически важно',
        action: 'Проверьте качество лидов и процесс конверсии'
      });
    }

    // Сравнение с предыдущим периодом
    if (comparison.budget.change < -20) {
      recommendations.push({
        id: 'budget-comparison',
        title: 'Снижение бюджета по сравнению с прошлым периодом',
        description: `Бюджет снизился на ${Math.abs(comparison.budget.change).toFixed(1)}%`,
        priority: 'medium',
        impact: 'Восстановление бюджета может улучшить результаты',
        action: 'Рассмотрите увеличение бюджета до предыдущего уровня'
      });
    }

    if (comparison.conversions.change < -15) {
      recommendations.push({
        id: 'conversions-comparison',
        title: 'Снижение конверсий по сравнению с прошлым периодом',
        description: `Конверсии снизились на ${Math.abs(comparison.conversions.change).toFixed(1)}%`,
        priority: 'high',
        impact: 'Восстановление конверсий критически важно',
        action: 'Проведите аудит рекламных кампаний и оптимизируйте воронку'
      });
    }

    // Фильтруем по приоритету
    if (priority !== 'all') {
      return recommendations.filter(r => r.priority === priority);
    }

    return recommendations;
  });

  protected recommendationStats = computed(() => {
    const recommendations = this.recommendations();
    const high = recommendations.filter(r => r.priority === 'high').length;
    const medium = recommendations.filter(r => r.priority === 'medium').length;
    const low = recommendations.filter(r => r.priority === 'low').length;

    return {
      total: recommendations.length,
      high,
      medium,
      low
    };
  });

  ngOnInit() {

    // Добавляем обработчик клавиши Escape для закрытия модалок
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (this.showDeleteModal()) {
          this.showDeleteModal.set(false);
        }
      }
    });
  }





  // ApexCharts конфігурації
  protected chartConfig: any = {
    type: 'line',
    height: 350,
    fontFamily: 'Inter, system-ui, sans-serif',
    animations: {
      enabled: true,
      easing: 'linear',
      speed: 800,
      animateGradually: {
        enabled: false
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350
      }
    },
    toolbar: {
      show: true,
      tools: {
        download: true,
        selection: false,
        zoom: false,
        zoomin: false,
        zoomout: false,
        pan: false,
        reset: false
      }
    },
    events: {
      mounted: (chartContext: any, config: any) => {
        // Виправляємо проблему з passive event listeners
        const chart = chartContext.w.globals.dom.baseEl;
        if (chart) {
          chart.style.touchAction = 'none';
        }
      }
    },
    zoom: {
      enabled: false
    },
    pan: {
      enabled: false
    },
    selection: {
      enabled: false
    },
    brush: {
      enabled: false
    },
    dataLabels: {
      enabled: false
    }
  };

  protected chartXAxis = computed<any>(() => ({
    type: 'category',
    categories: this.displayDates(),
    labels: {
      style: {
        colors: '#6b7280',
        fontSize: '12px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    },
    axisBorder: {
      show: false
    },
    axisTicks: {
      show: false
    },
    tooltip: {
      enabled: false
    }
  }));

  protected chartYAxis: any = {
    labels: {
      style: {
        colors: '#6b7280',
        fontSize: '12px',
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      formatter: (value: number) => {
        if (value >= 1000000) {
          const formatted = (value / 1000000).toFixed(1);
          return formatted.replace(/\.0$/, '') + 'M';
        } else if (value >= 1000) {
          const formatted = (value / 1000).toFixed(1);
          return formatted.replace(/\.0$/, '') + 'K';
        }
        return value.toString();
      }
    }
  };

  protected chartColors: string[] = [
    '#3b82f6', // blue
    '#10b981', // green
    '#ef4444', // red
    '#f59e0b', // orange
    '#eab308', // yellow
    '#06b6d4', // cyan
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#6366f1', // indigo
    '#64748b'  // slate
  ];

  protected chartStroke: any = {
    curve: 'smooth',
    width: 3
  };

  protected chartLegend: any = {
    position: 'top',
    horizontalAlign: 'left',
    fontSize: '14px',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 500,
    labels: {
      colors: '#374151'
    },
    markers: {
      width: 12,
      height: 12
    }
  };

  protected chartTooltip: any = {
    theme: 'light',
    style: {
      fontSize: '11px',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    fillSeriesColor: false,
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
    titleColor: '#374151',
    bodyColor: '#6b7280',
    titleFontSize: '11px',
    bodyFontSize: '11px',
    titleFontWeight: 600,
    bodyFontWeight: 400,
    intersect: false,
    shared: true,
    marker: {
      show: true,
      size: 4
    },
    filter: function(seriesEl: any, dataPointIndex: any) {
      return true; // Показуємо всі серії, навіть з нульовими значеннями
    },
    y: {
      formatter: (value: number, { seriesIndex }: any) => {
        const seriesName = this.chartSeries()[seriesIndex]?.name;
        if (seriesName?.includes('Бюджет')) {
          return `€${value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}`;
        } else if (seriesName?.includes('Конверсии')) {
          return value.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
        } else if (seriesName?.includes('CTR') || seriesName?.includes('CR')) {
          return `${value.toFixed(2)}%`;
        }
        return value.toFixed(2);
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

  protected displayDates = computed(() => {
    const dates = this.filteredDates();
    const project = this.selectedProject();

    // Убираем приставки проектов из дат для отображения
    return dates.map(d => {
      const projectSuffix = `-${project}`;
      return d.endsWith(projectSuffix) ? d.slice(0, -projectSuffix.length) : d;
    });
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

  protected chartSeries = computed(() => {
    const filteredDates = this.filteredDates();
    const labels = this.displayDates();
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

    for (let i = 0; i < filteredDates.length; i++) {
      const d = filteredDates[i];
      const src = this.store.reports().find(x => x.id === d);
      if (!src || !src.total) continue;
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
      budgetSeries.push(base.budgetEur || 0);
      conversionsSeries.push(base.conversions || 0);
      sendNewMessageSeries.push(base.sendNewMessage || 0);
      salesFullTelSeries.push(base.salesFullTel || 0);
      buttonMessengerSeries.push(base.buttonMessenger || 0);
      impressionsSeries.push(base.impressions || 0);
      clicksSeries.push(base.clicks || 0);
      cpmEurSeries.push(base.cpmEur || 0);
      ctrPercentSeries.push((base.ctrPercent || 0) * 100); // Конвертируем в проценты
      crPercentSeries.push((base.crPercent || 0) * 100); // Конвертируем в проценты
    }

    const series = [
      {
        name: 'Бюджет текущий период',
        data: budgetSeries
      },
      {
        name: 'Конверсии текущий период',
        data: conversionsSeries
      },
      {
        name: 'send_new_message',
        data: sendNewMessageSeries
      },
      {
        name: 'sales_full_tel',
        data: salesFullTelSeries
      },
      {
        name: 'button_messenger',
        data: buttonMessengerSeries
      },
      {
        name: 'Показы текущий период',
        data: impressionsSeries
      },
      {
        name: 'Клики текущий период',
        data: clicksSeries
      },
      {
        name: 'СРМ текущий период',
        data: cpmEurSeries
      },
      {
        name: 'CTR текущий период',
        data: ctrPercentSeries
      },
      {
        name: 'CR текущий период',
        data: crPercentSeries
      }
    ];

    // Діагностика: перевіряємо чи всі серії мають дані
    console.log('Chart Series Debug:', {
      filteredDates: filteredDates.length,
      seriesCount: series.length,
      seriesData: series.map(s => ({ name: s.name, dataLength: s.data.length, hasData: s.data.some(d => d > 0) }))
    });

    return series;
  });

  protected totals = computed(() => {
    const labels = this.filteredDates();
    const selected = this.selectedCampaign();
    const subgroup = this.selectedSubgroup();
    let budget = 0, conversions = 0, clicks = 0, impressions = 0, ctrSum = 0;
    let sendNewMessage = 0, salesFullTel = 0, buttonMessenger = 0, cpmEur = 0, crSum = 0;
    for (const d of labels) {
      const report = this.store.reports().find(x => x.id === d);
      if (!report || !report.total) continue;
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
      const report = this.store.reports().find(x => x.id === d);
      if (!report) continue;
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
      // Убираем суффикс проекта из даты для поиска
      const cleanDate = date.split('-').slice(0, 3).join('-');
      const reports = this.store.reports().filter(r => r.date === cleanDate);

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

  async clearAllData() {
    if (!confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить.')) {
      return;
    }

    try {
      // Очищаем все данные через store
      await this.store.clearAll();

      // Закрываем модальное окно
      this.showDeleteModal.set(false);
      this.selectedDeleteDate.set('');

      // Показываем уведомление об успехе
      alert('Все данные успешно удалены!');

      // Перезагружаем страницу для обновления данных
      window.location.reload();

    } catch (error) {
      alert('Ошибка при удалении всех данных');
    }
  }



  onTrendPeriod(e: Event) {
    const input = e.target as HTMLSelectElement;
    const newPeriod = parseInt(input.value);
    this.trendPeriod.set(newPeriod);
  }

  onComparisonPeriod(e: Event) {
    const input = e.target as HTMLSelectElement;
    this.comparisonPeriod.set(input.value as 'previous_week' | 'previous_month' | 'same_period_last_year');
  }

  private calculatePeriodMetrics(dates: string[], project: ProjectType) {
    const allReports = this.store.reports();
    // Убираем суффикс проекта из дат для поиска
    const cleanDates = dates.map(date => date.split('-').slice(0, 3).join('-'));
    
    const reports = allReports.filter(r =>
      cleanDates.includes(r.date) && r.project === project
    );
    
    console.log('- Filtered reports:', reports);

    const total = reports.reduce((sum, r) => ({
      budget: sum.budget + r.total.budgetEur,
      conversions: sum.conversions + r.total.conversions,
      clicks: sum.clicks + r.total.clicks,
      impressions: sum.impressions + r.total.impressions
    }), { budget: 0, conversions: 0, clicks: 0, impressions: 0 });

    return {
      budget: total.budget,
      conversions: total.conversions,
      ctr: total.impressions > 0 ? total.clicks / total.impressions : 0,
      cr: total.clicks > 0 ? total.conversions / total.clicks : 0
    };
  }

  getComparisonClass(change: number): string {
    if (change > 10) return 'bg-green-100 text-green-800';
    if (change > 0) return 'bg-blue-100 text-blue-800';
    if (change < -10) return 'bg-red-100 text-red-800';
    if (change < 0) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  }

  getComparisonIcon(change: number): string {
    if (change > 10) return '🚀';
    if (change > 0) return '📈';
    if (change < -10) return '💥';
    if (change < 0) return '📉';
    return '➡️';
  }

  getComparisonStatus(change: number): string {
    if (change > 10) return 'Отлично';
    if (change > 0) return 'Хорошо';
    if (change < -10) return 'Критично';
    if (change < 0) return 'Требует внимания';
    return 'Стабильно';
  }

  private getKPITargets(project: ProjectType) {
    const key = `kpi_targets_${project}`;
    const stored = localStorage.getItem(key);

    if (stored) {
      return JSON.parse(stored);
    }

    // Дефолтные цели
    const defaultTargets = {
      budget: 10000, // €10,000
      conversions: 100, // 100 конверсий
      ctr: 0.05, // 5%
      cr: 0.02 // 2%
    };

    localStorage.setItem(key, JSON.stringify(defaultTargets));
    return defaultTargets;
  }

  getKPIClass(achievement: number): string {
    if (achievement >= 100) return 'bg-green-100 text-green-800';
    if (achievement >= 80) return 'bg-blue-100 text-blue-800';
    if (achievement >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  getKPISummaryClass(status: 'excellent' | 'good' | 'warning' | 'critical'): string {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  getKPISummaryStatus(status: 'excellent' | 'good' | 'warning' | 'critical'): string {
    switch (status) {
      case 'excellent': return 'Отлично';
      case 'good': return 'Хорошо';
      case 'warning': return 'Требует внимания';
      case 'critical': return 'Критично';
      default: return 'Неизвестно';
    }
  }

  onKPISettingsProject(e: Event) {
    const input = e.target as HTMLSelectElement;
    const project = input.value as ProjectType;
    this.kpiSettingsProject.set(project);

    // Загружаем цели для выбранного проекта
    const targets = this.getKPITargets(project);
    this.kpiSettingsTargets.set(targets);
  }

  onKPIBudgetChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const value = parseFloat(input.value) || 0;
    const current = this.kpiSettingsTargets();
    this.kpiSettingsTargets.set({ ...current, budget: value });
  }

  onKPIConversionsChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const value = parseFloat(input.value) || 0;
    const current = this.kpiSettingsTargets();
    this.kpiSettingsTargets.set({ ...current, conversions: value });
  }

  onKPICTRChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const value = (parseFloat(input.value) || 0) / 100; // Convert from % to decimal
    const current = this.kpiSettingsTargets();
    this.kpiSettingsTargets.set({ ...current, ctr: value });
  }

  onKPICRChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const value = (parseFloat(input.value) || 0) / 100; // Convert from % to decimal
    const current = this.kpiSettingsTargets();
    this.kpiSettingsTargets.set({ ...current, cr: value });
  }

  saveKPISettings() {
    const project = this.kpiSettingsProject();
    const targets = this.kpiSettingsTargets();

    // Сохраняем в localStorage
    const key = `kpi_targets_${project}`;
    localStorage.setItem(key, JSON.stringify(targets));

    // Закрываем модальное окно
    this.showKPISettings.set(false);

    // Показываем уведомление
    alert(`Цели для проекта ${project} успешно сохранены!`);
  }

  onAnomalySensitivity(e: Event) {
    const input = e.target as HTMLSelectElement;
    this.anomalySensitivity.set(input.value as 'low' | 'medium' | 'high');
  }

  getAnomalyClass(severity: 'critical' | 'warning' | 'info'): string {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  }

  getAnomalyIcon(severity: 'critical' | 'warning' | 'info'): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📊';
    }
  }

  getAnomalySeverityClass(severity: 'critical' | 'warning' | 'info'): string {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getAnomalySeverityText(severity: 'critical' | 'warning' | 'info'): string {
    switch (severity) {
      case 'critical': return 'Критично';
      case 'warning': return 'Предупреждение';
      case 'info': return 'Информация';
      default: return 'Неизвестно';
    }
  }



  onRecommendationPriority(e: Event) {
    const input = e.target as HTMLSelectElement;
    this.recommendationPriority.set(input.value as 'all' | 'high' | 'medium' | 'low');
  }

  getRecommendationClass(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  }

  getRecommendationIcon(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '💡';
      default: return '📊';
    }
  }

  getRecommendationPriorityClass(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getRecommendationPriorityText(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return 'Неизвестно';
    }
  }





  getTrendClass(trend: number): string {
    if (trend > 5) return 'bg-green-100 text-green-800';
    if (trend > 0) return 'bg-blue-100 text-blue-800';
    if (trend < -5) return 'bg-red-100 text-red-800';
    if (trend < 0) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  }

  getTrendIcon(trend: number): string {
    if (trend > 5) return '📈';
    if (trend > 0) return '↗️';
    if (trend < -5) return '📉';
    if (trend < 0) return '↘️';
    return '➡️';
  }

  protected trendChartSeries = computed(() => {
    const dates = this.filteredDates();
    const period = this.trendPeriod();
    const recentDates = dates.slice(-Math.min(period, dates.length));
    const project = this.selectedProject();

    const dailyData = recentDates.map(date => {
      // Убираем суффикс проекта из даты для поиска
      const cleanDate = date.split('-').slice(0, 3).join('-');
      const reports = this.store.reports().filter(r => r.date === cleanDate && r.project === project);
      const total = reports.reduce((sum, r) => ({
        budget: sum.budget + r.total.budgetEur,
        conversions: sum.conversions + r.total.conversions,
        ctr: sum.ctr + (r.total.impressions > 0 ? r.total.clicks / r.total.impressions : 0),
        cr: sum.cr + (r.total.clicks > 0 ? r.total.conversions / r.total.clicks : 0)
      }), { budget: 0, conversions: 0, ctr: 0, cr: 0 });

      return {
        date,
        budget: total.budget,
        conversions: total.conversions,
        ctr: total.ctr * 100, // Convert to percentage
        cr: total.cr * 100 // Convert to percentage
      };
    });

    const series = [
      {
        name: 'Бюджет (€)',
        data: dailyData.map(d => d.budget)
      },
      {
        name: 'Конверсии',
        data: dailyData.map(d => d.conversions)
      },
      {
        name: 'CTR (%)',
        data: dailyData.map(d => d.ctr)
      },
      {
        name: 'CR (%)',
        data: dailyData.map(d => d.cr)
      }
    ];
    
    return series;
  });

  // Trend Chart ApexCharts конфігурації
  protected trendChartConfig: any = {
    type: 'line',
    height: 250,
    fontFamily: 'Inter, system-ui, sans-serif',
    animations: {
      enabled: true,
      easing: 'linear',
      speed: 600,
      animateGradually: {
        enabled: false
      },
      dynamicAnimation: {
        enabled: true,
        speed: 300
      }
    },
    toolbar: {
      show: false
    },
    events: {
      mounted: (chartContext: any, config: any) => {
        // Виправляємо проблему з passive event listeners
        const chart = chartContext.w.globals.dom.baseEl;
        if (chart) {
          chart.style.touchAction = 'none';
        }
      }
    },
    zoom: {
      enabled: false
    },
    pan: {
      enabled: false
    },
    selection: {
      enabled: false
    },
    brush: {
      enabled: false
    },
    dataLabels: {
      enabled: false
    }
  };

  protected trendChartXAxis = computed(() => {
    const dates = this.filteredDates();
    const period = this.trendPeriod();
    const recentDates = dates.slice(-period);
    
    // Форматируем даты для отображения
    const formattedDates = recentDates.map(date => {
      const cleanDate = date.split('-').slice(0, 3).join('-');
      const dateObj = new Date(cleanDate);
      return dateObj.toLocaleDateString('uk-UA', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    });

    return {
      type: 'category' as const,
      categories: formattedDates,
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      tooltip: {
        enabled: false
      }
    };
  });

  protected trendChartYAxis: any = {
    labels: {
      style: {
        colors: '#6b7280',
        fontSize: '12px',
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      formatter: (value: number) => {
        if (value >= 1000000) {
          const formatted = (value / 1000000).toFixed(1);
          return formatted.replace(/\.0$/, '') + 'M';
        } else if (value >= 1000) {
          const formatted = (value / 1000).toFixed(1);
          return formatted.replace(/\.0$/, '') + 'K';
        }
        return value.toString();
      }
    }
  };

  protected trendChartColors: string[] = [
    '#3b82f6', // blue
    '#10b981', // green
    '#6366f1', // indigo
    '#9333ea'  // purple
  ];

  protected trendChartStroke: any = {
    curve: 'smooth',
    width: 3
  };

  protected trendChartLegend: any = {
    position: 'top',
    horizontalAlign: 'left',
    fontSize: '14px',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 500,
    labels: {
      colors: '#374151'
    },
    markers: {
      width: 12,
      height: 12
    }
  };

  protected trendChartTooltip: any = {
    theme: 'light',
    style: {
      fontSize: '11px',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    fillSeriesColor: false,
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
    titleColor: '#374151',
    bodyColor: '#6b7280',
    titleFontSize: '11px',
    bodyFontSize: '11px',
    titleFontWeight: 600,
    bodyFontWeight: 400,
    intersect: false,
    shared: true,
    marker: {
      show: true,
      size: 4
    },
    y: {
      formatter: (value: number, { seriesIndex }: any) => {
        const seriesName = this.trendChartSeries()[seriesIndex]?.name;
        if (seriesName?.includes('Бюджет')) {
          return `€${value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}`;
        } else if (seriesName?.includes('Конверсии')) {
          return value.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
        } else if (seriesName?.includes('CTR') || seriesName?.includes('CR')) {
          return `${value.toFixed(2)}%`;
        }
        return value.toFixed(2);
      }
    }
  };

  constructor() {
    // дефолтный период — весь диапазон
    effect(() => {
      const dates = this.store.dates();
      if (dates.length && !this.from() && !this.to()) {
        // Прибираємо суфікси проектів з дат
        const cleanDates = dates.map(d => {
          // Прибираємо суфікс проекту (наприклад, -Autoline)
          const parts = d.split('-');
          if (parts.length >= 4) {
            // Якщо є суфікс проекту, прибираємо останню частину
            return parts.slice(0, 3).join('-');
          }
          return d;
        }).sort();
        
        this.from.set(cleanDates[0]);
        this.to.set(cleanDates[cleanDates.length - 1]);
      }
    });
  }
}


