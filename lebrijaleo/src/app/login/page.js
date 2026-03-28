import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Lebrijaleo - Iniciar Sesión",
  description: "Inicia sesión para descubrir la esencia de Lebrija",
};

export default function LoginPage() {
  return (
    <div className="bg-cloud-dancer font-display text-midnight-blue min-h-screen flex flex-col">
      <div className="flex flex-1 min-h-screen w-full flex-col lg:flex-row overflow-hidden">
        {/* Columna Izquierda (Imagen Hero) */}
        <div
          className="relative hidden w-full lg:flex lg:w-[60%] flex-col justify-center items-center bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-Zmby9jS_b8itcNauGnJhI9zIkFPW-VXnwahqJUJZcnX-OB640gXfcP6OfZEPEmDmHA_x0U-5nyIS9Rk1lu2sUgQ5oQe1ekBw7IWFEjad33s_znSpjB8buKn0u72V-ceLXekhkKunzut0eI9iw4ojrUf4vkddUzyCPdcbDEtThiqT-lq79ersnuBTOFQsOmjS6ovcKkQhWYHsmcTzXMBDAGonhPbTklkFQDpamsVMOoUJo32xQM5RXTXmSgcbZ0ffI4WdUWy40WIp')",
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="relative z-10 flex flex-col items-center text-center p-12">
            <h1 className="text-6xl font-black tracking-tighter drop-shadow-lg mb-4 bg-gradient-to-br from-[#D4AF37] via-lemon-icing to-[#D4AF37] text-transparent bg-clip-text">
              LEBRIJALEO
            </h1>
            <p className="text-white text-xl md:text-2xl font-medium tracking-wide drop-shadow-md opacity-90">
              Descubre la esencia de Lebrija
            </p>
          </div>
        </div>

        {/* Columna Derecha (Formulario) */}
        <div className="flex w-full flex-1 flex-col justify-center bg-form-bg lg:w-[40%] relative">
          <div className="lg:hidden absolute top-0 left-0 w-full p-6 flex justify-center">
            <h1 className="text-2xl font-black tracking-tighter text-[#C4B27A]">
              LEBRIJALEO
            </h1>
          </div>

          <div className="w-full max-w-[480px] mx-auto px-6 py-12 sm:px-10">
            <div className="flex flex-col gap-2 mb-10 text-center lg:text-left">
              <h2 className="text-midnight-blue tracking-tight text-[32px] font-bold leading-tight">
                Bienvenido de nuevo
              </h2>
              <p className="text-slate-600 text-sm font-normal leading-normal">
                Ingresa tus datos para acceder a tu cuenta.
              </p>
            </div>

            {/* Componente del formulario interactivo */}
            <LoginForm />
          </div>

          <div className="lg:hidden absolute bottom-0 w-full h-2 bg-gradient-to-r from-lemon-icing via-orange-200 to-yellow-200"></div>
        </div>
      </div>
    </div>
  );
}
