import React from 'react';
import { RESTAURANT_INFO, openDeviceMap, isAppleDevice } from '../../data/restaurantInfo';
import {
  IconMapPin,
  IconX,
  IconGoogleMaps,
  IconApple,
  IconPhone,
} from './Icons';

export default function LocationModal({ isOpen, onClose }) {
  const isApple = isAppleDevice();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-950 text-white p-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-2.5">
            <IconMapPin className="w-5 h-5 text-[#cb6115]" />
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-white">
                Ubicación del Restaurante
              </h3>
              <p className="text-[10px] text-stone-400 font-semibold">
                La Kampiña • Cochabamba, Bolivia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Cerrar modal de ubicación"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm text-stone-700">
          {/* Address Details */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
            <p className="font-bold text-stone-900 text-sm">
              Cochabamba - Av. D'orbigny Km 4 1/2
            </p>
            <p className="text-stone-600 text-xs mt-0.5 leading-relaxed">
              Entre Avenida Segunda y Rafael Torrico Montaño
            </p>
          </div>

          {/* Interactive Google Maps Iframe */}
          <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-stone-200 shadow-inner bg-stone-100">
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

          {/* Botón único inteligente que detecta Apple Maps o Google Maps según el dispositivo */}
          <div className="pt-2">
            <button
              onClick={openDeviceMap}
              className="w-full bg-[#cb6115] hover:bg-[#af5312] text-white font-black py-3 px-4 rounded-xl text-xs sm:text-sm uppercase tracking-wide transition flex items-center justify-center space-x-2 shadow-md active:scale-[0.98] cursor-pointer"
              title={isApple ? 'Abrir en Apple Maps' : 'Abrir en Google Maps'}
            >
              {isApple ? (
                <>
                  <IconApple className="w-4 h-4 text-white" />
                  <span>Abrir en Apple Maps</span>
                </>
              ) : (
                <>
                  <IconGoogleMaps className="w-4 h-4 text-white" />
                  <span>Abrir en Google Maps</span>
                </>
              )}
            </button>
          </div>

          {/* Direct Phone Contact */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">Teléfono directo:</span>
            <a
              href={RESTAURANT_INFO.phoneCallUrl}
              className="font-black text-stone-900 hover:text-[#cb6115] transition flex items-center space-x-1"
            >
              <IconPhone className="w-3.5 h-3.5 text-[#cb6115]" />
              <span>{RESTAURANT_INFO.phoneDisplay}</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 text-center">
          <button
            onClick={onClose}
            className="text-xs font-bold text-stone-500 hover:text-black uppercase px-4 py-1"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
