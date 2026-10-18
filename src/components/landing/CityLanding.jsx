import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import {
  IconMapPin,
  IconArrowRight,
  IconScooter,
  IconQrCode,
} from '../common/Icons';
import LocationModal from '../common/LocationModal';
import { getRestaurantOpenStatus } from '../../data/restaurantInfo';

export default function CityLanding({ onSelectStore }) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const { storeSettings } = useCart();
  const status = getRestaurantOpenStatus(storeSettings);
  return (
    <div className="relative h-screen h-[100dvh] max-h-[100dvh] w-full bg-stone-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* 1. Fondo Cinematográfico Fotográfico con Movimiento Suave */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <img
          src="/kampinafoto2.webp"
          alt="Entorno campestre del Restaurante La Kampiña en Cochabamba"
          width="1920"
          height="1080"
          fetchpriority="high"
          decoding="async"
          className="w-full h-full object-cover animate-kenburns-smooth filter brightness-[0.45] contrast-[1.1] saturate-[0.95]"
        />
        {/* Viñeta oscura cinematográfica para alto contraste y legibilidad WCAG AAA */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/75 to-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,10,0.85)_80%)]" />
      </div>

      {/* 2. Enmarcado Natural Enriquecido (Capas botánicas con brisa suave) */}
      {/* --- Esquina Superior Izquierda (Doble Capa con Profundidad) --- */}
      <div className="absolute top-0 left-10 sm:left-16 md:left-24 pointer-events-none z-10 w-24 sm:w-36 md:w-44 max-w-[20vw] select-none" aria-hidden="true">
        <img
          src="/palmera-corner-tl.webp"
          alt=""
          width="366"
          height="367"
          loading="lazy"
          decoding="async"
          className="w-full h-auto object-contain animate-palm-canopy-l opacity-60 filter brightness-[0.7] drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]"
        />
      </div>
      <div className="absolute top-0 left-0 pointer-events-none z-20 w-32 sm:w-48 md:w-56 lg:w-64 max-w-[28vw] select-none" aria-hidden="true">
        <img
          src="/palmera-corner-tl.webp"
          alt=""
          width="366"
          height="367"
          decoding="async"
          className="w-full h-auto object-contain animate-palm-tl opacity-95 filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)]"
        />
      </div>

      {/* --- Esquina Superior Derecha (Doble Capa con Profundidad) --- */}
      <div className="absolute top-0 right-10 sm:right-16 md:right-24 pointer-events-none z-10 w-24 sm:w-36 md:w-44 max-w-[20vw] select-none flex justify-end" aria-hidden="true">
        <img
          src="/palmera-corner-tr.webp"
          alt=""
          width="366"
          height="367"
          loading="lazy"
          decoding="async"
          className="w-full h-auto object-contain animate-palm-canopy-r opacity-60 filter brightness-[0.7] drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]"
        />
      </div>
      <div className="absolute top-0 right-0 pointer-events-none z-20 w-32 sm:w-48 md:w-56 lg:w-64 max-w-[28vw] select-none flex justify-end" aria-hidden="true">
        <img
          src="/palmera-corner-tr.webp"
          alt=""
          width="366"
          height="367"
          decoding="async"
          className="w-full h-auto object-contain animate-palm-tr opacity-95 filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)]"
        />
      </div>

      {/* --- Esquina Inferior Izquierda (Doble Capa) --- */}
      <div className="absolute bottom-0 left-8 sm:left-14 pointer-events-none z-10 w-20 sm:w-32 md:w-36 max-w-[18vw] select-none flex items-end" aria-hidden="true">
        <img
          src="/palmera-corner-bl.webp"
          alt=""
          width="366"
          height="367"
          loading="lazy"
          decoding="async"
          className="w-full h-auto object-contain animate-palm-mid-l opacity-55 filter brightness-[0.7] drop-shadow-[0_-6px_12px_rgba(0,0,0,0.8)]"
        />
      </div>
      <div className="absolute bottom-0 left-0 pointer-events-none z-20 w-28 sm:w-40 md:w-48 lg:w-52 max-w-[24vw] select-none flex items-end" aria-hidden="true">
        <img
          src="/palmera-corner-bl.webp"
          alt=""
          width="366"
          height="367"
          decoding="async"
          className="w-full h-auto object-contain animate-palm-bl opacity-85 filter drop-shadow-[0_-10px_20px_rgba(0,0,0,0.9)]"
        />
      </div>

      {/* --- Esquina Inferior Derecha (Doble Capa) --- */}
      <div className="absolute bottom-0 right-8 sm:right-14 pointer-events-none z-10 w-20 sm:w-32 md:w-36 max-w-[18vw] select-none flex items-end justify-end" aria-hidden="true">
        <img
          src="/palmera-corner-br.webp"
          alt=""
          width="366"
          height="367"
          loading="lazy"
          decoding="async"
          className="w-full h-auto object-contain animate-palm-mid-r opacity-55 filter brightness-[0.7] drop-shadow-[0_-6px_12px_rgba(0,0,0,0.8)]"
        />
      </div>
      <div className="absolute bottom-0 right-0 pointer-events-none z-20 w-28 sm:w-40 md:w-48 lg:w-52 max-w-[24vw] select-none flex items-end justify-end" aria-hidden="true">
        <img
          src="/palmera-corner-br.webp"
          alt=""
          width="366"
          height="367"
          decoding="async"
          className="w-full h-auto object-contain animate-palm-br opacity-85 filter drop-shadow-[0_-10px_20px_rgba(0,0,0,0.9)]"
        />
      </div>

      {/* 3. Header Centrado en PC & Móvil (Ubicación Interactiva) */}
      <header
        role="banner"
        className="relative z-30 px-4 sm:px-6 pt-[max(3.25rem,calc(env(safe-area-inset-top)+1.5rem))] sm:pt-8 flex items-center justify-center max-w-6xl mx-auto w-full shrink-0"
      >
        {/* Ubicación: Cochabamba, Bolivia (Interactivo para ver ubicación y mapas) */}
        <button
          type="button"
          onClick={() => setIsLocationOpen(true)}
          className="group relative inline-flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-stone-200 bg-stone-900/95 hover:bg-stone-900 backdrop-blur-md px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full border border-white/20 hover:border-amber-400/60 shadow-[0_6px_24px_rgba(0,0,0,0.65)] transition-all duration-300 active:scale-95 cursor-pointer"
          title="Toca para ver la ubicación en Google Maps y Apple Maps"
        >
          {/* Pin con micro-ping sutil */}
          <span className="relative flex items-center justify-center shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#cb6115] absolute animate-ping opacity-35 group-hover:opacity-75" />
            <IconMapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#cb6115] relative z-10 group-hover:scale-110 transition-transform" aria-hidden="true" />
          </span>

          <span className="font-bold text-white text-xs sm:text-sm group-hover:text-amber-200 transition-colors tracking-tight">
            Cochabamba, Bolivia
          </span>

          <span className="text-stone-500 text-xs">•</span>

          {/* Indicación de acción agrandada y nítida en móvil */}
          <span className="inline-flex items-center space-x-1 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 rounded-full group-hover:bg-amber-400 group-hover:text-stone-950 transition-all duration-200 shrink-0">
            <span>Ver mapa</span>
            <span className="text-xs group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">↗</span>
          </span>
        </button>
      </header>

      {/* 4. Contenido Central Proporcional y Dinámico (Sin desbordes ni scroll) */}
      <main
        role="main"
        className="relative z-30 flex-1 flex flex-col items-center justify-center px-4 py-1 sm:py-4 text-center max-w-xl mx-auto min-h-0 w-full"
      >
        {/* Logotipo Oficial Adaptable por Altura de Pantalla */}
        <div className="mb-2 sm:mb-4 relative shrink-0">
          <img
            src="/logokampina3.webp"
            alt="La Kampiña - Restaurante Criollo y Casa de Campo"
            width="240"
            height="240"
            fetchpriority="high"
            decoding="async"
            className="w-32 h-32 sm:w-52 sm:h-52 md:w-60 md:h-60 max-h-[22vh] sm:max-h-[30vh] object-contain mx-auto filter drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)] transition-transform duration-300 hover:scale-[1.02]"
          />
        </div>

        {/* Kicker tipográfico gastronómico */}
        <span className="inline-block text-xs sm:text-base md:text-lg font-display font-bold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-amber-300 drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] mb-3 sm:mb-6 shrink-0">
          Sabor Tradicional
        </span>

        {/* Controles de Acción (Touch targets accesibles) */}
        <div className="space-y-2.5 sm:space-y-4 w-full max-w-xs sm:max-w-sm flex flex-col items-center shrink-0">
          {/* Botón Principal (Vibrant Flame Gradient) */}
          <button
            type="button"
            onClick={() => onSelectStore('cochabamba')}
            aria-label="Explorar Menú y realizar pedidos en Cochabamba"
            className="group relative w-full inline-flex items-center justify-center gap-2.5 sm:gap-3 px-6 sm:px-10 py-3.5 sm:py-4.5 min-h-[48px] sm:min-h-[54px] rounded-2xl btn-vibrant-flame text-white font-display font-bold text-sm sm:text-lg uppercase tracking-wider cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
          >
            <span>Explorar Menú Y Pedidos</span>
            <IconArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1.5 transition-transform duration-200" aria-hidden="true" />
          </button>

          {/* Indicador Minimalista de Estado de Atención (Luz Verde / Roja) */}
          <div className="inline-flex items-center justify-center gap-2 py-1.5 sm:py-2 px-3.5 sm:px-4.5 rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-800 text-[10px] sm:text-xs shadow-lg">
            <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5">
              {status.isOpen && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 ${
                  status.isOpen
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]'
                    : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]'
                }`}
              />
            </span>
            <span
              className={`font-black uppercase tracking-wider text-[10px] sm:text-[11px] ${
                status.isOpen ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {status.statusText}
            </span>
            <span className="text-stone-600 text-[10px]">•</span>
            <span className="text-stone-300 text-[11px] sm:text-xs font-semibold">
              {status.detailText}
            </span>
          </div>
        </div>
      </main>

      {/* 5. Footer con Métricas de Confianza (Totalmente contenido y sin desbordes) */}
      <footer
        role="contentinfo"
        className="relative z-30 pb-4 sm:pb-6 pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] px-4 text-center max-w-2xl mx-auto w-full shrink-0"
      >
        <div className="inline-flex items-center justify-center gap-2.5 sm:gap-6 text-[10px] sm:text-sm font-bold text-stone-100 bg-stone-900/90 backdrop-blur-md py-2 sm:py-3 px-4 sm:px-8 rounded-full border border-stone-800 shadow-xl whitespace-nowrap">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <IconScooter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#cb6115]" aria-hidden="true" />
            <span>Delivery Cochabamba</span>
          </div>
          <span className="text-stone-500" aria-hidden="true">•</span>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <IconQrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#cb6115]" aria-hidden="true" />
            <span>Pago QR Simple</span>
          </div>
        </div>
      </footer>

      {/* Modal Interactivo de Ubicación & Mapas */}
      <LocationModal isOpen={isLocationOpen} onClose={() => setIsLocationOpen(false)} />
    </div>
  );
}
