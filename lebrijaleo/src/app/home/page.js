'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Navbar';
import EventCard from '@/components/events/EventCard';
import { DateRangePicker } from '@/components/events/DateRangePicker';
import { isWithinInterval, parseISO } from 'date-fns';
import { 
  MdSearch, MdFilterList, MdSpaceDashboard, MdGridView, MdViewList, 
  MdClose, MdStorefront, MdArrowForward, MdMenu
} from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function HomePage() {
  const [eventos, setEventos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  
  // Estado para el rango de fechas seleccionado en el calendario
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  useEffect(() => {
    async function fetchEventos() {
      try {
        const response = await fetch(`${API_URL}/api/eventos`);
        if (response.ok) {
          const result = await response.json();
          setEventos(result.data);
        } else {
          console.error("Error al obtener eventos");
        }
      } catch (error) {
        console.error("Error de conexión con la API:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEventos();
  }, []);

  const removeFilter = (filterToRemove) => {
    setActiveFilters(activeFilters.filter(f => f !== filterToRemove));
  };

  // Lógica de Filtrado (Texto + Categorías + Fechas)
  const eventosFiltrados = eventos.filter((evento) => {
    // 1. Filtrar por texto en título o lugar
    const coincideTexto = 
      (evento.nombre || evento.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evento.lugar || '').toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Filtrar por categoría
    const filtrosDeCategoria = activeFilters.filter(f => f !== 'Esta semana');
    const coincideCategoria = filtrosDeCategoria.length === 0 || 
      filtrosDeCategoria.includes(evento.categoria);

    // 3. Filtrar por Fecha
    let coincideFecha = true;
    if (dateRange?.from && dateRange?.to && evento.fecha) {
      // Convertimos la fecha del string de la BD a un objeto Date real
      const fechaEvento = parseISO(evento.fecha);
      
      try {
        coincideFecha = isWithinInterval(fechaEvento, {
          start: dateRange.from,
          end: dateRange.to,
        });
      } catch (error) {
        // Por si el usuario está a mitad de seleccionar la fecha final
        coincideFecha = true; 
      }
    }

    return coincideTexto && coincideCategoria && coincideFecha;
  });

  return (
    <div className="bg-cloud-dancer text-midnight-blue font-display antialiased overflow-hidden h-screen flex">
      
      {/* SIDEBAR IZQUIERDO */}
      <Sidebar />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-form-bg relative">
        <header className="h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-nimbus-cloud/30">
          <div className="flex items-center gap-4 flex-1">
            <button className="p-2 text-slate-400 hover:text-midnight-blue hover:bg-lemon-icing/50 rounded-lg transition-colors">
              <MdMenu className="text-2xl" />
            </button>
            <div className="relative max-w-md w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nimbus-cloud pointer-events-none">
                <MdSearch className="text-xl" />
              </span>
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-nimbus-cloud/40 rounded-xl text-sm focus:ring-2 focus:ring-lemon-icing focus:bg-white transition-all placeholder:text-slate-400" 
                placeholder="Buscar eventos, lugares..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-nimbus-cloud/40 text-sm font-semibold text-midnight-blue hover:bg-lemon-icing/30 transition-colors shadow-sm">
              <MdFilterList className="text-xl" />
              <span>Categorías</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-midnight-blue hover:bg-lemon-icing/30 rounded-lg transition-colors lg:hidden">
              <MdSpaceDashboard className="text-2xl" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-midnight-blue tracking-tight mb-1">Cartelera de Eventos</h1>
                <p className="text-slate-600 font-medium">Descubre qué está pasando en Lebrija.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vista:</span>
                <button className="p-1.5 bg-white shadow-sm border border-nimbus-cloud/40 rounded text-midnight-blue">
                  <MdGridView className="text-xl" />
                </button>
                <button className="p-1.5 text-slate-400 hover:text-midnight-blue hover:bg-white/50 rounded transition-colors">
                  <MdViewList className="text-xl" />
                </button>
              </div>
            </div>

            {/* RENDERIZADO DE EVENTOS */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-12 h-12 border-4 border-nimbus-cloud border-t-midnight-blue rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Cargando la cartelera...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {eventosFiltrados.length > 0 ? (
                  eventosFiltrados.map((evento) => (
                    <EventCard key={evento.id_evento} evento={evento} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 bg-white/40 rounded-3xl border-2 border-dashed border-nimbus-cloud/30">
                    <p className="text-slate-500">No se han encontrado eventos que coincidan con tu búsqueda.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* SIDEBAR DERECHO */}
      <aside className="w-80 bg-white border-l border-nimbus-cloud/30 p-6 flex flex-col gap-6 h-full shadow-[-2px_0_20px_rgba(0,0,0,0.02)] overflow-y-auto hidden xl:flex shrink-0">
        
        {/* CALENDARIO DE SHADCN */}
        <div className="flex flex-col gap-4">
          <h3 className="text-midnight-blue font-bold text-lg">Filtrar por fecha</h3>
          <div className="bg-form-bg rounded-2xl p-2 border border-nimbus-cloud/40 shadow-sm flex justify-center">
             <DateRangePicker onRangeChange={setDateRange} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-midnight-blue font-bold text-base">Filtros activos</h3>
            <button className="text-xs text-slate-500 font-semibold hover:underline" onClick={() => setActiveFilters([])}>
              Limpiar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.length === 0 && <span className="text-sm text-slate-400">Sin filtros activos</span>}
            {activeFilters.map(filter => (
              <div key={filter} className="flex items-center gap-1.5 pl-2 pr-1 py-1 bg-lemon-icing border border-nimbus-cloud/30 text-midnight-blue rounded-lg text-xs font-bold shadow-sm">
                <span>{filter}</span>
                <button onClick={() => removeFilter(filter)} className="hover:bg-white/50 rounded p-0.5 transition-colors">
                  <MdClose className="text-sm" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto bg-nimbus-cloud/20 rounded-2xl p-6 relative overflow-hidden text-midnight-blue border border-nimbus-cloud/30">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-lemon-icing/40 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-midnight-blue mb-1 shadow-sm">
              <MdStorefront className="text-xl" />
            </div>
            <div>
              <h4 className="font-bold text-lg leading-tight mb-1 text-midnight-blue">¿Eres empresario?</h4>
              <p className="text-slate-600 text-sm leading-snug">Publica tus eventos y llega a toda Lebrija en minutos.</p>
            </div>
            <button className="w-full py-2.5 bg-midnight-blue hover:bg-black text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 group shadow-lg">
              <span>Empezar ahora</span>
              <MdArrowForward className="text-base group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="text-center pb-4">
          <p className="text-xs text-slate-400">© 2026 Lebrijaleo Inc.</p>
        </div>
      </aside>
    </div>
  );
}