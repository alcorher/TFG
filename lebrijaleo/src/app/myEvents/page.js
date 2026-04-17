'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Navbar';
import EventCard from '@/components/events/EventCard';
import { createClient } from '@/utils/supabase/client';
import {
  MdMenu, MdSearch, MdSpaceDashboard, MdCalendarMonth,
  MdExpandMore
} from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function MisEventosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [eventos, setEventos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMisEventos() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/api/mis-eventos`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          setEventos(result.data);
        } else {
          console.error("Error al obtener mis eventos");
        }
      } catch (error) {
        console.error("Error de conexión con la API:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMisEventos();
  }, []);

  const eventosFiltrados = eventos.filter(evento =>
    evento.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evento.lugar?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-cloud-dancer text-midnight-blue font-display antialiased overflow-hidden h-screen flex">
      {/* 1. SIDEBAR IMPORTADO (Limpio y modular) */}
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-form-bg relative">
        {/* CABECERA TOP */}
        <header className="h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-nimbus-cloud/40">
          <div className="flex items-center gap-4 flex-1">
            <button className="p-2 text-midnight-blue/50 hover:text-midnight-blue hover:bg-lemon-icing/40 rounded-lg transition-colors xl:hidden">
              <MdMenu className="text-2xl" />
            </button>
            <div className="relative max-w-md w-full hidden sm:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight-blue/40 pointer-events-none">
                <MdSearch className="text-xl" />
              </span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-nimbus-cloud/50 rounded-xl text-sm focus:ring-2 focus:ring-lemon-icing/80 focus:bg-white transition-all placeholder:text-midnight-blue/40"
                placeholder="Buscar en mis eventos..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        
           
            
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-7xl mx-auto">

            {/* Título y Filtros */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-midnight-blue tracking-tight mb-2">Mis Eventos</h1>
                <p className="text-midnight-blue/70 font-medium">Gestiona los {eventos.length} eventos que has publicado en LebriJaleo.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-midnight-blue/50 uppercase tracking-wider hidden sm:inline">Ordenar por:</span>
                <button className="flex items-center gap-2 px-3 py-2 bg-white shadow-sm border border-nimbus-cloud/50 rounded-lg text-midnight-blue text-sm font-medium hover:bg-cloud-dancer transition-colors">
                  <MdCalendarMonth className="text-lg" />
                  <span>Fecha más cercana</span>
                  <MdExpandMore className="text-lg" />
                </button>
              </div>
            </div>

            {/* ZONA CONDICIONAL: Cargando / Vacío / Grid */}
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-10 h-10 border-4 border-lemon-icing border-t-midnight-blue rounded-full animate-spin"></div>
              </div>
            ) : eventosFiltrados.length === 0 ? (
              <div className="text-center py-20 bg-white/40 rounded-3xl border-2 border-dashed border-nimbus-cloud/30">
                <p className="text-slate-500 font-medium">No se encontraron eventos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 xl:grid-cols-3 2xl:grid-cols-4">
                {eventosFiltrados.map((evento) => (
                  <EventCard key={evento.id_evento || evento.id} evento={evento} />
                ))}
              </div>
            )}

          </div> {/* Cierra max-w-7xl */}
        </div> {/* Cierra flex-1 */}
      </main>
    </div>
  );
}