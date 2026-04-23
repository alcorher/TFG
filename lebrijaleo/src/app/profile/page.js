
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Navbar';
import EventCard from '@/components/events/EventCard';
import { createClient } from '@/utils/supabase/client';
import { 
  MdArrowBack, MdMenu, MdClose, MdGroup, 
  MdBookmark, MdGridView, MdViewList, MdEdit, 
  MdLogout, MdEventNote, MdDownload
} from "react-icons/md";
import { generateStatsTxt, downloadTxt, fetchOrganizerStats } from '@/utils/statsDownload';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Estados para guardar la info del usuario
  const [userProfile, setUserProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    async function loadProfileAndData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login'); 
          return;
        }

        const token = session.access_token;

        // Fetch del perfil real desde la API
        const profileRes = await fetch(`${API_URL}/api/perfil`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        let profileData = {};
        if (profileRes.ok) {
          profileData = await profileRes.json();
        }

        const profile = {
          id: session.user.id,
          nombre: profileData.nombre || session.user.email?.split('@')[0] || 'Usuario',
          bio: profileData.biografia || '',
          avatar_url: profileData.avatar_url || '',
          banner_url: profileData.banner_url || '',
          username: profileData.username || '',
          ubicacion: profileData.ubicacion || '',
          rol: profileData.rol || 'Cliente',
        };

        setUserProfile(profile);

        // Fetch de los favoritos reales desde la API
        const favRes = await fetch(`${API_URL}/api/mis-favoritos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (favRes.ok) {
          const favData = await favRes.json();
          setFavorites(favData.data || []);
        }

        // Si es organizador/empresario, cargar sus eventos
        if (profile.rol === 'Empresario') {
          const eventsRes = await fetch(`${API_URL}/api/mis-eventos`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (eventsRes.ok) {
            const eventsData = await eventsRes.json();
            setMyEvents(eventsData.data || []);
          }
        }

      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfileAndData();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleDownloadStats = async () => {
    setStatsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const stats = await fetchOrganizerStats(session.user.id, session.access_token, API_URL);
      const txt = generateStatsTxt(stats);
      const safeName = (stats.nombre || 'organizador').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '').replace(/\s+/g, '_');
      downloadTxt(txt, `estadisticas_${safeName}.txt`);
    } catch (err) {
      console.error('Error descargando estadísticas:', err);
      alert('No se pudieron descargar las estadísticas.');
    } finally {
      setStatsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-cloud-dancer h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-lemon-icing border-t-midnight-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si no hay perfil (ej. error en la carga), mostramos un fallback
  if (!userProfile) return null; 

  const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(userProfile.nombre) + "&background=F6EBC8&color=1e293b";
  const defaultBanner = "https://images.unsplash.com/photo-1518605368461-1ee46062f6b8?q=80&w=2093";
  const isOrganizer = userProfile.rol === 'Empresario';

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
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMobilePanel(true)}
              className="p-2 text-midnight-blue/50 hover:text-midnight-blue hover:bg-lemon-icing/40 rounded-lg transition-colors xl:hidden"
            >
              <MdMenu className="text-xl" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Cabecera del Perfil */}
          <div className="relative w-full h-80">
            <div className="absolute inset-0 bg-midnight-blue">
              <img 
                alt="Portada del perfil" 
                className="w-full h-full object-cover opacity-80" 
                src={userProfile.banner_url || defaultBanner}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-full px-8 pb-8 pt-20">
              <div className="flex items-end gap-6 max-w-7xl mx-auto">
                <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden shrink-0 bg-white">
                  <img 
                    alt={`Avatar de ${userProfile.nombre}`} 
                    className="w-full h-full object-cover" 
                    src={userProfile.avatar_url || defaultAvatar}
                  />
                </div>
                <div className="pb-2 text-white drop-shadow-md">
                  <h1 className="text-3xl font-bold tracking-tight mb-1">{userProfile.nombre}</h1>
                  {userProfile.username && (
                    <p className="text-white/70 text-sm font-medium mb-1">@{userProfile.username}</p>
                  )}
                  <p className="text-white/90 max-w-2xl text-lg font-medium leading-relaxed">
                    {userProfile.bio}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-8 py-8">
            {/* Tarjetas de Estadísticas */}
            <div className={`grid grid-cols-1 ${isOrganizer ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 mb-10`}>
              <div className="bg-white rounded-2xl p-5 border border-nimbus-cloud/30 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                  <MdBookmark className="text-2xl" />
                </div>
                <div>
                  <p className="text-sm text-midnight-blue/60 font-medium">Favoritos guardados</p>
                  <p className="text-2xl font-bold text-midnight-blue">{favorites.length}</p>
                </div>
              </div>
              {isOrganizer && (
                <div className="bg-white rounded-2xl p-5 border border-nimbus-cloud/30 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <MdEventNote className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-sm text-midnight-blue/60 font-medium">Eventos creados</p>
                    <p className="text-2xl font-bold text-midnight-blue">{myEvents.length}</p>
                  </div>
                </div>
              )}
              {userProfile.ubicacion && (
                <div className="bg-white rounded-2xl p-5 border border-nimbus-cloud/30 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <MdGroup className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-sm text-midnight-blue/60 font-medium">Ubicación</p>
                    <p className="text-2xl font-bold text-midnight-blue">{userProfile.ubicacion}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sección Mis Eventos (solo organizadores) */}
            {isOrganizer && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-midnight-blue">Mis Eventos</h3>
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

                {myEvents.length === 0 ? (
                  <div className="text-center py-20 bg-white/40 rounded-3xl border-2 border-dashed border-nimbus-cloud/30">
                    <MdEventNote className="text-5xl text-midnight-blue/20 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Aún no has creado ningún evento.</p>
                    <p className="text-slate-400 text-sm mt-1">Crea tu primer evento y compártelo con la comunidad.</p>
                  </div>
                ) : (
                  <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                    {myEvents.map(evento => (
                      <EventCard key={evento.id_evento || evento.id} evento={evento} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sección Mis Favoritos */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-midnight-blue">Mis Favoritos</h3>
              </div>

              {favorites.length === 0 ? (
                <div className="text-center py-20 bg-white/40 rounded-3xl border-2 border-dashed border-nimbus-cloud/30">
                  <MdBookmark className="text-5xl text-midnight-blue/20 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Aún no tienes eventos favoritos.</p>
                  <p className="text-slate-400 text-sm mt-1">Explora la cartelera y guarda los que más te gusten.</p>
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {favorites.map(evento => (
                    <EventCard key={evento.id_evento || evento.id} evento={evento} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ASIDE DERECHO (Acciones) — Desktop */}
      <aside className="w-80 bg-white border-l border-nimbus-cloud/40 p-6 flex flex-col gap-8 h-full shadow-[-2px_0_20px_rgba(0,0,0,0.02)] overflow-y-auto hidden xl:flex shrink-0">
        <div className="bg-white rounded-2xl flex flex-col gap-3">
          <h3 className="text-midnight-blue font-bold text-lg">Acciones</h3>
          <button 
            onClick={() => router.push('/profile/edit')}
            className="w-full py-3 bg-lemon-icing hover:brightness-95 text-midnight-blue font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <MdEdit className="text-xl" />
            <span>Editar Perfil</span>
          </button>
          {isOrganizer && (
            <>
              <button 
                onClick={() => router.push('/createEvent')}
                className="w-full py-3 bg-white border border-nimbus-cloud/50 hover:bg-cloud-dancer text-midnight-blue/70 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <MdEventNote className="text-xl" />
                <span>Crear Evento</span>
              </button>
              <button 
                onClick={handleDownloadStats}
                disabled={statsLoading}
                className="w-full py-3 bg-white border border-nimbus-cloud/50 hover:bg-cloud-dancer text-midnight-blue/70 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
              >
                {statsLoading ? (
                  <div className="w-5 h-5 border-2 border-midnight-blue/30 border-t-midnight-blue rounded-full animate-spin" />
                ) : (
                  <>
                    <MdDownload className="text-xl" />
                    <span>Descargar Estadísticas</span>
                  </>
                )}
              </button>
            </>
          )}
          <button 
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-all flex items-center justify-start gap-3 border border-red-100"
          >
            <MdLogout className="text-xl" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* PANEL MÓVIL — Overlay + Drawer */}
      <div 
        className={`fixed inset-0 z-50 xl:hidden transition-opacity duration-300 ${
          showMobilePanel ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          onClick={() => setShowMobilePanel(false)} 
        />
        {/* Drawer */}
        <aside 
          className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl p-6 flex flex-col gap-8 overflow-y-auto transition-transform duration-300 ease-out ${
            showMobilePanel ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-midnight-blue font-bold text-lg">Acciones</h3>
            <button 
              onClick={() => setShowMobilePanel(false)}
              className="p-2 text-midnight-blue/50 hover:text-midnight-blue hover:bg-lemon-icing/40 rounded-lg transition-colors"
            >
              <MdClose className="text-xl" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => { setShowMobilePanel(false); router.push('/profile/edit'); }}
              className="w-full py-3 bg-lemon-icing hover:brightness-95 text-midnight-blue font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <MdEdit className="text-xl" />
              <span>Editar Perfil</span>
            </button>
            {isOrganizer && (
              <>
                <button 
                  onClick={() => { setShowMobilePanel(false); router.push('/createEvent'); }}
                  className="w-full py-3 bg-white border border-nimbus-cloud/50 hover:bg-cloud-dancer text-midnight-blue/70 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <MdEventNote className="text-xl" />
                  <span>Crear Evento</span>
                </button>
                <button 
                  onClick={() => { setShowMobilePanel(false); handleDownloadStats(); }}
                  disabled={statsLoading}
                  className="w-full py-3 bg-white border border-nimbus-cloud/50 hover:bg-cloud-dancer text-midnight-blue/70 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                >
                  {statsLoading ? (
                    <div className="w-5 h-5 border-2 border-midnight-blue/30 border-t-midnight-blue rounded-full animate-spin" />
                  ) : (
                    <>
                      <MdDownload className="text-xl" />
                      <span>Descargar Estadísticas</span>
                    </>
                  )}
                </button>
              </>
            )}
            <button 
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-all flex items-center justify-start gap-3 border border-red-100"
            >
              <MdLogout className="text-xl" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}