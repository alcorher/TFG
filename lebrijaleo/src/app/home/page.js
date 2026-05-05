'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/layout/Navbar'; // Asegúrate de que esta ruta es la correcta en tu proyecto
import EventCard from '@/components/events/EventCard';
import { DateRangePicker } from '@/components/events/DateRangePicker';
import { isWithinInterval, parseISO, startOfDay, endOfDay, isAfter, isEqual } from 'date-fns';
import { 
  MdSearch, MdFilterList, MdSpaceDashboard, MdGridView, MdViewList, 
  MdClose, MdStorefront, MdArrowForward, MdMenu, MdCheck
} from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lebrijaleo-backend.onrender.com';

// Lista de categorías de LebriJaleo
const CATEGORIAS_DISPONIBLES = [
  'Flamenco', 'Gastronomía', 'Música', 'Cultura', 
  'Teatro', 'Deporte', 'Arte', 'Ocio Nocturno'
];

export default function HomePage() {
  const [eventos, setEventos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtros
  const [activeFilters, setActiveFilters] = useState([]);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  // Control del panel móvil
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Referencia para cerrar el menú de categorías al hacer clic fuera
  const menuRef = useRef(null);

  useEffect(() => {
    async function fetchEventos() {
      try {
        const response = await fetch(`${API_URL}/api/eventos`);
        if (response.ok) {
          const result = await response.json();
          setEventos(result.data);

          // Si no hay un rango de fecha activo, establecer un rango por defecto
          // desde hoy hasta la fecha del noveno evento siguiente (o el último disponible)
          try {
            const eventosData = result.data || [];
            const todayStart = startOfDay(new Date());
            const futureEvents = eventosData
              .filter(e => e.fecha)
              .map(e => ({ ...e, _fechaDate: parseISO(e.fecha) }))
              .filter(e => isAfter(e._fechaDate, todayStart) || isEqual(e._fechaDate, todayStart))
              .sort((a, b) => a._fechaDate - b._fechaDate);

            if ((!dateRange?.from || !dateRange?.to) && futureEvents.length > 0) {
              const idx = Math.min(8, futureEvents.length - 1);
              const toDate = endOfDay(futureEvents[idx]._fechaDate);
              setDateRange({ from: todayStart, to: toDate });
            }
          } catch (err) {
            // Silenciar errores no críticos de cálculo de rango
            console.error('Error calculando rango de fecha por defecto:', err);
          }
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

  // Cierra el menú desplegable si haces clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsCategoryMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Bloquear el scroll del body cuando el panel móvil está abierto
  useEffect(() => {
    if (isMobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileFiltersOpen]);

  const toggleFilter = (categoria) => {
    if (activeFilters.includes(categoria)) {
      setActiveFilters(activeFilters.filter(f => f !== categoria));
    } else {
      setActiveFilters([...activeFilters, categoria]);
    }
  };

  const removeFilter = (filterToRemove) => {
    setActiveFilters(activeFilters.filter(f => f !== filterToRemove));
  };

  const eventosFiltrados = eventos.filter((evento) => {
    const coincideTexto = 
      (evento.nombre || evento.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evento.lugar || '').toLowerCase().includes(searchTerm.toLowerCase());

    const coincideCategoria = activeFilters.length === 0 || 
      activeFilters.includes(evento.categoria);

    let coincideFecha = true;
    const fechaEvento = evento.fecha ? parseISO(evento.fecha) : null;

    if (dateRange?.from && dateRange?.to && fechaEvento) {
      try {
        coincideFecha = isWithinInterval(fechaEvento, {
          start: dateRange.from,
          end: dateRange.to,
        });
      } catch (error) {
        coincideFecha = true;
      }
    } else {
      // Si NO hay filtros de fecha activos, no mostrar eventos pasados
      if (fechaEvento) {
        const todayStart = startOfDay(new Date());
        coincideFecha = isAfter(fechaEvento, todayStart) || isEqual(fechaEvento, todayStart);
      } else {
        coincideFecha = true;
      }
    }

    return coincideTexto && coincideCategoria && coincideFecha;
  });

  // --- VARIABLE JSX: Contenido de los filtros ---
  // SOLUCIÓN DEL ERROR: Al ser una variable y no un componente, no causa un bucle infinito en React.
  const filtersContentJSX = (
    <>
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

      <div className="mt-auto bg-nimbus-cloud rounded-2xl p-6 relative overflow-hidden text-midnight-blue border border-nimbus-cloud/50 hidden lg:flex flex-col gap-4 shrink-0">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/50 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-midnight-blue mb-1 shadow-sm">
            <MdStorefront className="text-xl" />
          </div>
          <div>
            <h4 className="font-bold text-lg leading-tight mb-1 text-midnight-blue">¿Eres organizador?</h4>
            <p className="text-slate-600 text-sm leading-snug">Publica tus eventos y llega a toda Lebrija en minutos.</p>
          </div>
          <a
            href="mailto:acorher2911@g.educaand.es?subject=Solicitud de cuenta de Organizador en LebriJaleo&body=Hola, me gustaría solicitar el rol de organizador para publicar eventos, mi nombre de usuario es [tu_nombre_de_usuario], me dedico a eventos de [tipo de eventos]."
            className="w-full py-2.5 bg-midnight-blue text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 group shadow-lg hover:bg-black"
          >
            <span>Empezar ahora</span>
            <MdArrowForward className="text-base group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </>
  );

  return (
    <div className="bg-cloud-dancer text-midnight-blue font-display antialiased overflow-hidden min-h-screen h-dvh flex items-stretch">
      
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-form-bg relative">
        <header className="h-20 px-4 md:px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-nimbus-cloud/30">
          <div className="flex items-center gap-2 md:gap-4 flex-1">
           
            <div className="relative max-w-md w-full hidden sm:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nimbus-cloud pointer-events-none">
                <MdSearch className="text-xl" />
              </span>
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-nimbus-cloud rounded-xl text-sm focus:ring-2 focus:ring-lemon-icing focus:bg-white transition-all placeholder:text-slate-400" 
                placeholder="Buscar eventos, lugares..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative hidden sm:block" ref={menuRef}>
              <button 
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white border text-sm font-semibold transition-colors shadow-sm ${isCategoryMenuOpen ? 'border-lemon-icing ring-2 ring-lemon-icing/50 text-midnight-blue' : 'border-nimbus-cloud/40 text-midnight-blue hover:bg-lemon-icing/30'}`}
              >
                <MdFilterList className="text-xl" />
                <span>Categorías {activeFilters.length > 0 && `(${activeFilters.length})`}</span>
              </button>

              {isCategoryMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-nimbus-cloud/40 z-50 rounded-2xl shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                    Filtrar por
                  </div>
                  {CATEGORIAS_DISPONIBLES.map(categoria => (
                    <button
                      key={categoria}
                      onClick={() => toggleFilter(categoria)}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-lemon-icing/30 transition-colors flex items-center justify-between group"
                    >
                      <span className="text-midnight-blue">{categoria}</span>
                      {activeFilters.includes(categoria) && (
                        <MdCheck className="text-lg text-nimbus-cloud" />
                      )}
                    </button>
                  ))}
                  {activeFilters.length > 0 && (
                    <div className="mt-1 pt-2 border-t border-slate-50 px-2">
                      <button 
                        onClick={() => {
                          setActiveFilters([]);
                          setIsCategoryMenuOpen(false);
                        }}
                        className="w-full py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BOTÓN PARA ABRIR FILTROS EN MÓVIL */}
            <button 
              onClick={() => setIsMobileFiltersOpen(true)}
              className="p-2 text-slate-400 hover:text-midnight-blue hover:bg-lemon-icing/30 rounded-lg transition-colors xl:hidden relative"
            >
              <MdSpaceDashboard className="text-2xl" />
              {/* Indicador visual si hay filtros activos y el panel está cerrado */}
              {(activeFilters.length > 0 || (dateRange?.from && dateRange?.to)) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        </header>

        {/* Barra de búsqueda visible solo en móvil */}
        <div className="px-4 pt-4 sm:hidden">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nimbus-cloud pointer-events-none">
              <MdSearch className="text-xl" />
            </span>
            <input 
              className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-nimbus-cloud rounded-xl text-sm focus:ring-2 focus:ring-lemon-icing focus:bg-white transition-all placeholder:text-slate-400" 
              placeholder="Buscar eventos..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-midnight-blue tracking-tight mb-1">Cartelera de Eventos</h1>
                <p className="text-slate-600 font-medium text-sm md:text-base">Descubre qué está pasando en Lebrija.</p>
              </div>
              
             
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-12 h-12 border-4 border-nimbus-cloud border-t-midnight-blue rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Cargando la cartelera...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
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

      {/* ASIDE DERECHO (Escritorio) */}
      <aside className="w-80 bg-white border-l border-nimbus-cloud/30 p-6 gap-6 self-stretch h-dvh shadow-[-2px_0_20px_rgba(0,0,0,0.02)] overflow-y-auto hidden xl:flex xl:flex-col shrink-0 z-10">
        {filtersContentJSX}
      </aside>

      {/* OVERLAY PARA MÓVIL: Fondo oscuro cuando el panel está abierto */}
      {isMobileFiltersOpen && (
        <div 
          className="fixed inset-0 bg-midnight-blue/50 backdrop-blur-sm z-50 xl:hidden transition-opacity"
          onClick={() => setIsMobileFiltersOpen(false)}
        />
      )}

      {/* PANEL LATERAL PARA MÓVIL (Drawer) */}
      <div 
        className={`fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-white shadow-2xl z-50 xl:hidden flex flex-col transition-transform duration-300 ease-in-out ${
          isMobileFiltersOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-nimbus-cloud/30">
          <h2 className="text-lg font-bold text-midnight-blue">Filtros y Búsqueda</h2>
          <button 
            onClick={() => setIsMobileFiltersOpen(false)}
            className="p-2 text-slate-400 hover:text-midnight-blue hover:bg-lemon-icing/30 rounded-lg transition-colors"
          >
            <MdClose className="text-xl" />
          </button>
        </div>
        
        {/* Contenido scrolleable dentro del panel móvil */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          
          {/* Categorías en móvil (replicando el dropdown) */}
          <div className="flex flex-col gap-3">
             <h3 className="text-midnight-blue font-bold text-lg">Categorías</h3>
             <div className="grid grid-cols-2 gap-2">
                {CATEGORIAS_DISPONIBLES.map(categoria => {
                  const isActive = activeFilters.includes(categoria);
                  return (
                    <button
                      key={categoria}
                      onClick={() => toggleFilter(categoria)}
                      className={`px-3 py-2 text-sm font-medium rounded-xl border text-center transition-colors ${
                        isActive 
                          ? 'bg-lemon-icing border-lemon-icing text-midnight-blue shadow-sm' 
                          : 'bg-white border-nimbus-cloud/40 text-slate-600 hover:border-nimbus-cloud'
                      }`}
                    >
                      {categoria}
                    </button>
                  );
                })}
             </div>
          </div>

          {/* El mismo contenido de calendario y filtros activos de escritorio */}
          {filtersContentJSX}
        </div>
      </div>

    </div>
  );
}