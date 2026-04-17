import Link from "next/link";
import { MdCalendarToday, MdLocationOn, MdFavorite } from "react-icons/md";

export default function EventCard({ evento }) {
  const isFree = evento.precio === 'Gratis' || Number(evento.precio) === 0;

  // OJO: Asegúrate de que tu base de datos devuelve 'id', si se llama de otra forma (ej. 'id_evento'), cámbialo aquí.
  const eventoId = evento.id_evento; 

  return (
    <Link href={`/event/${eventoId}`} className="block h-full">
      <article className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full border border-nimbus-cloud/30 cursor-pointer">
        <div className="relative h-48 overflow-hidden">
          {/* Categoría */}
          <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-midnight-blue text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {evento.categoria || 'Evento'}
          </div>
          
          {/* Precio */}
          <div className={`absolute top-3 right-3 z-10 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm ${isFree ? 'bg-green-600' : 'bg-midnight-blue'}`}>
            {isFree ? 'Gratis' : `${evento.precio}€`}
          </div>

          {/* Imagen del Cartel */}
          <img 
            alt={evento.titulo || evento.nombre} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            src={evento.imagen_url || evento.cartel_url || 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=2070'} 
          />
        </div>
        
        <div className="p-5 flex flex-col flex-1">
          {/* Fecha */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
            <MdCalendarToday className="text-base" />
            <span>{evento.fecha_formateada || evento.fecha}</span>
          </div>
          
          {/* Título */}
          <h3 className="text-lg font-bold text-midnight-blue leading-tight mb-2">
            {evento.titulo || evento.nombre}
          </h3>
          
          {/* Lugar */}
          <div className="flex items-start gap-1.5 text-slate-500 text-sm mb-4">
            <MdLocationOn className="text-lg shrink-0 text-nimbus-cloud" />
            <span className="line-clamp-1">{evento.lugar}</span>
          </div>
          
          {/* Footer de la tarjeta (Likes) */}
          <div className="mt-auto pt-4 border-t border-nimbus-cloud/20 flex items-center justify-end">
            {/* NOTA DE ARQUITECTO: Como todo el <article> es ahora un enlace, si en el futuro quieres que el botón de like haga algo sin cambiar de página, tendrás que añadirle un onClick={(e) => e.preventDefault()} a este div */}
            <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-red-500 transition-colors bg-cloud-dancer px-3 py-1.5 rounded-lg group-hover:bg-red-50">
              <MdFavorite className="text-xl" />
              <span className="font-bold text-sm text-slate-600 group-hover:text-red-600">{evento.likes || '0'}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}