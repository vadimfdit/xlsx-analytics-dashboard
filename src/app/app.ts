import { Component, signal } from '@angular/core';
import { UploadComponent } from './upload.component';
import { DashboardComponent } from './dashboard.component';

@Component({
  selector: 'app-root',
  imports: [UploadComponent, DashboardComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header class="border-b bg-white shadow-sm">
        <div class="container mx-auto px-4 py-6 flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-800">XLSX Аналитика</h1>
          </div>
        </div>
      </header>

      <main class="container mx-auto px-4 py-8 space-y-8">
        <section class="p-6 rounded-xl bg-white shadow-lg border border-gray-100">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Импорт ежедневного отчета</h2>
          <app-upload></app-upload>
        </section>

        <section>
          <app-dashboard></app-dashboard>
        </section>
      </main>
    </div>
  `,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('thebestann-analytics');
}
