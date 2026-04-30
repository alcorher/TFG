/**
 * Configuración centralizada de la API.
 */

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

/** Tipo base de un evento tal y como lo devuelve /api/eventos */
export interface Evento {
  id_evento: number;
  titulo?: string;
  nombre?: string;
  descripcion?: string;
  fecha: string;
  fecha_formateada?: string;
  hora?: string;
  lugar?: string;
  categoria?: string;
  precio?: string | number;
  imagen_url?: string;
  cartel_url?: string;
  likes?: number;
  creador_nombre?: string;
}
