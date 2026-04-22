'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Navbar';
import EventCard from '@/components/events/EventCard';
import { createClient } from '@/utils/supabase/client';
import { 
  MdArrowBack, MdGroup, MdMenu, MdClose,
  MdBookmark, MdGridView, MdViewList, 
  MdEventNote, MdInfoOutline, MdLocationOn,
  MdPersonAdd, MdPersonRemove, MdAdminPanelSettings
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

  // Friend system state
  const [esAmigo, setEsAmigo] = useState(false);
  const [conteoAmigos, setConteoAmigos] = useState(0);
  const [friendLoading, setFriendLoading] = useState(false);

  // Admin state
  const [currentUserRol, setCurrentUserRol] = useState(null);
  const [rolLoading, setRolLoading] = useState(false);
  const [rolMessage, setRolMessage] = useState('');

  // Mobile panel
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  useEffect(() => {
    async function loadPublicProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Check if this is the current user's own profile
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

        // Fetch friend status
        const headers = {};
        if (session) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const friendRes = await fetch(`${API_URL}/api/amigos/${id}/estado`, { headers });
        if (friendRes.ok) {
          const friendData = await friendRes.json();
          setEsAmigo(friendData.es_amigo);
          setConteoAmigos(friendData.conteo_amigos);
        }

        // If logged in, get current user's role for admin features
        if (session) {
          const profileRes = await fetch(`${API_URL}/api/perfil`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (profileRes.ok) {
            const myProfile = await profileRes.json();
            setCurrentUserRol(myProfile.rol);
          }
        }

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

  // Toggle friend
  const handleToggleFriend = async () => {
    setFriendLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${API_URL}/api/amigos/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setEsAmigo(data.es_amigo);
        setConteoAmigos(data.conteo_amigos);
      }
    } catch (err) {
      console.error("Error toggling friend:", err);
    } finally {
      setFriendLoading(false);
    }
  };

  // Assign Organizador role
  const handleAsignarRol = async () => {
    setRolLoading(true);
    setRolMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/admin/asignar-rol/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      const data = await res.json();

      if (res.ok) {
        setRolMessage(data.mensaje || 'Rol asignado con éxito');
        // Update the profile data locally
        setProfileData(prev => ({ ...prev, rol: 'Empresario' }));
      } else {
        setRolMessage(data.detail || 'Error al asignar rol');
      }
    } catch (err) {
      setRolMessage('Error de conexión');
    } finally {
      setRolLoading(false);
    }
  };

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
  const isAdmin = currentUserRol === 'Administrador';
  const canMakeEmpresario = isAdmin && profileData.rol === 'Cliente';

  // Sidebar content (reused for desktop aside and mobile drawer)
  const SidebarContent = () => (
    <div className="bg-white rounded-2xl flex flex-col gap-3">
      <h3 className="text-midnight-blue font-bold text-lg">Acciones</h3>
      
      {/* Add/Remove Friend Button */}
      <button
        onClick={handleToggleFriend}
        disabled={friendLoading}
        className={`w-full py-3 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 ${
          esAmigo
            ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100'
            : 'bg-lemon-icing hover:brightness-95 text-midnight-blue'
        }`}
      >
        {friendLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        ) : esAmigo ? (
          <>
            <MdPersonRemove className="text-xl" />
            <span>Eliminar Amigo</span>
          </>
        ) : (
          <>
            <MdPersonAdd className="text-xl" />
            <span>Añadir Amigo</span>
          </>
        )}
      </button>

      {/* Make Organizador Button (Admin only, target must be Cliente) */}
      {canMakeEmpresario && (
        <button
          onClick={handleAsignarRol}
          disabled={rolLoading}
          className="w-full py-3 bg-lemon-icing hover:brightness-95 text-black font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
        >
          {rolLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <MdAdminPanelSettings className="text-xl" />
              <span>Hacer Organizador</span>
            </>
          )}
        </button>
      )}

      {/* Role assignment feedback message */}
      {rolMessage && (
        <div className={`text-sm font-medium p-3 rounded-xl text-center ${
          rolMessage.includes('Error') || rolMessage.includes('error')
            ? 'bg-red-50 text-red-600 border border-red-100'
            : 'bg-green-50 text-green-700 border border-green-100'
        }`}>
          {rolMessage}
        </div>
      )}

      {/* Friend count info card */}
      <div className="mt-2 bg-cloud-dancer/60 rounded-xl p-4 border border-nimbus-cloud/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <MdGroup className="text-xl" />
          </div>
          <div>
            <p className="text-xs text-midnight-blue/50 font-medium">Amigos</p>
            <p className="text-lg font-bold text-midnight-blue">{conteoAmigos}</p>
          </div>
        </div>
      </div>
    </div>
  );

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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
              
              {/* Friend count stat card */}
              <div className="bg-white rounded-2xl p-5 border border-nimbus-cloud/30 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <MdGroup className="text-2xl" />
                </div>
                <div>
                  <p className="text-sm text-midnight-blue/60 font-medium">Amigos</p>
                  <p className="text-2xl font-bold text-midnight-blue">{conteoAmigos}</p>
                </div>
              </div>

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

      {/* ASIDE DERECHO (Acciones) — Desktop */}
      <aside className="w-80 bg-white border-l border-nimbus-cloud/40 p-6 flex flex-col gap-8 h-full shadow-[-2px_0_20px_rgba(0,0,0,0.02)] overflow-y-auto hidden xl:flex shrink-0">
        <SidebarContent />
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
          <SidebarContent />
        </aside>
      </div>
    </div>
  );
}
