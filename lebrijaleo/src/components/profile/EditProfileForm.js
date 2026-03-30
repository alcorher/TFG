"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  MdArrowBack,
  MdMenu,
  MdPhotoCamera,
  MdEdit,
  MdPerson,
  MdAlternateEmail,
  MdLocationOn,
  MdExpandMore,
  MdSave,
} from "react-icons/md";

export default function EditProfileForm() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [userId, setUserId] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "",
    username: "",
    biografia: "",
    ubicacion: "Lebrija, Sevilla",
  });

  // 1. Cargar los datos del usuario al entrar a la página
  useEffect(() => {
    async function loadUserProfile() {
      // Obtenemos el usuario autenticado
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData?.user) {
        router.push("/login"); // Si no está logueado, lo echamos al login
        return;
      }

      const uid = authData.user.id;
      setUserId(uid);

      // Buscamos sus datos en la tabla pública 'usuarios'
      const { data: userProfile, error: profileError } = await supabase
        .from("usuarios")
        .select("nombre, username, biografia, ubicacion")
        .eq("id_usuario", uid)
        .single();

      if (userProfile) {
        setFormData({
          nombre: userProfile.nombre || "",
          username: userProfile.username || "",
          biografia: userProfile.biografia || "",
          ubicacion: userProfile.ubicacion || "Lebrija, Sevilla",
        });
      }
      setIsFetching(false);
    }

    loadUserProfile();
  }, [router, supabase]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Guardar los cambios en la base de datos
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("usuarios")
      .update({
        nombre: formData.nombre,
        username: formData.username,
        biografia: formData.biografia,
        ubicacion: formData.ubicacion,
      })
      .eq("id_usuario", userId);

    setIsLoading(false);

    if (error) {
      alert("Hubo un error al guardar: " + error.message);
    } else {
      alert("¡Perfil actualizado con éxito!");
    }
  };

  if (isFetching) {
    return (
      <main className="flex-1 flex items-center justify-center bg-form-bg">
        <div className="w-8 h-8 border-4 border-lemon-icing border-t-midnight-blue rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-form-bg relative">
      {/* Cabecera */}
      <header className="h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200/60">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-midnight-blue hover:bg-lemon-icing/30 rounded-lg transition-colors"
          >
            <MdArrowBack className="text-2xl" />
          </button>
          <h2 className="text-lg font-bold text-midnight-blue">
            Editar Perfil
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-midnight-blue hover:bg-lemon-icing/30 rounded-lg transition-colors xl:hidden">
            <MdMenu className="text-2xl" />
          </button>
        </div>
      </header>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Portada y Foto */}
        <div className="relative w-full h-80 group cursor-pointer">
          <div className="absolute inset-0 bg-midnight-blue">
            <img
              alt="Sunset over Lebrija"
              className="w-full h-full object-cover opacity-80"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqWHoynpoFZdVEdAzRUIaWkhf63j3SYVpxt6HM-1EIxFn0ssH-gDpROW2lL4V8yUd30w16JynNYHSTZO0BsVDlICHXYZkyIMpg86sqavDP8mjI4EU935hPEMi_npl8hfXWdl1TWdN2EBgNM_-AEqK15mDGlT3LPV5jjx02JzX8BxZd6wqdjpEaUrZy40NYZQw3kD7kRrDevF5tUPagmVDhp-LgiYIhJAAicTtvyhu5cRdTO5HoHiQDe7l9J1sFKUiV25zWAB8jJ-iQ"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          </div>
          <div className="absolute top-4 right-4 z-20">
            <button className="flex items-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-lg transition-all border border-white/20 shadow-lg">
              <MdPhotoCamera className="text-xl" />
              <span className="text-sm font-semibold">Cambiar portada</span>
            </button>
          </div>
          <div className="absolute bottom-0 left-0 w-full px-8 pb-8 pt-20">
            <div className="flex items-end gap-6 max-w-7xl mx-auto">
              <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-2xl shrink-0 bg-white group/avatar cursor-pointer">
                <img
                  alt="User Avatar"
                  className="w-full h-full object-cover rounded-full"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7JPPUwco9QXD2BSlvAtaKxJoAGHJfu949TDUjtUk6h8ezR3JpeYlcSxv5EDtZehRKEUdEvKwFgXpgaIA10bxESTLmi95-1pawRGoIA-k3sa55iWHyHnHe6dgxffHL1D352F8ZgnYpz-kz5SdilVhPBfmYU3Ds7Gei-yLrCQb0PBHPd9ngiLJj0Ui-wOA71TvonOiskqtYBiBPeYf0AFn385l1UmKwtGPkE6OR38M9DP2vlovPDcyLScbEeWTzxANhYlzT7cVHrrFY"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 backdrop-blur-[2px]">
                  <MdEdit className="text-white text-3xl" />
                </div>
              </div>
              <div className="pb-2 text-white drop-shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {formData.nombre || "Usuario"}
                  </h1>
                </div>
                <p className="text-slate-100 max-w-2xl text-lg font-medium leading-relaxed opacity-90 truncate">
                  {formData.biografia || "Aún no hay biografía."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="bg-white rounded-2xl border border-nimbus-cloud/40 shadow-sm p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-2xl font-bold text-midnight-blue">
                  Configuración de Perfil
                </h3>
                <p className="text-slate-500 mt-1">
                  Actualiza tu información personal y cómo te ven los demás.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Nombre */}
                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-midnight-blue"
                    htmlFor="nombre"
                  >
                    Nombre completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MdPerson className="text-xl" />
                    </div>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Ej. Alejandro Campos"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-midnight-blue text-sm focus:ring-2 focus:ring-lemon-icing focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-midnight-blue"
                    htmlFor="username"
                  >
                    Nombre de usuario
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MdAlternateEmail className="text-xl" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Ej. alex_lebrija"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-midnight-blue text-sm focus:ring-2 focus:ring-lemon-icing focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Biografía */}
              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-midnight-blue"
                  htmlFor="biografia"
                >
                  Biografía
                </label>
                <div className="relative">
                  <textarea
                    id="biografia"
                    name="biografia"
                    value={formData.biografia}
                    onChange={handleChange}
                    maxLength={160}
                    placeholder="Cuéntanos un poco sobre ti..."
                    className="block w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-midnight-blue text-sm focus:ring-2 focus:ring-lemon-icing focus:border-transparent transition-all min-h-[120px] resize-y"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-slate-400 pointer-events-none">
                    {formData.biografia.length}/160
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Breve descripción para tu perfil público.
                </p>
              </div>

              {/* Ubicación */}
              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-midnight-blue"
                  htmlFor="ubicacion"
                >
                  Ubicación
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MdLocationOn className="text-xl" />
                  </div>
                  <select
                    id="ubicacion"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-midnight-blue text-sm focus:ring-2 focus:ring-lemon-icing focus:border-transparent transition-all appearance-none"
                  >
                    <option value="Lebrija, Sevilla">Lebrija, Sevilla</option>
                    <option value="Las Cabezas de San Juan">
                      Las Cabezas de San Juan
                    </option>
                    <option value="El Cuervo">El Cuervo</option>
                    <option value="Trebujena">Trebujena</option>
                    <option value="Jerez de la Frontera">
                      Jerez de la Frontera
                    </option>
                    <option value="Sevilla Capital">Sevilla Capital</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <MdExpandMore className="text-xl" />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-2.5 bg-lemon-icing hover:bg-[#e6dcb9] text-midnight-blue font-bold rounded-xl text-sm transition-all shadow-sm flex items-center gap-2"
                >
                  <MdSave className="text-xl" />
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
