"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
  MdOutlineMail,
  MdOutlineLock,
  MdOutlineVisibility,
  MdOutlineVisibilityOff,
} from "react-icons/md";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  };

  const handlePasswordReset = async () => {
    if (!formData.email.trim()) {
      setErrorMessage("Introduce tu correo para enviarte el enlace de cambio de contraseña.");
      setSuccessMessage("");
      return;
    }

    setIsResetLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email.trim(), {
      redirectTo,
    });

    if (error) {
      setErrorMessage(
        error.message || "No se ha podido enviar el correo de recuperación. Inténtalo de nuevo."
      );
      setIsResetLoading(false);
      return;
    }

    setSuccessMessage("Te hemos enviado un correo para cambiar tu contraseña.");
    setIsResetLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      const loginErrorMessages = {
        "Invalid login credentials": "El correo electrónico o la contraseña no son correctos.",
        "Email not confirmed": "Debes confirmar tu correo antes de iniciar sesión.",
      };

      setErrorMessage(loginErrorMessages[error.message] || error.message || "No se ha podido iniciar sesión.");
      setIsLoading(false);
      return;
    }

    // Redirigimos (Home)
    router.push("/");
  };

  return (
    <div className="flex flex-col w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Mensaje de Error */}
        {errorMessage && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* Mensaje de Éxito */}
        {successMessage && (
          <div className="p-3 bg-green-100 border border-green-300 text-green-700 text-sm rounded-xl">
            {successMessage}
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label
            className="text-midnight-blue text-sm font-semibold leading-normal"
            htmlFor="email"
          >
            Correo electrónico
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="usuario@ejemplo.com"
              disabled={isLoading}
              className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-midnight-blue focus:outline-none focus:ring-2 focus:ring-lemon-icing focus:border-lemon-icing border border-nimbus-cloud bg-white h-12 px-4 text-base font-normal leading-normal placeholder:text-slate-400 transition-all duration-200 disabled:opacity-50"
            />
            <div className="absolute right-4 top-3 text-slate-400">
              <MdOutlineMail className="text-xl" />
            </div>
          </div>
        </div>

        {/* Contraseña */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label
              className="text-midnight-blue text-sm font-semibold leading-normal"
              htmlFor="password"
            >
              Contraseña
            </label>
          </div>
          <div className="relative group">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="•••••••••"
              disabled={isLoading}
              className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-midnight-blue focus:outline-none focus:ring-2 focus:ring-lemon-icing focus:border-lemon-icing border border-nimbus-cloud bg-white h-12 px-4 pr-12 text-base font-normal leading-normal placeholder:text-slate-400 transition-all duration-200 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-slate-400 hover:text-[#C4B27A] transition-colors focus:outline-none"
            >
              {showPassword ? (
                <MdOutlineVisibilityOff className="text-xl" />
              ) : (
                <MdOutlineVisibility className="text-xl" />
              )}
            </button>
          </div>
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={isLoading || isResetLoading}
              className="text-sm font-medium text-slate-500 hover:text-[#C4B27A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isResetLoading ? "Enviando correo..." : "¿Olvidaste tu contraseña?"}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-lemon-icing hover:bg-[#EBE0BC] text-midnight-blue text-base font-bold leading-normal tracking-[0.015em] transition-all duration-200 shadow-md shadow-lemon-icing/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <span className="truncate">
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </span>
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          ¿No tienes cuenta?
          <Link
            href="/register"
            className="font-bold text-[#C4B27A] hover:text-[#A38C52] hover:underline transition-colors ml-1"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
