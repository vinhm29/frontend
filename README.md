# Frontend - Libro de Reclamaciones

Este proyecto es la interfaz web del sistema de Libro de Reclamaciones desarrollado con Angular 22. La aplicación permite registrar reclamos desde el público, consultar si la persona ya existe en la base de datos y gestionar los reclamos desde un panel administrativo.

## 1. Descripción general

La aplicación está compuesta por tres módulos principales:

- Formulario público de reclamos: vista principal en la ruta `/`
- Login administrativo: ruta `/login`
- Panel de administración: ruta `/admin`

La navegación se define en [src/app/app.routes.ts](src/app/app.routes.ts) y usa rutas con protección por guard para restringir el acceso al panel administrativo.

## 2. Stack tecnológico

- Angular 22
- TypeScript
- RxJS
- Reactive Forms
- Standalone components
- HttpClient para consumir la API REST

## 3. Estructura del proyecto

```text
src/
├── app/
│   ├── admin-reclamos/
│   ├── auth/
│   ├── login/
│   ├── reclamo-form/
│   ├── app.config.ts
│   ├── app.css
│   ├── app.html
│   ├── app.routes.ts
│   └── app.ts
├── index.html
├── main.ts
└── styles.css
```

## 4. Flujo de la aplicación

### 4.1. Formulario de reclamo (`/`)

La ruta principal renderiza el componente `ReclamoFormComponent`, ubicado en [src/app/reclamo-form/reclamo-form.ts](src/app/reclamo-form/reclamo-form.ts).

Su funcionalidad incluye:

- Carga de establecimientos desde la API.
- Carga de clasificaciones desde la API.
- Búsqueda de persona por tipo y número de documento.
- Si la persona existe, se cargan sus datos y se permite editarlos.
- Si no existe, el usuario puede completar los datos y continuar con el reclamo.
- Envío del reclamo mediante `POST` a `/reclamos`.

El formulario usa `FormBuilder` y validaciones reactivas. Además, se manejan mensajes de éxito/error y estados de carga para mejorar la experiencia del usuario.

#### Campos principales

- `tipo_documento`
- `n_documento`
- `nombre_completo`
- `domicilio`
- `referencia`
- `correo`
- `telefono`
- `fecha_nacimiento`
- `n_establecimiento`
- `detalle_reclamo`
- `notif_correo`
- `id_clasif`

#### Integración con API

La aplicación apunta a la API del backend en la siguiente URL:

```ts
http://libro-reclamaciones.test/api
```

Endpoints principales consumidos por este formulario:

- `GET /establecimientos`
- `GET /clasificaciones`
- `GET /personas/buscar?tipo_documento=&n_documento=`
- `PUT /personas/{n_documento}`
- `POST /reclamos`

### 4.2. Login administrativo (`/login`)

El acceso al panel administrativo se encuentra protegido por guard de autenticación. El login se implementa en [src/app/login/login.ts](src/app/login/login.ts) y usa el servicio [src/app/auth/auth.service.ts](src/app/auth/auth.service.ts).

#### Funcionalidad

- El usuario ingresa correo y contraseña.
- Se envía la petición `POST /login`.
- Si la autenticación es correcta, se guarda el token en `sessionStorage`.
- Luego se redirige a `/admin`.

#### Protección de rutas

El guard [src/app/auth/auth.guard.ts](src/app/auth/auth.guard.ts) comprueba si el usuario está autenticado antes de permitir el acceso a la vista administrativa.

### 4.3. Administración de reclamos (`/admin`)

El componente [src/app/admin-reclamos/admin-reclamos.ts](src/app/admin-reclamos/admin-reclamos.ts) permite:

- listar reclamos pendientes o registrados,
- filtrar por correlativo, documento o nombre,
- seleccionar un reclamo para responder,
- registrar una respuesta con observaciones,
- adjuntar archivo, canal de notificación y estado.

#### Endpoints consumidos

- `GET /admin/reclamos`
- `GET /admin/clasificaciones-respuesta`
- `GET /admin/estados-reclamo`
- `POST /admin/respuestas`

## 5. Rutas principales

| Ruta | Componente | Descripción |
| --- | --- | --- |
| `/` | `ReclamoFormComponent` | Formulario público para registrar reclamos |
| `/login` | `LoginComponent` | Acceso al panel administrativo |
| `/admin` | `AdminReclamosComponent` | Gestión de reclamos y respuestas |
| `**` | Redirección a `/` | Ruta no encontrada |

## 6. Requisitos para ejecutar el proyecto

### Dependencias

Se requiere tener instalado:

- Node.js
- npm o pnpm
- Angular CLI (se recomienda usar el proyecto local definido en `package.json`)

### Backend requerido

La aplicación frontend depende del proyecto backend del Libro de Reclamaciones, que debe estar disponible en:

```text
http://libro-reclamaciones.test
```

Repositorio del backend:

- Nombre del proyecto: Libro de Reclamaciones API
- Enlace: https://github.com/vinhm29/libro-reclamaciones

Si el backend no está levantado, la aplicación puede cargar parcialmente pero no podrá registrar ni consultar datos reales.

## 7. Instalación

Desde la raíz del proyecto:

```bash
pnpm install
```

O si se usa npm:

```bash
npm install
```

## 8. Ejecución en desarrollo

```bash
pnpm start
```

o

```bash
npm start
```

Luego abrir en el navegador:

```text
http://localhost:4200/
```

El servidor de Angular compila automáticamente ante cambios en los archivos fuente.

## 9. Construcción para producción

```bash
pnpm build
```

Esto genera la versión compilada en la carpeta `dist/`.

## 10. Pruebas

```bash
pnpm test
```

El proyecto usa Angular con soporte para pruebas del framework de la aplicación.

## 11. Uso práctico de la página

### Para un usuario público

1. Abrir la ruta principal `/`.
2. Ingresar los datos de la persona o buscar por documento.
3. Seleccionar el establecimiento y la clasificación del reclamo.
4. Describir el problema en `detalle_reclamo`.
5. Enviar el reclamo.
6. El sistema genera un correlativo y muestra un mensaje de éxito.

### Para un administrador

1. Acceder a `/login`.
2. Iniciar sesión con credenciales válidas.
3. Revisar la lista de reclamos en `/admin`.
4. Filtrar por documento o nombre.
5. Seleccionar un reclamo y registrar una respuesta.
6. Adjuntar archivo opcional si aplica.
7. Definir estado del reclamo y canal de notificación.

## 12. Consideraciones técnicas

- El token de autenticación se almacena en `sessionStorage` para sesiones temporales del navegador.
- Los formularios usan validaciones reactivas para evitar envíos incompletos.
- La administración maneja respuestas con `FormData` para soportar archivos adjuntos.
- La lógica de negocio de la búsqueda y actualización de personas está centralizada en el componente del formulario público.

## 13. Observaciones

Este frontend está diseñado para operar junto con un backend que exponga la API REST definida por los endpoints mencionados. La base URL actual está fijada en código y debe coincidir con el entorno local del proyecto backend.

---
