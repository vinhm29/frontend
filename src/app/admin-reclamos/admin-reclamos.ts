import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';

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
  respuesta?: { correlativo_reclamo: string } | null;
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
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
      archivo_adjunto: ['', Validators.required],
      observaciones: ['', Validators.required],
      canal_notif: ['CORREO', Validators.required],
      fecha_notif: [this.fechaActual(), Validators.required],
      id_clasif_resp: ['', Validators.required],
      id_estado_reclamo: ['', Validators.required],
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
      archivo_adjunto: '',
      observaciones: '',
      canal_notif: 'CORREO',
      fecha_notif: this.fechaActual(),
      id_clasif_resp: '',
      id_estado_reclamo: '',
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
    this.http.post(`${this.apiBaseUrl}/admin/respuestas`, {
      correlativo_reclamo: this.reclamoSeleccionado.correlativo,
      ...valores,
      fecha_notif: `${valores.fecha_notif?.replace('T', ' ')}:00`,
      id_estado_reclamo: Number(valores.id_estado_reclamo),
    }).subscribe({
      next: () => {
        this.mensaje = 'La respuesta fue registrada correctamente.';
        this.enviando = false;
        this.cerrarRespuesta();
        this.cargarDatos();
      },
      error: (err) => {
        this.error = err.error?.message || 'No se pudo registrar la respuesta.';
        this.enviando = false;
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