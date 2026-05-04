import LoginGate from "@/components/auth/LoginGate";

export const metadata = {
  title: "Lebrijaleo - Iniciar Sesión",
  description: "Inicia sesión para descubrir la esencia de Lebrija",
};

export default function LoginPage() {
  return <LoginGate />;
}
