# LebriJaleo

Plataforma para descubrir y gestionar eventos culturales de Lebrija. El proyecto
incluye una aplicación web, una aplicación móvil y una API compartida, con
autenticación, perfiles, eventos, favoritos y funciones sociales.

## Arquitectura

| Componente | Tecnología | Carpeta |
| --- | --- | --- |
| API | Python, FastAPI y Supabase | `backend/` |
| Aplicación web | Next.js, React y Supabase | `lebrijaleo/` |
| Aplicación móvil | Expo, React Native y Expo Router | `lebrijaleo-mobile/` |

Las aplicaciones web y móvil consumen la API de FastAPI y comparten el proyecto
de Supabase para autenticación, base de datos y almacenamiento de imágenes.

## Funcionalidades principales

- Consulta pública de eventos y sus detalles.
- Registro, inicio de sesión y gestión de perfiles.
- Favoritos y funcionalidades sociales.
- Creación y edición de eventos para usuarios con permisos de organización.
- Estadísticas para organizadores.
- Subida de imágenes de perfiles y eventos.
- Acceso desde navegador, Android, iOS y Expo Web.

## Requisitos

- Python 3.11 o superior.
- Node.js 18 o superior.
- npm.
- Un proyecto de [Supabase](https://supabase.com/).
- Expo CLI, disponible mediante `npx`, para ejecutar la aplicación móvil.

## Configuración

### 1. Backend

Desde la raíz del repositorio:

```bash
cd backend
python -m venv .venv
```

Activa el entorno virtual e instala las dependencias:

```bash
# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

Crea `backend/.env` con las credenciales de Supabase:

```env
SUPABASE_URL=
SUPABASE_KEY=
```

### 2. Aplicación web

```bash
cd lebrijaleo
npm install
```

Crea `lebrijaleo/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 3. Aplicación móvil

```bash
cd lebrijaleo-mobile
npm install
```

Crea `lebrijaleo-mobile/.env` a partir de `.env.example`:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
```

En un dispositivo físico, sustituye `127.0.0.1` por la dirección IP local del
ordenador que ejecuta el backend.

## Ejecución en desarrollo

Inicia cada componente en una terminal independiente.

### API

```bash
cd backend
# Activa .venv antes de ejecutar este comando
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

La documentación interactiva está disponible en
<http://127.0.0.1:8000/docs>.

### Web

```bash
cd lebrijaleo
npm run dev
```

La aplicación estará disponible en <http://localhost:3000>.

### Móvil

```bash
cd lebrijaleo-mobile
npx expo start
```

Desde el menú de Expo se puede abrir el proyecto en Expo Go, un development
build, Android, iOS o navegador.

## Scripts disponibles

### Web

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Ejecuta la build de producción
```

### Móvil

```bash
npm start        # Inicia Expo
npm run android  # Abre Android
npm run ios      # Abre iOS
npm run web      # Abre Expo Web
npm run lint     # Comprueba el estilo
```

## Estructura del repositorio

```text
.
├── backend/             # API FastAPI y acceso a Supabase
├── lebrijaleo/          # Aplicación web Next.js
├── lebrijaleo-mobile/   # Aplicación móvil Expo/React Native
└── .github/             # Configuración de GitHub
```

## Documentación específica

- [Documentación del backend](backend/README.md)
- [Documentación de la aplicación web](lebrijaleo/README.md)
- [Documentación de la aplicación móvil](lebrijaleo-mobile/README.md)

## Despliegue

El backend puede desplegarse en un servicio compatible con FastAPI, y la
aplicación web en un servicio compatible con Next.js como Vercel. En cada
entorno de despliegue deben configurarse las variables de entorno
correspondientes y añadir el dominio web a la configuración CORS del backend
cuando sea necesario.
