import EditProfileForm from "@/components/profile/EditProfileForm";
import {
  MdLockReset,
  MdSecurity,
  MdNotifications,
  MdLogout,
  MdSupportAgent,
} from "react-icons/md";
import Navbar from "@/components/layout/Navbar";

export const metadata = {
  title: "Lebrijaleo - Editar Perfil",
  description: "Actualiza tu perfil de LebriJaleo",
};

export default function EditProfilePage() {
  return (
    <div className="bg-cloud-dancer text-midnight-blue font-display antialiased overflow-hidden h-screen flex">
      {/* SIDEBAR IZQUIERDO (Componente Reutilizable) */}
      <Navbar />

      {/* CONTENIDO PRINCIPAL (Formulario) */}
      <EditProfileForm />

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
          <button className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-all flex items-center justify-start gap-3">
            <MdSecurity className="text-xl text-slate-400" />
            <span>Privacidad</span>
          </button>
          <button className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-all flex items-center justify-start gap-3">
            <MdNotifications className="text-xl text-slate-400" />
            <span>Notificaciones</span>
          </button>

          <div className="h-px bg-slate-100 my-2"></div>

          <button className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-all flex items-center justify-start gap-3 border border-red-100">
            <MdLogout className="text-xl" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        <div className="mt-auto">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-lemon-icing/50 text-midnight-blue flex items-center justify-center">
                <MdSupportAgent className="text-xl" />
              </div>
              <h4 className="font-bold text-midnight-blue">
                ¿Necesitas ayuda?
              </h4>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Contacta con soporte si tienes problemas con tu perfil.
            </p>
            <button className="text-sm font-bold text-slate-700 hover:text-midnight-blue hover:underline">
              Ir al centro de ayuda
            </button>
          </div>
        </div>

        <div className="text-center pb-4 mt-2">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Lebrijaleo Inc.
          </p>
        </div>
      </aside>
    </div>
  );
}
