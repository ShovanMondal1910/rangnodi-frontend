import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-navbar.component.html',
  styleUrls: ['./admin-navbar.component.css'],
})
export class AdminNavbarComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  isProductMenuOpen = signal<boolean>(false);
  isCategoriesMenuOpen = signal<boolean>(false);
  isAdminMenuOpen = signal<boolean>(false);

  get adminName(): string {
    return this.authService.currentUser()?.fullname || 'Shovan Mondal';
  }

  get adminFirstName(): string {
    return this.adminName.trim().split(' ')[0] || 'Admin';
  }

  get adminInitials(): string {
    const parts = this.adminName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  isDashboardActive(): boolean {
    return this.router.url === '/admin' || this.router.url.startsWith('/admin/dashboard');
  }

  isProductActive(): boolean {
    return this.router.url.startsWith('/products/');
  }

  isCategoriesActive(): boolean {
    return this.router.url.startsWith('/catalog');
  }

  isAdminsActive(): boolean {
    return this.router.url.startsWith('/admin/add') || this.router.url.startsWith('/admin/edit');
  }

  toggleProductMenu(): void {
    this.isProductMenuOpen.update(v => !v);
  }

  openProductMenu(): void {
    this.isProductMenuOpen.set(true);
  }

  closeProductMenu(): void {
    this.isProductMenuOpen.set(false);
  }

  toggleCategoriesMenu(): void {
    this.isCategoriesMenuOpen.update(v => !v);
  }

  openCategoriesMenu(): void {
    this.isCategoriesMenuOpen.set(true);
  }

  closeCategoriesMenu(): void {
    this.isCategoriesMenuOpen.set(false);
  }

  toggleAdminMenu(): void {
    this.isAdminMenuOpen.update(v => !v);
  }

  openAdminMenu(): void {
    this.isAdminMenuOpen.set(true);
  }

  closeAdminMenu(): void {
    this.isAdminMenuOpen.set(false);
  }

  onLogout(): void {
    this.authService.logout();
    this.toastService.info('You have been logged out of the admin panel.');
    this.router.navigate(['/login']);
  }
}
