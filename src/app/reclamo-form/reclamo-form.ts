import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface Establecimiento {
  cod_establecimiento: string;
  nombre: string;
  direccion: string | null;
}

interface Clasificacion {
  codigo: string;
  descripcion: string;
}

@Component({
  selector: 'app-reclamo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './reclamo-form.html',
  styleUrls: ['./reclamo-form.css']
})
export class ReclamoFormComponent implements OnInit {
  reclamoForm!: FormGroup;
  apiBaseUrl = 'http://libro-reclamaciones.test/api';
  establecimientos: Establecimiento[] = [];
  clasificaciones: Clasificacion[] = [];
  cargandoEstablecimientos = false;
  cargandoClasificaciones = false;
  mensajeExito: string | null = null;
  mensajeError: string | null = null;
  correlativoGenerado: string | null = null;
  enviandoReclamo = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarEstablecimientos();
    this.cargarClasificaciones();
  }

  cargarEstablecimientos(): void {
    this.cargandoEstablecimientos = true;

    this.http.get<{ status: string; data: Establecimiento[] }>(`${this.apiBaseUrl}/establecimientos`).subscribe({
      next: (response) => {
        this.establecimientos = response.data;
        this.cargandoEstablecimientos = false;
      },
      error: () => {
        this.mensajeError = 'No se pudieron cargar los establecimientos disponibles.';
        this.cargandoEstablecimientos = false;
      }
    });
  }

  cargarClasificaciones(): void {
    this.cargandoClasificaciones = true;

    this.http.get<{ status: string; data: Clasificacion[] }>(`${this.apiBaseUrl}/clasificaciones`).subscribe({
      next: (response) => {
        this.clasificaciones = response.data;
        this.cargandoClasificaciones = false;
      },
      error: () => {
        this.mensajeError = 'No se pudieron cargar los códigos de clasificación disponibles.';
        this.cargandoClasificaciones = false;
      }
    });
  }

  initForm(): void {
    this.reclamoForm = this.fb.group({
      // 1. Campos exactos de tu tabla PERSONA
      n_documento: ['', [Validators.required, Validators.maxLength(10)]],
      tipo_documento: ['DNI', [Validators.required, Validators.maxLength(10)]],
      nombre_completo: ['', [Validators.required]],
      domicilio: [''],
      referencia: [''],
      correo: [''],
      telefono: ['', [Validators.maxLength(9)]],
      fecha_nacimiento: [''],

      // 2. Campos exactos de tu tabla RECLAMO (correlativo y activo los creará Laravel)
      n_establecimiento: ['', [Validators.required, Validators.maxLength(50)]],
      detalle_reclamo: [''],
      notif_correo: ['SI', [Validators.required, Validators.maxLength(2)]],
      id_clasif: ['', [Validators.required, Validators.maxLength(15)]]
    });
  }

  enviarReclamo(): void {
    if (this.reclamoForm.invalid || this.enviandoReclamo) {
      this.reclamoForm.markAllAsTouched();
      return;
    }

    this.mensajeExito = null;
    this.mensajeError = null;
    this.enviandoReclamo = true;

    // Enviar todo el paquete JSON directo a tu API en Laravel
    this.http.post<any>(`${this.apiBaseUrl}/reclamos`, this.reclamoForm.value).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.mensajeExito = response.message;
          this.correlativoGenerado = response.data?.correlativo;
          // Limpiar formulario y resetear valores por defecto
          this.reclamoForm.reset({ tipo_documento: 'DNI', notif_correo: 'SI' }); 
          this.enviandoReclamo = false;
        }
      },
      error: (err) => {
        this.mensajeError = err.error?.message || 'No se pudo conectar con el servidor de reclamos.';
        this.enviandoReclamo = false;
        console.error(err);
      }
    });
  }
}
