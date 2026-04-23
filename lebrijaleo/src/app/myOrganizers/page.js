'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Navbar';
import { createClient } from '@/utils/supabase/client';
import {
  MdMenu, MdSearch, MdAdd, MdMail, MdEvent,
  MdDelete, MdArrowForward, MdStorefront, MdClose,
  MdPerson, MdCheckCircle, MdWarning, MdLocationOn,
} from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── Dialogo de confirmación de borrado ────────────────────────────────────
function ConfirmDialog({ empresario, onConfirm, onCancel, isLoading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-5">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
          <MdWarning className="text-3xl text-red-500" />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-midnight-blue text-xl mb-2">¿Eliminar empresario?</h3>
          <p className="text-midnight-blue/60 text-sm leading-relaxed">
            Se revocará el rol de empresario a{' '}
            <span className="font-bold text-midnight-blue">{empresario?.nombre}</span>.
            Su cuenta pasará a ser un Cliente normal.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl border border-nimbus-cloud/50 text-midnight-blue/70 text-sm font-bold hover:bg-cloud-dancer transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-60"
          >
            {isLoading ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tarjeta de empresario ────────────────────────────────────────────────
function EmpresarioCard({ emp, onDelete, onViewProfile }) {
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.nombre)}&background=F6EBC8&color=1e293b`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-nimbus-cloud/40 flex flex-col hover:shadow-md hover:border-lemon-icing transition-all group">
      {/* Cabecera con avatar */}
      <div className="p-5 flex items-center gap-4 border-b border-nimbus-cloud/30">
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-cloud-dancer border border-nimbus-cloud/30">
          <img
            src={emp.foto_perfil || emp.avatar_url || defaultAvatar}
            alt={`Avatar de ${emp.nombre}`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-base text-midnight-blue truncate">{emp.nombre}</h3>
          {emp.username && (
            <p className="text-xs text-midnight-blue/50 font-medium">@{emp.username}</p>
          )}
        </div>
        <div className="ml-auto shrink-0">
         
        </div>
      </div>

      {/* Info */}
      <div className="p-5 flex-1 space-y-3">
        <div className="flex items-center gap-2.5 text-sm text-midnight-blue/70">
          <MdMail className="text-lg text-midnight-blue/35 shrink-0" />
          <span className="truncate">{emp.email}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-midnight-blue/70">
          <MdEvent className="text-lg text-midnight-blue/35 shrink-0" />
          <span>
            <span className="font-bold text-midnight-blue">{emp.num_eventos}</span>
            {' '}evento{emp.num_eventos !== 1 ? 's' : ''} publicado{emp.num_eventos !== 1 ? 's' : ''}
          </span>
        </div>
        {emp.ubicacion && (
          <div className="flex items-center gap-2.5 text-sm text-midnight-blue/70">
            <MdLocationOn className="text-lg text-midnight-blue/35 shrink-0" />
            <span className="truncate">{emp.ubicacion}</span>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="p-4 bg-form-bg border-t border-nimbus-cloud/30 flex gap-2 rounded-b-2xl">
        <button
          onClick={() => onViewProfile(emp.id_usuario)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-lemon-icing text-midnight-blue rounded-xl text-sm font-bold hover:brightness-95 transition-colors shadow-sm"
        >
          <span>Ver perfil</span>
          <MdArrowForward className="text-base" />
        </button>
        <button
          onClick={() => onDelete(emp)}
          className="flex items-center justify-center p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          title="Revocar rol de empresario"
        >
          <MdDelete className="text-xl" />
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton card para loading ───────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-nimbus-cloud/30 p-5 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-cloud-dancer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-cloud-dancer rounded-lg w-3/4" />
          <div className="h-3 bg-cloud-dancer rounded-lg w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-cloud-dancer rounded-lg w-full" />
        <div className="h-3 bg-cloud-dancer rounded-lg w-2/3" />
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────
export default function MyOrganizersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [empresarios, setEmpresarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para el diálogo de confirmación
  const [empToDelete, setEmpToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Toast de feedback ──
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg: string }

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Carga inicial ──
  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/login'); return; }

        const accessToken = session.access_token;
        setToken(accessToken);

        // Verificar que el usuario es Administrador; si no, redirigir
        const perfilRes = await fetch(`${API_URL}/api/perfil`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (perfilRes.ok) {
          const perfil = await perfilRes.json();
          if (perfil.rol !== 'Administrador') {
            router.push('/home');
            return;
          }
        } else {
          router.push('/home');
          return;
        }

        // Solo llega aquí si es Administrador
        await fetchEmpresarios(accessToken);
      } catch (err) {
        console.error('Error en carga inicial:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function fetchEmpresarios(accessToken) {
    const res = await fetch(`${API_URL}/api/empresarios`, {
      headers: { 'Authorization': `Bearer ${accessToken || token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setEmpresarios(data.data || []);
    } else {
      console.error('Error al obtener empresarios');
    }
  }

  // ── Eliminar (revocar rol) ──
  async function handleConfirmDelete() {
    if (!empToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/empresarios/${empToDelete.id_usuario}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setEmpresarios(prev => prev.filter(e => e.id_usuario !== empToDelete.id_usuario));
        showToast('success', `Rol de "${empToDelete.nombre}" revocado correctamente.`);
      } else {
        const err = await res.json();
        showToast('error', err.detail || 'No tienes permisos para realizar esta acción.');
      }
    } catch (err) {
      showToast('error', 'Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsDeleting(false);
      setEmpToDelete(null);
    }
  }

  // ── Filtrado por búsqueda ──
  const empresariosFiltrados = empresarios.filter(emp =>
    emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="bg-cloud-dancer text-midnight-blue font-display antialiased overflow-hidden h-screen flex">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-form-bg relative">
          <header className="h-20 px-8 flex items-center gap-4 bg-white/80 backdrop-blur-md border-b border-nimbus-cloud/40">
            <div className="h-10 w-72 bg-cloud-dancer rounded-xl animate-pulse" />
          </header>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
              <div className="h-8 w-64 bg-cloud-dancer rounded-xl animate-pulse mb-8" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-cloud-dancer text-midnight-blue font-display antialiased overflow-hidden h-screen flex">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-form-bg relative">

        {/* ── CABECERA ── */}
        <header className="h-20 px-4 md:px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-nimbus-cloud/40">
          <div className="flex items-center gap-4 flex-1">
            <button className="p-2 text-midnight-blue/50 hover:text-midnight-blue hover:bg-lemon-icing/40 rounded-lg transition-colors lg:hidden">
              <MdMenu className="text-2xl" />
            </button>
            <div className="relative max-w-md w-full hidden sm:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight-blue/40 pointer-events-none">
                <MdSearch className="text-xl" />
              </span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-nimbus-cloud/50 rounded-xl text-sm focus:ring-2 focus:ring-lemon-icing/80 focus:bg-white transition-all placeholder:text-midnight-blue/40"
                placeholder="Buscar por nombre, email o usuario..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-blue/40 hover:text-midnight-blue transition-colors"
                >
                  <MdClose className="text-lg" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-7xl mx-auto">

            {/* Título */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-midnight-blue tracking-tight mb-1">
                  Gestión de Empresarios
                </h1>
                <p className="text-midnight-blue/60 font-medium">
                  {empresarios.length} organizador{empresarios.length !== 1 ? 'es' : ''} registrado{empresarios.length !== 1 ? 's' : ''} en la plataforma.
                </p>
              </div>
            </div>

            {/* Buscador móvil */}
            <div className="sm:hidden mb-6">
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight-blue/40 pointer-events-none">
                  <MdSearch className="text-xl" />
                </span>
                <input
                  className="w-full pl-10 pr-10 py-2.5 bg-white/50 border border-nimbus-cloud/50 rounded-xl text-sm focus:ring-2 focus:ring-lemon-icing/80 focus:bg-white transition-all placeholder:text-midnight-blue/40"
                  placeholder="Buscar..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-blue/40">
                    <MdClose className="text-lg" />
                  </button>
                )}
              </div>
            </div>

            {/* Grid de empresarios */}
            {empresariosFiltrados.length === 0 ? (
              <div className="text-center py-24 bg-white/40 rounded-3xl border-2 border-dashed border-nimbus-cloud/30">
                <MdStorefront className="text-6xl text-midnight-blue/15 mx-auto mb-4" />
                <p className="text-midnight-blue/50 font-semibold text-lg">
                  {searchTerm ? 'Sin resultados para tu búsqueda.' : 'No hay empresarios registrados aún.'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 text-sm text-midnight-blue/60 underline hover:text-midnight-blue transition-colors"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {empresariosFiltrados.map((emp) => (
                    <EmpresarioCard
                      key={emp.id_usuario}
                      emp={emp}
                      onDelete={setEmpToDelete}
                      onViewProfile={(id) => router.push(`/profile/${id}`)}
                    />
                  ))}
                </div>

                {/* Pie de página con totales */}
                <div className="mt-8 flex items-center justify-between px-1">
                  <p className="text-xs text-midnight-blue/50 font-medium">
                    Mostrando{' '}
                    <span className="font-bold text-midnight-blue">{empresariosFiltrados.length}</span>
                    {' '}de{' '}
                    <span className="font-bold text-midnight-blue">{empresarios.length}</span>
                    {' '}empresarios
                  </p>
                </div>
              </>
            )}

            <div className="h-12" />
          </div>
        </div>
      </main>

      {/* ── DIÁLOGO CONFIRMACIÓN ── */}
      {empToDelete && (
        <ConfirmDialog
          empresario={empToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={() => setEmpToDelete(null)}
          isLoading={isDeleting}
        />
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all animate-in slide-in-from-bottom-4 duration-300 ${
            toast.type === 'success'
              ? 'bg-midnight-blue text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success'
            ? <MdCheckCircle className="text-xl shrink-0" />
            : <MdWarning className="text-xl shrink-0" />
          }
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}