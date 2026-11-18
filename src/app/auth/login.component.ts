import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Active view: 'login' or 'signup'
  activeTab = signal<'login' | 'signup'>('login');
  isLoading = signal<boolean>(false);
  showPassword = signal<boolean>(false);

  // Login form fields
  loginEmail = '';
  loginPassword = '';
  rememberMe = true;

  // Sign up form fields
  signupFullname = '';
  signupEmail = '';
  signupPhone = '';
  signupPassword = '';
  signupConfirmPassword = '';
  agreeTerms = true;

  constructor() {
    // Check if query params specify mode (e.g. /login?mode=signup)
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'signup') {
        this.activeTab.set('signup');
      } else {
        this.activeTab.set('login');
      }
    });
  }

  setTab(tab: 'login' | 'signup'): void {
    this.activeTab.set(tab);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  /**
   * Handle Email/Password Login
   */
  onLoginSubmit(): void {
    if (!this.loginEmail || !this.loginPassword) {
      this.toastService.show('Please fill in both email and password', 'error');
      return;
    }

    this.isLoading.set(true);
    this.authService.login({
      email: this.loginEmail,
      password: this.loginPassword
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toastService.success(`Welcome back, ${res.data.user.fullname}!`);
        
        // Redirect based on role or home
        if (res.data.user.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || 'Login failed. Please check your credentials.';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Handle Customer Registration (Sign Up)
   */
  onSignupSubmit(): void {
    if (!this.signupFullname.trim()) {
      this.toastService.error('Full name is required');
      return;
    }
    if (!this.signupEmail.trim() || !this.signupEmail.includes('@')) {
      this.toastService.error('Valid email address is required');
      return;
    }
    if (!this.signupPassword || this.signupPassword.length < 6) {
      this.toastService.error('Password must be at least 6 characters');
      return;
    }
    if (this.signupPassword !== this.signupConfirmPassword) {
      this.toastService.error('Passwords do not match');
      return;
    }
    if (!this.agreeTerms) {
      this.toastService.error('Please agree to Terms of Service & Privacy Policy');
      return;
    }

    this.isLoading.set(true);
    this.authService.signup({
      fullname: this.signupFullname,
      email: this.signupEmail,
      phone: this.signupPhone,
      password: this.signupPassword
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toastService.success('Account created successfully! Welcome to Rangnodi.');
        this.router.navigate(['/']);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || 'Registration failed. Please try again.';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Handle Google One-Click Login / Sign Up
   */
  onGoogleSignIn(): void {
    this.isLoading.set(true);

    // Google Sign-In simulation / OAuth callback integration
    // When real Google Client ID is configured, window.google.accounts.id.prompt() is invoked.
    setTimeout(() => {
      const mockGoogleUser = {
        googleId: 'g_' + Math.floor(1000000000 + Math.random() * 9000000000),
        email: this.loginEmail || this.signupEmail || 'google.customer@rangnodi.com',
        fullname: this.signupFullname || 'Google Customer',
        avatar: 'https://lh3.googleusercontent.com/a/default-user'
      };

      this.authService.googleLogin(mockGoogleUser).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.toastService.success(`Signed in with Google as ${res.data.user.fullname}`);
          if (res.data.user.role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (err: any) => {
          this.isLoading.set(false);
          const msg = err?.error?.message || 'Google Sign-In failed';
          this.toastService.error(msg);
        }
      });
    }, 600);
  }

  onSignOut(): void {
    this.authService.logout();
    this.toastService.info('You have been logged out successfully.');
  }
}
