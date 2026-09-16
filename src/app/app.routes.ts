import { Routes } from '@angular/router';
import { ReclamoFormComponent } from './reclamo-form/reclamo-form';
import { AdminReclamosComponent } from './admin-reclamos/admin-reclamos';

export const routes: Routes = [
	{ path: '', component: ReclamoFormComponent },
	{ path: 'admin', component: AdminReclamosComponent },
	{ path: '**', redirectTo: '' },
];
