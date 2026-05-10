# LebriJaleo Mobile

Aplicacion movil de LebriJaleo construida con Expo Router. Comparte backend y autenticacion con la version web del proyecto.

## Funcionalidades

- Inicio con listado de eventos.
- Detalle de evento, favoritos y edicion para usuarios autorizados.
- Favoritos, social, perfil y edicion de perfil.
- Puntos de gestion de eventos y organizadores para roles con permisos.
- Navegacion por tabs con rutas compartidas entre web y movil.

## Requisitos

- Node.js 18 o superior.
- Expo CLI disponible via `npx`.
- Una cuenta y proyecto de Supabase.
- El backend del proyecto accesible desde la app.

## Instalacion

1. Entra en la carpeta del proyecto movil.
2. Instala dependencias.
3. Crea un archivo `.env` a partir de `.env.example`.
4. Arranca Expo.

```bash
cd lebrijaleo-mobile
npm install
npx expo start
```

## Variables de entorno

Define estas variables en `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=https://lebrijaleo-backend.onrender.com
```

Si ejecutas el backend en local, cambia `EXPO_PUBLIC_API_URL` por la URL local, por ejemplo `http://127.0.0.1:8000`.

## Scripts

- `npm start` arranca Expo.
- `npm run android` abre la app en Android.
- `npm run ios` abre la app en iOS.
- `npm run web` abre la app en navegador.
- `npm run lint` ejecuta la comprobacion de estilo.
- `npm run reset-project` restaura la estructura base de Expo.

## Entorno de desarrollo

La app puede abrirse con Expo Go, un development build o en web, segun la opcion que elijas al iniciar `expo start`.
