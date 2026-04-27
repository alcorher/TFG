'use client';

import Link from 'next/link';
import { 
  MdExplore, MdBusinessCenter, MdKeyboardArrowDown, 
  MdCalendarMonth, MdTune, MdGroups, MdVisibility, 
  MdLocalActivity, MdBarChart 
} from "react-icons/md";
import { FaInstagram, FaFacebookF, FaTwitter } from "react-icons/fa";

export default function LandingPage() {
  return (
    <div className="font-display text-midnight-blue antialiased bg-white overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-nimbus-cloud/40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-lemon-icing rounded-xl flex items-center justify-center text-midnight-blue shadow-md">
                  <span className="font-extrabold text-2xl tracking-tighter">L</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-midnight-blue">LebriJaleo</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#beneficios" className="text-sm font-bold text-midnight-blue/60 hover:text-midnight-blue transition-colors">Ciudadanos</a>
              <a href="#organizadores" className="text-sm font-bold text-midnight-blue/60 hover:text-midnight-blue transition-colors">Organizadores</a>
              <a href="#cultura" className="text-sm font-bold text-midnight-blue/60 hover:text-midnight-blue transition-colors">Cultura</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="hidden md:block text-sm font-bold text-midnight-blue hover:text-midnight-blue/70 transition-colors">
                Iniciar Sesión
              </Link>
              <Link href="/cartelera" className="px-5 py-2.5 bg-midnight-blue text-white text-sm font-bold rounded-full hover:bg-black transition-all shadow-lg shadow-midnight-blue/20">
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
            className="w-full h-full object-cover object-center opacity-60 mix-blend-multiply" 
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2074"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight-blue via-transparent to-midnight-blue/30"></div>
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
            <Link href="/cartelera" className="w-full sm:w-auto px-8 py-4 bg-lemon-icing text-midnight-blue font-bold rounded-xl hover:bg-white hover:scale-105 transition-all shadow-[0_0_30px_rgba(246,235,200,0.3)] flex items-center justify-center gap-2">
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
          <MdKeyboardArrowDown className="text-4xl" />
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
              
              <Link href="/login" className="inline-flex items-center justify-center px-8 py-4 bg-midnight-blue text-white font-bold rounded-xl hover:bg-black hover:shadow-lg transition-all gap-2 group shadow-midnight-blue/20">
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
                        <div className="text-[10px] uppercase font-bold text-midnight-blue/50 mb-1">Ventas</div>
                        <div className="font-bold text-midnight-blue">1,240€</div>
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
                src="https://images.unsplash.com/photo-1533174000222-edfe3abc5496?q=80&w=2070"
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
                  src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2070"
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
                  src="https://images.unsplash.com/photo-1507676184212-d03305a555e4?q=80&w=2069"
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

      {/* FOOTER */}
      <footer className="bg-midnight-blue text-white pt-20 pb-10 border-t-4 border-lemon-icing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-lemon-icing rounded-xl flex items-center justify-center text-midnight-blue shadow-lg shadow-lemon-icing/20">
                  <span className="font-extrabold text-2xl tracking-tighter">L</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-white">LebriJaleo</span>
              </Link>
              <p className="text-white/60 text-sm leading-relaxed mb-6 font-medium">
                La plataforma digital que conecta a ciudadanos, visitantes y organizadores para celebrar la vida en Lebrija.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-lemon-icing hover:text-midnight-blue flex items-center justify-center transition-colors">
                  <FaInstagram className="text-lg" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-lemon-icing hover:text-midnight-blue flex items-center justify-center transition-colors">
                  <FaFacebookF className="text-lg" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-lemon-icing hover:text-midnight-blue flex items-center justify-center transition-colors">
                  <FaTwitter className="text-lg" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6 text-lemon-icing">Plataforma</h4>
              <ul className="space-y-4 text-white/60 text-sm font-medium">
                <li><Link href="/cartelera" className="hover:text-white transition-colors">Explorar Eventos</Link></li>
                <li><a href="#organizadores" className="hover:text-white transition-colors">Para Organizadores</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mapa Interactivo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Descargar App</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6 text-lemon-icing">Categorías</h4>
              <ul className="space-y-4 text-white/60 text-sm font-medium">
                <li><a href="#" className="hover:text-white transition-colors">Cultura y Teatro</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Deportes</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gastronomía</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Fiestas Locales</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-6 text-lemon-icing">Mantente al día</h4>
              <p className="text-white/60 text-sm mb-4 font-medium">Recibe los mejores planes de la semana en tu correo.</p>
              <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  required
                  placeholder="Tu correo electrónico" 
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lemon-icing/50 placeholder:text-white/40" 
                />
                <button type="submit" className="bg-lemon-icing text-midnight-blue font-bold rounded-lg px-4 py-3 text-sm hover:brightness-95 transition-colors shadow-lg shadow-lemon-icing/20">
                  Suscribirse
                </button>
              </form>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50 font-medium">
            <p>© 2026 LebriJaleo Inc. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Términos de Uso</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}