import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService, HealthResponse } from './services/api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('Rangnodi');
  private readonly apiService = inject(ApiService);

  protected readonly isConnecting = signal(true);
  protected readonly isConnected = signal(false);
  protected readonly health = signal<HealthResponse | null>(null);
  protected readonly apiMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.checkBackendConnection();
  }

  checkBackendConnection(): void {
    this.isConnecting.set(true);
    this.errorMessage.set(null);

    this.apiService.getHealth().subscribe({
      next: (healthData) => {
        this.health.set(healthData);
        this.isConnected.set(true);
        this.isConnecting.set(false);

        this.apiService.getApiWelcome().subscribe({
          next: (apiData) => {
            this.apiMessage.set(apiData.message);
          },
          error: (err) => {
            console.warn('API welcome endpoint warning:', err);
          },
        });
      },
      error: (err) => {
        this.isConnected.set(false);
        this.isConnecting.set(false);
        this.errorMessage.set(
          err.status === 0
            ? 'Cannot reach Express backend. Ensure the backend server is running on http://localhost:5000.'
            : `Error ${err.status}: ${err.statusText || 'Backend connection failed'}`
        );
      },
    });
  }
}
