import { Routes } from '@angular/router';
import { CatalogManagementComponent } from './features/catalog-management/catalog-management.component';
import { AddProductComponent } from './features/products/add-product/add-product.component';
import { EditProductComponent } from './features/products/edit-product/edit-product.component';
import { LoginComponent } from './auth/login.component';
import { AddAdminComponent } from './admin/add-admin/add-admin.component';
import { EditAdminComponent } from './admin/edit-admin/edit-admin.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { FeaturedProductsComponent } from './features/featured-products/featured-products.component';

export const routes: Routes = [
  {
    path: '',
    component: FeaturedProductsComponent,
  },
  {
    path: 'featured',
    component: FeaturedProductsComponent,
  },
  {
    path: 'featured-products',
    component: FeaturedProductsComponent,
  },
  {
    path: 'catalog',
    component: CatalogManagementComponent,
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
  },
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
  },
  {
    path: 'admin/add',
    component: AddAdminComponent,
  },
  {
    path: 'admin/edit/:id',
    component: EditAdminComponent,
  },
  {
    path: 'admin/edit',
    component: EditAdminComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'signup',
    component: LoginComponent,
  },
  {
    path: 'auth',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'products/add',
    component: AddProductComponent,
  },
  {
    path: 'products/edit/:id',
    component: EditProductComponent,
  },
  {
    path: 'products/edit',
    component: EditProductComponent,
  },
  {
    path: 'products',
    redirectTo: 'products/add',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
