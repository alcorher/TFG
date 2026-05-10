"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "@/components/layout/Navbar";
import { Alert } from "@/components/ui/alert";
import {
  MdArrowBack,
  MdShare,
  MdCalendarToday,
  MdSchedule,
  MdLocationOn,
  MdPayments,
  MdInfoOutline,
  MdFavoriteBorder,
  MdVerifiedUser,
  MdMenu,
  MdVerified,
  MdFavorite,
  MdClose,
} from "react-icons/md";

export default function EventDetailPage({ params }) {
  const router = useRouter();
  const { id } = useParams(params);
  const supabase = createClient();

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  // --- NUEVOS ESTADOS PARA LA CONEXIÓN ---
  const [eventData, setEventData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  // Bloquear scroll cuando el panel móvil está abierto
  useEffect(() => {
    if (isMobilePanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobilePanelOpen]);

  // --- EFECTO PARA CARGAR LOS DATOS ---
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://lebrijaleo-backend.onrender.com";

        // Obtener usuario actual
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentUser(session.user);
        }

        // Llamamos al nuevo endpoint de Python
        const response = await fetch(`${API_URL}/api/eventos/${id}`);

        if (!response.ok) {
          throw new Error("No se pudo cargar el evento");
        }

        const data = await response.json();
        setEventData(data);

        // Llamamos al endpoint de favoritos
        const headers = {};
        if (session) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        const favResponse = await fetch(`${API_URL}/api/eventos/${id}/favoritos`, { headers });
        if (favResponse.ok) {
          const favData = await favResponse.json();
          setFavoritesCount(favData.count);
          setIsFavorite(favData.is_favorite);
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Lo sentimos, no hemos podido cargar este evento.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchEventData();
    }
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (isTogglingFav) return;
    setIsTogglingFav(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://lebrijaleo-backend.onrender.com";
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${API_URL}/api/eventos/${id}/favoritos`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFavoritesCount(data.count);
        setIsFavorite(data.is_favorite);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setIsTogglingFav(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventData) return;

    const confirmed = window.confirm("¿Seguro que quieres eliminar este evento? Esta acción no se puede deshacer.");
    if (!confirmed) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://lebrijaleo-backend.onrender.com";
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/api/eventos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        router.push("/myEvents");
        return;
      }

      const errorData = await response.json().catch(() => ({}));
      setDeleteMessage(errorData.detail || "No se ha podido eliminar el evento.");
    } catch (err) {
      console.error("Error deleting event:", err);
      setDeleteMessage("No se ha podido conectar con el servidor para eliminar el evento.");
    }
  };

  // Funciones para formatear la fecha de "2026-12-20" a "20 Diciembre"
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { day: "numeric", month: "long" };
    return new Date(dateString).toLocaleDateString("es-ES", options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    // Cortamos "21:30:00" para que quede "21:30"
    return timeString.substring(0, 5) + "h";
  };

  // --- PANTALLAS DE CARGA Y ERROR ---
  if (isLoading) {
    return (
      <div className="bg-cloud-dancer h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-lemon-icing border-t-midnight-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="bg-cloud-dancer h-screen flex flex-col items-center justify-center text-midnight-blue">
        <MdInfoOutline className="text-6xl mb-4 text-midnight-blue/40" />
        <h2 className="text-2xl font-bold mb-2">Ups... Algo ha fallado</h2>
        <p className="text-midnight-blue/60 mb-6">{error}</p>
        <button
          onClick={() => router.push("/home")}
          className="bg-lemon-icing px-6 py-3 rounded-xl font-bold"
        >
          Volver a la cartelera
        </button>
      </div>
    );
  }



  const rightPanelContentJSX = (
    <>
      {/* Card Entrada General */}
      <div className="bg-gradient-to-br from-[#FDF9ED] to-lemon-icing rounded-3xl p-8 text-midnight-blue shadow-sm border border-lemon-icing/50">
        <p className="text-midnight-blue/70 text-sm font-medium mb-1">
          Entrada general
        </p>
        <div className="text-5xl font-extrabold tracking-tight mb-4">
          {eventData.precio === 0 || eventData.precio === null
            ? "Gratis"
            : `${eventData.precio}€`}
        </div>
        <p className="text-midnight-blue/60 text-xs leading-relaxed">
          {eventData.precio === 0
            ? "Acceso libre hasta completar aforo. Se recomienda llegar con antelación."
            : "Las entradas pueden adquirirse en la plataforma o taquilla del organizador."}
        </p>
        {eventData.aforo_max && (
          <p className="mt-4 pt-4 border-t border-nimbus-cloud/40 text-xs font-bold text-midnight-blue/80">
            Aforo máximo: {eventData.aforo_max} personas
          </p>
        )}
      </div>

      {/* Card Favoritos */}
      <div className="bg-form-bg/30 p-8 rounded-3xl border border-nimbus-cloud/30 flex flex-col items-center justify-center text-center gap-1">
        <MdFavoriteBorder className="text-red-500 text-3xl mb-2" />
        <span className="text-3xl font-extrabold text-midnight-blue">{favoritesCount}</span>
        <span className="text-xs text-midnight-blue/50 font-semibold uppercase tracking-wider">
          Favoritos
        </span>
      </div>

      {/* Panel de Organizador */}
      {currentUser && (eventData.id_empresario === currentUser.id || eventData.empresario_creado_por === currentUser.id) && (
        <div className="mt-auto bg-gradient-to-b from-form-bg to-nimbus-cloud/30 rounded-3xl p-6 relative overflow-hidden border border-nimbus-cloud/40">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <MdVerifiedUser className="text-midnight-blue/70 text-lg" />
              <span className="text-[11px] font-bold uppercase text-midnight-blue/60 tracking-wider">
                {eventData.id_empresario === currentUser.id ? "Organizador" : "Admin"}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-base text-midnight-blue leading-tight mb-2">
                Gestionar evento
              </h4>
              <p className="text-midnight-blue/60 text-xs leading-relaxed">
                Accede al panel de control para editar detalles o ver
                estadísticas.
              </p>
            </div>
            <button
              onClick={() => router.push(`/event/edit/${eventData.id_evento}`)}
              className="w-full py-3 mt-2 bg-midnight-blue hover:bg-black text-white font-semibold rounded-xl text-sm transition-all shadow-md"
            >
              Acceder
            </button>
          </div>
        </div>
      )}
    </>
  );

  // Si todo ha ido bien, renderizamos la página con los datos de eventData
  return (
    <div className="bg-cloud-dancer text-midnight-blue font-display antialiased overflow-hidden h-screen flex">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-form-bg relative">
        {/* Cabecera Superior */}
        <header className="h-20 px-4 md:px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-nimbus-cloud/40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/home")}
              className="flex items-center gap-2 text-sm font-semibold text-midnight-blue/70 hover:text-midnight-blue transition-colors"
            >
              <MdArrowBack className="text-xl" />
              Volver a la cartelera
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wide">
                {eventData.estado || "Publicado"}
              </span>
            </div>
            {/* Botón menú móvil para abrir sidebar */}
            <button
              onClick={() => setIsMobilePanelOpen(true)}
              className="p-2 text-midnight-blue/50 hover:text-midnight-blue hover:bg-lemon-icing/40 rounded-full transition-colors xl:hidden"
            >
              <MdMenu className="text-2xl" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Cabecera / Imagen Hero */}
          <div className="relative h-[350px] md:h-[400px] w-full">
            <img
              alt={eventData.nombre}
              className="w-full h-full object-cover object-top"
              src={
                eventData.cartel_url ||
                "https://images.unsplash.com/photo-1533174000222-edfe3abc5496?q=80&w=2070&auto=format&fit=crop"
              }
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight-blue/90 via-midnight-blue/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
              <div className="max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold border border-white/10">
                    {eventData.categoria}
                  </span>
                  {/* Destacado dinámico (Opcional, podrías añadir un boolean en DB para esto) */}
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4">
                  {eventData.nombre}
                </h1>

                {/* Card del Organizador - Clickeable */}
                <button
                  onClick={() => router.push(`/profile/${eventData.id_empresario}`)}
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20 transition-all duration-300 group cursor-pointer"
                >
                  {/* Foto del Organizador */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        eventData.organizador_avatar ||
                        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop"
                      }
                      alt={eventData.organizador_nombre}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/30 group-hover:border-white/60 transition-all"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-emerald-400 w-4 h-4 rounded-full border-2 border-white"></div>
                  </div>

                  {/* Info del Organizador */}
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-white font-semibold text-base md:text-lg">
                        {eventData.organizador_nombre || "Organizador"}
                      </span>
                      <MdVerified className="text-white text-lg" />
                    </div>
                    <p className="text-white/70 text-xs md:text-sm">
                      {eventData.organizador_username ? `@${eventData.organizador_username}` : "Toca para ver perfil"}
                    </p>
                  </div>
                </button>

                
              </div>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="max-w-4xl mx-auto px-6 md:px-8 py-8">
            {/* Grid de Info Rápida */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-white py-6 px-4 rounded-3xl shadow-sm border border-nimbus-cloud/30 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-form-bg text-midnight-blue flex items-center justify-center">
                  <MdCalendarToday className="text-xl" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-midnight-blue/50 font-bold uppercase tracking-wider mb-0.5">
                    Fecha
                  </p>
                  <p className="text-midnight-blue font-bold text-sm md:text-base capitalize">
                    {formatDate(eventData.fecha)}
                  </p>
                </div>
              </div>
              <div className="bg-white py-6 px-4 rounded-3xl shadow-sm border border-nimbus-cloud/30 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-form-bg text-midnight-blue flex items-center justify-center">
                  <MdSchedule className="text-xl" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-midnight-blue/50 font-bold uppercase tracking-wider mb-0.5">
                    Hora
                  </p>
                  <p className="text-midnight-blue font-bold text-sm md:text-base">
                    {formatTime(eventData.hora)}
                  </p>
                </div>
              </div>
              <div className="bg-white py-6 px-4 rounded-3xl shadow-sm border border-nimbus-cloud/30 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-form-bg text-midnight-blue flex items-center justify-center">
                  <MdLocationOn className="text-xl" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-midnight-blue/50 font-bold uppercase tracking-wider mb-0.5">
                    Lugar
                  </p>
                  <p className="text-midnight-blue font-bold text-sm md:text-base">
                    {eventData.lugar}
                  </p>
                </div>
              </div>
              <div className="bg-white py-6 px-4 rounded-3xl shadow-sm border border-nimbus-cloud/30 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-form-bg text-midnight-blue flex items-center justify-center">
                  <MdPayments className="text-xl" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-midnight-blue/50 font-bold uppercase tracking-wider mb-0.5">
                    Precio
                  </p>
                  <p className="text-midnight-blue font-bold text-sm md:text-base">
                    {eventData.precio === 0 || eventData.precio === null
                      ? "Gratis"
                      : `${eventData.precio}€`}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {deleteMessage && (
                <Alert
                  message={deleteMessage}
                  type="error"
                  onClose={() => setDeleteMessage("")}
                />
              )}

              {/* Sección Descripción */}
              <section className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-nimbus-cloud/30">
                <h2 className="text-2xl font-bold text-midnight-blue mb-6 flex items-center gap-2">
                  <MdInfoOutline className="text-2xl text-midnight-blue/70" />
                  Sobre el evento
                </h2>
                <div className="prose prose-slate max-w-none text-midnight-blue/70 leading-relaxed space-y-5 text-sm md:text-base font-medium whitespace-pre-wrap">
                  {/* whitespace-pre-wrap respeta los saltos de línea introducidos en el textarea */}
                  {eventData.descripcion}
                </div>
              </section>

              {/* Botón CTA */}
              <button
                onClick={handleToggleFavorite}
                disabled={isTogglingFav}
                className={`w-full py-5 rounded-2xl font-bold text-lg shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 ${isFavorite
                  ? "bg-red-50 text-red-500 border border-red-200"
                  : "bg-lemon-icing hover:brightness-95 text-midnight-blue"
                  } ${isTogglingFav ? "opacity-70 cursor-wait" : ""}`}
              >
                {isFavorite ? (
                  <MdFavorite className="text-2xl" />
                ) : (
                  <MdFavoriteBorder className="text-2xl" />
                )}
                <span>
                  {isFavorite ? "En tus favoritos" : "Añadir a favoritos"}
                </span>
              </button>
            </div>

            <div className="h-20"></div>
          </div>
        </div>
      </main>

      {/* ASIDE DERECHO (Escritorio) */}
      <aside className="hidden xl:block w-[320px] bg-white border-l border-nimbus-cloud/40 h-full shadow-[-2px_0_20px_rgba(0,0,0,0.02)] overflow-y-auto shrink-0">
        <div className="flex h-full flex-col gap-8 p-6">
          {rightPanelContentJSX}
        </div>
      </aside>

      {/* OVERLAY PARA MÓVIL: Fondo oscuro cuando el panel está abierto */}
      {isMobilePanelOpen && (
        <div
          className="fixed inset-0 bg-midnight-blue/50 backdrop-blur-sm z-50 xl:hidden transition-opacity"
          onClick={() => setIsMobilePanelOpen(false)}
        />
      )}

      {/* PANEL LATERAL PARA MÓVIL (Drawer) */}
      <div
        className={`fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-white shadow-2xl z-50 xl:hidden flex flex-col transition-transform duration-300 ease-in-out ${isMobilePanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-nimbus-cloud/30">
          <h2 className="text-lg font-bold text-midnight-blue">Info del Evento</h2>
          <button
            onClick={() => setIsMobilePanelOpen(false)}
            className="p-2 text-slate-400 hover:text-midnight-blue hover:bg-lemon-icing/30 rounded-lg transition-colors"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Contenido scrolleable dentro del panel móvil */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          {rightPanelContentJSX}
        </div>
      </div>
    </div>
  );
}
