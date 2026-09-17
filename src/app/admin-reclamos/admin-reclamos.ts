import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';

interface ReclamoAdmin {
  correlativo: string;
  doc_afectado: string;
  n_establecimiento: string;
  id_clasif: string;
  detalle_reclamo: string | null;
  notif_correo: string | null;
  activo: boolean;
  created_at: string;
  persona?: { nombre_completo: string; correo?: string | null; telefono?: string | null };
  establecimiento?: { nombre: string };
  clasificacion?: { descripcion: string };
  respuesta?: { correlativo_reclamo: string; id_estado_reclamo: number } | null;
}

interface ClasificacionRespuesta {
  id_clasif_resp: string;
  descripcion: string;
}

interface EstadoReclamo {
  id_estado_reclamo: number;
  nombre_estado: string;
  descripcion: string;
}

@Component({
  selector: 'app-admin-reclamos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-reclamos.html',
  styleUrls: ['./admin-reclamos.css'],
})
export class AdminReclamosComponent implements OnInit {
  private readonly apiBaseUrl = 'http://libro-reclamaciones.test/api';
  reclamos: ReclamoAdmin[] = [];
  reclamosFiltrados: ReclamoAdmin[] = [];
  clasificaciones: ClasificacionRespuesta[] = [];
  estados: EstadoReclamo[] = [];
  cargando = false;
  enviando = false;
  mensaje: string | null = null;
  error: string | null = null;
  reclamoSeleccionado: ReclamoAdmin | null = null;
  filtro = '';

  respuestaForm;

  constructor(private http: HttpClient, private fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.respuestaForm = this.fb.group({
      archivo_adjunto: this.fb.control<File | null>(null),
      observaciones: ['', Validators.required],
      canal_notif: ['CORREO'],
      fecha_notif: [this.fechaActual(), Validators.required],
      id_clasif_resp: [''],
      id_estado_reclamo: ['', Validators.required],
    });
    this.respuestaForm.get('id_estado_reclamo')?.valueChanges.subscribe((estado) => {
      this.actualizarValidacionesEstado(Number(estado));
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = null;
    this.http.get<{ data: ReclamoAdmin[] }>(`${this.apiBaseUrl}/admin/reclamos`).subscribe({
      next: (response) => {
        this.reclamos = response.data;
        this.aplicarFiltro();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudieron cargar los reclamos.';
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });

    this.http.get<{ data: ClasificacionRespuesta[] }>(`${this.apiBaseUrl}/admin/clasificaciones-respuesta`).subscribe({
      next: (response) => {
        this.clasificaciones = response.data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudieron cargar las clasificaciones de respuesta.';
        this.cdr.detectChanges();
      },
    });
    this.http.get<{ data: EstadoReclamo[] }>(`${this.apiBaseUrl}/admin/estados-reclamo`).subscribe({
      next: (response) => {
        this.estados = response.data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudieron cargar los estados del reclamo.';
        this.cdr.detectChanges();
      },
    });
  }

  aplicarFiltro(): void {
    const termino = this.filtro.trim().toLowerCase();
    this.reclamosFiltrados = this.reclamos.filter((reclamo) =>
      !termino || reclamo.correlativo.toLowerCase().includes(termino)
      || reclamo.doc_afectado.toLowerCase().includes(termino)
      || reclamo.persona?.nombre_completo.toLowerCase().includes(termino)
    );
  }

  seleccionarReclamo(reclamo: ReclamoAdmin): void {
    this.reclamoSeleccionado = reclamo;
    this.mensaje = null;
    this.respuestaForm.reset({
      archivo_adjunto: null,
      observaciones: '',
      canal_notif: 'CORREO',
      fecha_notif: this.fechaActual(),
      id_clasif_resp: '',
      id_estado_reclamo: '',
    });
  }

  seleccionarArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] || null;
    this.respuestaForm.get('archivo_adjunto')?.setValue(archivo);
    this.respuestaForm.get('archivo_adjunto')?.markAsTouched();
  }

  quitarArchivo(input: HTMLInputElement): void {
    input.value = '';
    this.respuestaForm.get('archivo_adjunto')?.reset(null);
  }

  esEstadoEvaluacion(): boolean {
    return Number(this.respuestaForm.get('id_estado_reclamo')?.value) === 1;
  }

  puedeContinuarRespuesta(reclamo: ReclamoAdmin): boolean {
    return !reclamo.respuesta || Number(reclamo.respuesta.id_estado_reclamo) === 1;
  }

  private actualizarValidacionesEstado(idEstado: number): void {
    const soloEvaluacion = idEstado === 1;
    const camposOpcionalesEnEvaluacion = ['archivo_adjunto', 'canal_notif', 'id_clasif_resp'];

    camposOpcionalesEnEvaluacion.forEach((nombre) => {
      const control = this.respuestaForm.get(nombre);
      control?.setValidators(soloEvaluacion ? [] : Validators.required);
      control?.updateValueAndValidity({ emitEvent: false });
    });
  }

  cerrarRespuesta(): void {
    this.reclamoSeleccionado = null;
  }

  responder(): void {
    if (!this.reclamoSeleccionado || this.respuestaForm.invalid || this.enviando) {
      this.respuestaForm.markAllAsTouched();
      return;
    }

    this.enviando = true;
    this.error = null;
    const valores = this.respuestaForm.getRawValue();
    const archivo = valores.archivo_adjunto;
    if (!this.esEstadoEvaluacion() && !archivo) {
      this.enviando = false;
      return;
    }
    const datos = new FormData();
    datos.append('correlativo_reclamo', this.reclamoSeleccionado.correlativo);
    if (archivo) {
      datos.append('archivo_adjunto', archivo, archivo.name);
    }
    datos.append('observaciones', String(valores.observaciones));
    if (valores.canal_notif) {
      datos.append('canal_notif', valores.canal_notif);
    }
    datos.append('fecha_notif', `${valores.fecha_notif?.replace('T', ' ') || ''}:00`);
    if (valores.id_clasif_resp) {
      datos.append('id_clasif_resp', valores.id_clasif_resp);
    }
    datos.append('id_estado_reclamo', String(Number(valores.id_estado_reclamo)));

    this.http.post(`${this.apiBaseUrl}/admin/respuestas`, datos).pipe(
      timeout(15000),
      finalize(() => {
        this.enviando = false;
        this.cdr.detectChanges();
      }),
    ).subscribe({
      next: () => {
        this.mensaje = 'La respuesta fue registrada correctamente.';
        this.cerrarRespuesta();
        this.cargarDatos();
      },
      error: (err) => {
        this.error = err.name === 'TimeoutError'
          ? 'La respuesta tardó demasiado. Verifica la conexión e inténtalo nuevamente.'
          : err.error?.message || 'No se pudo registrar la respuesta.';
      },
    });
  }

  private fechaActual(): string {
    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10);
    const hora = ahora.toTimeString().slice(0, 5);
    return `${fecha}T${hora}`;
  }
}