import Link from 'next/link';
// Importamos el icono del logo para la cabecera
import { MdFestival } from "react-icons/md";
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Lebrijaleo - Registro',
  description: 'Únete a la comunidad de eventos de Lebrija',
};

export default function RegisterPage() {
  return (
    <div className="bg-cloud-dancer font-display antialiased h-screen w-full overflow-hidden flex text-midnight-blue">
      
      {/* Columna Izquierda (Imagen y Texto Hero) */}
      <div className="hidden lg:flex lg:w-[60%] relative h-full bg-midnight-blue overflow-hidden group">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBYpCNUJaFhGAbMJHzg3qlT60OLZPupOZOnOEhqQ_uDAToGMN66Te6Fy--YUeREYvG7US2TSiTCg1oAvFoSPrKocLGQOTxDjvxgRQhxa87SRNy2_O9f08NtZNdi35yP-Pj3agZRTrR7tJe9npH4VQixeYMmaso7L7RDYdolRTRg_HzYzHpOmBgss261rA8V0v0MiwsveGcwsVJHOnIavBb383bWEXat91gtGDN7Kgd7IL0mCBFmwk97a21O21GRlozGgtaD9ul6A5XB')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-lemon-icing/20 backdrop-blur-md flex items-center justify-center border border-lemon-icing/30 text-white">
              {/* Reemplazamos span por el componente MdFestival */}
              <MdFestival className="text-2xl text-lemon-icing" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Lebrijaleo</span>
          </div>
          <div className="max-w-2xl">
            <h1 className="text-5xl font-black text-white leading-tight mb-4 tracking-tight">
              Únete a la<br />
              <span className="text-lemon-icing">comunidad</span>
            </h1>
            <p className="text-lg text-slate-300 font-medium max-w-lg leading-relaxed">
              Descubre, vive y gestiona los mejores eventos culturales de Lebrija. Tu puerta de entrada a la cultura local.
            </p>
          </div>
          <div className="flex gap-4 text-xs text-slate-400">
            <span>© {new Date().getFullYear()} Lebrijaleo</span>
            <span>•</span>
            <span>Cultura y Tradición</span>
          </div>
        </div>
      </div>

     {/* Columna Derecha (Formulario) */}
      <div className="w-full lg:w-[40%] h-full bg-form-bg flex flex-col justify-center items-center overflow-y-auto">
        <div className="w-full max-w-[480px] px-8 py-12 flex flex-col gap-8">
          
          {/* Cabecera Móvil */}
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <MdFestival className="text-3xl text-lemon-icing" />
            <span className="text-2xl font-bold text-midnight-blue">Lebrijaleo</span>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black text-midnight-blue tracking-tight">Crea tu cuenta</h2>
            <p className="text-slate-600">Regístrate para comenzar a explorar</p>
          </div>

          {/* Formulario que incluye todo el bloque nuevo */}
          <RegisterForm />

        </div>
      </div>
      </div>
  );
}