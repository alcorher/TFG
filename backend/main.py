import os
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import date, time, datetime
from typing import Optional
import uuid 
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Header, FastAPI
# Cargar variables de entorno
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Faltan las credenciales de Supabase en el archivo .env")

# Cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Iniciar FastAPI
app = FastAPI(
    title="LebriJaleo API",
    description="Backend para la app de eventos culturales de Lebrija",
    version="1.0.0"
)

# Origenes permitidos en desarrollo web/movil (Next.js y Expo)
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:19006",
    "http://127.0.0.1:19006",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "https://lebrijaleo.vercel.app",
]

# Configurar CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELOS PYDANTIC (Validación de datos) ---
class PerfilUpdate(BaseModel):
    nombre: str
    username: str
    biografia: str
    ubicacion: str
    avatar_url: str | None = None  # Nuevo campo (opcional)
    banner_url: str | None = None  # Nuevo campo (opcional)

class EventoCreate(BaseModel):
    nombre: str
    descripcion: str
    lugar: str
    fecha: date
    hora: time
    precio: float = 0.0
    cartel_url: Optional[str] = None
    categoria: str
    aforo_max: Optional[int] = None
    estado: str = 'Publicado'  # Cambia 'Publicado' por la palabra exacta de tu ENUM que arreglaste antes


def validar_fecha_evento(fecha_str: str):
    try:
        fecha_evento = datetime.fromisoformat(fecha_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido")

    if fecha_evento < datetime.now():
        raise HTTPException(status_code=400, detail="No puedes crear o actualizar eventos con una fecha pasada")

    return fecha_evento

# --- Valida el Token de Next.js ---
def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado o formato inválido")
    
    token = authorization.split(" ")[1]
    try:
        # Supabase valida y devuelve quién es el usuario
        user_response = supabase.auth.get_user(token)
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")

# --- API ---

@app.get("/")
def read_root():
    return {"mensaje": "Bienvenido a la API de LebriJaleo"}

@app.get("/api/perfil")
def obtener_perfil(current_user = Depends(get_current_user)):
    """Obtiene los datos del perfil del usuario autenticado"""
    try:
        # Buscamos en la tabla 'usuarios' usando el ID validado del token
        response = supabase.table("usuarios").select("nombre, username, biografia, ubicacion, avatar_url, banner_url, rol").eq("id_usuario", current_user.id).single().execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

@app.put("/api/perfil")
def actualizar_perfil(perfil: PerfilUpdate, current_user = Depends(get_current_user)):
    """Actualiza los datos del perfil del usuario autenticado"""
    try:
        response = supabase.table("usuarios").update({
            "nombre": perfil.nombre,
            "username": perfil.username,
            "biografia": perfil.biografia,
            "ubicacion": perfil.ubicacion,
            "avatar_url": perfil.avatar_url,  
            "banner_url": perfil.banner_url   
        }).eq("id_usuario", current_user.id).execute()
        
        # SOLUCIÓN: Comprobamos de forma segura si Supabase nos devolvió datos
        datos_actualizados = response.data[0] if response.data else None
        
        return {"mensaje": "Perfil actualizado con éxito", "data": datos_actualizados}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al actualizar el perfil: {str(e)}")

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Carga un archivo a Supabase Storage y devuelve la URL pública"""
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="El archivo no tiene nombre")
        
        # Obtener extensión
        extension = file.filename.split(".")[-1].lower()
        
        # Validar tipos de archivo permitidos
        allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
        if extension not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Tipo de archivo no permitido. Usa: {', '.join(allowed_extensions)}")
        
        # Crear nombre único del archivo
        nombre_archivo = f"perfiles/{current_user.id}/{uuid.uuid4()}.{extension}"
        
        # Leer contenido del archivo
        contenido_archivo = await file.read()
        
        # Subir a Supabase Storage
        supabase.storage.from_("eventos").upload(
            path=nombre_archivo,
            file=contenido_archivo,
            file_options={"content-type": file.content_type}
        )
        
        # Obtener URL pública
        file_url = supabase.storage.from_("eventos").get_public_url(nombre_archivo)
        
        return {"url": file_url, "file_url": file_url}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error al subir archivo: {e}")
        raise HTTPException(status_code=400, detail=f"Error al subir archivo: {str(e)}")

@app.get("/api/perfil/{user_id}")
def obtener_perfil_publico(user_id: str):
    """Obtiene el perfil público de cualquier usuario por su ID"""
    try:
        response = supabase.table("usuarios").select(
            "id_usuario, nombre, username, biografia, ubicacion, avatar_url, banner_url, rol, creado_por"
        ).eq("id_usuario", user_id).single().execute()
        
        perfil = response.data
        
        eventos = []
        favoritos = []

        if perfil and perfil.get("rol") == "Empresario":
            # Empresario: obtener sus eventos creados
            ev_response = supabase.table("eventos").select(
                "id_evento, nombre, descripcion, lugar, fecha, hora, precio, cartel_url, categoria, aforo_max, estado, id_empresario, favoritos(count)"
            ).eq("id_empresario", user_id).order("fecha", desc=True).execute()
            
            for e in ev_response.data:
                evento_mod = e.copy()
                count = 0
                if "favoritos" in e and e["favoritos"]:
                    fav_data = e["favoritos"]
                    if isinstance(fav_data, list) and len(fav_data) > 0:
                        count = fav_data[0].get("count", 0)
                    elif isinstance(fav_data, dict):
                        count = fav_data.get("count", 0)
                evento_mod["likes"] = count
                eventos.append(evento_mod)
        else:
            # Usuario normal: obtener sus favoritos
            fav_response = supabase.table("favoritos").select("id_evento").eq("id_usuario", user_id).execute()
            
            if fav_response.data:
                event_ids = [f["id_evento"] for f in fav_response.data]
                
                ev_response = supabase.table("eventos").select(
                    "id_evento, nombre, descripcion, lugar, fecha, hora, precio, cartel_url, categoria, aforo_max, estado, id_empresario, favoritos(count)"
                ).in_("id_evento", event_ids).order("fecha").execute()
                
                for e in ev_response.data:
                    evento_mod = e.copy()
                    count = 0
                    if "favoritos" in e and e["favoritos"]:
                        fav_data = e["favoritos"]
                        if isinstance(fav_data, list) and len(fav_data) > 0:
                            count = fav_data[0].get("count", 0)
                        elif isinstance(fav_data, dict):
                            count = fav_data.get("count", 0)
                    evento_mod["likes"] = count
                    favoritos.append(evento_mod)
        
        return {"perfil": perfil, "eventos": eventos, "favoritos": favoritos}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Perfil no encontrado: {str(e)}")
    
# --- ENDPOINTS DE EVENTOS ---

@app.get("/api/eventos")
def obtener_eventos():
    """Obtiene todos los eventos públicos para la cartelera"""
    try:
        # Hacemos un select de todas las columnas que necesita la EventCard, incluyendo el conteo de favoritos
        response = supabase.table("eventos").select(
            "id_evento, nombre, descripcion, lugar, fecha, hora, precio, cartel_url, categoria, aforo_max, estado, id_empresario, favoritos(count)"
        ).order("fecha").execute()
        
        eventos_procesados = []
        for e in response.data:
            evento_mod = e.copy()
            count = 0
            # Dependiendo de la versión de postgrest/supabase, puede venir como lista o dict
            if "favoritos" in e and e["favoritos"]:
                fav_data = e["favoritos"]
                if isinstance(fav_data, list) and len(fav_data) > 0:
                    count = fav_data[0].get("count", 0)
                elif isinstance(fav_data, dict):
                    count = fav_data.get("count", 0)
                else:
                    count = len(fav_data) if isinstance(fav_data, list) else 0
            
            evento_mod["likes"] = count
            eventos_procesados.append(evento_mod)
        
        return {"mensaje": "Eventos recuperados con éxito", "data": eventos_procesados}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al obtener los eventos: {str(e)}")

@app.get("/api/mis-eventos")
def obtener_mis_eventos(current_user = Depends(get_current_user)):
    """Obtiene los eventos publicados por el usuario autenticado"""
    try:
        response = supabase.table("eventos").select(
            "id_evento, nombre, descripcion, lugar, fecha, hora, precio, cartel_url, categoria, aforo_max, estado, id_empresario, favoritos(count)"
        ).eq("id_empresario", current_user.id).order("fecha", desc=True).execute()
        
        eventos_procesados = []
        for e in response.data:
            evento_mod = e.copy()
            count = 0
            if "favoritos" in e and e["favoritos"]:
                fav_data = e["favoritos"]
                if isinstance(fav_data, list) and len(fav_data) > 0:
                    count = fav_data[0].get("count", 0)
                elif isinstance(fav_data, dict):
                    count = fav_data.get("count", 0)
                else:
                    count = len(fav_data) if isinstance(fav_data, list) else 0
            
            evento_mod["likes"] = count
            eventos_procesados.append(evento_mod)
        
        return {"mensaje": "Eventos recuperados con éxito", "data": eventos_procesados}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al obtener tus eventos: {str(e)}")

@app.get("/api/mis-favoritos")
def obtener_mis_favoritos(current_user = Depends(get_current_user)):
    """Obtiene los eventos que el usuario autenticado ha marcado como favoritos"""
    try:
        # 1. Obtener los IDs de los eventos favoritos del usuario
        fav_response = supabase.table("favoritos").select("id_evento").eq("id_usuario", current_user.id).execute()
        
        if not fav_response.data:
            return {"mensaje": "No hay favoritos", "data": []}
            
        event_ids = [f["id_evento"] for f in fav_response.data]
        
        # 2. Obtener los detalles de esos eventos
        response = supabase.table("eventos").select(
            "id_evento, nombre, descripcion, lugar, fecha, hora, precio, cartel_url, categoria, aforo_max, estado, id_empresario, favoritos(count)"
        ).in_("id_evento", event_ids).order("fecha").execute()
        
        eventos_procesados = []
        for e in response.data:
            evento_mod = e.copy()
            count = 0
            if "favoritos" in e and e["favoritos"]:
                fav_data = e["favoritos"]
                if isinstance(fav_data, list) and len(fav_data) > 0:
                    count = fav_data[0].get("count", 0)
                elif isinstance(fav_data, dict):
                    count = fav_data.get("count", 0)
                else:
                    count = len(fav_data) if isinstance(fav_data, list) else 0
            
            evento_mod["likes"] = count
            eventos_procesados.append(evento_mod)
        
        return {"mensaje": "Eventos recuperados con éxito", "data": eventos_procesados}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al obtener tus eventos favoritos: {str(e)}")
    
@app.post("/api/eventos")
async def crear_evento(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    date: str = Form(...),
    location: str = Form(...),
    price: str = Form("0"),
    capacity: str = Form(""),
    ticketLink: str = Form(""),
    isFree: str = Form("false"),
    banner: UploadFile = File(...),
    authorization: str = Header(None) # <-- 1. CAPTURAMOS EL TOKEN
):
    # 2. VALIDAMOS QUE HAYA TOKEN
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado. Inicia sesión primero.")
    
    token = authorization.split(" ")[1]

    try:
        # 3. LE PREGUNTAMOS A SUPABASE QUIÉN ES EL DUEÑO DE ESTE TOKEN
        user_response = supabase.auth.get_user(token)
        usuario_id = user_response.user.id

        validar_fecha_evento(date)

        # ... (Tu código de subida de imagen a Storage se queda igual) ...
        extension = banner.filename.split(".")[-1]
        nombre_archivo = f"carteles/{uuid.uuid4()}.{extension}"
        
        contenido_archivo = await banner.read()
        
        supabase.storage.from_("eventos").upload(
            path=nombre_archivo,
            file=contenido_archivo,
            file_options={"content-type": banner.content_type}
        )
        
        cartel_url = supabase.storage.from_("eventos").get_public_url(nombre_archivo)

        # 4. AÑADIMOS EL ID DEL EMPRESARIO AL EVENTO
        fecha_part, hora_part = date.split("T")
        
        evento_db = {
            "nombre": title,
            "descripcion": description,
            "categoria": category,
            "fecha": fecha_part,
            "hora": f"{hora_part}:00",
            "lugar": location,
            "precio": 0.0 if isFree == "true" else float(price),
            "aforo_max": int(capacity) if capacity else None,
            "cartel_url": cartel_url,
            "estado": "Activo",
            "id_empresario": usuario_id # <-- ¡AQUÍ ESTÁ LA MAGIA!
        }

        response = supabase.table("eventos").insert(evento_db).execute()

        return {"mensaje": "Evento creado con éxito", "data": response.data}

    except Exception as e:
        print(f"Error al crear evento: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
@app.get("/api/eventos/{evento_id}")
async def obtener_evento(evento_id: str):
    try:
        # Buscamos en la tabla de Supabase el evento que coincida con el ID
        response = supabase.table("eventos").select("*").eq("id_evento", evento_id).execute()
        
        # Si la lista viene vacía, el evento no existe
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Evento no encontrado en LebriJaleo")
            
        evento = response.data[0]
        
        # Obtenemos también el campo creado_por del empresario propietario
        try:
            user_response = supabase.table("usuarios").select("nombre, username, creado_por, avatar_url").eq("id_usuario", evento["id_empresario"]).execute()
            if user_response.data and len(user_response.data) > 0:
                usuario_evento = user_response.data[0]
                evento["organizador_nombre"] = usuario_evento.get("nombre")
                evento["organizador_username"] = usuario_evento.get("username")
                evento["organizador_avatar"] = usuario_evento.get("avatar_url")
                evento["empresario_creado_por"] = usuario_evento.get("creado_por")

                creador_id = usuario_evento.get("creado_por")
                if creador_id:
                    creador_response = supabase.table("usuarios").select("nombre, username").eq("id_usuario", creador_id).execute()
                    if creador_response.data and len(creador_response.data) > 0:
                        evento["creador_nombre"] = creador_response.data[0].get("nombre")
                        evento["creador_username"] = creador_response.data[0].get("username")
                    else:
                        evento["creador_nombre"] = None
                        evento["creador_username"] = None
            else:
                evento["organizador_nombre"] = None
                evento["organizador_username"] = None
                evento["empresario_creado_por"] = None
        except Exception:
            evento["organizador_nombre"] = None
            evento["organizador_username"] = None
            evento["empresario_creado_por"] = None
            evento["creador_nombre"] = None
            evento["creador_username"] = None
            
        # Devolvemos el primer (y único) evento encontrado
        return evento

    except Exception as e:
        print(f"Error al obtener el evento {evento_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/eventos/{evento_id}")
async def actualizar_evento(
    evento_id: str,
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    date: str = Form(...),
    location: str = Form(...),
    price: str = Form("0"),
    capacity: str = Form(""),
    ticketLink: str = Form(""),
    isFree: str = Form("false"),
    banner: UploadFile = File(None),
    authorization: str = Header(None)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado. Inicia sesión primero.")
    
    token = authorization.split(" ")[1]

    try:
        user_response = supabase.auth.get_user(token)
        usuario_id = user_response.user.id

        # 1. Obtener el evento para verificar permisos
        ev_response = supabase.table("eventos").select("id_empresario").eq("id_evento", evento_id).execute()
        if not ev_response.data or len(ev_response.data) == 0:
            raise HTTPException(status_code=404, detail="Evento no encontrado")
            
        id_empresario = ev_response.data[0]["id_empresario"]
        
        # 2. Obtener el admin que creó la cuenta del empresario
        creado_por = None
        try:
            usr_response = supabase.table("usuarios").select("creado_por").eq("id_usuario", id_empresario).execute()
            if usr_response.data and len(usr_response.data) > 0:
                creado_por = usr_response.data[0].get("creado_por")
        except Exception:
            pass
            
        # 3. Comprobar permisos (es el dueño o es el admin que lo creó)
        if usuario_id != id_empresario and usuario_id != creado_por:
            raise HTTPException(status_code=403, detail="No tienes permisos para editar este evento")

        validar_fecha_evento(date)

        # 4. Preparar la actualización
        # Format the datetime correctly. Sometimes HTML date inputs give YYYY-MM-DDTHH:MM
        if "T" in date:
            fecha_part, hora_part = date.split("T")
            if len(hora_part) == 5: # HH:MM
                hora_part = f"{hora_part}:00"
        else:
            # Fallback if somehow they pass different format
            fecha_part = date
            hora_part = "00:00:00"

        evento_db = {
            "nombre": title,
            "descripcion": description,
            "categoria": category,
            "fecha": fecha_part,
            "hora": hora_part,
            "lugar": location,
            "precio": 0.0 if isFree == "true" else float(price),
            "aforo_max": int(capacity) if capacity else None,
        }

        # 5. Si viene nueva imagen, la subimos
        if banner and banner.filename:
            extension = banner.filename.split(".")[-1]
            nombre_archivo = f"carteles/{uuid.uuid4()}.{extension}"
            
            contenido_archivo = await banner.read()
            
            supabase.storage.from_("eventos").upload(
                path=nombre_archivo,
                file=contenido_archivo,
                file_options={"content-type": banner.content_type}
            )
            
            cartel_url = supabase.storage.from_("eventos").get_public_url(nombre_archivo)
            evento_db["cartel_url"] = cartel_url

        # 6. Guardar cambios
        response = supabase.table("eventos").update(evento_db).eq("id_evento", evento_id).execute()

        return {"mensaje": "Evento actualizado con éxito", "data": response.data}

    except Exception as e:
        print(f"Error al actualizar evento {evento_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/eventos/{evento_id}")
def eliminar_evento(evento_id: str, current_user = Depends(get_current_user)):
    try:
        evento_response = supabase.table("eventos").select("id_empresario").eq("id_evento", evento_id).execute()
        if not evento_response.data or len(evento_response.data) == 0:
            raise HTTPException(status_code=404, detail="Evento no encontrado")

        id_empresario = evento_response.data[0].get("id_empresario")
        creado_por = None

        try:
            usr_response = supabase.table("usuarios").select("creado_por").eq("id_usuario", id_empresario).execute()
            if usr_response.data and len(usr_response.data) > 0:
                creado_por = usr_response.data[0].get("creado_por")
        except Exception:
            pass

        if current_user.id != id_empresario and current_user.id != creado_por:
            raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este evento")

        supabase.table("favoritos").delete().eq("id_evento", evento_id).execute()
        supabase.table("eventos").delete().eq("id_evento", evento_id).execute()

        return {"mensaje": "Evento eliminado con éxito"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al eliminar el evento: {str(e)}")

@app.get("/api/eventos/{evento_id}/favoritos")
async def obtener_favoritos(evento_id: str, authorization: str = Header(None)):
    try:
        # Get count
        response_count = supabase.table("favoritos").select("*", count="exact").eq("id_evento", evento_id).execute()
        count = response_count.count if response_count.count is not None else 0

        is_favorite = False
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            try:
                user_response = supabase.auth.get_user(token)
                user_id = user_response.user.id
                
                fav_response = supabase.table("favoritos").select("*").eq("id_evento", evento_id).eq("id_usuario", user_id).execute()
                is_favorite = len(fav_response.data) > 0
            except Exception:
                pass # Invalid token or no favorite, ignore

        return {"count": count, "is_favorite": is_favorite}
    except Exception as e:
        print(f"Error al obtener favoritos: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/eventos/{evento_id}/favoritos")
async def toggle_favorito(evento_id: str, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado. Inicia sesión primero.")
    
    token = authorization.split(" ")[1]
    try:
        user_response = supabase.auth.get_user(token)
        user_id = user_response.user.id
        
        # Check if already favorite
        fav_response = supabase.table("favoritos").select("*").eq("id_evento", evento_id).eq("id_usuario", user_id).execute()
        is_favorite = len(fav_response.data) > 0
        
        if is_favorite:
            # Remove favorite
            supabase.table("favoritos").delete().eq("id_evento", evento_id).eq("id_usuario", user_id).execute()
            nuevo_estado = False
        else:
            # Add favorite
            supabase.table("favoritos").insert({
                "id_usuario": user_id,
                "id_evento": evento_id
            }).execute()
            nuevo_estado = True
            
        # Get new count
        response_count = supabase.table("favoritos").select("*", count="exact").eq("id_evento", evento_id).execute()
        count = response_count.count if response_count.count is not None else 0
        
        return {"count": count, "is_favorite": nuevo_estado}

    except Exception as e:
        print(f"Error al alternar favorito: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/empresarios")
def obtener_empresarios(current_user = Depends(get_current_user)):
    """Obtiene los empresarios creados por el administrador autenticado"""
    try:
        # 1. Verificar que el usuario es Administrador
        admin_check = supabase.table("usuarios").select("rol").eq("id_usuario", current_user.id).single().execute()
        if not admin_check.data or admin_check.data.get("rol") != "Administrador":
            raise HTTPException(status_code=403, detail="Acceso restringido a administradores")

        # 2. Obtener solo los empresarios que este admin ha creado
        response = supabase.table("usuarios").select(
            "id_usuario, nombre, email, avatar_url, banner_url, username, biografia, ubicacion"
        ).eq("rol", "Empresario").eq("creado_por", current_user.id).order("nombre").execute()

        empresarios = []
        for emp in response.data:
            # Contar eventos publicados por cada empresario
            try:
                ev_response = supabase.table("eventos").select(
                    "id_evento", count="exact"
                ).eq("id_empresario", emp["id_usuario"]).execute()
                num_eventos = ev_response.count if ev_response.count is not None else 0
            except Exception:
                num_eventos = 0

            empresarios.append({
                **emp,
                "num_eventos": num_eventos
            })

        return {"mensaje": "Empresarios recuperados con éxito", "data": empresarios}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al obtener los empresarios: {str(e)}")

@app.delete("/api/empresarios/{user_id}")
def eliminar_empresario(user_id: str, current_user = Depends(get_current_user)):
    """Revoca el rol de un empresario (pasa a Cliente). Solo el admin que lo creó puede hacerlo."""
    try:
        # 1. Verificar que es Administrador
        admin_check = supabase.table("usuarios").select("rol").eq("id_usuario", current_user.id).single().execute()
        if not admin_check.data or admin_check.data.get("rol") != "Administrador":
            raise HTTPException(status_code=403, detail="Solo los administradores pueden realizar esta acción")

        # 2. Verificar que el empresario fue creado por este admin
        emp_check = supabase.table("usuarios").select("creado_por").eq("id_usuario", user_id).single().execute()
        if not emp_check.data or emp_check.data.get("creado_por") != current_user.id:
            raise HTTPException(status_code=403, detail="Solo puedes gestionar los empresarios que tú creaste")

        # 3. Cancelar todos sus eventos activos
        supabase.table("eventos").update({"estado": "Cancelado"}).eq("id_empresario", user_id).eq("estado", "Activo").execute()

        # 4. Degradar rol a Cliente
        response = supabase.table("usuarios").update({"rol": "Cliente", "creado_por": None}).eq("id_usuario", user_id).execute()
        return {"mensaje": "Rol revocado con éxito. Sus eventos han sido cancelados.", "data": response.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al revocar el rol: {str(e)}")

# --- ENDPOINTS DE ADMINISTRACIÓN DE ROLES ---

@app.put("/api/admin/asignar-rol/{user_id}")
def asignar_rol_empresario(user_id: str, current_user = Depends(get_current_user)):
    """Permite a un Administrador asignar el rol 'Empresario' a un usuario Cliente"""
    try:
        # 1. Verificar que el usuario autenticado es Administrador
        admin_check = supabase.table("usuarios").select("rol").eq("id_usuario", current_user.id).single().execute()
        if not admin_check.data or admin_check.data.get("rol") != "Administrador":
            raise HTTPException(status_code=403, detail="Solo los administradores pueden asignar roles")

        # 2. Verificar que el usuario objetivo existe y es Cliente
        target_check = supabase.table("usuarios").select("rol, nombre").eq("id_usuario", user_id).single().execute()
        if not target_check.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        if target_check.data.get("rol") != "Cliente":
            raise HTTPException(status_code=400, detail=f"Este usuario ya tiene el rol '{target_check.data.get('rol')}'")

        # 3. Asignar rol Empresario y registrar quién lo creó
        response = supabase.table("usuarios").update({
            "rol": "Empresario",
            "creado_por": current_user.id
        }).eq("id_usuario", user_id).execute()

        return {
            "mensaje": f"{target_check.data.get('nombre')} ahora es Empresario",
            "data": response.data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al asignar rol: {str(e)}")

# --- ENDPOINT DE ESTADÍSTICAS DE ORGANIZADOR ---

@app.get("/api/estadisticas-organizador/{user_id}")
def obtener_estadisticas_organizador(user_id: str, current_user = Depends(get_current_user)):
    """Obtiene estadísticas de un organizador: likes totales, seguidores, evento top.
    Solo accesible por el propio organizador o un Administrador que lo creó."""
    try:
        # 1. Verificar que el usuario objetivo es Empresario
        target = supabase.table("usuarios").select(
            "id_usuario, nombre, username, rol, creado_por"
        ).eq("id_usuario", user_id).single().execute()

        if not target.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        if target.data.get("rol") != "Empresario":
            raise HTTPException(status_code=400, detail="Este usuario no es un organizador")

        # 2. Verificar permisos: solo el propio organizador o su admin creador
        es_propio = str(current_user.id) == user_id
        es_admin_creador = False

        if not es_propio:
            admin_check = supabase.table("usuarios").select("rol").eq("id_usuario", current_user.id).single().execute()
            if admin_check.data and admin_check.data.get("rol") == "Administrador":
                if target.data.get("creado_por") == str(current_user.id):
                    es_admin_creador = True

        if not es_propio and not es_admin_creador:
            raise HTTPException(status_code=403, detail="No tienes permisos para ver estas estadísticas")

        # 3. Obtener eventos con likes
        ev_response = supabase.table("eventos").select(
            "id_evento, nombre, favoritos(count)"
        ).eq("id_empresario", user_id).execute()

        eventos_con_likes = []
        likes_totales = 0
        for e in ev_response.data:
            count = 0
            if "favoritos" in e and e["favoritos"]:
                fav_data = e["favoritos"]
                if isinstance(fav_data, list) and len(fav_data) > 0:
                    count = fav_data[0].get("count", 0)
                elif isinstance(fav_data, dict):
                    count = fav_data.get("count", 0)
            likes_totales += count
            eventos_con_likes.append({"nombre": e["nombre"], "likes": count})

        # 4. Evento con más likes
        evento_top = None
        if eventos_con_likes:
            evento_top = max(eventos_con_likes, key=lambda x: x["likes"])

        # 5. Seguidores totales
        count_response = supabase.table("amigos").select("*", count="exact").eq("id_amigo", user_id).execute()
        seguidores = count_response.count if count_response.count is not None else 0

        return {
            "nombre": target.data.get("nombre"),
            "username": target.data.get("username"),
            "num_eventos": len(ev_response.data),
            "likes_totales": likes_totales,
            "seguidores_totales": seguidores,
            "evento_top": evento_top,
            "eventos": eventos_con_likes
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al obtener estadísticas: {str(e)}")

# --- ENDPOINTS DE AMIGOS ---

@app.post("/api/amigos/{user_id}")
def toggle_amigo(user_id: str, current_user = Depends(get_current_user)):
    """Añade o elimina a un usuario como amigo (toggle)"""
    try:
        # No puedes añadirte a ti mismo
        if str(current_user.id) == user_id:
            raise HTTPException(status_code=400, detail="No puedes añadirte a ti mismo como amigo")

        # Comprobar si ya es amigo
        existing = supabase.table("amigos").select("id").eq("id_usuario", current_user.id).eq("id_amigo", user_id).execute()

        if existing.data and len(existing.data) > 0:
            # Eliminar amistad
            supabase.table("amigos").delete().eq("id_usuario", current_user.id).eq("id_amigo", user_id).execute()
            es_amigo = False
        else:
            # Añadir amistad
            supabase.table("amigos").insert({
                "id_usuario": str(current_user.id),
                "id_amigo": user_id
            }).execute()
            es_amigo = True

        # Obtener nuevo conteo de amigos del usuario objetivo (cuánta gente lo sigue)
        count_response = supabase.table("amigos").select("*", count="exact").eq("id_amigo", user_id).execute()
        conteo = count_response.count if count_response.count is not None else 0

        return {"es_amigo": es_amigo, "conteo_amigos": conteo}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al gestionar amistad: {str(e)}")

@app.get("/api/amigos/{user_id}/estado")
def obtener_estado_amigo(user_id: str, authorization: str = Header(None)):
    """Consulta si el usuario autenticado sigue a otro y el conteo de amigos"""
    try:
        es_amigo = False

        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            try:
                user_response = supabase.auth.get_user(token)
                current_id = user_response.user.id

                existing = supabase.table("amigos").select("id").eq("id_usuario", current_id).eq("id_amigo", user_id).execute()
                es_amigo = len(existing.data) > 0 if existing.data else False
            except Exception:
                pass

        # Conteo de seguidores (cuánta gente sigue a este user)
        count_response = supabase.table("amigos").select("*", count="exact").eq("id_amigo", user_id).execute()
        conteo = count_response.count if count_response.count is not None else 0

        return {"es_amigo": es_amigo, "conteo_amigos": conteo}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al obtener estado de amistad: {str(e)}")



@app.get("/api/mis-amigos")
def obtener_mis_amigos(current_user = Depends(get_current_user)):
    """Obtiene la lista de amigos (usuarios que sigo) del usuario autenticado"""
    try:
        # 1. Obtener los IDs de amigos
        amigos_response = supabase.table("amigos").select("id_amigo, created_at").eq("id_usuario", current_user.id).order("created_at", desc=True).execute()

        if not amigos_response.data:
            return {"mensaje": "No tienes amigos aún", "data": []}

        amigo_ids = [a["id_amigo"] for a in amigos_response.data]

        # 2. Obtener los perfiles de esos usuarios
        perfiles_response = supabase.table("usuarios").select(
            "id_usuario, nombre, username, avatar_url, rol, ubicacion"
        ).in_("id_usuario", amigo_ids).execute()

        # 3. Crear mapa de fecha de amistad
        fecha_map = {a["id_amigo"]: a["created_at"] for a in amigos_response.data}

        # 4. Combinar datos
        amigos = []
        for perfil in perfiles_response.data:
            perfil["amigo_desde"] = fecha_map.get(perfil["id_usuario"])
            amigos.append(perfil)

        return {"mensaje": "Amigos recuperados con éxito", "data": amigos}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al obtener amigos: {str(e)}")

@app.get("/api/usuarios/buscar")
def buscar_usuarios(q: str = "", current_user = Depends(get_current_user)):
    """Busca usuarios por nombre o username"""
    try:
        if not q or len(q) < 2:
            return {"data": []}

        # Buscar por nombre o username (ilike = case insensitive)
        response = supabase.table("usuarios").select(
            "id_usuario, nombre, username, avatar_url, rol, ubicacion"
        ).or_(f"nombre.ilike.%{q}%,username.ilike.%{q}%").neq("id_usuario", current_user.id).limit(20).execute()

        # Para cada resultado, comprobar si ya es amigo
        resultados = []
        for user in response.data:
            # Check friendship
            friend_check = supabase.table("amigos").select("id").eq("id_usuario", current_user.id).eq("id_amigo", user["id_usuario"]).execute()
            user["es_amigo"] = len(friend_check.data) > 0 if friend_check.data else False
            resultados.append(user)

        return {"data": resultados}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al buscar usuarios: {str(e)}")