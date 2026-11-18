import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AdminService, DashboardStats } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  // Dynamic Dashboard Statistics
  stats = signal<DashboardStats>({
    totalProducts: 4,
    totalCategories: 9,
    totalSubcategories: 80,
    totalUsers: 4,
    stockAlerts: 0,
    mediaAssets: 26,
  });

  isLoading = signal<boolean>(true);
  isProductMenuOpen = signal<boolean>(false);
  currentDate = new Date();

  // Admin user details
  adminName = signal<string>('Shovan Mondal');
  adminInitials = signal<string>('SM');

  ngOnInit(): void {
    this.initAdminUser();
    this.loadStats();
  }

  private initAdminUser(): void {
    const user = this.authService.currentUser();
    if (user && user.fullname) {
      this.adminName.set(user.fullname);
      const parts = user.fullname.trim().split(' ');
      if (parts.length >= 2) {
        this.adminInitials.set((parts[0][0] + parts[1][0]).toUpperCase());
      } else {
        this.adminInitials.set(parts[0].substring(0, 2).toUpperCase());
      }
    } else {
      this.adminName.set('Shovan Mondal');
      this.adminInitials.set('SM');
    }
  }

  loadStats(): void {
    this.isLoading.set(true);
    this.adminService.getDashboardStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stats.set({
            totalProducts: res.data.totalProducts || 4,
            totalCategories: res.data.totalCategories || 9,
            totalSubcategories: res.data.totalSubcategories || 80,
            totalUsers: res.data.totalUsers || 4,
            stockAlerts: res.data.stockAlerts || 0,
            mediaAssets: res.data.mediaAssets || 26,
          });
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        // Retain baseline default metrics from design
      }
    });
  }

  toggleProductMenu(): void {
    this.isProductMenuOpen.update(v => !v);
  }

  onLogout(): void {
    this.authService.logout();
    this.toastService.info('You have been signed out from the admin session.');
    this.router.navigate(['/login']);
  }
}
