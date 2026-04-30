'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginGate() {
  const router = useRouter();
  const supabase = createClient();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (session) {
        router.replace('/home');
        return;
      }

      setIsCheckingSession(false);
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  if (isCheckingSession) {
    return (
      <div className="bg-cloud-dancer min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-lemon-icing border-t-midnight-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-cloud-dancer font-display text-midnight-blue min-h-screen flex flex-col">
      <div className="flex flex-1 min-h-screen w-full flex-col lg:flex-row overflow-hidden">
        <div
          className="relative hidden w-full lg:flex lg:w-[60%] flex-col justify-center items-center bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-Zmby9jS_b8itcNauGnJhI9zIkFPW-VXnwahqJUJZcnX-OB640gXfcP6OfZEPEmDmHA_x0U-5nyIS9Rk1lu2sUgQ5oQe1ekBw7IWFEjad33s_znSpjB8buKn0u72V-ceLXekhkKunzut0eI9iw4ojrUf4vkddUzyCPdcbDEtThiqT-lq79ersnuBTOFQsOmjS6ovcKkQhWYHsmcTzXMBDAGonhPbTklkFQDpamsVMOoUJo32xQM5RXTXmSgcbZ0ffI4WdUWy40WIp')",
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
            <h1 className="text-6xl font-black tracking-tighter drop-shadow-lg mb-4 text-lemon-icing">
              LEBRIJALEO
            </h1>
            <p className="text-white text-xl md:text-2xl font-medium tracking-wide drop-shadow-md opacity-90">
              Descubre la esencia de Lebrija
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

            <div className="flex flex-col gap-2 mb-10 text-center lg:text-left">
              <h2 className="text-midnight-blue tracking-tight text-[32px] font-bold leading-tight">
                Bienvenido de nuevo
              </h2>
              <p className="text-slate-600 text-sm font-normal leading-normal">
                Ingresa tus datos para acceder a tu cuenta.
              </p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}