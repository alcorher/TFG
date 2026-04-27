'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  MdDashboard, MdFavorite, MdGroups, MdAddCircle, MdCalendarMonth, MdSettings, MdGroup 
} from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Navbar() {
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    async function loadAvatar() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) return;

        const response = await fetch(`${API_URL}/api/perfil`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (response.ok) {
          const profile = await response.json();
          setAvatarUrl(profile.avatar_url || null);
          setUserName(profile.nombre || '');
          setRole(profile.rol || '');
        }
      } catch (error) {
        console.error("Error cargando avatar del navbar:", error);
      }
    }

    loadAvatar();
  }, []);

  const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(userName || 'U') + "&background=F6EBC8&color=1e293b&size=96";
  const isAdmin = role === 'Administrador';
  const isOrganizer = role === 'Empresario';
  const showOrganizerTools = isOrganizer || isAdmin;
  const showMyOrganizers = isAdmin;

  const isActive = (route) => {
    if (!pathname) return false;
    if (route === '/home') {
      return pathname === '/home' || pathname === '/';
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  };

  const getNavItemClasses = (route) => {
    const baseClasses = 'group relative w-full aspect-square rounded-xl flex items-center justify-center transition-all';
    const activeClasses = 'text-midnight-blue bg-lemon-icing';
    const inactiveClasses = 'text-slate-400 hover:text-midnight-blue hover:bg-lemon-icing/30';
    return `${baseClasses} ${isActive(route) ? activeClasses : inactiveClasses}`;
  };

  return (
    <aside className="w-20 bg-white border-r border-slate-100 flex flex-col items-center py-6 h-full shadow-sm z-20 shrink-0">
      
      {/* Logo (Lleva a la Home) */}
      <Link href="/" className="mb-10 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-lemon-icing/30 hover:scale-105 transition-transform overflow-hidden bg-white border border-lemon-icing/30">
        <Image src="/logo.png" alt="LebriJaleo" width={48} height={48} className="object-contain" priority />
      </Link>
      
      {/* Navegación Principal */}
      <nav className="flex-1 flex flex-col gap-6 w-full px-2">
        <Link href="/home" className={getNavItemClasses('/home')}>
          <MdDashboard className="text-3xl" />
          <span className="absolute left-16 bg-midnight-blue text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Cartelera</span>
          {isActive('/home') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-midnight-blue rounded-r-full opacity-20"></div>}
        </Link>
        
        <Link href="/favorites" className={getNavItemClasses('/favorites')}>
          <MdFavorite className="text-3xl" />
          <span className="absolute left-16 bg-midnight-blue text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Favoritos</span>
          {isActive('/favorites') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-midnight-blue rounded-r-full opacity-20"></div>}
        </Link>
        <Link href="/social" className={getNavItemClasses('/social')}>
          <MdGroup className="text-3xl" />
          <span className="absolute left-16 bg-midnight-blue text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Social</span>
          {isActive('/social') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-midnight-blue rounded-r-full opacity-20"></div>}
        </Link>
        {showOrganizerTools && (
          <>
            {showMyOrganizers && (
              <Link href="/myOrganizers" className={getNavItemClasses('/myOrganizers')}>
                <MdGroups className="text-3xl" />
                <span className="absolute left-16 bg-midnight-blue text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Organizadores</span>
                {isActive('/myOrganizers') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-midnight-blue rounded-r-full opacity-20"></div>}
              </Link>
            )}
            <Link href="/createEvent" className={getNavItemClasses('/createEvent')}>
              <MdAddCircle className="text-3xl" />
              <span className="absolute left-16 bg-midnight-blue text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Publicar</span>
              {isActive('/createEvent') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-midnight-blue rounded-r-full opacity-20"></div>}
            </Link>
            <Link href="/myEvents" className={getNavItemClasses('/myEvents')}>
              <MdCalendarMonth className="text-3xl" />
              <span className="absolute left-16 bg-midnight-blue text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Mis Eventos</span>
              {isActive('/myEvents') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-midnight-blue rounded-r-full opacity-20"></div>}
            </Link>
          </>
        )}
        
        <Link href="/profile/edit" className={`${getNavItemClasses('/profile/edit')} mt-auto`}>
          <MdSettings className="text-3xl" />
          <span className="absolute left-16 bg-midnight-blue text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">Ajustes</span>
          {isActive('/profile/edit') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-midnight-blue rounded-r-full opacity-20"></div>}
        </Link>
      </nav>
      
      {/* Avatar del usuario (Lleva al perfil) */}
      <div className="mt-4 px-2 pb-2">
        <Link href="/profile" className="block w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md hover:ring-2 hover:ring-lemon-icing transition-all">
          <img 
            alt="User avatar" 
            className="w-full h-full object-cover"
            src={avatarUrl || defaultAvatar} 
          />
        </Link>
      </div>
    </aside>
  );
}