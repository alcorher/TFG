'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Navbar';
import { createClient } from '@/utils/supabase/client';
import { formatDateES } from '@/lib/utils';
import { 
  MdMenu, MdPersonSearch, MdSearch, MdClose,
  MdPersonAdd, MdPersonRemove, MdGroup, MdPersonOff,
  MdOpenInNew, MdGridView, MdViewList
} from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lebrijaleo-backend.onrender.com';

function FriendCard({ friend, viewMode, togglingId, onToggleFriend, onOpenProfile, formatDate, getAvatar }) {
  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 px-6 py-4 hover:bg-cloud-dancer/40 transition-colors group">
        <img
          alt={friend.nombre}
          className="w-14 h-14 rounded-full object-cover border-2 border-cloud-dancer shadow-sm cursor-pointer group-hover:scale-105 transition-transform"
          src={getAvatar(friend)}
          onClick={() => onOpenProfile(friend.id_usuario)}
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-bold text-midnight-blue truncate cursor-pointer hover:underline"
            onClick={() => onOpenProfile(friend.id_usuario)}
          >
            {friend.nombre}
          </p>
          <p className="text-xs text-midnight-blue/50 font-medium truncate">
            {friend.username ? `@${friend.username} • ` : ''}
            {formatDate(friend.amigo_desde)}
            {friend.rol === 'Empresario' && <span className="ml-2 px-1.5 py-0.5 bg-lemon-icing/70 text-midnight-blue text-[10px] font-bold rounded-full border border-lemon-icing">Organizador</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggleFriend(friend.id_usuario)}
            disabled={togglingId === friend.id_usuario}
            className="h-8 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-100 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {togglingId === friend.id_usuario ? (
              <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <><MdPersonRemove className="text-sm" /> Quitar</>
            )}
          </button>
          <button
            onClick={() => onOpenProfile(friend.id_usuario)}
            className="h-8 px-3 rounded-lg bg-lemon-icing text-midnight-blue text-xs font-bold border border-lemon-icing/80 hover:bg-lemon-icing/80 transition-colors"
          >
            Ver perfil
          </button>
        </div>
      </div>
    );
  }

  return (
    <article className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-nimbus-cloud/40 flex flex-col items-center text-center relative group hover:border-lemon-icing">
      <div
        className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-cloud-dancer shadow-sm group-hover:scale-105 transition-transform duration-300 cursor-pointer"
        onClick={() => onOpenProfile(friend.id_usuario)}
      >
        <img alt={friend.nombre} className="w-full h-full object-cover" src={getAvatar(friend)} />
      </div>

      <h3
        className="font-bold text-lg text-midnight-blue cursor-pointer hover:underline"
        onClick={() => onOpenProfile(friend.id_usuario)}
      >
        {friend.nombre}
      </h3>
      <p className="text-xs font-bold text-midnight-blue/50 mb-1">
        {friend.username ? `@${friend.username}` : ''}
      </p>

      <div className="min-h-5 mb-2 flex items-center justify-center">
        {friend.rol === 'Empresario' ? (
          <span className="inline-block px-2 py-0.5 bg-lemon-icing/70 text-midnight-blue text-[10px] font-bold rounded-full border border-lemon-icing">Organizador</span>
        ) : (
          <span className="invisible inline-block px-2 py-0.5 text-[10px] font-bold rounded-full">Organizador</span>
        )}
      </div>

      <div className="bg-cloud-dancer rounded-xl p-3 w-full mb-6">
        <div className="flex items-center gap-2 justify-center text-xs font-bold text-midnight-blue/50">
          <MdGroup className="text-base" />
          <span>Amigos {formatDate(friend.amigo_desde)}</span>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3 w-full">
        <button
          onClick={() => onToggleFriend(friend.id_usuario)}
          disabled={togglingId === friend.id_usuario}
          className="h-10 px-4 rounded-xl border border-red-100 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {togglingId === friend.id_usuario ? (
            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <><MdPersonRemove className="text-lg" /> Quitar</>
          )}
        </button>
        <button
          onClick={() => onOpenProfile(friend.id_usuario)}
          className="h-10 px-4 rounded-xl bg-lemon-icing text-midnight-blue text-sm font-bold border border-lemon-icing/80 hover:bg-lemon-icing/85 transition-colors shadow-sm"
        >
          Ver perfil
        </button>
      </div>
    </article>
  );
}

export default function MisAmigosPage() {
  const router = useRouter();
  const supabase = createClient();

  // Friends list
  const [amigos, setAmigos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState("");

  // Search users
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // UI
  const [viewMode, setViewMode] = useState('grid');
  const [togglingId, setTogglingId] = useState(null);
  const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'az'

  // Load friends
  useEffect(() => {
    async function loadFriends() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const res = await fetch(`${API_URL}/api/mis-amigos`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setAmigos(data.data || []);
        }
      } catch (err) {
        console.error("Error cargando amigos:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadFriends();
  }, [router, supabase]);

  // Search users (debounced)
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch(`${API_URL}/api/usuarios/buscar?q=${encodeURIComponent(searchTerm)}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.data || []);
        }
      } catch (err) {
        console.error("Error buscando:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, supabase]);

  // Toggle friend
  const handleToggleFriend = async (userId) => {
    setTogglingId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/api/amigos/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.es_amigo) {
          // Was added — if in search results, update their state
          setSearchResults(prev => prev.map(u => 
            u.id_usuario === userId ? { ...u, es_amigo: true } : u
          ));
          // Reload friends list
          const friendsRes = await fetch(`${API_URL}/api/mis-amigos`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (friendsRes.ok) {
            const friendsData = await friendsRes.json();
            setAmigos(friendsData.data || []);
          }
        } else {
          // Was removed
          setAmigos(prev => prev.filter(a => a.id_usuario !== userId));
          setSearchResults(prev => prev.map(u => 
            u.id_usuario === userId ? { ...u, es_amigo: false } : u
          ));
        }
      }
    } catch (err) {
      console.error("Error toggling friend:", err);
    } finally {
      setTogglingId(null);
    }
  };

  // Filter & sort friends
  const filteredAmigos = amigos
    .filter(a => {
      if (!filterTerm) return true;
      const term = filterTerm.toLowerCase();
      return (a.nombre || '').toLowerCase().includes(term) || (a.username || '').toLowerCase().includes(term);
    })
    .sort((a, b) => {
      if (sortBy === 'az') return (a.nombre || '').localeCompare(b.nombre || '');
      // 'recent' — by amigo_desde descending (already sorted from API, but just in case)
      return new Date(b.amigo_desde || 0) - new Date(a.amigo_desde || 0);
    });

  const getAvatar = (user) => user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre || 'U')}&background=F6EBC8&color=1e293b`;

  const formatDate = (dateStr) => formatDateES(dateStr, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Loading
  if (isLoading) {
    return (
      <div className="bg-cloud-dancer h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-lemon-icing border-t-midnight-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-cloud-dancer text-midnight-blue font-display antialiased overflow-hidden h-screen flex">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-form-bg relative">
        {/* HEADER */}
        <header className="h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-nimbus-cloud/40">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-midnight-blue">Mis Amigos</h1>
              <p className="text-xs text-midnight-blue/60 font-medium">Gestiona tus conexiones en Lebrija</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative max-w-sm w-64 hidden md:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight-blue/40 pointer-events-none">
                <MdPersonSearch className="text-xl" />
              </span>
              <input 
                className="w-full pl-10 pr-4 py-2 bg-white border border-nimbus-cloud/50 rounded-xl text-sm focus:ring-2 focus:ring-lemon-icing/80 focus:border-lemon-icing/50 transition-all placeholder:text-midnight-blue/40 shadow-sm" 
                placeholder="Filtrar amigos..." 
                type="text"
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-7xl mx-auto">
            
            {/* Search Banner */}
            <div className="mb-8 bg-linear-to-r from-midnight-blue to-slate-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-lemon-icing/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">¿Buscas a alguien?</h2>
                  <p className="text-white/80 text-sm mb-6 max-w-lg leading-relaxed">Encuentra a tus amigos de siempre o conoce gente nueva con tus mismos intereses culturales y de ocio en Lebrija.</p>
                  <div className="relative max-w-md w-full">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                      <MdSearch className="text-xl" />
                    </span>
                    <input 
                      className="w-full pl-12 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:bg-white/20 focus:ring-2 focus:ring-lemon-icing focus:border-transparent transition-all backdrop-blur-sm font-medium" 
                      placeholder="Buscar personas por nombre o username..." 
                      type="text"
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setShowSearch(true); }}
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => { setSearchTerm(""); setSearchResults([]); setShowSearch(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                      >
                        <MdClose className="text-xl" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                    <MdPersonAdd className="text-3xl text-lemon-icing" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search Results (overlay when searching) */}
            {showSearch && searchTerm.length >= 2 && (
              <div className="mb-8 bg-white rounded-2xl border border-nimbus-cloud/40 shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-nimbus-cloud/30 flex items-center justify-between">
                  <h3 className="text-base font-bold text-midnight-blue flex items-center gap-2">
                    <MdSearch className="text-lg text-midnight-blue/50" />
                    Resultados para "{searchTerm}"
                  </h3>
                  <button 
                    onClick={() => { setShowSearch(false); setSearchTerm(""); setSearchResults([]); }}
                    className="text-xs font-bold text-midnight-blue/50 hover:text-midnight-blue px-3 py-1.5 rounded-lg hover:bg-cloud-dancer transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
                
                {isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-lemon-icing border-t-midnight-blue rounded-full animate-spin"></div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-12">
                    <MdPersonOff className="text-4xl text-midnight-blue/20 mx-auto mb-3" />
                    <p className="text-sm text-midnight-blue/50 font-medium">No se encontraron usuarios con ese nombre.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-nimbus-cloud/20">
                    {searchResults.map(user => (
                      <div key={user.id_usuario} className="flex items-center gap-4 px-6 py-4 hover:bg-cloud-dancer/40 transition-colors">
                        <img 
                          alt={user.nombre} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-cloud-dancer shadow-sm cursor-pointer hover:scale-105 transition-transform"
                          src={getAvatar(user)}
                          onClick={() => router.push(`/profile/${user.id_usuario}`)}
                        />
                        <div className="flex-1 min-w-0">
                          <p 
                            className="text-sm font-bold text-midnight-blue truncate cursor-pointer hover:underline"
                            onClick={() => router.push(`/profile/${user.id_usuario}`)}
                          >
                            {user.nombre}
                          </p>
                          <p className="text-xs text-midnight-blue/50 font-medium truncate">
                            {user.username ? `@${user.username}` : ''} 
                            {user.rol === 'Empresario' && <span className="ml-1 px-1.5 py-0.5 bg-lemon-icing/70 text-midnight-blue text-[10px] font-bold rounded-full border border-lemon-icing">Organizador</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => router.push(`/profile/${user.id_usuario}`)}
                            className="p-2 text-midnight-blue/60 bg-lemon-icing/60 border border-lemon-icing rounded-lg hover:bg-lemon-icing/80 transition-colors"
                            title="Ver perfil"
                          >
                            <MdOpenInNew className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleToggleFriend(user.id_usuario)}
                            disabled={togglingId === user.id_usuario}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                              user.es_amigo
                                ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100'
                                : 'bg-lemon-icing hover:brightness-95 text-midnight-blue shadow-sm'
                            }`}
                          >
                            {togglingId === user.id_usuario ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : user.es_amigo ? (
                              <><MdPersonRemove className="text-base" /> Quitar</>
                            ) : (
                              <><MdPersonAdd className="text-base" /> Añadir</>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Friends Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-midnight-blue flex items-center">
                Todos mis amigos 
                <span className="ml-2 text-sm font-bold text-midnight-blue/60 bg-white px-2.5 py-0.5 rounded-full border border-nimbus-cloud/50 shadow-sm">{amigos.length}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSortBy('recent')}
                  className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${sortBy === 'recent' ? 'text-midnight-blue bg-white shadow-sm border border-nimbus-cloud/50' : 'text-midnight-blue/50 hover:text-midnight-blue hover:bg-white'}`}
                >
                  Recientes
                </button>
                <button 
                  onClick={() => setSortBy('az')}
                  className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${sortBy === 'az' ? 'text-midnight-blue bg-white shadow-sm border border-nimbus-cloud/50' : 'text-midnight-blue/50 hover:text-midnight-blue hover:bg-white'}`}
                >
                  A-Z
                </button>
                <div className="w-px h-5 bg-nimbus-cloud/50 mx-1"></div>
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

            {/* Friends Grid/List */}
            {filteredAmigos.length === 0 ? (
              <div className="text-center py-20 bg-white/40 rounded-3xl border-2 border-dashed border-nimbus-cloud/30">
                <MdGroup className="text-5xl text-midnight-blue/20 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">
                  {amigos.length === 0 
                    ? 'Aún no tienes amigos. ¡Usa el buscador para encontrar gente!' 
                    : 'No se encontraron amigos con ese filtro.'
                  }
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {filteredAmigos.map((friend) => (
                  <FriendCard
                    key={friend.id_usuario}
                    friend={friend}
                    viewMode="grid"
                    togglingId={togglingId}
                    onToggleFriend={handleToggleFriend}
                    onOpenProfile={(id) => router.push(`/profile/${id}`)}
                    formatDate={formatDate}
                    getAvatar={getAvatar}
                  />
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white rounded-2xl border border-nimbus-cloud/40 shadow-sm overflow-hidden divide-y divide-nimbus-cloud/20 mb-20">
                {filteredAmigos.map((friend) => (
                  <FriendCard
                    key={friend.id_usuario}
                    friend={friend}
                    viewMode="list"
                    togglingId={togglingId}
                    onToggleFriend={handleToggleFriend}
                    onOpenProfile={(id) => router.push(`/profile/${id}`)}
                    formatDate={formatDate}
                    getAvatar={getAvatar}
                  />
                ))}
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}