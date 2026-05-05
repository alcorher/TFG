# LebriJaleo Web

Aplicacion web de LebriJaleo, construida con Next.js y conectada a Supabase y al backend FastAPI del proyecto.

## Funcionalidades

- Feed publico de eventos.
- Login y registro de usuarios.
- Perfil publico y edicion de perfil.
- Favoritos, social y ficha de eventos.
- Vistas de creacion y edicion de eventos para usuarios con rol de empresario.

## Requisitos

- Node.js 18 o superior.
- Una cuenta y proyecto de Supabase.
- El backend del proyecto en ejecucion o accesible desde la red.

## Instalacion

1. Entra en la carpeta del proyecto web.
2. Instala dependencias.
3. Crea un archivo `.env.local` con las variables necesarias.
4. Arranca el servidor de desarrollo.

```bash
cd lebrijaleo
npm install
npm run dev
```

## Variables de entorno

Define estas variables en `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=https://lebrijaleo-backend.onrender.com
```

Si ejecutas el backend en local, cambia `NEXT_PUBLIC_API_URL` por la URL local, por ejemplo `http://127.0.0.1:8000`.

## Scripts

- `npm run dev` arranca la app en desarrollo.
- `npm run build` genera la build de produccion.
- `npm run start` ejecuta la build generada.

## Estructura principal

- `src/app` rutas de la aplicacion.
- `src/components` componentes reutilizables.
- `src/lib` utilidades compartidas.
- `src/utils/supabase` cliente de Supabase.
