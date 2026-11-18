import { Routes } from '@angular/router';
import { CatalogManagementComponent } from './features/catalog-management/catalog-management.component';
import { AddProductComponent } from './features/products/add-product/add-product.component';
import { EditProductComponent } from './features/products/edit-product/edit-product.component';

export const routes: Routes = [
  {
    path: '',
    component: CatalogManagementComponent,
  },
  {
    path: 'catalog',
    component: CatalogManagementComponent,
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
