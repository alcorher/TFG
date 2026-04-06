'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Navbar';
import EventCard from '@/components/events/EventCard';
import { 
  MdSearch, MdFilterList, MdSpaceDashboard, MdGridView, MdViewList, 
  MdClose, MdStorefront, MdArrowForward, MdMenu
} from "react-icons/md";

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState(['Música', 'Esta semana']);

  const removeFilter = (filterToRemove) => {
    setActiveFilters(activeFilters.filter(f => f !== filterToRemove));
  };

  // Datos MOCK para visualizar el diseño hasta que conectemos la API
  const [eventosMock, setEventosMock] = useState([
    {
      id_evento: 1,
      titulo: 'Zambomba Lebrijana',
      categoria: 'Cultura',
      precio: '10',
      fecha_formateada: 'Vie, 14 Dic • 20:30',
      lugar: 'Plaza de España, Lebrija',
      likes: '1.2k',
      imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADcQvECMShOQ8LCUz474zuRUGtHixPZkvAMBZYLKZSZC6LtAgTfS3GLI67e3HhKtuFSZEcUOUHvSh6aLFRBGY5rtwxIlA87FMK7ckSTBTooJLdH0NQGC34x9Qd3nm1nUtdsjhX46HUOJIeOESUivsGN0aow8GIh-ObLDg8d3wa5prEX-vudwZsx24GxC3U7z-WO03RXrKJsr1SDAuZiU-Ent47Q7qtFOsIneFsEiT2FmZZFYwF5Cc14mJ80v19M8cwkU_xMsaMFg9d'
    },
    {
      id_evento: 2,
      titulo: 'Concierto Rock Local',
      categoria: 'Música',
      precio: 'Gratis',
      fecha_formateada: 'Sáb, 15 Dic • 22:00',
      lugar: 'Sala Ajedrez, Lebrija',
      likes: '342',
      imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPdOMJdIT0-sNPEigFmNr2EJ6NOrRx5LSKNZ12kxtK6f5XyQjo-FZlM8bZQve68hH3-QU_5lRr4s6H-3sK1Pb1EFS9gnXMFi3LroVfWubgcRVAoNPcp555kwB6DjMPH-P4Cxd9aOe4E8CGRXBXbCNzZ4O3FxOxY5jz-D2rtYukpUEeGNC9PQ761iBoE0mi8L-aZyJJLwUL8NtnDktDhE2t5ABgFmaqtEE8UwePJh3OkOzyaUHua_d0K154mYqYIRis7YDa08zKig4p'
    },
    {
      id_evento: 3,
      titulo: 'Ruta de la Tapa',
      categoria: 'Gastronomía',
      precio: 'Variable',
      fecha_formateada: 'Dom, 16 Dic • 13:00',
      lugar: 'Centro Histórico, Lebrija',
      likes: '856',
      imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEfP316HzM0zzMzm4oBu_aZWVk_5lVId6y6N95JhluBLrVrshEKtsPAHJGGwhqWqNcUqTdudieyJ-z6ls3s9UjI1MEgiXok4fpIczV_GWiBvCInwkuiqTzCZ3qQaP47u81Sn0FiGSb5KrUFTVsDhxh6DuyXKGzSdt-1ArEJ5yqL7Yio8aqKxHU7CsN_6pNrkhn7kdLCwRo-bA6gU42cEw8oD5WLXST-AW-pGsu4cJKXsrli_4nFst7V9NroLX_PHTbFouctNzbiOeq'
    },
    {
      id_evento: 4,
      titulo: 'Obra: La Casa de Bernarda',
      categoria: 'Teatro',
      precio: '15',
      fecha_formateada: 'Jue, 20 Dic • 19:00',
      lugar: 'Teatro Municipal Juan Bernabé',
      likes: '124',
      imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG0CM8vd-OaQ3Ul3k9XqtZpPdGJzqNspt2mYF92jrOq6KRGw7wvngUcsBvU2tNhAkOqBhIBMSItYR-WB_KbpRERiRdcH3sM72eE55y-Ntv2XlRHpArDNUk9C5qfBxNrEXDEsNwNGTOGvdSnZKj5JBOXpwKzrevGEjDPhJRf-WonpTt6jL0VqSEtRt0YE_oFIdhpMYMTvHAOAT0xnk7QZ4GZnU_UZKAaZB7Ibp-bTDZTQAlHtjFDw3-RJFJoFOlnyJAQdyHmRTc_j2X'
    },
    {
      id_evento: 5,
      titulo: 'Torneo de Navidad',
      categoria: 'Deporte',
      precio: 'Gratis',
      fecha_formateada: 'Sab, 22 Dic • 11:00',
      lugar: 'Polideportivo Municipal',
      likes: '593',
      imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7JPPUwco9QXD2BSlvAtaKxJoAGHJfu949TDUjtUk6h8ezR3JpeYlcSxv5EDtZehRKEUdEvKwFgXpgaIA10bxESTLmi95-1pawRGoIA-k3sa55iWHyHnHe6dgxffHL1D352F8ZgnYpz-kz5SdilVhPBfmYU3Ds7Gei-yLrCQb0PBHPd9ngiLJj0Ui-wOA71TvonOiskqtYBiBPeYf0AFn385l1UmKwtGPkE6OR38M9DP2vlovPDcyLScbEeWTzxANhYlzT7cVHrrFY'
    },
    {
      id_evento: 6,
      titulo: 'Exposición: Barro y Luz',
      categoria: 'Arte',
      precio: '5',
      fecha_formateada: 'Dom, 23 Dic • 10:00',
      lugar: 'Casa de la Cultura',
      likes: '98',
      imagen_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuuNkWzYWJPhxmsJbyMzhAbZiDechZoMbfiS2IhJvg4xxurP3swOtw90g4gB-mJOFOrPIU7HH0r-bqcsiuJD4OnB0LVl_5AjGtevTgi8yT0UL3ILmsY25gqLwvByhJpxJgvq3c6wwekDf618v1PuBxpTQs4-dUs-MUkj7Fm0GK8AImQrarmUtdRgCe6Zg8CtlG1_m1KrSVCYJbI6cYKOYRkhxLGLHHdcVV78oAVpkGFgHTrFd8KcGV_gXzpwtnk49GGFQ4pq-aNyML'
    }
  ]);

  return (
    <div className="bg-background-light text-slate-900 font-display antialiased overflow-hidden h-screen flex">
      
      {/* SIDEBAR IZQUIERDO */}
      <Sidebar />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background-main relative">
        <header className="h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200/60">
          <div className="flex items-center gap-4 flex-1">
            <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-primary/30 rounded-lg transition-colors">
              <MdMenu className="text-2xl" />
            </button>
            <div className="relative max-w-md w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <MdSearch className="text-xl" />
              </span>
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-slate-200/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all placeholder:text-slate-400" 
                placeholder="Buscar eventos, lugares..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-primary/20 transition-colors shadow-sm">
              <MdFilterList className="text-xl" />
              <span>Categorías</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-primary/30 rounded-lg transition-colors lg:hidden">
              <MdSpaceDashboard className="text-2xl" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Cartelera de Eventos</h1>
                <p className="text-slate-600 font-medium">Descubre qué está pasando en Lebrija.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vista:</span>
                <button className="p-1.5 bg-white shadow-sm border border-slate-200 rounded text-slate-800">
                  <MdGridView className="text-xl" />
                </button>
                <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded transition-colors">
                  <MdViewList className="text-xl" />
                </button>
              </div>
            </div>

            {/* RENDERIZADO DE EVENTOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
              {eventosMock.map((evento) => (
                <EventCard key={evento.id_evento} evento={evento} />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* SIDEBAR DERECHO */}
      <aside className="w-80 bg-white border-l border-slate-100 p-6 flex flex-col gap-6 h-full shadow-[-2px_0_20px_rgba(0,0,0,0.02)] overflow-y-auto hidden xl:flex shrink-0">
        
        <div className="flex flex-col gap-4">
          <h3 className="text-slate-900 font-bold text-lg">Filtrar por fecha</h3>
          
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 shadow-sm min-h-[250px] flex items-center justify-center text-slate-400 text-sm border-dashed">
             [Componente de Calendario Shadcn aquí]
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-900 font-bold text-base">Filtros activos</h3>
            <button className="text-xs text-slate-500 font-semibold hover:underline" onClick={() => setActiveFilters([])}>
              Limpiar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.length === 0 && <span className="text-sm text-slate-400">Sin filtros activos</span>}
            {activeFilters.map(filter => (
              <div key={filter} className="flex items-center gap-1.5 pl-2 pr-1 py-1 bg-primary/40 border border-primary/20 text-slate-900 rounded-lg text-xs font-bold">
                <span>{filter}</span>
                <button onClick={() => removeFilter(filter)} className="hover:bg-primary/50 rounded p-0.5">
                  <MdClose className="text-sm" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto bg-[#D5D5D8] rounded-2xl p-6 relative overflow-hidden text-slate-900 shadow-xl shadow-slate-900/5">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/40 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-900 mb-1 shadow-sm">
              <MdStorefront className="text-xl" />
            </div>
            <div>
              <h4 className="font-bold text-lg leading-tight mb-1 text-slate-900">¿Eres empresario?</h4>
              <p className="text-slate-600 text-sm leading-snug">Publica tus eventos y llega a toda Lebrija en minutos.</p>
            </div>
            <button className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 group shadow-lg shadow-slate-900/10">
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