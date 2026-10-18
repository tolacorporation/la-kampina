import React, { useRef, useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { CATALOG_CATEGORIES } from '../../data/catalog';
import { isThursday } from '../../data/restaurantInfo';
import { IconSearch, IconShoppingBag, IconMapPin, IconX, IconAlertTriangle } from '../common/Icons';

export default function StoreHeader({ onBackToLanding }) {
  const {
    totalCount,
    setIsCartOpen,
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    setIsInfoOpen,
    activeCategory,
    setActiveCategory,
    categories,
    liveDiscount,
    storeSettings,
  } = useCart();

  const isClosed = storeSettings?.is_closed_override === 'true';
  const closedMessage = storeSettings?.closed_message || 'Hoy cerrado por evento privado';

  const currentCategories = categories && categories.length > 0 ? categories : CATALOG_CATEGORIES;

  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef(null);

  // Detectar scroll para modo móvil compacto y dinámico
  useEffect(() => {
    const handleWindowScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    handleWindowScroll();
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  // Centrar horizontalmente la categoría activa en la barra móvil
  useEffect(() => {
    if (activeCategory && scrollContainerRef.current) {
      const activeBtn = scrollContainerRef.current.querySelector(`[data-cat-id="${activeCategory}"]`);
      if (activeBtn) {
        const container = scrollContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        const offset = btnRect.left - containerRect.left - (containerRect.width / 2) + (btnRect.width / 2);
        container.scrollBy({
          left: offset,
          behavior: 'smooth',
        });
      }
    }
  }, [activeCategory]);

  const scrollToCategory = (catId) => {
    setActiveCategory(catId);
    const element = document.getElementById(catId);
    if (element) {
      const headerOffset = isScrolled ? 80 : 100;
      const y = element.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  return (
    <header
      className="sticky top-0 z-50 w-full bg-stone-950/95 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_10px_35px_rgba(0,0,0,0.45)] transition-all duration-300"
      style={{ position: 'sticky', top: 0 }}
    >
      {/* Specular glass highlight bevel */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

      {/* ⚠️ Banner Oficial de Cierre Temporal del Local */}
      {isClosed && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-stone-950 font-bold border-b border-amber-400/40 animate-fade-in shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <IconAlertTriangle className="w-4 h-4 text-stone-950 flex-shrink-0" />
              <p className="text-[11px] sm:text-xs font-bold truncate">
                <span className="uppercase font-black text-[9px] bg-stone-950 text-amber-300 px-2 py-0.5 rounded tracking-wider mr-1.5">
                  Local Cerrado
                </span>
                {closedMessage} · Pedidos pausados temporalmente
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold text-stone-950/80 tracking-wider hidden sm:inline flex-shrink-0">
              Carta informativa
            </span>
          </div>
        </div>
      )}

      {/* 🔴 Banner Dinámico de Live / Descuento Activo */}
      {liveDiscount?.active && (
        <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-rose-700 to-red-600 border-b border-red-400/40 text-white animate-fade-in shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <p className="text-[11px] sm:text-xs font-bold truncate tracking-wide">
                <span className="bg-white/20 text-white uppercase text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider mr-1.5">
                  LIVE
                </span>
                {liveDiscount.title || '¡Estamos en Vivo! Descuento especial en todos los platos'}
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-200 tracking-wider hidden sm:inline flex-shrink-0">
              Descuento activo
            </span>
          </div>
        </div>
      )}

      {/* 🌶️ Banner especial — solo aparece los jueves */}
      {isThursday() && (
        <div className="relative overflow-hidden bg-gradient-to-r from-red-900/90 via-orange-800/90 to-amber-800/90 border-b border-amber-500/40 animate-fade-in">
          {/* Shimmer de luz */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse pointer-events-none" />
          <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-100 min-w-0">
              <span className="text-base animate-bounce flex-shrink-0" role="img" aria-label="ají">🌶️</span>
              <p className="text-[11px] sm:text-xs font-bold truncate">
                <span className="text-amber-300 font-black">¡Hoy es Jueves!</span>
                {' '}Hay Ají de Fideo · Solo 45 Bs.
              </p>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('cat-aji-fideo');
                if (el) {
                  const y = el.getBoundingClientRect().top + window.pageYOffset - 120;
                  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
                }
              }}
              className="flex-shrink-0 text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-stone-950 px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer shadow-md"
            >
              Ver →
            </button>
          </div>
        </div>
      )}

      {/* Top Banner Row (Adaptable y fluida en móvil) */}
      <div
        className={`bg-stone-900/75 backdrop-blur-xl text-white border-b border-white/[0.06] transition-all duration-300 ${
          isScrolled ? 'py-1.5 px-3 sm:px-4' : 'py-2.5 px-4'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Left Actions: Back + Search */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="text-xs font-bold bg-white/[0.08] hover:bg-white/[0.16] text-[#cb6115] px-2.5 py-1.5 rounded-xl flex items-center space-x-1 transition border border-white/10 backdrop-blur-md active:scale-95 cursor-pointer shadow-sm"
                title="Volver a la portada"
              >
                <span>←</span>
                <span className="hidden sm:inline text-stone-200">Portada</span>
              </button>
            )}

            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-stone-300 hover:text-[#cb6115] transition flex items-center justify-center rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 backdrop-blur-md active:scale-95 cursor-pointer shadow-sm"
              aria-label="Buscar plato"
              title="Buscar platos del menú"
            >
              <IconSearch className="w-4 h-4" />
            </button>
          </div>

          {/* Center: Brand Logo & Typography */}
          <div className="flex-1 flex justify-center px-1 overflow-hidden">
            <div
              className="cursor-pointer flex items-center space-x-1.5 sm:space-x-2 py-0.5 group shrink-0"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="relative">
                <img
                  src="/logokampina3.webp"
                  alt="La Kampiña"
                  className={`w-auto object-contain filter drop-shadow group-hover:scale-105 transition-all duration-300 ${
                    isScrolled ? 'h-6 sm:h-7' : 'h-8 sm:h-10'
                  }`}
                />
              </div>
              <div className="text-left hidden xs:block">
                <span
                  className={`font-display font-bold tracking-wider text-white group-hover:text-amber-300 transition-colors duration-200 block leading-tight ${
                    isScrolled ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                  }`}
                >
                  LA KAMPIÑA
                </span>
                {!isScrolled && (
                  <p className="text-[8px] sm:text-[9px] text-amber-400 uppercase tracking-widest font-bold hidden md:block">
                    Cochabamba • Bolivia
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Location Button + Cart Button with Badge */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Botón de Ubicación & Mapa */}
            <button
              onClick={() => setIsInfoOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 text-stone-200 hover:text-[#cb6115] transition flex items-center justify-center rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 backdrop-blur-md active:scale-95 cursor-pointer shadow-sm group"
              aria-label="Ver ubicación y mapa del restaurante"
              title="Ver ubicación en Google Maps y Apple Maps (Av. D'orbigny Km 4 1/2)"
            >
              <span className="animate-pin-bounce flex items-center justify-center">
                <IconMapPin className="w-4 h-4 text-[#cb6115]" />
              </span>
              <span className="hidden sm:inline text-xs font-bold text-stone-200 ml-1.5 group-hover:text-[#cb6115] transition">
                Ubicación
              </span>
            </button>

            {/* Botón de Carrito */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:px-3 sm:py-1.5 text-stone-200 hover:text-[#cb6115] transition flex items-center justify-center rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 backdrop-blur-md active:scale-95 cursor-pointer shadow-sm"
              aria-label="Abrir pedido"
              title="Ver tu pedido"
            >
              <IconShoppingBag className="w-4 h-4 text-stone-200" />
              {totalCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-[#cb6115] to-[#e67a28] text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-[#cb6115]/50 border border-white/20">
                  {totalCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Search Input */}
        {isSearchOpen && (
          <div className="max-w-xl mx-auto mt-2 px-2 pb-1 animate-fade-in">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar charque, matahambre, charkambre, pique macho, planchita, ají de fideo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-stone-950/90 border border-white/20 rounded-xl px-4 py-2 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#cb6115] backdrop-blur-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-white p-0.5"
                >
                  <IconX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Categories Horizontal Carousel (Apple Liquid Dock Móvil) */}
      <div
        ref={scrollContainerRef}
        className="bg-stone-950/85 backdrop-blur-xl border-t border-white/[0.06] overflow-x-auto no-scrollbar scroll-smooth"
      >
        <div
          className={`max-w-6xl mx-auto flex items-center whitespace-nowrap px-3 sm:px-4 space-x-2 transition-all duration-300 ${
            isScrolled ? 'py-1.5' : 'py-2'
          }`}
        >
          {currentCategories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                data-cat-id={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`text-xs md:text-sm uppercase tracking-wide px-4 py-1.5 rounded-xl transition-all relative whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 cursor-pointer active:scale-95 ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-[#c45009] via-[#b84807] to-[#9a3605] font-display font-bold shadow-[0_4px_16px_rgba(0,0,0,0.5)] ring-1 ring-amber-400/40 scale-[1.03]'
                    : 'text-stone-300 hover:text-white font-medium bg-white/[0.06] hover:bg-white/[0.14] border border-white/[0.10] backdrop-blur-md'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
