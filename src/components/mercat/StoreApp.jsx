import React from 'react';
import StoreHeader from './StoreHeader';
import StoreCatalog from './StoreCatalog';
import ProductModal from './ProductModal';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import InfoModal from './InfoModal';
import WhatsAppFloating from './WhatsAppFloating';
import ImageZoomModal from './ImageZoomModal';

export default function StoreApp({ onBackToLanding }) {
  return (
    <div className="min-h-screen min-h-[100dvh] text-white flex flex-col font-sans selection:bg-[#cb6115] selection:text-white relative bg-transparent">
      {/* Fondo Rústico Fotográfico de Pared de Piedra (Continuo en móvil y desktop sin recortes) */}
      <div
        className="fixed inset-x-0 pointer-events-none z-0 overflow-hidden select-none"
        style={{
          top: '-20px',
          bottom: '-90px',
          height: 'calc(100dvh + 110px)',
          minHeight: '100dvh',
        }}
        aria-hidden="true"
      >
        {/* Base de respaldo oscura neutra */}
        <div className="absolute inset-0 bg-stone-950" />

        {/* Imagen de pared de roca rústica: nítida, fluida y sin cortes en pantallas móviles */}
        <img
          src="/fondopiedra.jpg"
          alt=""
          className="w-full h-full object-cover object-center filter brightness-[0.75] contrast-[1.12] saturate-[1.15]"
        />

        {/* Velo oscuro uniforme que preserva la textura de la piedra en toda la altura sin manchas de color */}
        <div className="absolute inset-0 bg-stone-950/45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(10,10,10,0.55)_100%)]" />

        {/* Resplandor cálido de fogón (solo en pantallas grandes para evitar manchas cafés en móvil) */}
        <div className="hidden sm:block absolute top-1/4 -left-32 w-[500px] h-[500px] bg-[#cb6115]/[0.08] rounded-full blur-[140px] pointer-events-none" />
        <div className="hidden sm:block absolute top-2/3 -right-40 w-[500px] h-[500px] bg-[#f59e0b]/[0.06] rounded-full blur-[160px] pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen min-h-[100dvh]">
        <StoreHeader onBackToLanding={onBackToLanding} />
        <StoreCatalog />
      </div>

      {/* Popups and Modals */}
      <ProductModal />
      <ImageZoomModal />
      <CartDrawer />
      <CheckoutModal />
      <InfoModal />
      <WhatsAppFloating />
    </div>
  );
}
