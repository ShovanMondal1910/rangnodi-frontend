import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserStatus } from '../models/auth.models';

export interface CustomerListResponse {
  success: boolean;
  data: User[];
  total: number;
}

export interface CustomerSingleResponse {
  success: boolean;
  data: User;
  message?: string;
}

export interface GenerateCustomerIdResponse {
  success: boolean;
  data: { id: string };
}

export interface CreateCustomerRequest {
  fullname: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  status?: UserStatus;
  avatar?: string;
}

export interface UpdateCustomerRequest {
  fullname?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  status?: UserStatus;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/customers';

  getAllCustomers(search?: string, status?: string): Observable<CustomerListResponse> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (status && status !== 'all') {
      params = params.set('status', status);
    }
    return this.http.get<CustomerListResponse>(this.apiUrl, { params });
  }

  getCustomerById(id: string): Observable<CustomerSingleResponse> {
    return this.http.get<CustomerSingleResponse>(`${this.apiUrl}/${id}`);
  }

  generateCustomerId(): Observable<GenerateCustomerIdResponse> {
    return this.http.get<GenerateCustomerIdResponse>(`${this.apiUrl}/generate-id`);
  }

  createCustomer(dto: CreateCustomerRequest): Observable<CustomerSingleResponse> {
    return this.http.post<CustomerSingleResponse>(this.apiUrl, dto);
  }

  updateCustomer(id: string, dto: UpdateCustomerRequest): Observable<CustomerSingleResponse> {
    return this.http.put<CustomerSingleResponse>(`${this.apiUrl}/${id}`, dto);
  }

  deleteCustomer(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
