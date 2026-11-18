import { Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from './core/services/toast.service';
import { NavbarComponent } from './nav/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { AdminNavbarComponent } from './admin/admin-navbar/admin-navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, FooterComponent, AdminNavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly toastService = inject(ToastService);
  readonly router = inject(Router);

  isAdminRoute(): boolean {
    const url = this.router.url;
    return (
      url === '/admin' ||
      url.startsWith('/admin/') ||
      url.startsWith('/products/add') ||
      url.startsWith('/products/edit') ||
      url.startsWith('/catalog')
    );
  }
}

