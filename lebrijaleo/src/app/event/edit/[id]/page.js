'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Navbar';
import { Alert } from '@/components/ui/alert';
import { createClient } from "@/utils/supabase/client";
import { getFriendlyErrorMessage } from "@/lib/utils";
import {
  MdArrowBack, MdInfoOutline, MdExpandMore, MdLocationOn,
  MdImage, MdDelete, MdLocalActivity, MdLightbulbOutline,
  MdArrowForward, MdWarning
} from "react-icons/md";

const AVAILABLE_CATEGORIES = ["Cultura", "Música", "Gastronomía", "Arte", "Deporte", "Teatro"];

export default function EditEventPage({ params }) {
  const router = useRouter();
  const { id } = useParams(params);
  const fileInputRef = useRef(null);
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState("info");

  // Nuevos estados para las reglas de negocio
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isPastEvent, setIsPastEvent] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    date: "",
    description: "",
    location: "",
    price: "",
    capacity: "",
    ticketLink: "",
    isFree: false,
  });

  // --- EFECTO PARA CARGAR LOS DATOS DEL EVENTO A EDITAR ---
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://lebrijaleo-backend.onrender.com";

        const response = await fetch(`${API_URL}/api/eventos/${id}`);
        if (!response.ok) {
          throw new Error("No se pudo cargar el evento");
        }

        const data = await response.json();

        // Comprobar permisos
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const userId = session.user.id;
        if (userId !== data.id_empresario && userId !== data.empresario_creado_por) {
          setError("No tienes permisos para editar este evento.");
          setIsLoading(false);
          return;
        }

        let formattedDate = "";
        if (data.fecha && data.hora) {
          formattedDate = `${data.fecha}T${data.hora.substring(0, 5)}`;

          // REGLA DE NEGOCIO (RN-005): Comprobar si el evento ya pasó
          const eventDateTime = new Date(formattedDate);
          if (eventDateTime < new Date()) {
            setIsPastEvent(true);
          }
        }

        setFormData({
          title: data.nombre || "",
          category: data.categoria || "",
          date: formattedDate,
          description: data.descripcion || "",
          location: data.lugar || "",
          price: data.precio === 0 ? "0" : (data.precio?.toString() || ""),
          capacity: data.aforo_max?.toString() || "",
          ticketLink: data.ticketLink || "",
          isFree: data.precio === 0,
        });

        if (data.cartel_url) {
          setImagePreview(data.cartel_url);
        }

      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Error al cargar el evento.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Limpiar error específico al escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        price: checked ? "0" : prev.price,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Validación Frontend antes de enviar (RU-005, RN-008, Fechas)
  const validateForm = () => {
    const errors = {};
    const now = new Date();
    const selectedDate = new Date(formData.date);

    // RN-008: Transparencia de costes (Precio obligatorio)
    if (!formData.isFree && (!formData.price || parseFloat(formData.price) <= 0)) {
      errors.price = "El precio es obligatorio y debe ser mayor a 0€.";
    }

    // Fechas válidas: La nueva fecha no puede estar en el pasado
    if (selectedDate < now && !isPastEvent) {
      errors.date = "La fecha seleccionada no puede ser anterior al día de hoy.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isPastEvent) return; // Doble validación de seguridad
    if (!validateForm()) return; // Detener si hay errores de validación

    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setAlertMessage("Debes iniciar sesión para editar el evento.");
        setAlertType("error");
        setIsSaving(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://lebrijaleo-backend.onrender.com";

      const dataToSend = new FormData();
      if (imageFile) dataToSend.append("banner", imageFile);
      dataToSend.append("title", formData.title);
      dataToSend.append("category", formData.category);
      dataToSend.append("date", formData.date);
      dataToSend.append("description", formData.description);
      dataToSend.append("location", formData.location);
      dataToSend.append("price", formData.price || "0");
      dataToSend.append("capacity", formData.capacity || "");
      dataToSend.append("ticketLink", formData.ticketLink || "");
      dataToSend.append("isFree", formData.isFree ? "true" : "false");

      const response = await fetch(`${API_URL}/api/eventos/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: dataToSend,
      });

      if (response.ok) {
        setAlertMessage("¡Evento actualizado con éxito!");
        setAlertType("success");
        setTimeout(() => router.push(`/event/${id}`), 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setAlertMessage(getFriendlyErrorMessage(errorData, "No se ha podido actualizar el evento. Revisa los campos e inténtalo de nuevo."));
        setAlertType("error");
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      setAlertMessage("No se ha podido conectar con el servidor para actualizar el evento.");
      setAlertType("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (isDeleting) return;

    const confirmed = window.confirm("¿Seguro que quieres eliminar este evento? Esta acción no se puede deshacer.");
    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setAlertMessage("Debes iniciar sesión para eliminar el evento.");
        setAlertType("error");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://lebrijaleo-backend.onrender.com";
      const response = await fetch(`${API_URL}/api/eventos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        router.push("/myEvents");
        return;
      }

      const errorData = await response.json().catch(() => ({}));
      setAlertMessage(getFriendlyErrorMessage(errorData, "No se ha podido eliminar el evento. Revisa tus permisos e inténtalo de nuevo."));
      setAlertType("error");
    } catch (error) {
      console.error("Error deleting event:", error);
      setAlertMessage("No se ha podido conectar con el servidor para eliminar el evento.");
      setAlertType("error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-cloud-dancer h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-lemon-icing border-t-midnight-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-cloud-dancer h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-midnight-blue mb-4">{error}</h2>
        <button onClick={() => router.push("/home")} className="px-6 py-3 bg-lemon-icing text-midnight-blue font-bold rounded-xl">Volver</button>
      </div>
    );
  }

  return (
    <div className="bg-cloud-dancer text-midnight-blue font-display antialiased overflow-hidden h-screen flex">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-form-bg relative">
        <header className="h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-nimbus-cloud/50">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => router.push(`/event/${id}`)} className="p-2 text-midnight-blue/50 hover:text-midnight-blue hover:bg-lemon-icing/40 rounded-lg transition-colors flex items-center gap-2">
              <MdArrowBack className="text-xl" />
              <span className="font-bold text-sm hidden sm:inline">Volver al Evento</span>
            </button>
            <h1 className="text-xl font-bold text-midnight-blue">
              Editar Evento
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="max-w-4xl mx-auto">
            {alertMessage && (
              <div className="mb-6">
                <Alert
                  message={alertMessage}
                  type={alertType}
                  onClose={() => setAlertMessage(null)}
                />
              </div>
            )}

            {/* AVISO DE EVENTO PASADO (RN-005) */}
            {isPastEvent && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
                <MdWarning className="text-red-500 text-xl shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-800 font-bold">Evento finalizado</h3>
                  <p className="text-red-600 text-sm mt-1">Los eventos pasados no se pueden modificar para mantener la integridad de los datos de la cartelera.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* SECCIÓN 1: Información básica */}
              <div className={`bg-white rounded-2xl shadow-sm border border-nimbus-cloud/40 overflow-hidden ${isPastEvent ? 'opacity-80' : ''}`}>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-cloud-dancer flex items-center justify-center text-midnight-blue/70">
                      <MdInfoOutline className="text-xl" />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-midnight-blue">
                        Información básica
                      </h2>
                      <p className="text-sm text-midnight-blue/60">
                        Detalles principales del evento.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-midnight-blue/90" htmlFor="event-title">
                        Título del evento
                      </label>
                      <input
                        id="event-title"
                        name="title" type="text" required value={formData.title} onChange={handleInputChange} disabled={isPastEvent}
                        className="w-full px-4 py-3 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing/80 focus:border-lemon-icing transition-all disabled:opacity-60 placeholder:text-midnight-blue/40"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-midnight-blue/90" htmlFor="event-category">
                          Categoría
                        </label>
                        <div className="relative">
                          <select
                            id="event-category"
                            name="category" required value={formData.category} onChange={handleInputChange} disabled={isPastEvent}
                            className="w-full px-4 py-3 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing/80 focus:border-lemon-icing transition-all appearance-none cursor-pointer disabled:opacity-60"
                          >
                            <option value="" disabled>Selecciona una categoría</option>
                            {AVAILABLE_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-midnight-blue/50">
                            <MdExpandMore className="text-2xl" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-midnight-blue/90" htmlFor="event-date">
                          Fecha y hora
                        </label>
                        <div className="relative">
                          <input
                            id="event-date"
                            name="date" type="datetime-local" required value={formData.date} onChange={handleInputChange} disabled={isPastEvent}
                            className={`w-full px-4 py-3 bg-white border rounded-xl text-midnight-blue focus:ring-2 transition-all disabled:opacity-60 placeholder:text-midnight-blue/40 ${formErrors.date ? 'border-red-500 focus:ring-red-500' : 'border-nimbus-cloud focus:ring-lemon-icing/80 focus:border-lemon-icing'}`}
                          />
                        </div>
                        {formErrors.date && <p className="text-red-500 text-xs font-bold mt-1">{formErrors.date}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-midnight-blue/90" htmlFor="event-description">
                        Descripción
                      </label>
                      <textarea
                        id="event-description"
                        name="description" rows="4" required value={formData.description} onChange={handleInputChange} disabled={isPastEvent}
                        className="w-full px-4 py-3 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing/80 focus:border-lemon-icing transition-all resize-y disabled:opacity-60 min-h-[160px] placeholder:text-midnight-blue/40"
                      />
                      <p className="text-xs text-midnight-blue/50 text-right">
                        {formData.description.length}/500 caracteres
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-midnight-blue/90" htmlFor="event-location">
                        Lugar
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-blue/50 pointer-events-none flex items-center">
                          <MdLocationOn className="text-xl" />
                        </div>
                        <input
                          id="event-location"
                          name="location" type="text" required value={formData.location} onChange={handleInputChange} disabled={isPastEvent}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing/80 focus:border-lemon-icing transition-all disabled:opacity-60 placeholder:text-midnight-blue/40"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: Entradas y Precio */}
              <div className={`bg-white rounded-2xl shadow-sm border border-nimbus-cloud/40 overflow-hidden ${isPastEvent ? 'opacity-80' : ''}`}>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-cloud-dancer flex items-center justify-center text-midnight-blue/70">
                      <MdLocalActivity className="text-xl" />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-midnight-blue">
                        Entradas y Precio
                      </h2>
                      <p className="text-sm text-midnight-blue/60">
                        Gestiona la capacidad y el coste de las entradas.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-6 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-bold text-midnight-blue/90" htmlFor="event-price">
                          Precio de entrada
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-midnight-blue/70 font-medium cursor-pointer select-none" htmlFor="is-free">
                            Gratis
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              id="is-free"
                              type="checkbox"
                              name="isFree"
                              checked={formData.isFree}
                              onChange={handleInputChange}
                              disabled={isPastEvent}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-nimbus-cloud peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-nimbus-cloud after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lemon-icing"></div>
                          </label>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-blue/50 pointer-events-none flex items-center font-bold">
                          €
                        </div>
                        <input
                          id="event-price"
                          name="price" type="number" step="0.01" min="0" value={formData.price} onChange={handleInputChange} disabled={formData.isFree || isPastEvent}
                          className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-midnight-blue focus:ring-2 disabled:bg-cloud-dancer disabled:text-midnight-blue/40 transition-all placeholder:text-midnight-blue/40 ${formErrors.price ? 'border-red-500 focus:ring-red-500' : 'border-nimbus-cloud focus:ring-lemon-icing/80 focus:border-lemon-icing'}`}
                        />
                      </div>
                      {formErrors.price && <p className="text-red-500 text-xs font-bold mt-1">{formErrors.price}</p>}
                    </div>

                    <div className="md:col-span-6 space-y-2">
                      <label className="block text-sm font-bold text-midnight-blue/90" htmlFor="event-capacity">
                        Capacidad / Aforo
                      </label>
                      <div className="relative">
                        <input
                          id="event-capacity"
                          name="capacity" type="number" value={formData.capacity} onChange={handleInputChange} disabled={isPastEvent}
                          className="w-full px-4 py-3 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing/80 focus:border-lemon-icing transition-all disabled:opacity-60 placeholder:text-midnight-blue/40"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-12 space-y-2">
                      <label className="block text-sm font-bold text-midnight-blue/90" htmlFor="event-tickets">
                        Enlace de venta (Opcional)
                      </label>
                      <div className="relative">
                        <input
                          id="event-tickets"
                          name="ticketLink" type="url" placeholder="https://..." value={formData.ticketLink} onChange={handleInputChange} disabled={isPastEvent}
                          className="w-full px-4 py-3 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing/80 focus:border-lemon-icing transition-all disabled:opacity-60 placeholder:text-midnight-blue/40"
                        />
                      </div>
                      <p className="text-xs text-midnight-blue/60">
                        Si vendes entradas en otra plataforma (Eventbrite, Ticketmaster, etc.), pega el enlace aquí.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: Multimedia (Imagen del Cartel) */}
              <div className={`bg-white rounded-2xl shadow-sm border border-nimbus-cloud/40 overflow-hidden ${isPastEvent ? 'opacity-80' : ''}`}>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-cloud-dancer flex items-center justify-center text-midnight-blue/70">
                      <MdImage className="text-xl" />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-midnight-blue">
                        Multimedia
                      </h2>
                      <p className="text-sm text-midnight-blue/60">
                        Añade imágenes para hacer tu evento más atractivo.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="w-48 aspect-[4/5] rounded-xl overflow-hidden border border-nimbus-cloud/50 relative group shrink-0 bg-form-bg">
                      <img alt="Portada actual" className="w-full h-full object-cover" src={imagePreview || "https://images.unsplash.com/photo-1533174000222-edfe3abc5496?q=80&w=2070"} />
                      {!isPastEvent && (
                        <div className="absolute inset-0 bg-midnight-blue/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button type="button" onClick={() => { setImagePreview(""); setImageFile(null); }} className="w-10 h-10 bg-white text-red-500 rounded-full flex items-center justify-center hover:scale-110 shadow-lg transition-transform">
                            <MdDelete className="text-xl" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-midnight-blue/60 max-w-xs leading-relaxed">
                        Esta imagen aparecerá en la cartelera y en los detalles del evento. Se recomienda formato horizontal 16:9.
                      </p>
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isPastEvent} />
                      <div className="flex gap-3 mt-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isPastEvent} className="px-5 py-2.5 bg-white border border-nimbus-cloud text-midnight-blue font-bold rounded-xl hover:bg-cloud-dancer disabled:opacity-50 transition-colors">
                          Cambiar imagen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Guardar / Cancelar */}
              <div className="flex items-center justify-between gap-4 pt-4 pb-12">
                <button type="button" onClick={handleDeleteEvent} disabled={isDeleting} className="text-sm font-bold text-red-500 hover:text-red-700 hover:underline transition-colors w-full sm:w-auto text-left disabled:opacity-50 disabled:hover:no-underline">
                  Eliminar evento
                </button>
                <div className="flex items-center gap-4">
                  <button type="button" disabled={isSaving} onClick={() => router.push(`/event/${id}`)} className="px-6 py-3 bg-white border border-nimbus-cloud text-midnight-blue/80 font-bold rounded-xl hover:bg-cloud-dancer hover:text-midnight-blue transition-all shadow-sm disabled:opacity-50">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving || isPastEvent} className="px-8 py-3 bg-lemon-icing hover:brightness-95 text-midnight-blue font-bold rounded-xl shadow-lg shadow-lemon-icing/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0">
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* ASIDE DERECHO (Ayuda y Estado) */}
      <aside className="hidden xl:block w-80 bg-white border-l border-nimbus-cloud/40 h-full shadow-[-2px_0_20px_rgba(0,0,0,0.02)] overflow-y-auto shrink-0">
        <div className="flex h-full flex-col justify-between gap-6 p-6">
          <div className="bg-white border border-nimbus-cloud/40 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-midnight-blue/50 uppercase tracking-wider mb-4">Estado del evento</h3>
            <div className="flex items-center gap-3 ">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              <span className="text-green-600 font-bold text-lg">Publicado</span>
            </div>
          </div>

          <div className="bg-nimbus-cloud/40 rounded-2xl p-6 relative overflow-hidden shadow-sm">
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-midnight-blue text-white flex items-center justify-center shrink-0 shadow-lg shadow-midnight-blue/20">
                <MdLightbulbOutline className="text-xl" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-midnight-blue mb-2">Consejos rápidos</h4>
                <ul className="text-sm text-midnight-blue/80 space-y-2 list-disc list-inside marker:text-midnight-blue/50">
                  <li>El cartel debe verse bien en horizontal (16:9).</li>
                  <li>Verifica siempre la hora exacta.</li>
                  <li>Escribe un título corto y llamativo.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}