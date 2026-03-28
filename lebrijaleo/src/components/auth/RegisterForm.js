'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Importamos el router para redirigir
import { createClient } from '@/utils/supabase/client'; // Importamos tu cliente de Supabase
import { 
  MdOutlinePerson, 
  MdOutlineMail, 
  MdOutlineLock, 
  MdOutlineVisibility, 
  MdOutlineVisibilityOff, 
  MdArrowForward 
} from "react-icons/md";

export default function RegisterForm() {
  const router = useRouter();
  const supabase = createClient(); // Inicializamos Supabase
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Estado para el botón de carga
  const [errorMessage, setErrorMessage] = useState(''); // Estado para mostrar errores
  const [successMessage, setSuccessMessage] = useState(''); // Estado para éxito

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Limpiamos errores si el usuario vuelve a escribir
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    // Llamada real a Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          nombre: formData.name, // Pasamos el nombre para el Trigger de la BD
        }
      }
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    // Si todo va bien
    setSuccessMessage('¡Cuenta creada con éxito! Revisa tu correo o inicia sesión.');
    setIsLoading(false);
    
    // Opcional: Redirigir al usuario al Home o al Login después de 2 segundos
    setTimeout(() => {
      router.push('/login'); // O router.push('/') si prefieres que entre directo
    }, 2000);
  };

  return (
    <div className="flex flex-col w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Mostrar Mensajes de Error o Éxito */}
        {errorMessage && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded-xl">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 text-sm rounded-xl">
            {successMessage}
          </div>
        )}

        {/* Input Nombre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-midnight-blue" htmlFor="name">
            Nombre completo
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-nimbus-cloud transition-colors">
              <MdOutlinePerson className="text-xl" />
            </div>
            <input
              id="name" name="name" type="text" required
              value={formData.name} onChange={handleChange}
              placeholder="Ej. María García"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lemon-icing/50 focus:border-lemon-icing transition-all font-medium disabled:opacity-50"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Input Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-midnight-blue" htmlFor="email">
            Correo electrónico
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-nimbus-cloud transition-colors">
              <MdOutlineMail className="text-xl" />
            </div>
            <input
              id="email" name="email" type="email" required
              value={formData.email} onChange={handleChange}
              placeholder="tu@email.com"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lemon-icing/50 focus:border-lemon-icing transition-all font-medium disabled:opacity-50"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Input Contraseña */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-midnight-blue" htmlFor="password">
            Contraseña
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-nimbus-cloud transition-colors">
              <MdOutlineLock className="text-xl" />
            </div>
            <input
              id="password" name="password" 
              type={showPassword ? "text" : "password"} required
              value={formData.password} onChange={handleChange}
              placeholder="••••••••"
              className="w-full pl-11 pr-12 py-3.5 bg-white border border-nimbus-cloud rounded-xl text-midnight-blue placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lemon-icing/50 focus:border-lemon-icing transition-all font-medium disabled:opacity-50"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-midnight-blue transition-colors cursor-pointer"
              disabled={isLoading}
            >
              {showPassword ? <MdOutlineVisibilityOff className="text-xl" /> : <MdOutlineVisibility className="text-xl" />}
            </button>
          </div>
        </div>

        {/* Botón Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 w-full bg-lemon-icing hover:bg-[#EBE0BC] text-midnight-blue font-bold py-4 px-6 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-lemon-icing focus:ring-offset-2 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <span>{isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}</span>
          {!isLoading && <MdArrowForward className="text-xl group-hover:translate-x-1 transition-transform" />}
        </button>
      </form>

      {/* Enlace Iniciar Sesión */}
      <div className="text-center mt-6">
        <p className="text-sm text-slate-600">
          ¿Ya tienes una cuenta? 
          <Link href="/login" className="font-bold text-[#C4B27A] hover:text-[#A38C52] transition-colors ml-1">
            Inicia sesión
          </Link>
        </p>
      </div>

      {/* Separador Organizador */}
      <div className="relative flex py-8 items-center">
        <div className="flex-grow border-t border-nimbus-cloud/60" />
        <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">¿Eres organizador?</span>
        <div className="flex-grow border-t border-nimbus-cloud/60" />
      </div>

      {/* Botón de Contacto Admin */}
      <a 
        href="mailto:tu_correo_admin@lebrijaleo.com?subject=Solicitud de cuenta de Organizador en LebriJaleo&body=Hola, me gustaría solicitar una cuenta de empresario para publicar eventos."
        className="flex items-start gap-4 p-4 bg-white/50 rounded-2xl border border-nimbus-cloud/50 hover:border-nimbus-cloud hover:bg-white transition-all cursor-pointer group decoration-none"
      >
        <div className="flex items-center h-5 mt-0.5">
          <div className="h-5 w-5 rounded-full border border-nimbus-cloud group-hover:border-[#C4B27A] flex items-center justify-center bg-white transition-colors" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-midnight-blue group-hover:text-[#C4B27A] transition-colors">
            Contacta con un administrador
          </span>
          <span className="text-xs text-slate-500 mt-0.5">
            Selecciona esta opción si quieres publicar y gestionar eventos.
          </span>
        </div>
      </a>
    </div>
  );
}