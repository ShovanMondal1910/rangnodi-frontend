import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
  uptime: number;
}

export interface ApiWelcomeResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);

  getHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(environment.healthUrl);
  }

  getApiWelcome(): Observable<ApiWelcomeResponse> {
    return this.http.get<ApiWelcomeResponse>(environment.apiBaseUrl);
  }
}
