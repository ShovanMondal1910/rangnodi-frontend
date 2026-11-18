import { Routes } from '@angular/router';
import { CatalogManagementComponent } from './features/catalog-management/catalog-management.component';
import { AddProductComponent } from './features/products/add-product/add-product.component';
import { EditProductComponent } from './features/products/edit-product/edit-product.component';
import { LoginComponent } from './auth/login.component';
import { AddAdminComponent } from './admin/add-admin/add-admin.component';
import { EditAdminComponent } from './admin/edit-admin/edit-admin.component';
import { AddCustomerComponent } from './admin/add-customer/add-customer.component';
import { EditCustomerComponent } from './admin/edit-customer/edit-customer.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { OrderManagementComponent } from './admin/order-management/order-management.component';
import { OrderInvoiceComponent } from './shared/order-invoice/order-invoice.component';
import { FeaturedProductsComponent } from './features/featured-products/featured-products.component';
import { ProductDetailsComponent } from './features/products/product-details/product-details.component';
import { ProfileComponent } from './features/profile/profile.component';
import { CartPageComponent } from './features/cart/cart-page.component';
import { CheckoutComponent } from './features/checkout/checkout.component';
import { authGuard } from './core/guards/auth.guard';

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
    path: 'admin/customers/add',
    component: AddCustomerComponent,
  },
  {
    path: 'admin/customers/edit/:id',
    component: EditCustomerComponent,
  },
  {
    path: 'admin/customers/edit',
    component: EditCustomerComponent,
  },
  {
    path: 'admin/customers',
    redirectTo: 'admin/customers/edit',
    pathMatch: 'full',
  },
  {
    path: 'admin/orders',
    component: OrderManagementComponent,
  },
  {
    path: 'admin/orders/invoice/:id',
    component: OrderInvoiceComponent,
  },
  {
    path: 'invoice/:id',
    component: OrderInvoiceComponent,
  },
  {
    path: 'admin/order-management',
    redirectTo: 'admin/orders',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
  },
  {
    path: 'account',
    redirectTo: 'profile',
    pathMatch: 'full',
  },
  {
    path: 'cart',
    component: CartPageComponent,
  },
  {
    path: 'bag',
    redirectTo: 'cart',
    pathMatch: 'full',
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [authGuard],
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
    path: 'product/:id',
    component: ProductDetailsComponent,
  },
  {
    path: 'products/detail/:id',
    component: ProductDetailsComponent,
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
