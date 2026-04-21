'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Navbar';
import EventCard from '@/components/events/EventCard';
import { createClient } from '@/utils/supabase/client';
import { 
  MdArrowBack, MdGroup, 
  MdBookmark, MdGridView, MdViewList, 
  MdEventNote, MdInfoOutline, MdLocationOn
} from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function PublicProfilePage() {
  const router = useRouter();
  const { id } = useParams();
  const supabase = createClient();
  
  const [profileData, setProfileData] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    async function loadPublicProfile() {
      try {
        // Check if this is the current user's own profile
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user.id === id) {
          router.replace('/profile');
          return;
        }

        // Fetch the public profile
        const res = await fetch(`${API_URL}/api/perfil/${id}`);
        
        if (!res.ok) {
          throw new Error("Perfil no encontrado");
        }

        const data = await res.json();
        setProfileData(data.perfil);
        setEventos(data.eventos || []);
        setFavoritos(data.favoritos || []);

      } catch (err) {
        console.error("Error cargando perfil público:", err);
        setError("No hemos podido encontrar este perfil.");
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadPublicProfile();
    }
  }, [id, router, supabase]);

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="bg-cloud-dancer h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-lemon-icing border-t-midnight-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- Error / Not found ---
  if (error || !profileData) {
    return (
      <div className="bg-cloud-dancer h-screen flex flex-col items-center justify-center text-midnight-blue">
        <MdInfoOutline className="text-6xl mb-4 text-midnight-blue/40" />
        <h2 className="text-2xl font-bold mb-2">Perfil no encontrado</h2>
        <p className="text-midnight-blue/60 mb-6">{error || "Este usuario no existe."}</p>
        <button
          onClick={() => router.push('/home')}
          className="bg-lemon-icing px-6 py-3 rounded-xl font-bold hover:brightness-95 transition-all"
        >
          Volver a la cartelera
        </button>
      </div>
    );
  }

  const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(profileData.nombre || 'U') + "&background=F6EBC8&color=1e293b";
  const defaultBanner = "https://images.unsplash.com/photo-1518605368461-1ee46062f6b8?q=80&w=2093";
  const isOrganizer = profileData.rol === 'Empresario';

  return (
    <div className="bg-cloud-dancer text-midnight-blue font-display antialiased overflow-hidden h-screen flex">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-form-bg relative">
        <header className="h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-nimbus-cloud/40">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => router.back()}
              className="p-2 text-midnight-blue/50 hover:text-midnight-blue hover:bg-lemon-icing/40 rounded-lg transition-colors"
            >
              <MdArrowBack className="text-xl" />
            </button>
            <h2 className="text-lg font-bold text-midnight-blue">
              {isOrganizer ? 'Perfil de Organizador' : 'Perfil de Usuario'}
            </h2>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Cabecera del Perfil */}
          <div className="relative w-full h-80">
            <div className="absolute inset-0 bg-midnight-blue">
              <img 
                alt={`Portada de ${profileData.nombre}`}
                className="w-full h-full object-cover opacity-80" 
                src={profileData.banner_url || defaultBanner}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-full px-8 pb-8 pt-20">
              <div className="flex items-end gap-6 max-w-7xl mx-auto">
                <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden shrink-0 bg-white">
                  <img 
                    alt={`Avatar de ${profileData.nombre}`} 
                    className="w-full h-full object-cover" 
                    src={profileData.avatar_url || defaultAvatar}
                  />
                </div>
                <div className="pb-2 text-white drop-shadow-md">
                  <h1 className="text-3xl font-bold tracking-tight mb-1">{profileData.nombre}</h1>
                  {profileData.username && (
                    <p className="text-white/70 text-sm font-medium mb-1">@{profileData.username}</p>
                  )}
                  {isOrganizer && (
                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/10 mb-2">
                      Organizador
                    </span>
                  )}
                  <p className="text-white/90 max-w-2xl text-lg font-medium leading-relaxed">
                    {profileData.biografia}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-8 py-8">
            {/* Tarjetas de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {isOrganizer ? (
                <div className="bg-white rounded-2xl p-5 border border-nimbus-cloud/30 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <MdEventNote className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-sm text-midnight-blue/60 font-medium">Eventos publicados</p>
                    <p className="text-2xl font-bold text-midnight-blue">{eventos.length}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-5 border border-nimbus-cloud/30 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                    <MdBookmark className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-sm text-midnight-blue/60 font-medium">Eventos favoritos</p>
                    <p className="text-2xl font-bold text-midnight-blue">{favoritos.length}</p>
                  </div>
                </div>
              )}
              {profileData.ubicacion && (
                <div className="bg-white rounded-2xl p-5 border border-nimbus-cloud/30 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <MdLocationOn className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-sm text-midnight-blue/60 font-medium">Ubicación</p>
                    <p className="text-2xl font-bold text-midnight-blue">{profileData.ubicacion}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Eventos del organizador */}
            {isOrganizer && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-midnight-blue">Eventos de {profileData.nombre}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-midnight-blue/40 uppercase tracking-wider hidden sm:block">Vista:</span>
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm border border-nimbus-cloud/50 text-midnight-blue' : 'text-midnight-blue/40 hover:text-midnight-blue/70 hover:bg-white/50'}`}
                    >
                      <MdGridView className="text-xl" />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm border border-nimbus-cloud/50 text-midnight-blue' : 'text-midnight-blue/40 hover:text-midnight-blue/70 hover:bg-white/50'}`}
                    >
                      <MdViewList className="text-xl" />
                    </button>
                  </div>
                </div>

                {eventos.length === 0 ? (
                  <div className="text-center py-20 bg-white/40 rounded-3xl border-2 border-dashed border-nimbus-cloud/30">
                    <MdEventNote className="text-5xl text-midnight-blue/20 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Este organizador aún no ha publicado eventos.</p>
                  </div>
                ) : (
                  <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                    {eventos.map(evento => (
                      <EventCard key={evento.id_evento || evento.id} evento={evento} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favoritos del usuario */}
            {!isOrganizer && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-midnight-blue">Favoritos de {profileData.nombre}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-midnight-blue/40 uppercase tracking-wider hidden sm:block">Vista:</span>
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm border border-nimbus-cloud/50 text-midnight-blue' : 'text-midnight-blue/40 hover:text-midnight-blue/70 hover:bg-white/50'}`}
                    >
                      <MdGridView className="text-xl" />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm border border-nimbus-cloud/50 text-midnight-blue' : 'text-midnight-blue/40 hover:text-midnight-blue/70 hover:bg-white/50'}`}
                    >
                      <MdViewList className="text-xl" />
                    </button>
                  </div>
                </div>

                {favoritos.length === 0 ? (
                  <div className="text-center py-20 bg-white/40 rounded-3xl border-2 border-dashed border-nimbus-cloud/30">
                    <MdBookmark className="text-5xl text-midnight-blue/20 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">{profileData.nombre} aún no tiene eventos favoritos.</p>
                  </div>
                ) : (
                  <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                    {favoritos.map(evento => (
                      <EventCard key={evento.id_evento || evento.id} evento={evento} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
