import { Routes } from '@angular/router';
import { CatalogManagementComponent } from './features/catalog-management/catalog-management.component';

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
    path: '**',
    redirectTo: '',
  },
];
