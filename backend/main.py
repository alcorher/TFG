import os
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

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
        response = supabase.table("usuarios").select("nombre, username, biografia, ubicacion").eq("id_usuario", current_user.id).single().execute()
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
            "ubicacion": perfil.ubicacion
        }).eq("id_usuario", current_user.id).execute()
        
        return {"mensaje": "Perfil actualizado con éxito", "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al actualizar el perfil: {str(e)}")