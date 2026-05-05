/**
 * Configuración centralizada de la API.
 */

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://lebrijaleo-backend.onrender.com';

/** Tipo base de un evento tal y como lo devuelve /api/eventos */
export interface Evento {
  id_evento?: number | string;
  id?: number | string;
  titulo?: string;
  nombre?: string;
  descripcion?: string;
  fecha?: string;
  fecha_formateada?: string;
  hora?: string;
  lugar?: string;
  categoria?: string;
  precio?: string | number | null;
  imagen_url?: string;
  cartel_url?: string;
  likes?: number;
  creador_nombre?: string;
}

export interface EventDetail extends Evento {
  precio?: string | number | null;
  aforo_max?: number | null;
  estado?: string;
  organizador_avatar?: string | null;
  organizador_nombre?: string | null;
  organizador_username?: string | null;
  id_empresario?: string | null;
  empresario_creado_por?: string | null;
  ticketLink?: string | null;
}

export interface FavoriteResponse {
  count: number;
  is_favorite: boolean;
}

export interface EventFormValues {
  title: string;
  category: string;
  date: string;
  time: string;
  description: string;
  location: string;
  price: string;
  capacity: string;
  ticketLink: string;
  isFree: boolean;
}
