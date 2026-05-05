'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getFriendlyErrorMessage } from '@/lib/utils';
import { Alert } from '@/components/ui/alert';
import { 
  MdArrowBack, MdMenu, MdPhotoCamera, MdEdit, MdPerson, 
  MdAlternateEmail, MdLocationOn, MdExpandMore, MdSave 
} from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lebrijaleo-backend.onrender.com';

export default function EditProfileForm({ onOpenMobilePanel }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState("info");

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    biografia: '',
    ubicacion: 'Lebrija, Sevilla',
    avatar_url: '',
    banner_url: ''
  });

  useEffect(() => {
    async function loadUserProfile() {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        router.push('/login');
        return;
      }

      setUserId(session.user.id);

      try {
        const response = await fetch(`${API_URL}/api/perfil`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userProfile = await response.json();
          setFormData({
            nombre: userProfile.nombre || '',
            username: userProfile.username || '',
            biografia: userProfile.biografia || '',
            ubicacion: userProfile.ubicacion || 'Lebrija, Sevilla',
            avatar_url: userProfile.avatar_url || '',
            banner_url: userProfile.banner_url || ''
          });
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      } finally {
        setIsFetching(false);
      }
    }

    loadUserProfile();
  }, [router, supabase]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ---Extraer el Path desde la URL pública ---    
  const getStoragePathFromUrl = (url) => {
    if (!url || !url.includes('/public/perfiles/')) return null;
    return url.split('/public/perfiles/')[1];
  };

  // --- Subir Imagen y Limpiar la anterior ---
  const handleImageUpload = async (event, type) => {
    try {
      setIsUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      //Identificar si ya existe una imagen previa
      const oldUrl = type === 'avatar' ? formData.avatar_url : formData.banner_url;
      const oldPath = getStoragePathFromUrl(oldUrl);

      //Si existe un archivo previo, lo eliminamos del storage
      if (oldPath) {
        // Ejecutamos la eliminación en paralelo para no bloquear
        console.log(`Eliminando imagen antigua: ${oldPath}`);
        supabase.storage
          .from('perfiles')
          .remove([oldPath]) 
          .then(({ error }) => {
            if (error) {
              console.error(`Error al borrar imagen antigua: ${error.message}`);
            } else {
              console.log(`Imagen antigua eliminada con éxito: ${oldPath}`);
            }
          });
      }

      // 3. Proceder con la subida de la nueva imagen (como antes)
      const fileExt = file.name.split('.').pop();
      // Usamos Date.now() para generar un nombre único y evitar problemas de caché
      const filePath = `${userId}/${type}-${Date.now()}.${fileExt}`;

      // Subimos la imagen
      const { error: uploadError } = await supabase.storage
        .from('perfiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtenemos la URL pública de la imagen recién subida
      const { data: { publicUrl } } = supabase.storage
        .from('perfiles')
        .getPublicUrl(filePath);

      // Actualizamos el estado del formulario con la nueva URL
      setFormData(prev => ({ 
        ...prev, 
        [type === 'avatar' ? 'avatar_url' : 'banner_url']: publicUrl 
      }));

    } catch (error) {
      setAlertMessage("Error al subir la imagen: " + error.message);
      setAlertType("error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/api/perfil`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData) 
      });

      if (response.ok) {
        const responseData = await response.json();
        const updatedData = responseData.data;
        
        if (updatedData) {
            setFormData({
                nombre: updatedData.nombre || '',
                username: updatedData.username || '',
                biografia: updatedData.biografia || '',
                ubicacion: updatedData.ubicacion || 'Lebrija, Sevilla',
                avatar_url: updatedData.avatar_url || '',
                banner_url: updatedData.banner_url || ''
            });
        }
        setAlertMessage("¡Perfil guardado correctamente!");
        setAlertType("success");
      } else {
        const errorData = await response.json().catch(() => ({}));
        setAlertMessage(getFriendlyErrorMessage(errorData, "No se ha podido guardar el perfil. Revisa los campos e inténtalo de nuevo."));
        setAlertType("error");
      }
    } catch (error) {
      setAlertMessage("No se ha podido conectar con el servidor para guardar el perfil.");
      setAlertType("error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <main className="flex-1 flex items-center justify-center bg-form-bg">
        <div className="w-8 h-8 border-4 border-lemon-icing border-t-midnight-blue rounded-full animate-spin"></div>
      </main>
    );
  }

  const defaultAvatar = "https://ui-avatars.com/api/?name=" + (formData.nombre || 'Usuario') + "&background=F6EBC8&color=1e293b";
  const defaultBanner = "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=2070";

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-form-bg relative">
      <header className="h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200/60">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-midnight-blue hover:bg-lemon-icing/30 rounded-lg transition-colors">
            <MdArrowBack className="text-2xl" />
          </button>
          <h2 className="text-lg font-bold text-midnight-blue">Editar Perfil</h2>
        </div>
        {onOpenMobilePanel && (
          <div className="flex items-center gap-3">
            <button 
              onClick={onOpenMobilePanel}
              className="p-2 text-midnight-blue/50 hover:text-midnight-blue hover:bg-lemon-icing/40 rounded-lg transition-colors xl:hidden"
            >
              <MdMenu className="text-xl" />
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {alertMessage && (
          <div className="max-w-7xl mx-auto px-8 pt-8 pb-2">
            <Alert
              message={alertMessage}
              type={alertType}
              onClose={() => setAlertMessage(null)}
            />
          </div>
        )}
        
        <input type="file" accept="image/*" ref={bannerInputRef} onChange={(e) => handleImageUpload(e, 'banner')} className="hidden" />
        <input type="file" accept="image/*" ref={avatarInputRef} onChange={(e) => handleImageUpload(e, 'avatar')} className="hidden" />

        <div className="relative w-full h-80 group">
          <div className="absolute inset-0 bg-midnight-blue">
            <img alt="Banner LebriJaleo" className="w-full h-full object-cover opacity-80" src={formData.banner_url || defaultBanner} />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent"></div>
          </div>
          
          <div className="absolute top-4 right-4 z-20">
            <button 
              type="button"
              onClick={() => bannerInputRef.current.click()} 
              disabled={isUploading}
              className="flex items-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-lg transition-all border border-white/20 shadow-lg cursor-pointer"
            >
              <MdPhotoCamera className="text-xl" />
              <span className="text-sm font-semibold">{isUploading ? 'Subiendo...' : 'Cambiar portada'}</span>
            </button>
          </div>

          <div className="absolute bottom-0 left-0 w-full px-8 pb-8 pt-20">
            <div className="flex items-end gap-6 max-w-7xl mx-auto">
              <div 
                onClick={() => !isUploading && avatarInputRef.current.click()}
                className="relative w-32 h-32 rounded-full border-4 border-white shadow-2xl shrink-0 bg-white group/avatar cursor-pointer"
              >
                <img alt="User Avatar" className="w-full h-full object-cover rounded-full" src={formData.avatar_url || defaultAvatar} />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 backdrop-blur-[2px]">
                  <MdEdit className="text-white text-3xl" />
                </div>
              </div>

              <div className="pb-2 text-white drop-shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold tracking-tight">{formData.nombre || 'Usuario'}</h1>
                </div>
                <p className="text-slate-100 max-w-2xl text-lg font-medium leading-relaxed opacity-90 truncate">
                  {formData.biografia || 'Aún no hay biografía.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="bg-white rounded-2xl border border-nimbus-cloud/40 shadow-sm p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-2xl font-bold text-midnight-blue">Configuración de Perfil</h3>
                <p className="text-slate-500 mt-1">Actualiza tu información personal y cómo te ven los demás.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-midnight-blue">Nombre completo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MdPerson className="text-xl" />
                    </div>
                    <input id="nombre" name="nombre" type="text" value={formData.nombre} onChange={handleChange} className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-midnight-blue text-sm focus:ring-2 focus:ring-lemon-icing focus:border-transparent transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-midnight-blue">Nombre de usuario</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MdAlternateEmail className="text-xl" />
                    </div>
                    <input id="username" name="username" type="text" value={formData.username} onChange={handleChange} className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-midnight-blue text-sm focus:ring-2 focus:ring-lemon-icing focus:border-transparent transition-all" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-midnight-blue">Biografía</label>
                <div className="relative">
                  <textarea id="biografia" name="biografia" value={formData.biografia} onChange={handleChange} maxLength={160} className="block w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-midnight-blue text-sm focus:ring-2 focus:ring-lemon-icing focus:border-transparent transition-all min-h-30 resize-y" />
                  <div className="absolute bottom-3 right-3 text-xs text-slate-400 pointer-events-none">{formData.biografia.length}/160</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-midnight-blue">Ubicación</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MdLocationOn className="text-xl" />
                  </div>
                  <select id="ubicacion" name="ubicacion" value={formData.ubicacion} onChange={handleChange} className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-midnight-blue text-sm focus:ring-2 focus:ring-lemon-icing focus:border-transparent transition-all appearance-none">
                    <option value="Lebrija, Sevilla">Lebrija, Sevilla</option>
                    <option value="Las Cabezas de San Juan">Las Cabezas de San Juan</option>
                    <option value="El Cuervo">El Cuervo</option>
                    <option value="Trebujena">Trebujena</option>
                    <option value="Jerez de la Frontera">Jerez de la Frontera</option>
                    <option value="Sevilla Capital">Sevilla Capital</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <MdExpandMore className="text-xl" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
                <button type="button" onClick={() => router.back()} className="px-6 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={isLoading} className="px-8 py-2.5 bg-lemon-icing hover:bg-[#e6dcb9] text-midnight-blue font-bold rounded-xl text-sm transition-all shadow-sm flex items-center gap-2">
                  <MdSave className="text-xl" />
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}