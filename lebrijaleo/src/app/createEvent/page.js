"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/layout/Navbar";
import { Alert } from "@/components/ui/alert";

import { createClient } from "@/utils/supabase/client";
import { getFriendlyErrorMessage } from "@/lib/utils";

// Importamos todos los iconos necesarios desde react-icons

import {
  MdMenu,
  MdSpaceDashboard,
  MdInfoOutline,
  MdExpandMore,
  MdCalendarToday,
  MdLocationOn,
  MdLocalActivity,
  MdGroups,
  MdLink,
  MdImage,
  MdCloudUpload,
  MdEdit,
  MdLightbulbOutline,
  MdHelpOutline,
  MdCheckCircleOutline,
} from "react-icons/md";

const AVAILABLE_CATEGORIES = [
  "Música",
  "Teatro",
  "Gastronomía",
  "Arte",
  "Deporte",
  "Cultura",
];

export default function CreateEventPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef(null);

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

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState("info");
  const minDateTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        isFree: checked,
        price: checked ? "0" : prev.price,
      }));
    } else {
      const keyMap = {
        "event-title": "title",
        "event-category": "category",
        "event-date": "date",
        "event-description": "description",
        "event-location": "location",
        "event-price": "price",
        "event-capacity": "capacity",
        "event-tickets": "ticketLink",
      };

      const key = keyMap[id];

      if (key) {
        setFormData((prev) => ({ ...prev, [key]: value }));
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setImageFile(file);

      const previewUrl = URL.createObjectURL(file);

      setImagePreview(previewUrl);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      setAlertMessage("Por favor, sube una imagen de portada para tu evento.");
      setAlertType("warning");
      return;
    }

    // 1. OBTENEMOS EL TOKEN DEL USUARIO LOGUEADO

    // (Asegúrate de importar tu cliente de supabase arriba)

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    if (!token) {
      setAlertMessage("Debes iniciar sesión para publicar un evento.");
      setAlertType("error");
      return;
    }

    if (!formData.date) {
      setAlertMessage("Selecciona una fecha y hora para el evento.");
      setAlertType("warning");
      return;
    }

    const selectedDate = new Date(formData.date);
    if (Number.isNaN(selectedDate.getTime())) {
      setAlertMessage("La fecha seleccionada no es válida.");
      setAlertType("error");
      return;
    }

    if (selectedDate < new Date()) {
      setAlertMessage("No puedes crear eventos con una fecha ya pasada.");
      setAlertType("warning");
      return;
    }

    const dataToSend = new FormData();

    dataToSend.append("banner", imageFile);

    Object.keys(formData).forEach((key) => {
      dataToSend.append(key, formData[key]);
    });

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "https://lebrijaleo-backend.onrender.com";

      const response = await fetch(`${API_URL}/api/eventos`, {
        method: "POST",

        // 2. ENVIAMOS EL TOKEN AL BACKEND

        headers: {
          Authorization: `Bearer ${token}`,
        },

        body: dataToSend,
      });

      if (response.ok) {
        const result = await response.json();

        setAlertMessage("¡Evento publicado con éxito en LebriJaleo!");
        setAlertType("success");
        const createdEvent = Array.isArray(result.data) ? result.data[0] : result.data;
        setTimeout(() => {
          if (createdEvent?.id_evento) {
            router.push(`/event/${createdEvent.id_evento}`);
          } else {
            router.push("/myEvents");
          }
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setAlertMessage(getFriendlyErrorMessage(errorData, "No se ha podido publicar el evento. Revisa los campos e inténtalo de nuevo."));
        setAlertType("error");
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setAlertMessage("No se ha podido conectar con el servidor para publicar el evento.");
      setAlertType("error");
    }
  };

  return (
    <div className="bg-cloud-dancer text-midnight-blue font-display antialiased overflow-hidden h-screen flex">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-form-bg relative">
        <header className="h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-nimbus-cloud/50">
          <div className="flex items-center gap-4 flex-1">
           

            <h1 className="text-xl font-bold text-midnight-blue">
              Publicar nuevo evento
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
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* SECCIÓN 1: Información básica */}

              <div className="bg-white rounded-2xl shadow-sm border border-nimbus-cloud/40 overflow-hidden">
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
                      <label
                        className="block text-sm font-bold text-midnight-blue/90"
                        htmlFor="event-title"
                      >
                        Título del evento
                      </label>

                      <input
                        id="event-title"
                        type="text"
                        placeholder="Ej: Concierto de Jazz en la Plaza"
                        required
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing/80 focus:border-lemon-icing transition-all placeholder:text-midnight-blue/40"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label
                          className="block text-sm font-bold text-midnight-blue/90"
                          htmlFor="event-category"
                        >
                          Categoría
                        </label>

                        <div className="relative">
                          <select
                            id="event-category"
                            required
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing/80 focus:border-lemon-icing transition-all appearance-none cursor-pointer"
                          >
                            <option value="" disabled>
                              Selecciona una categoría
                            </option>

                            {AVAILABLE_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>

                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-midnight-blue/50">
                            <MdExpandMore className="text-2xl" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          className="block text-sm font-bold text-midnight-blue/90"
                          htmlFor="event-date"
                        >
                          Fecha y hora
                        </label>

                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-blue/50 pointer-events-none flex items-center">
                            <MdCalendarToday className="text-xl" />
                          </div>

                          <input
                            id="event-date"
                            type="datetime-local"
                            required
                            min={minDateTime}
                            value={formData.date}
                            onChange={handleInputChange}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing/80 focus:border-lemon-icing transition-all placeholder:text-midnight-blue/40"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="block text-sm font-bold text-midnight-blue/90"
                        htmlFor="event-description"
                      >
                        Descripción
                      </label>

                      <textarea
                        id="event-description"
                        placeholder="Describe de qué trata el evento, quiénes actúan, qué incluye la entrada..."
                        required
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing/80 focus:border-lemon-icing transition-all placeholder:text-midnight-blue/40 min-h-[160px] resize-y"
                      />

                      <p className="text-xs text-midnight-blue/50 text-right">
                        {formData.description.length}/500 caracteres
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="block text-sm font-bold text-midnight-blue/90"
                        htmlFor="event-location"
                      >
                        Lugar
                      </label>

                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-blue/50 pointer-events-none flex items-center">
                          <MdLocationOn className="text-xl" />
                        </div>

                        <input
                          id="event-location"
                          type="text"
                          placeholder="Buscar ubicación..."
                          required
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing/80 focus:border-lemon-icing transition-all placeholder:text-midnight-blue/40"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: Entradas y Precio */}

              <div className="bg-white rounded-2xl shadow-sm border border-nimbus-cloud/40 overflow-hidden">
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
                        <label
                          className="block text-sm font-bold text-midnight-blue/90"
                          htmlFor="event-price"
                        >
                          Precio de entrada
                        </label>
                        <div className="flex items-center gap-2">
                          <label
                            className="text-sm text-midnight-blue/70 font-medium cursor-pointer select-none"
                            htmlFor="is-free"
                          >
                            Gratis
                          </label>

                          {/* --- TOGGLE ANIMADO CORREGIDO --- */}
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              id="is-free"
                              type="checkbox"
                              name="is-free"
                              checked={formData.isFree}
                              onChange={handleInputChange}
                              className="sr-only peer"
                            />
                            {/* Pista (fondo) */}
                            <div className="w-11 h-6 bg-nimbus-cloud peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-nimbus-cloud after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lemon-icing"></div>
                          </label>
                          {/* -------------------------------- */}
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-blue/50 pointer-events-none flex items-center font-bold">
                          €
                        </div>

                        <input
                          id="event-price"
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={handleInputChange}
                          disabled={formData.isFree}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing/80 focus:border-lemon-icing disabled:bg-cloud-dancer disabled:text-midnight-blue/40 transition-all placeholder:text-midnight-blue/40"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-6 space-y-2">
                      <label
                        className="block text-sm font-bold text-midnight-blue/90"
                        htmlFor="event-capacity"
                      >
                        Capacidad / Aforo
                      </label>

                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-blue/50 pointer-events-none flex items-center">
                          <MdGroups className="text-xl" />
                        </div>

                        <input
                          id="event-capacity"
                          type="number"
                          placeholder="Ej: 150 personas"
                          min="1"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing/80 focus:border-lemon-icing transition-all placeholder:text-midnight-blue/40"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-12 space-y-2">
                      <label
                        className="block text-sm font-bold text-midnight-blue/90"
                        htmlFor="event-tickets"
                      >
                        Enlace de venta (Opcional)
                      </label>

                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-blue/50 pointer-events-none flex items-center">
                          <MdLink className="text-xl" />
                        </div>

                        <input
                          id="event-tickets"
                          type="url"
                          placeholder="https://tusitio.com/venta-entradas"
                          value={formData.ticketLink}
                          onChange={handleInputChange}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue focus:ring-2 focus:ring-lemon-icing/80 focus:border-lemon-icing transition-all placeholder:text-midnight-blue/40"
                        />
                      </div>

                      <p className="text-xs text-midnight-blue/60">
                        Si vendes entradas en otra plataforma (Eventbrite,
                        Ticketmaster, etc.), pega el enlace aquí.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: Multimedia (Imagen del Cartel) */}

              <div className="bg-white rounded-2xl shadow-sm border border-nimbus-cloud/40 overflow-hidden">
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

                  <div
                    onClick={triggerFileInput}
                    className="border-2 border-dashed border-nimbus-cloud rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-cloud-dancer transition-colors cursor-pointer group relative overflow-hidden"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />

                    {imagePreview ? (
                      <div className="relative w-full max-w-sm aspect-[4/5] rounded-lg overflow-hidden border border-nimbus-cloud">
                        <img
                          src={imagePreview}
                          alt="Cartel del evento"
                          className="w-full h-full object-cover"
                        />

                        <div className="absolute inset-0 bg-midnight-blue/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white font-bold flex items-center gap-2">
                            <MdEdit className="text-xl" /> Cambiar imagen
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-form-bg rounded-full flex items-center justify-center mb-4 text-midnight-blue/40 group-hover:text-midnight-blue group-hover:bg-lemon-icing/40 transition-all">
                          <MdCloudUpload className="text-4xl" />
                        </div>

                        <h3 className="font-bold text-midnight-blue mb-1">
                          Sube una imagen de portada
                        </h3>

                        <p className="text-sm text-midnight-blue/60 mb-4">
                          Recomendamos formato vertical 4:5
                        </p>

                        <button
                          type="button"
                          className="text-sm font-bold text-midnight-blue bg-lemon-icing px-4 py-2 rounded-lg hover:brightness-95 transition-all"
                        >
                          Seleccionar archivo
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones Finales */}

              <div className="flex items-center justify-end gap-4 pt-4 pb-12">
                <button
                  type="button"
                  className="px-6 py-3 bg-white border border-nimbus-cloud text-midnight-blue/80 font-bold rounded-xl hover:bg-cloud-dancer hover:text-midnight-blue transition-all shadow-sm"
                >
                  Guardar como borrador
                </button>

                <button
                  type="submit"
                  className="px-8 py-3 bg-lemon-icing hover:brightness-95 text-midnight-blue font-bold rounded-xl shadow-lg shadow-lemon-icing/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                  <span>Publicar evento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* ASIDE DERECHO (Consejos) */}

      <aside className="w-80 bg-white border-l border-nimbus-cloud/40 p-6 flex flex-col gap-6 h-full shadow-[-2px_0_20px_rgba(0,0,0,0.02)] overflow-y-auto hidden xl:flex shrink-0">
        <div className="bg-nimbus-cloud/40 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-midnight-blue text-white flex items-center justify-center shrink-0 shadow-lg shadow-midnight-blue/20">
              <MdLightbulbOutline className="text-xl" />
            </div>

            <div className="flex-1">
              <h4 className="font-bold text-midnight-blue mb-2">
                Consejos de publicación
              </h4>

              <ul className="text-sm text-midnight-blue/80 space-y-2 list-disc list-inside marker:text-midnight-blue/50">
                <li>Usa un título corto y llamativo.</li>

                <li>Añade una descripción detallada.</li>

                <li>Elige una imagen de alta calidad.</li>

                <li>Verifica la ubicación en el mapa.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-nimbus-cloud/40 p-6 shadow-sm">
          <h3 className="font-bold text-midnight-blue mb-4 flex items-center gap-2">
            <MdHelpOutline className="text-xl text-midnight-blue" />
            Ayuda rápida
          </h3>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="shrink-0 mt-1">
                <MdCheckCircleOutline className="text-lg text-nimbus-cloud" />
              </div>

              <div>
                <h5 className="text-sm font-bold text-midnight-blue/90">
                  ¿Cuándo se publica?
                </h5>

                <p className="text-xs text-midnight-blue/60 mt-1">
                  Tu evento será revisado y publicado en un máximo de 24 horas.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="shrink-0 mt-1">
                <MdEdit className="text-lg text-nimbus-cloud" />
              </div>

              <div>
                <h5 className="text-sm font-bold text-midnight-blue/90">
                  ¿Puedo editarlo después?
                </h5>

                <p className="text-xs text-midnight-blue/60 mt-1">
                  Sí, podrás modificar la información desde tu panel de "Mis
                  Eventos".
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
