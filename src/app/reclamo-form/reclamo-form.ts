import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { catchError, finalize, of, throwError, timeout } from 'rxjs';

interface Establecimiento {
  cod_establecimiento: string;
  nombre: string;
  direccion: string | null;
}

interface Clasificacion {
  codigo: string;
  descripcion: string;
}

interface Persona {
  n_documento: string;
  tipo_documento: string;
  nombre_completo: string;
  domicilio?: string | null;
  referencia?: string | null;
  correo?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
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
  buscandoPersona = false;
  personaEncontrada = false;
  personaNoEncontrada = false;
  editandoPersona = false;
  guardandoPersona = false;
  mensajeBusqueda: string | null = null;
  private personaOriginal: Persona | null = null;
  private temporizadorBusqueda?: ReturnType<typeof setTimeout>;

  constructor(private fb: FormBuilder, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initForm();
    this.reclamoForm.get('tipo_documento')?.valueChanges.subscribe(() => this.limpiarEstadoBusqueda());
    this.reclamoForm.get('n_documento')?.valueChanges.subscribe(() => this.limpiarEstadoBusqueda());
    this.cargarEstablecimientos();
    this.cargarClasificaciones();
  }

  buscarPersona(): void {
    const tipoDocumento = this.reclamoForm.get('tipo_documento')?.value;
    const numeroDocumento = this.reclamoForm.get('n_documento')?.value?.trim();
    const documentoControl = this.reclamoForm.get('n_documento');

    if (!tipoDocumento || !numeroDocumento || documentoControl?.invalid) {
      documentoControl?.markAsTouched();
      this.mensajeBusqueda = 'Ingresa un número de documento válido para buscar.';
      return;
    }

    this.buscandoPersona = true;
    this.personaEncontrada = false;
    this.personaNoEncontrada = false;
    this.mensajeBusqueda = null;
    this.temporizadorBusqueda = setTimeout(() => {
      if (this.buscandoPersona) {
        this.mensajeBusqueda = 'No se pudo completar la búsqueda. Verifica el documento e inténtalo nuevamente.';
        this.finalizarBusquedaPersona();
      }
    }, 5500);
    const params = new HttpParams()
      .set('tipo_documento', tipoDocumento)
      .set('n_documento', numeroDocumento);

    this.http.get<{ status: string; data?: Persona | null }>(`${this.apiBaseUrl}/personas/buscar`, { params }).pipe(
      timeout(5000),
      catchError((err) => {
        if (err.status === 404) {
          return of({ status: 'not_found', data: null });
        }

        return throwError(() => err);
      }),
      finalize(() => this.buscandoPersona = false)
    ).subscribe({
      next: (response) => {
        if (response.data) {
          this.reclamoForm.patchValue(response.data);
          this.personaOriginal = response.data;
          this.personaEncontrada = true;
          this.setCamposPersonaHabilitados(false);
          this.mensajeBusqueda = 'Persona encontrada. Verifica los datos cargados.';
        } else {
          this.personaNoEncontrada = true;
          this.limpiarDatosPersona();
          this.setCamposPersonaHabilitados(true);
          this.mensajeBusqueda = 'No encontramos a la persona. Completa sus datos para continuar.';
        }
        this.finalizarBusquedaPersona();
      },
      error: (err) => {
        this.personaNoEncontrada = false;
        this.setCamposPersonaHabilitados(true);
        this.mensajeBusqueda = err.name === 'TimeoutError'
          ? 'La búsqueda tardó demasiado. Verifica la conexión e inténtalo nuevamente.'
          : 'No se pudo consultar la base de datos. Inténtalo nuevamente.';
        this.finalizarBusquedaPersona();
      }
    });
  }

  private finalizarBusquedaPersona(): void {
    this.buscandoPersona = false;
    if (this.temporizadorBusqueda) {
      clearTimeout(this.temporizadorBusqueda);
      this.temporizadorBusqueda = undefined;
    }
    this.cdr.detectChanges();
  }

  private limpiarEstadoBusqueda(): void {
    if (this.personaEncontrada) {
      this.personaEncontrada = false;
      this.editandoPersona = false;
      this.personaOriginal = null;
      this.setCamposPersonaHabilitados(true);
    }
    this.personaNoEncontrada = false;
    this.mensajeBusqueda = null;
  }

  private setCamposPersonaHabilitados(habilitados: boolean): void {
    ['nombre_completo', 'domicilio', 'referencia', 'correo', 'telefono', 'fecha_nacimiento']
      .forEach((campo) => {
        const control = this.reclamoForm.get(campo);
        if (habilitados) {
          control?.enable({ emitEvent: false });
        } else {
          control?.disable({ emitEvent: false });
        }
      });
  }

  private limpiarDatosPersona(): void {
    this.reclamoForm.patchValue({
      nombre_completo: '',
      domicilio: '',
      referencia: '',
      correo: '',
      telefono: '',
      fecha_nacimiento: '',
    }, { emitEvent: false });
    this.personaOriginal = null;
    this.editandoPersona = false;
  }

  editarPersona(): void {
    if (!this.personaEncontrada) {
      return;
    }

    this.editandoPersona = true;
    this.setCamposPersonaHabilitados(true);
  }

  cancelarEdicionPersona(): void {
    if (this.personaOriginal) {
      this.reclamoForm.patchValue(this.personaOriginal);
    }

    this.editandoPersona = false;
    this.setCamposPersonaHabilitados(false);
    this.mensajeBusqueda = 'Se descartaron los cambios de la persona.';
  }

  guardarPersona(): void {
    if (!this.personaEncontrada || !this.editandoPersona || this.guardandoPersona) {
      return;
    }

    const persona = this.reclamoForm.getRawValue() as Persona;
    const datosPersona = {
      tipo_documento: persona.tipo_documento,
      nombre_completo: persona.nombre_completo,
      domicilio: persona.domicilio,
      referencia: persona.referencia,
      correo: persona.correo,
      telefono: persona.telefono,
      fecha_nacimiento: persona.fecha_nacimiento,
    };

    if (!datosPersona.nombre_completo) {
      this.reclamoForm.get('nombre_completo')?.markAsTouched();
      return;
    }

    this.guardandoPersona = true;
    this.http.put<{ status: string; data: Persona }>(
      `${this.apiBaseUrl}/personas/${encodeURIComponent(persona.n_documento)}`,
      datosPersona
    ).pipe(
      timeout(5000),
      finalize(() => {
        this.guardandoPersona = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.personaOriginal = response.data;
        this.reclamoForm.patchValue(response.data);
        this.editandoPersona = false;
        this.setCamposPersonaHabilitados(false);
        this.mensajeBusqueda = 'Los datos de la persona fueron actualizados correctamente.';
      },
      error: (err) => {
        this.mensajeBusqueda = err.name === 'TimeoutError'
          ? 'La actualización tardó demasiado. Inténtalo nuevamente.'
          : err.error?.message || 'No se pudieron actualizar los datos de la persona.';
      }
    });
  }

  cargarEstablecimientos(): void {
    this.cargandoEstablecimientos = true;

    this.http.get<{ status: string; data: Establecimiento[] }>(`${this.apiBaseUrl}/establecimientos`).subscribe({
      next: (response) => {
        this.establecimientos = response.data;
        this.cargandoEstablecimientos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'No se pudieron cargar los establecimientos disponibles.';
        this.cargandoEstablecimientos = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarClasificaciones(): void {
    this.cargandoClasificaciones = true;

    this.http.get<{ status: string; data: Clasificacion[] }>(`${this.apiBaseUrl}/clasificaciones`).subscribe({
      next: (response) => {
        this.clasificaciones = response.data;
        this.cargandoClasificaciones = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mensajeError = 'No se pudieron cargar los códigos de clasificación disponibles.';
        this.cargandoClasificaciones = false;
        this.cdr.detectChanges();
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
    this.http.post<any>(`${this.apiBaseUrl}/reclamos`, this.reclamoForm.getRawValue()).subscribe({
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
