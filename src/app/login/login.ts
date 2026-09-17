import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  enviando = false;
  error: string | null = null;
  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  ingresar(): void {
    if (this.loginForm.invalid || this.enviando) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.enviando = true;
    this.error = null;
    const { email, password } = this.loginForm.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        const destino = this.route.snapshot.queryParamMap.get('returnUrl') || '/admin';
        void this.router.navigateByUrl(destino.startsWith('/') ? destino : '/admin');
      },
      error: (error) => {
        this.error = error.error?.message || 'No se pudo iniciar sesión.';
        this.enviando = false;
      },
    });
  }
}