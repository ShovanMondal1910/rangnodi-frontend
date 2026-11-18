import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  Category,
  Subcategory,
  CategoryHierarchyItem,
  CatalogSummary,
  ApiResponse,
} from '../models/catalog.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getSummary(): Observable<CatalogSummary> {
    return this.http
      .get<ApiResponse<CatalogSummary>>(`${this.baseUrl}/catalog/summary`)
      .pipe(map((res) => res.data));
  }

  getHierarchy(status?: string, search?: string): Observable<CategoryHierarchyItem[]> {
    let params = new HttpParams();
    if (status && status !== 'all') {
      params = params.set('status', status);
    }
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http
      .get<ApiResponse<CategoryHierarchyItem[]>>(`${this.baseUrl}/catalog/hierarchy`, { params })
      .pipe(map((res) => res.data));
  }

  generateCategoryId(): Observable<string> {
    return this.http
      .get<{ success: boolean; category_id: string }>(`${this.baseUrl}/categories/generate-id`)
      .pipe(map((res) => res.category_id));
  }

  generateSubcategoryId(): Observable<string> {
    return this.http
      .get<{ success: boolean; subcategory_id: string }>(
        `${this.baseUrl}/subcategories/generate-id`
      )
      .pipe(map((res) => res.subcategory_id));
  }

  createCategory(payload: Partial<Category>): Observable<Category> {
    return this.http
      .post<ApiResponse<Category>>(`${this.baseUrl}/categories`, payload)
      .pipe(map((res) => res.data));
  }

  updateCategory(id: string, payload: Partial<Category>): Observable<Category> {
    return this.http
      .put<ApiResponse<Category>>(`${this.baseUrl}/categories/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteCategory(id: string): Observable<{ success: boolean; message: string; deletedSubcategoriesCount?: number }> {
    return this.http.delete<{ success: boolean; message: string; deletedSubcategoriesCount?: number }>(
      `${this.baseUrl}/categories/${id}`
    );
  }

  createSubcategory(payload: Partial<Subcategory>): Observable<Subcategory> {
    return this.http
      .post<ApiResponse<Subcategory>>(`${this.baseUrl}/subcategories`, payload)
      .pipe(map((res) => res.data));
  }

  updateSubcategory(id: string, payload: Partial<Subcategory>): Observable<Subcategory> {
    return this.http
      .put<ApiResponse<Subcategory>>(`${this.baseUrl}/subcategories/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteSubcategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/subcategories/${id}`);
  }
}
