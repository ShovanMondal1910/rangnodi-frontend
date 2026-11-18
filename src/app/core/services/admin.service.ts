import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/auth.models';

export interface AdminListResponse {
  success: boolean;
  data: User[];
  total: number;
}

export interface AdminSingleResponse {
  success: boolean;
  data: User;
  message?: string;
}

export interface GenerateIdResponse {
  success: boolean;
  data: { id: string };
}

export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalSubcategories: number;
  totalUsers: number;
  stockAlerts: number;
  mediaAssets: number;
}

export interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/admins';

  getDashboardStats(): Observable<DashboardStatsResponse> {
    return this.http.get<DashboardStatsResponse>(`${this.apiUrl}/dashboard-stats`);
  }

  getAllAdmins(search?: string, status?: string): Observable<AdminListResponse> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (status && status !== 'all') {
      params = params.set('status', status);
    }
    return this.http.get<AdminListResponse>(this.apiUrl, { params });
  }

  getAdminById(id: string): Observable<AdminSingleResponse> {
    return this.http.get<AdminSingleResponse>(`${this.apiUrl}/${id}`);
  }

  generateAdminId(): Observable<GenerateIdResponse> {
    return this.http.get<GenerateIdResponse>(`${this.apiUrl}/generate-id`);
  }

  createAdmin(payload: {
    fullname: string;
    email: string;
    password: string;
    phone?: string;
    status?: string;
    avatar?: string;
  }): Observable<AdminSingleResponse> {
    return this.http.post<AdminSingleResponse>(this.apiUrl, payload);
  }

  updateAdmin(id: string, payload: {
    fullname?: string;
    email?: string;
    password?: string;
    phone?: string | null;
    status?: string;
    avatar?: string | null;
  }): Observable<AdminSingleResponse> {
    return this.http.put<AdminSingleResponse>(`${this.apiUrl}/${id}`, payload);
  }

  deleteAdmin(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
