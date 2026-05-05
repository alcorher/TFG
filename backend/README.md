# LebriJaleo Backend

Backend de LebriJaleo basado en FastAPI y Supabase. Expone la API usada por la web y la app movil para perfiles, eventos, favoritos, social, estadisticas y subida de archivos.

## Requisitos

- Python 3.11 o superior.
- Credenciales de Supabase.
- El frontend web o movil apuntando a la URL de este backend.

## Variables de entorno

Crea un archivo `.env` en esta carpeta con estas variables:

```bash
SUPABASE_URL=
SUPABASE_KEY=
```

## Instalacion y arranque

En Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

La documentacion interactiva de FastAPI queda disponible en `/docs`.

## Endpoints principales

- `/api/perfil` y `/api/perfil/{user_id}` para perfiles.
- `/api/eventos` para la cartelera publica.
- `/api/mis-eventos`, `/api/mis-favoritos` y `/api/mis-amigos` para vistas privadas.
- `/api/empresarios` y `/api/estadisticas-organizador/{user_id}` para gestion de organizadores.
- `/api/upload` para carga de imagenes.

## CORS

El backend permite origenes locales de Next.js y Expo, ademas del despliegue web en Vercel.
