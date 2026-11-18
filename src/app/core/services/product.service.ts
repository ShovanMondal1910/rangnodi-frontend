import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CreateProductPayload, ProductResponse } from '../models/product.models';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/products`;

  generateId(): Observable<string> {
    return this.http
      .get<ApiResponse<{ product_id: string }>>(`${this.baseUrl}/generate-id`)
      .pipe(map((res) => res.data.product_id));
  }

  generateSku(categoryHint: string = ''): Observable<string> {
    const params = new HttpParams().set('category', categoryHint);
    return this.http
      .get<ApiResponse<{ sku: string }>>(`${this.baseUrl}/generate-sku`, { params })
      .pipe(map((res) => res.data.sku));
  }

  createProduct(payload: CreateProductPayload): Observable<ProductResponse> {
    return this.http
      .post<ApiResponse<ProductResponse>>(this.baseUrl, payload)
      .pipe(map((res) => res.data));
  }

  getProducts(filters?: { category_id?: string; status?: string; search?: string }): Observable<ProductResponse[]> {
    let params = new HttpParams();
    if (filters?.category_id) params = params.set('category_id', filters.category_id);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.search) params = params.set('search', filters.search);

    return this.http
      .get<ApiResponse<ProductResponse[]>>(this.baseUrl, { params })
      .pipe(map((res) => res.data));
  }

  getProductById(id: string): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  updateProduct(id: string, payload: Partial<CreateProductPayload>): Observable<ProductResponse> {
    return this.http
      .put<ApiResponse<ProductResponse>>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteProduct(id: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<any>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.success));
  }

  deleteGalleryImage(imageId: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<any>>(`${this.baseUrl}/images/${imageId}`)
      .pipe(map((res) => res.success));
  }
}
