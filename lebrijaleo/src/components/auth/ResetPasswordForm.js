"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import {
  MdOutlineVisibility,
  MdOutlineVisibilityOff,
  MdArrowBack,
} from "react-icons/md";

export default function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let isMounted = true;

    const resolveRecoverySession = async () => {
      const hasRecoveryTokens =
        window.location.hash.includes("access_token=") ||
        window.location.hash.includes("type=recovery");

      // Give Supabase a moment to process hash tokens on initial page load.
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session) {
          setCanReset(true);
          setIsCheckingLink(false);
          return;
        }

        if (!hasRecoveryTokens) {
          setCanReset(false);
          setIsCheckingLink(false);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      if (!isMounted) return;
      setCanReset(false);
      setIsCheckingLink(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!isMounted) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setCanReset(true);
        setIsCheckingLink(false);
      }
    });

    resolveRecoverySession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      setErrorMessage("Rellena ambos campos para continuar.");
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase.auth.updateUser({
      password: formData.password,
    });

    if (error) {
      setErrorMessage(error.message || "No se ha podido cambiar la contraseña.");
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("Contraseña actualizada. Te redirigimos al inicio de sesión.");
    setFormData({ password: "", confirmPassword: "" });
    setIsSubmitting(false);

    setTimeout(() => {
      router.replace("/login");
    }, 1500);
  };

  return (
    <div className="bg-cloud-dancer font-display text-midnight-blue min-h-screen flex flex-col">
      <div className="flex flex-1 min-h-screen w-full flex-col lg:flex-row overflow-hidden">
        <div
          className="relative hidden w-full lg:flex lg:w-[60%] flex-col justify-center items-center bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1740&auto=format&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center text-center p-12">
            <div className="absolute top-12 left-12">
              <Image
                src="/logo.png"
                alt="LebriJaleo"
                width={40}
                height={40}
                className="rounded-lg bg-white p-1 object-contain h-12 w-12"
                priority
              />
            </div>
            <h1 className="text-5xl font-black tracking-tighter drop-shadow-lg mb-4 text-lemon-icing">
              RESTABLECE TU CLAVE
            </h1>
            <p className="text-white text-xl font-medium tracking-wide drop-shadow-md opacity-90 max-w-xl">
              Elige una nueva contraseña para volver a entrar en tu cuenta.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-1 flex-col justify-center bg-form-bg lg:w-[40%] relative">
          <div className="w-full max-w-120 mx-auto px-6 py-12 sm:px-10">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <Image
                src="/logo.png"
                alt="LebriJaleo"
                width={40}
                height={40}
                className="rounded-lg bg-white p-1 object-contain h-10 w-10"
                priority
              />
              <span className="text-2xl font-bold text-midnight-blue tracking-tight">
                Lebrijaleo
              </span>
            </div>

            <div className="flex flex-col gap-2 mb-8 text-center lg:text-left">
              <h2 className="text-midnight-blue tracking-tight text-[32px] font-bold leading-tight">
                Cambiar contraseña
              </h2>
              <p className="text-slate-600 text-sm font-normal leading-normal">
                Introduce tu nueva contraseña para completar la recuperación.
              </p>
            </div>

            {isCheckingLink ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-10 h-10 border-4 border-lemon-icing border-t-midnight-blue rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {!canReset && (
                  <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 text-sm rounded-xl">
                    El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo desde login.
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 text-sm rounded-xl">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 mb-4 bg-green-100 border border-green-300 text-green-700 text-sm rounded-xl">
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-midnight-blue text-sm font-semibold leading-normal"
                      htmlFor="password"
                    >
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isSubmitting || !canReset}
                        placeholder="Mínimo 8 caracteres"
                        className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-midnight-blue focus:outline-none focus:ring-2 focus:ring-lemon-icing focus:border-lemon-icing border border-nimbus-cloud bg-white h-12 px-4 pr-12 text-base font-normal leading-normal placeholder:text-slate-400 transition-all duration-200 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting || !canReset}
                        className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-slate-400 hover:text-[#C4B27A] transition-colors focus:outline-none"
                      >
                        {showPassword ? (
                          <MdOutlineVisibilityOff className="text-xl" />
                        ) : (
                          <MdOutlineVisibility className="text-xl" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      className="text-midnight-blue text-sm font-semibold leading-normal"
                      htmlFor="confirmPassword"
                    >
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isSubmitting || !canReset}
                        placeholder="Repite la nueva contraseña"
                        className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-midnight-blue focus:outline-none focus:ring-2 focus:ring-lemon-icing focus:border-lemon-icing border border-nimbus-cloud bg-white h-12 px-4 pr-12 text-base font-normal leading-normal placeholder:text-slate-400 transition-all duration-200 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isSubmitting || !canReset}
                        className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-slate-400 hover:text-[#C4B27A] transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <MdOutlineVisibilityOff className="text-xl" />
                        ) : (
                          <MdOutlineVisibility className="text-xl" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !canReset}
                    className="mt-2 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-lemon-icing hover:bg-[#EBE0BC] text-midnight-blue text-base font-bold leading-normal tracking-[0.015em] transition-all duration-200 shadow-md shadow-lemon-icing/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <span className="truncate">
                      {isSubmitting ? "Guardando..." : "Guardar nueva contraseña"}
                    </span>
                  </button>
                </form>
              </>
            )}

            <div className="mt-8 text-center lg:text-left">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#A38C52] transition-colors"
              >
                <MdArrowBack className="text-base" />
                Volver a iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
