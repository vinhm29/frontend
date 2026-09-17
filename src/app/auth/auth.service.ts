import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
  token: string;
  user: { id: number; name: string; email: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBaseUrl = 'http://libro-reclamaciones.test/api';
  private readonly tokenKey = 'admin_auth_token';
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiBaseUrl}/login`, { email, password }).pipe(
      tap((response) => sessionStorage.setItem(this.tokenKey, response.token)),
    );
  }

  token(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  estaAutenticado(): boolean {
    return !!this.token();
  }

  cerrarSesion(): void {
    const token = this.token();
    sessionStorage.removeItem(this.tokenKey);
    if (token) {
      this.http.post(`${this.apiBaseUrl}/admin/logout`, {}, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      }).subscribe({ error: () => undefined });
    }
    void this.router.navigate(['/login']);
  }
}