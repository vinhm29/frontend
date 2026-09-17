import { Routes } from '@angular/router';
import { ReclamoFormComponent } from './reclamo-form/reclamo-form';
import { AdminReclamosComponent } from './admin-reclamos/admin-reclamos';
import { LoginComponent } from './login/login';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
	{ path: '', component: ReclamoFormComponent },
	{ path: 'login', component: LoginComponent },
	{ path: 'admin', component: AdminReclamosComponent, canActivate: [authGuard] },
	{ path: '**', redirectTo: '' },
];
