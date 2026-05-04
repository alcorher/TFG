'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EditProfileForm from "@/components/profile/EditProfileForm";
import { createClient } from '@/utils/supabase/client';
import {
  MdLockReset,
  MdSecurity,
  MdNotifications,
  MdLogout,
  MdSupportAgent,
  MdArrowForward,
  MdMenu,
  MdClose,
} from "react-icons/md";
import Navbar from "@/components/layout/Navbar";

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="bg-cloud-dancer text-midnight-blue font-display antialiased overflow-hidden h-screen flex">
      {/* SIDEBAR IZQUIERDO (Componente Reutilizable) */}
      <Navbar />

      {/* CONTENIDO PRINCIPAL (Formulario) */}
      <EditProfileForm onOpenMobilePanel={() => setShowMobilePanel(true)} />

      {/* SIDEBAR DERECHO (Ajustes de Cuenta - Específico de esta página) */}
      <aside className="w-80 bg-white border-l border-slate-100 p-6 flex flex-col gap-8 h-full shadow-sm overflow-y-auto hidden xl:flex shrink-0">
        <div className="bg-white rounded-2xl flex flex-col gap-3">
          <h3 className="text-midnight-blue font-bold text-lg mb-2">
            Ajustes de Cuenta
          </h3>

          <button className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-all flex items-center justify-start gap-3">
            <MdLockReset className="text-xl text-slate-400" />
            <span>Cambiar contraseña</span>
          </button>
         

          <div className="h-px bg-slate-100"></div>

          <button 
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-all flex items-center justify-start gap-3 border border-red-100"
          >
            <MdLogout className="text-xl" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        <div className="mt-auto bg-nimbus-cloud rounded-2xl p-6 relative overflow-hidden text-midnight-blue border border-nimbus-cloud/50">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/50 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-midnight-blue mb-1 shadow-sm">
              <MdSupportAgent className="text-xl" />
            </div>
            <div>
              <h4 className="font-bold text-lg leading-tight mb-1 text-midnight-blue">¿Necesitas ayuda?</h4>
              <p className="text-slate-600 text-sm leading-snug">Contacta con soporte si tienes problemas con tu perfil.</p>
            </div>
            <a
              href="mailto:acorher2911@g.educaand.es?subject=Soporte LebriJaleo&body=Hola, necesito ayuda con mi perfil en LebriJaleo."
              className="w-full py-2.5 bg-midnight-blue text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 group shadow-lg hover:bg-black"
            >
              <span>Contactar soporte</span>
              <MdArrowForward className="text-base group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

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
            <h3 className="text-midnight-blue font-bold text-lg">Ajustes de Cuenta</h3>
            <button 
              onClick={() => setShowMobilePanel(false)}
              className="p-2 text-midnight-blue/50 hover:text-midnight-blue hover:bg-lemon-icing/40 rounded-lg transition-colors"
            >
              <MdClose className="text-xl" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <button className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-all flex items-center justify-start gap-3">
              <MdLockReset className="text-xl text-slate-400" />
              <span>Cambiar contraseña</span>
            </button>
            <button className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-all flex items-center justify-start gap-3">
              <MdSecurity className="text-xl text-slate-400" />
              <span>Privacidad</span>
            </button>
            <button className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-all flex items-center justify-start gap-3">
              <MdNotifications className="text-xl text-slate-400" />
              <span>Notificaciones</span>
            </button>
            <div className="h-px bg-slate-100 my-2"></div>
            <button 
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-all flex items-center justify-start gap-3 border border-red-100"
            >
              <MdLogout className="text-xl" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

          <div className="mt-auto bg-nimbus-cloud rounded-2xl p-6 relative overflow-hidden text-midnight-blue border border-nimbus-cloud/50">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/50 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex flex-col gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-midnight-blue mb-1 shadow-sm">
                <MdSupportAgent className="text-xl" />
              </div>
              <div>
                <h4 className="font-bold text-lg leading-tight mb-1 text-midnight-blue">¿Necesitas ayuda?</h4>
                <p className="text-slate-600 text-sm leading-snug">Contacta con soporte si tienes problemas con tu perfil.</p>
              </div>
              <a
                href="mailto:acorher2911@g.educaand.es?subject=Soporte LebriJaleo&body=Hola, necesito ayuda con mi perfil en LebriJaleo."
                className="w-full py-2.5 bg-midnight-blue text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 group shadow-lg hover:bg-black"
              >
                <span>Contactar soporte</span>
                <MdArrowForward className="text-base group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
