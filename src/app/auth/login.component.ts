import { Component, OnInit, AfterViewInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';
import { environment } from '../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, AfterViewInit {
  authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Active view: 'login' or 'signup'
  activeTab = signal<'login' | 'signup'>('login');
  isLoading = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  isGoogleLoaded = signal<boolean>(false);

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
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'signup') {
        this.activeTab.set('signup');
      } else {
        this.activeTab.set('login');
      }
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initGoogleAuth();
  }

  setTab(tab: 'login' | 'signup'): void {
    this.activeTab.set(tab);
    setTimeout(() => this.renderGoogleButton(), 50);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  private initGoogleAuth(): void {
    const checkGoogle = () => {
      if (typeof google !== 'undefined' && google.accounts?.id) {
        try {
          google.accounts.id.initialize({
            client_id: environment.googleClientId,
            callback: (res: any) => this.handleGoogleCredential(res.credential),
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          this.renderGoogleButton();
          this.isGoogleLoaded.set(true);

          // Trigger One-Tap prompt if eligible
          google.accounts.id.prompt();
        } catch (e) {
          console.warn('Google Identity initialization error:', e);
        }
      } else {
        setTimeout(checkGoogle, 200);
      }
    };

    checkGoogle();
  }

  private renderGoogleButton(): void {
    if (typeof google === 'undefined' || !google.accounts?.id) return;
    const btnContainer = document.getElementById('googleSignInButton');
    if (btnContainer) {
      btnContainer.innerHTML = '';
      google.accounts.id.renderButton(btnContainer, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: this.activeTab() === 'login' ? 'signin_with' : 'signup_with',
        size: 'large',
        logo_alignment: 'left',
        width: 380,
      });
    }
  }

  handleGoogleCredential(credential: string): void {
    if (!credential) return;

    this.isLoading.set(true);
    this.authService.googleLogin({ credential }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toastService.success(`Welcome to Rangnodi, ${res.data.user.fullname}!`);
        if (res.data.user.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || 'Google authentication failed';
        this.toastService.error(msg);
      }
    });
  }

  onGoogleSignInFallback(): void {
    if (typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.prompt();
    } else {
      this.toastService.info('Loading Google Sign-In, please wait a moment...');
    }
  }

  /**
   * Handle Email/Password Login
   */
  onLoginSubmit(): void {
    if (!this.loginEmail || !this.loginEmail.includes('@')) {
      this.toastService.error('Please enter a valid email address');
      return;
    }
    if (!this.loginPassword) {
      this.toastService.error('Please enter your password');
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
        if (res.data.user.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || 'Invalid email or password';
        this.toastService.error(msg);
      }
    });
  }

  /**
   * Handle Customer Registration / Sign Up
   */
  onSignupSubmit(): void {
    if (!this.signupFullname.trim()) {
      this.toastService.error('Please enter your full name');
      return;
    }
    if (!this.signupEmail || !this.signupEmail.includes('@')) {
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

  onSignOut(): void {
    this.authService.logout();
    this.toastService.info('You have been logged out successfully.');
  }
}
