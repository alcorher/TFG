import os
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import date, time
from typing import Optional

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
        response = supabase.table("usuarios").select("nombre, username, biografia, ubicacion, avatar_url, banner_url").eq("id_usuario", current_user.id).single().execute()
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
    
# --- ENDPOINTS DE EVENTOS ---

@app.get("/api/eventos")
def obtener_eventos():
    """Obtiene todos los eventos públicos para la cartelera"""
    try:
        # Hacemos un select de todas las columnas que necesita la EventCard
        # Le añadimos un modificador para que los ordene por fecha de más próximo a más lejano
        response = supabase.table("eventos").select(
            "id_evento, nombre, descripcion, lugar, fecha, hora, precio, cartel_url, categoria, aforo_max, estado, id_empresario"
        ).order("fecha").execute()
        
        return {"mensaje": "Eventos recuperados con éxito", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al obtener los eventos: {str(e)}")
    
    
@app.post("/api/eventos")
def crear_evento(evento: EventoCreate, current_user = Depends(get_current_user)):
    """Crea un nuevo evento en la base de datos asociado al usuario autenticado"""
    try:
        # Convertimos el modelo de Pydantic a un diccionario
        evento_data = evento.model_dump() # Si usas Pydantic v1, usa evento.dict()
        
        # FastAPI recibe objetos date/time, pero Supabase necesita strings en formato ISO
        evento_data['fecha'] = evento_data['fecha'].isoformat()
        evento_data['hora'] = evento_data['hora'].isoformat()
        
        # Asignamos la autoría del evento al usuario que hace la petición
        evento_data['id_empresario'] = current_user.id
        
        # Insertamos en la tabla eventos de Supabase
        response = supabase.table("eventos").insert(evento_data).execute()
        
        return {"mensaje": "Evento creado con éxito", "data": response.data}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al crear el evento: {str(e)}")