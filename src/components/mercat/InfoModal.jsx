import React from 'react';
import { useCart } from '../../context/CartContext';
import { RESTAURANT_INFO, openDeviceMap, isAppleDevice } from '../../data/restaurantInfo';
import {
  IconMapPin,
  IconClock,
  IconPhone,
  IconMessageCircle,
  IconX,
  IconGoogleMaps,
  IconApple,
} from '../common/Icons';

export default function InfoModal() {
  const { isInfoOpen, setIsInfoOpen, storeSettings } = useCart();
  const isApple = isAppleDevice();

  if (!isInfoOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={() => setIsInfoOpen(false)}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-950 text-white p-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-2.5">
            <img
              src="/logokampina3.webp"
              alt="La Kampiña"
              className="h-7 w-auto object-contain"
            />
            <div>
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">
                Información del Restaurante
              </h3>
              <p className="text-[10px] text-amber-300/80 font-semibold">
                La Kampiña • Cochabamba, Bolivia
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsInfoOpen(false)}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Cerrar ventana de información"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm text-stone-700">
          {/* Ubicación & Mapa */}
          <div>
            <div className="flex items-center space-x-1.5 text-stone-900 font-bold mb-1">
              <IconMapPin className="w-4 h-4 text-orange-600" />
              <span className="uppercase text-xs tracking-wider font-display">Ubicación & Local</span>
            </div>
            <p className="font-bold text-stone-900 text-sm">Cochabamba - Av. D'orbigny Km 4 1/2</p>
            <p className="text-stone-600 text-xs mt-0.5 leading-relaxed">
              Entre Avenida Segunda y Rafael Torrico Montaño
            </p>

            {/* Google Maps Embed Iframe */}
            <div className="mt-2.5 rounded-2xl overflow-hidden border border-amber-900/10 shadow-inner aspect-[16/10] w-full bg-stone-100">
              <iframe
                src={RESTAURANT_INFO.location.embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Ubicación oficial La Kampiña en Google Maps"
                className="w-full h-full"
              />
            </div>

            {/* Botones de navegación GPS */}
            <div className="mt-3 space-y-2">
              {isApple ? (
                <>
                  <a
                    href={RESTAURANT_INFO.location.appleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-vibrant-flame text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm uppercase tracking-wide transition flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.98] shadow-md"
                    title="Abrir ubicación oficial en Apple Maps"
                  >
                    <IconApple className="w-4 h-4 text-white" />
                    <span>Abrir en Apple Maps</span>
                  </a>
                  <a
                    href={RESTAURANT_INFO.location.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wide transition flex items-center justify-center space-x-2 border border-stone-200 active:scale-[0.98] cursor-pointer"
                    title="Abrir ubicación en Google Maps"
                  >
                    <IconGoogleMaps className="w-4 h-4 text-stone-600" />
                    <span>O abrir en Google Maps</span>
                  </a>
                </>
              ) : (
                <a
                  href={RESTAURANT_INFO.location.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full btn-vibrant-flame text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm uppercase tracking-wide transition flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.98]"
                  title="Abrir en Google Maps"
                >
                  <IconGoogleMaps className="w-4 h-4 text-white" />
                  <span>Abrir en Google Maps</span>
                </a>
              )}
            </div>
          </div>

          {/* Horario de Atención */}
          <div className="border-t border-stone-100 pt-3.5">
            <div className="flex items-center space-x-1.5 text-stone-900 font-bold mb-1">
              <IconClock className="w-4 h-4 text-[#cb6115]" />
              <span className="uppercase text-xs tracking-wider">Horario de Atención</span>
            </div>
            <p className="font-bold text-stone-900">{storeSettings?.schedule_days || RESTAURANT_INFO.schedule.days}:</p>
            <p className="text-xs text-stone-600 mt-0.5">{storeSettings?.schedule_hours || RESTAURANT_INFO.schedule.hours}</p>
          </div>

          {/* Contacto & Pedidos */}
          <div className="border-t border-stone-100 pt-3.5">
            <div className="flex items-center space-x-1.5 text-stone-900 font-bold mb-1">
              <IconPhone className="w-4 h-4 text-[#cb6115]" />
              <span className="uppercase text-xs tracking-wider">Contacto & Delivery</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-500">Teléfono Local:</p>
                <a
                  href={RESTAURANT_INFO.phoneCallUrl}
                  className="font-black text-stone-900 text-base hover:text-[#cb6115] transition"
                >
                  {RESTAURANT_INFO.phoneDisplay}
                </a>
              </div>
              <a
                href={RESTAURANT_INFO.phoneCallUrl}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-3 py-1.5 rounded-lg text-xs transition"
              >
                Llamar
              </a>
            </div>

            <a
              href={RESTAURANT_INFO.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center space-x-2 mt-3 w-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-black uppercase px-4 py-3 rounded-xl transition shadow active:scale-[0.98]"
            >
              <IconMessageCircle className="w-4 h-4" />
              <span>Contactar por WhatsApp ({RESTAURANT_INFO.phoneDisplay})</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 text-center">
          <button
            onClick={() => setIsInfoOpen(false)}
            className="text-xs font-bold text-stone-500 hover:text-black uppercase px-4 py-1"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
