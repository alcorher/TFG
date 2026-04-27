'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { 
  MdExplore, MdBusinessCenter, MdKeyboardArrowDown, 
  MdCalendarMonth, MdTune, MdGroups, MdVisibility, 
  MdLocalActivity, MdBarChart 
} from "react-icons/md";
import { FaInstagram, FaFacebookF, FaTwitter } from "react-icons/fa";

export default function LandingPage() {
  const [hasSession, setHasSession] = useState(null);

  useEffect(() => {
    const supabase = createClient();

    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(Boolean(session));
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="font-display text-midnight-blue antialiased bg-white overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-nimbus-cloud/40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="LebriJaleo"
                  width={56}
                  height={56}
                  className="object-contain"
                  priority
                />
                <span className="font-bold text-2xl tracking-tight text-midnight-blue">LebriJaleo</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#beneficios" className="text-sm font-bold text-midnight-blue/60 hover:text-midnight-blue transition-colors">Ciudadanos</a>
              <a href="#organizadores" className="text-sm font-bold text-midnight-blue/60 hover:text-midnight-blue transition-colors">Organizadores</a>
              <a href="#cultura" className="text-sm font-bold text-midnight-blue/60 hover:text-midnight-blue transition-colors">Cultura</a>
            </div>
            <div className="flex items-center gap-4">
              {hasSession === false && (
                <Link href="/login" className="hidden md:block text-sm font-bold text-midnight-blue hover:text-midnight-blue/70 transition-colors">
                  Iniciar Sesión
                </Link>
              )}
              <Link href="/home" className="px-5 py-2.5 bg-midnight-blue text-white text-sm font-bold rounded-full hover:bg-black transition-all shadow-lg shadow-midnight-blue/20">
                Ver Cartelera
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-midnight-blue">
          <img 
            alt="Festival de Lebrija" 
            className="w-full h-full object-cover object-center opacity-100 mix-blend-overlay transition-transform duration-700 hover:scale-105" 
            src="https://rutadelvinojerez.es/wp-content/uploads/2022/09/Lebrija-Nocturna-1024x580.jpg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight-blue/10 via-transparent to-midnight-blue/30"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center mt-16">
          <span className="inline-block py-1.5 px-4 rounded-full bg-lemon-icing/20 backdrop-blur-sm border border-lemon-icing/40 text-lemon-icing text-xs font-bold tracking-wider uppercase mb-6 animate-pulse">
            La plataforma oficial de eventos
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight drop-shadow-lg">
            Todo lo que pasa en <br/>
            <span className="text-lemon-icing italic">Lebrija</span>, en un solo lugar
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-md">
            Descubre, vive y comparte la cultura, gastronomía y tradiciones de nuestra ciudad. Desde las Cruces de Mayo hasta la ruta de la tapa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/home" className="w-full sm:w-auto px-8 py-4 bg-lemon-icing text-midnight-blue font-bold rounded-xl hover:bg-white hover:scale-105 transition-all shadow-[0_0_30px_rgba(246,235,200,0.3)] flex items-center justify-center gap-2">
              <MdExplore className="text-xl" />
              Explorar Cartelera
            </Link>
            <a href="#organizadores" className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white/80 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-sm">
              <MdBusinessCenter className="text-xl" />
              Soy Organizador
            </a>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
          <MdKeyboardArrowDown className="text-4xl text-white" />
        </div>
      </section>

      {/* SECCIÓN: BENEFICIOS CIUDADANOS */}
      <section id="beneficios" className="py-24 bg-form-bg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-nimbus-cloud/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-x-1/3 translate-y-1/3"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-midnight-blue mb-4">Vive Lebrija a tu manera</h2>
            <p className="text-midnight-blue/60 max-w-2xl mx-auto text-lg font-medium">Una experiencia diseñada para que no te pierdas nada de lo que hace única a nuestra ciudad.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-nimbus-cloud/30 group">
              <div className="w-16 h-16 bg-cloud-dancer rounded-2xl flex items-center justify-center mb-6 text-midnight-blue group-hover:bg-lemon-icing transition-colors">
                <MdCalendarMonth className="text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-midnight-blue mb-3">Agenda Centralizada</h3>
              <p className="text-midnight-blue/70 leading-relaxed font-medium">
                Olvídate de buscar en diez sitios diferentes. Todos los eventos culturales, deportivos y de ocio unificados en un solo calendario oficial.
              </p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-nimbus-cloud/30 group">
              <div className="w-16 h-16 bg-cloud-dancer rounded-2xl flex items-center justify-center mb-6 text-midnight-blue group-hover:bg-lemon-icing transition-colors">
                <MdTune className="text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-midnight-blue mb-3">Experiencia Personalizada</h3>
              <p className="text-midnight-blue/70 leading-relaxed font-medium">
                Filtra por tus intereses: flamenco, teatro, gastronomía o deporte. Encuentra planes gratuitos o premium ajustados a tu gusto.
              </p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-nimbus-cloud/30 group">
              <div className="w-16 h-16 bg-cloud-dancer rounded-2xl flex items-center justify-center mb-6 text-midnight-blue group-hover:bg-lemon-icing transition-colors">
                <MdGroups className="text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-midnight-blue mb-3">Conexión Social</h3>
              <p className="text-midnight-blue/70 leading-relaxed font-medium">
                Descubre a qué eventos asistirán tus amigos, comparte planes y organiza quedadas directamente desde la plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN: ORGANIZADORES */}
      <section id="organizadores" className="py-24 bg-cloud-dancer relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 text-midnight-blue text-xs font-bold uppercase tracking-wider mb-6 border border-nimbus-cloud">
                <span className="w-2 h-2 rounded-full bg-lemon-icing animate-pulse"></span>
                Para Negocios y Promotores
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-midnight-blue mb-6 leading-tight">
                Haz que tu evento <br/>brille en Lebrija
              </h2>
              <p className="text-midnight-blue/70 text-lg mb-8 leading-relaxed font-medium">
                Potencia la visibilidad de tu negocio o evento cultural con herramientas profesionales diseñadas para el éxito local.
              </p>
              
              <ul className="space-y-6 mb-10">
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-lemon-icing flex items-center justify-center text-midnight-blue shrink-0 shadow-sm">
                    <MdVisibility className="text-xl" />
                  </div>
                  <div>
                    <h4 className="font-bold text-midnight-blue text-lg">Exposición Profesional</h4>
                    <p className="text-midnight-blue/60 text-sm font-medium">Tu evento destacado ante miles de ciudadanos locales y turistas.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-lemon-icing flex items-center justify-center text-midnight-blue shrink-0 shadow-sm">
                    <MdLocalActivity className="text-xl" />
                  </div>
                  <div>
                    <h4 className="font-bold text-midnight-blue text-lg">Control de Aforo y Entradas</h4>
                    <p className="text-midnight-blue/60 text-sm font-medium">Gestiona reservas y venta de tickets digitalmente sin complicaciones.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-lemon-icing flex items-center justify-center text-midnight-blue shrink-0 shadow-sm">
                    <MdBarChart className="text-xl" />
                  </div>
                  <div>
                    <h4 className="font-bold text-midnight-blue text-lg">Decisiones con Datos</h4>
                    <p className="text-midnight-blue/60 text-sm font-medium">Analíticas reales sobre quién asiste a tus eventos y qué les interesa.</p>
                  </div>
                </li>
              </ul>
              
              <Link href="mailto:acorher2911@g.educaand.es?subject=Solicitud de cuenta de Organizador en LebriJaleo&body=Hola, me gustaría solicitar el rol de organizador para publicar eventos, mi nombre de usuario es [tu_nombre_de_usuario], me dedico a eventos de [tipo de eventos]." className="inline-flex items-center justify-center px-8 py-4 bg-midnight-blue text-white font-bold rounded-xl hover:bg-black hover:shadow-lg transition-all gap-2 group shadow-midnight-blue/20">
                Publicar mi primer evento
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            
            {/* EFECTO 3D CARD */}
            <div className="order-1 lg:order-2 relative [perspective:1000px]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/40 rounded-full blur-3xl"></div>
              <div className="relative mx-auto w-[300px] h-[600px] bg-midnight-blue rounded-[3rem] p-4 shadow-2xl border-4 border-slate-800 [transform:rotateY(-12deg)] hover:[transform:rotateY(0deg)] transition-transform duration-700">
                
                {/* Pantalla del móvil falso */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-slate-800 rounded-b-xl z-20"></div>
                <div className="bg-form-bg w-full h-full rounded-[2.5rem] overflow-hidden relative">
                  <div className="p-6 bg-white h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6 pt-6">
                      <div className="w-8 h-8 bg-lemon-icing rounded-lg"></div>
                      <div className="w-8 h-8 bg-nimbus-cloud rounded-full"></div>
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="h-8 bg-midnight-blue rounded-lg w-3/4"></div>
                      <div className="h-4 bg-nimbus-cloud rounded w-1/2"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-lemon-icing/30 p-3 rounded-xl border border-lemon-icing/50">
                        <div className="text-[10px] uppercase font-bold text-midnight-blue/50 mb-1">Favoritos</div>
                        <div className="font-bold text-midnight-blue">1,240</div>
                      </div>
                      <div className="bg-cloud-dancer p-3 rounded-xl border border-nimbus-cloud/50">
                        <div className="text-[10px] uppercase font-bold text-midnight-blue/50 mb-1">Asistentes</div>
                        <div className="font-bold text-midnight-blue">342</div>
                      </div>
                    </div>
                    <div className="bg-form-bg rounded-xl p-3 flex items-center gap-3 mb-3 border border-nimbus-cloud/30">
                      <div className="w-10 h-10 bg-nimbus-cloud rounded-lg shrink-0"></div>
                      <div className="space-y-1 w-full">
                        <div className="h-3 bg-nimbus-cloud rounded w-2/3"></div>
                        <div className="h-2 bg-cloud-dancer rounded w-1/3"></div>
                      </div>
                    </div>
                    <div className="bg-form-bg rounded-xl p-3 flex items-center gap-3 mb-3 border border-nimbus-cloud/30">
                      <div className="w-10 h-10 bg-nimbus-cloud rounded-lg shrink-0"></div>
                      <div className="space-y-1 w-full">
                        <div className="h-3 bg-nimbus-cloud rounded w-2/3"></div>
                        <div className="h-2 bg-cloud-dancer rounded w-1/3"></div>
                      </div>
                    </div>
                    <div className="mt-auto bg-lemon-icing text-midnight-blue p-3 rounded-xl text-center text-sm font-bold shadow-sm">
                      Crear Evento
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECCIÓN: CULTURA / RAÍCES */}
      <section id="cultura" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-amber-600 font-bold tracking-widest uppercase text-sm">Nuestras Raíces</span>
            <h2 className="text-3xl md:text-5xl font-bold text-midnight-blue mt-2 mb-4">
              El corazón de nuestra tradición <br/>late en <span className="italic font-serif text-lemon-icing drop-shadow-sm">LebriJaleo</span>
            </h2>
            <div className="w-24 h-1 bg-lemon-icing mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-auto md:h-[600px]">
            <div className="relative rounded-2xl overflow-hidden group h-[300px] md:h-full">
              <img 
                alt="Flamenco Dancer" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                src="https://imgs.search.brave.com/HiGH-5EzCM-pl86ilJtf_treFBD-pp25uRXUotplQuU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/bGVicmlqYS5lcy9l/eHBvcnQvc2l0ZXMv/bGVicmlqYS8uZ2Fs/bGVyaWVzL2ltYWdl/bmVzLW5vdGljaWFz/L0NydWNlcy1kZS1N/YXlvLTEuanBnXzEw/NjY4NzQ0MzUuanBn"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight-blue/90 via-midnight-blue/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8">
                <div className="bg-lemon-icing text-midnight-blue text-xs font-bold px-3 py-1 rounded-full w-fit mb-3">Flamenco</div>
                <h3 className="text-2xl font-bold text-white mb-2">Cuna del Cante</h3>
                <p className="text-white/80 text-sm max-w-md font-medium">La Caracolá Lebrijana y nuestras peñas mantienen vivo el arte que nos define.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 h-[600px] md:h-full">
              <div className="relative rounded-2xl overflow-hidden group h-full">
                <img 
                  alt="Gastronomy" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAsXsrE--xBTlGnNiTIyTX50Af7eqaGyta5VIzIyVn7LVJZflmGFIV-HiWjHX1Q2myZUK-WXzWbsGoQPYd8w4XGiIL-gyoVwqxx4rkLUx-4ETv-__PvQqlUYhxkTqIW-yFCvVy9VwO2vYpQVCtNRCqsBaRc_Tid8mR4icYPeYd6XVezng6uFxuqnJonZdo6C50UOCxWbNwZHq0I-wrEkeuvF3KZoa1DZz2R4pE__k9gMunddDQWE20IwmaoqL34PhfeWqARbVlDFdl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight-blue/90 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6">
                  <div className="bg-white/90 text-midnight-blue text-xs font-bold px-3 py-1 rounded-full w-fit mb-2">Gastronomía</div>
                  <h3 className="text-xl font-bold text-white">Sabores de la Tierra</h3>
                </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden group h-full">
                <img 
                  alt="Local Pottery/Crafts" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAc57G38m0UFY8z7s1oYNThBqmnKTqfyDDpYG9Pb2LXi9OKh0g4aqXl2SRcEUOp7vwWj7-nqGQ4oIuuimwL-whbRMpfSSJcai1qHNvdjYownFGMc-AtG_9g-FRMVvlXrOk-8pYQM7VKEXd6hsMMxDFfR8LQye404XmPJ1v8IblDaeP8TlzrgWdRojqrMKZ0ybwWP2xoiwuokl1DH7PGJb277YvIz_llwCY658vR84lEE-yUIyycyenJyG9-8oaI1a1OCyRDi_Npg5Gm"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight-blue/90 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6">
                  <div className="bg-white/90 text-midnight-blue text-xs font-bold px-3 py-1 rounded-full w-fit mb-2">Artesanía</div>
                  <h3 className="text-xl font-bold text-white">Alfarería y Tradición</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    
      
    </div>
  );
}