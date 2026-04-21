import os
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import date, time
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

# Configurar CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
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

@app.get("/api/perfil/{user_id}")
def obtener_perfil_publico(user_id: str):
    """Obtiene el perfil público de cualquier usuario por su ID"""
    try:
        response = supabase.table("usuarios").select(
            "id_usuario, nombre, username, biografia, ubicacion, avatar_url, banner_url, rol"
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
            user_response = supabase.table("usuarios").select("creado_por").eq("id_usuario", evento["id_empresario"]).execute()
            if user_response.data and len(user_response.data) > 0:
                evento["empresario_creado_por"] = user_response.data[0].get("creado_por")
            else:
                evento["empresario_creado_por"] = None
        except Exception:
            evento["empresario_creado_por"] = None
            
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
