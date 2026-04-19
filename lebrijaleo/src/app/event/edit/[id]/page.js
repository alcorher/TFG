'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Navbar';
import { createClient } from "@/utils/supabase/client";
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
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
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
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
        alert("Debes iniciar sesión para editar el evento.");
        setIsSaving(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
        alert("¡Evento actualizado con éxito!");
        router.push(`/event/${id}`);
      } else {
        const errorData = await response.json();
        alert(`Error al actualizar: ${errorData.detail || "Revisa los campos."}`);
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Error de conexión al actualizar el evento.");
    } finally {
      setIsSaving(false);
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
        <header className="h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-nimbus-cloud/40">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push(`/event/${id}`)} className="flex items-center gap-2 text-midnight-blue/60 hover:text-midnight-blue transition-colors">
              <MdArrowBack className="text-xl" />
              <span className="font-bold text-sm">Volver al Evento</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-midnight-blue/40 uppercase tracking-wider">EDITAR EVENTO</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
          <div className="max-w-4xl mx-auto">

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-midnight-blue tracking-tight mb-2">
                Editar Evento: {formData.title || "Sin título"}
              </h1>
              <p className="text-midnight-blue/60 font-medium">
                Actualiza la información de tu evento. Los cambios se reflejarán inmediatamente.
              </p>
            </div>

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

            <form onSubmit={handleSubmit} className={`bg-white rounded-3xl shadow-sm border border-nimbus-cloud/40 overflow-hidden ${isPastEvent ? 'opacity-80' : ''}`}>

              {/* SECCIÓN 1: Información básica */}
              <div className="p-8 border-b border-nimbus-cloud/30">
                <h2 className="text-xl font-bold text-midnight-blue mb-6 flex items-center gap-2">
                  <MdInfoOutline className="text-2xl text-midnight-blue/50" /> Información básica
                </h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-midnight-blue/80 mb-2">Título del evento</label>
                      <input
                        name="title" type="text" required value={formData.title} onChange={handleInputChange} disabled={isPastEvent}
                        className="w-full px-4 py-3 bg-form-bg border border-nimbus-cloud/50 rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing transition-all disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-midnight-blue/80 mb-2">Categoría</label>
                      <div className="relative">
                        <select
                          name="category" required value={formData.category} onChange={handleInputChange} disabled={isPastEvent}
                          className="w-full px-4 py-3 bg-form-bg border border-nimbus-cloud/50 rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing transition-all appearance-none disabled:opacity-60"
                        >
                          <option value="" disabled>Selecciona...</option>
                          {AVAILABLE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <MdExpandMore className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-blue/40 pointer-events-none text-2xl" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-midnight-blue/80 mb-2">Fecha y hora</label>
                      <input
                        name="date" type="datetime-local" required value={formData.date} onChange={handleInputChange} disabled={isPastEvent}
                        className={`w-full px-4 py-3 bg-form-bg border rounded-xl text-midnight-blue focus:ring-2 transition-all disabled:opacity-60 ${formErrors.date ? 'border-red-500 focus:ring-red-500' : 'border-nimbus-cloud/50 focus:ring-lemon-icing'}`}
                      />
                      {formErrors.date && <p className="text-red-500 text-xs font-bold mt-2">{formErrors.date}</p>}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-midnight-blue/80 mb-2">Lugar</label>
                      <div className="relative">
                        <MdLocationOn className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-blue/40 pointer-events-none text-xl" />
                        <input
                          name="location" type="text" required value={formData.location} onChange={handleInputChange} disabled={isPastEvent}
                          className="w-full pl-11 pr-4 py-3 bg-form-bg border border-nimbus-cloud/50 rounded-xl text-midnight-blue focus:ring-2 transition-all disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-midnight-blue/80 mb-2">Descripción</label>
                      <textarea
                        name="description" rows="4" required value={formData.description} onChange={handleInputChange} disabled={isPastEvent}
                        className="w-full px-4 py-3 bg-form-bg border border-nimbus-cloud/50 rounded-xl text-midnight-blue focus:ring-2 transition-all resize-y disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: Multimedia */}
              <div className="p-8 border-b border-nimbus-cloud/30">
                <h2 className="text-xl font-bold text-midnight-blue mb-6 flex items-center gap-2">
                  <MdImage className="text-2xl text-midnight-blue/50" /> Multimedia
                </h2>
                <div>
                  <label className="block text-sm font-bold text-midnight-blue/80 mb-3">Imagen de portada</label>
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="w-48 aspect-[4/5] rounded-xl overflow-hidden border border-nimbus-cloud/50 relative group shrink-0">
                      <img alt="Portada actual" className="w-full h-full object-cover" src={imagePreview || "https://images.unsplash.com/photo-1533174000222-edfe3abc5496?q=80&w=2070"} />
                      {!isPastEvent && (
                        <div className="absolute inset-0 bg-midnight-blue/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button type="button" onClick={() => { setImagePreview(""); setImageFile(null); }} className="w-10 h-10 bg-white text-red-500 rounded-full flex items-center justify-center hover:scale-110 shadow-lg">
                            <MdDelete className="text-xl" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-midnight-blue/60 max-w-xs leading-relaxed">
                        Esta imagen aparecerá en la cartelera y en los detalles del evento. Se recomienda formato vertical 4:5.
                      </p>
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isPastEvent} />
                      <div className="flex gap-3 mt-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isPastEvent} className="px-5 py-2.5 bg-white border border-nimbus-cloud text-midnight-blue font-bold rounded-xl hover:bg-cloud-dancer disabled:opacity-50">
                          Cambiar imagen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: Entradas */}
              <div className="p-8">
                <h2 className="text-xl font-bold text-midnight-blue mb-6 flex items-center gap-2">
                  <MdLocalActivity className="text-2xl text-midnight-blue/50" /> Entradas y Precio
                </h2>
                <div className="space-y-6">

                  <div className={`flex items-center justify-between p-5 bg-form-bg rounded-2xl border border-nimbus-cloud/40 ${isPastEvent ? 'opacity-60' : ''}`}>
                    <div>
                      <span className="block font-bold text-midnight-blue">Evento Gratuito</span>
                      <span className="text-sm text-midnight-blue/60 font-medium mt-0.5">Activa esta opción si la entrada es libre</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="isFree" checked={formData.isFree} onChange={handleInputChange} disabled={isPastEvent} className="sr-only peer" />
                      <div className="w-11 h-6 bg-nimbus-cloud peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-nimbus-cloud after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lemon-icing"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-midnight-blue/80 mb-2">Precio de entrada (€)</label>
                      <input
                        name="price" type="number" step="0.01" min="0" value={formData.price} onChange={handleInputChange} disabled={formData.isFree || isPastEvent}
                        className={`w-full px-4 py-3 bg-form-bg border rounded-xl text-midnight-blue focus:ring-2 transition-all disabled:opacity-50 ${formErrors.price ? 'border-red-500 focus:ring-red-500' : 'border-nimbus-cloud/50 focus:ring-lemon-icing'}`}
                      />
                      {formErrors.price && <p className="text-red-500 text-xs font-bold mt-2">{formErrors.price}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-midnight-blue/80 mb-2">Capacidad / Aforo</label>
                      <input
                        name="capacity" type="number" value={formData.capacity} onChange={handleInputChange} disabled={isPastEvent}
                        className="w-full px-4 py-3 bg-form-bg border border-nimbus-cloud/50 rounded-xl text-midnight-blue focus:ring-2 transition-all disabled:opacity-60"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-midnight-blue/80 mb-2">Enlace de venta (Opcional)</label>
                      <input
                        name="ticketLink" type="url" placeholder="https://..." value={formData.ticketLink} onChange={handleInputChange} disabled={isPastEvent}
                        className="w-full px-4 py-3 bg-form-bg border border-nimbus-cloud/50 rounded-xl text-midnight-blue focus:ring-2 transition-all disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Guardar / Cancelar */}
              <div className="p-8 pt-0 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                <button type="button" disabled={isPastEvent} className="text-sm font-bold text-red-500 hover:text-red-700 hover:underline transition-colors w-full sm:w-auto text-left disabled:opacity-50 disabled:hover:no-underline">
                  Eliminar evento permanentemente
                </button>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button type="button" disabled={isSaving} onClick={() => router.push(`/event/${id}`)} className="flex-1 sm:flex-none px-6 py-3 rounded-xl border bg-white text-midnight-blue font-bold hover:bg-cloud-dancer disabled:opacity-50">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving || isPastEvent} className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-lemon-icing text-midnight-blue font-bold hover:brightness-95 disabled:opacity-50">
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            </form>
            <div className="h-12"></div>
          </div>
        </div>
      </main>

      {/* ASIDE DERECHO (Ayuda y Estado) */}
      <aside className="w-80 bg-white border-l border-nimbus-cloud/40 p-6 flex flex-col gap-6 h-full shadow-[-2px_0_20px_rgba(0,0,0,0.02)] overflow-y-auto hidden xl:flex shrink-0">

        <div className="bg-white border border-nimbus-cloud/40 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-midnight-blue/50 uppercase tracking-wider mb-4">Estado del evento</h3>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            <span className="text-green-600 font-bold text-lg">Publicado</span>
          </div>
          <button className="w-full py-2.5 px-4 border border-nimbus-cloud/50 rounded-xl text-sm font-bold text-midnight-blue/70 hover:bg-cloud-dancer hover:text-midnight-blue transition-colors">
            Pasar a borrador
          </button>
        </div>

      

        <div className="mt-auto bg-nimbus-cloud rounded-3xl p-6 relative overflow-hidden text-midnight-blue border border-nimbus-cloud/40">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/50 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-midnight-blue mb-1 shadow-sm">
              <MdLightbulbOutline className="text-xl" />
            </div>
            <div>
              <h4 className="font-bold text-lg leading-tight mb-2 text-midnight-blue">Consejos rápidos</h4>
              <ul className="text-midnight-blue/70 text-sm leading-relaxed list-disc pl-4 space-y-1 font-medium">
                <li>El cartel debe verse bien en horizontal (16:9).</li>
                <li>Verifica siempre la hora exacta.</li>
                <li>Escribe un título corto y llamativo.</li>
              </ul>
            </div>
          </div>
        </div>

      </aside>
    </div>
  );
}