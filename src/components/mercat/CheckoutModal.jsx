import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { RESTAURANT_INFO } from '../../data/restaurantInfo';
import {
  IconScooter,
  IconStore,
  IconQrCode,
  IconBanknote,
  IconCheckCircle,
  IconX,
  IconMessageCircle,
  IconMapPin,
  IconNavigation,
  IconExternalLink,
} from '../common/Icons';

export default function CheckoutModal() {
  const { isCheckoutOpen, setIsCheckoutOpen, items, totalAmount, clearCart, formatPrice } = useCart();
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('qr');
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const subtotal = totalAmount;

  if (!isCheckoutOpen) return null;

  // Validación estricta: Todos los campos requeridos son obligatorios
  const validateForm = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = 'El nombre completo es obligatorio.';
    }
    if (!phone.trim()) {
      errors.phone = 'El teléfono o WhatsApp es obligatorio.';
    } else if (phone.trim().replace(/\D/g, '').length < 7) {
      errors.phone = 'Ingresa un número válido (mínimo 7 dígitos).';
    }

    if (deliveryType === 'delivery') {
      if (!mapsUrl.trim()) {
        errors.mapsUrl = 'La ubicación de Google Maps es obligatoria (pega tu enlace o usa "Obtener mi GPS").';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Obtener ubicación GPS del dispositivo automáticamente
  const handleGetGPSLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Tu navegador o dispositivo no soporta geolocalización GPS.');
      return;
    }
    setIsLocating(true);
    setLocationError('');
    setLocationSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const url = `https://maps.google.com/?q=${lat},${lng}`;
        setMapsUrl(url);
        setIsLocating(false);
        setLocationSuccess(true);
        // Limpiar error de mapsUrl si existía
        setFormErrors((prev) => ({ ...prev, mapsUrl: '' }));
      },
      (err) => {
        setIsLocating(false);
        let msg = 'No se pudo obtener el GPS automático. Por favor pega tu link de Google Maps manualmente.';
        if (err.code === 1) {
          msg = 'Permiso GPS denegado. Pega tu link de Google Maps manualmente.';
        } else if (err.code === 2) {
          msg = 'Señal de ubicación no disponible. Pega tu link de Google Maps manualmente.';
        } else if (err.code === 3) {
          msg = 'Tiempo de espera agotado. Pega tu link de Google Maps manualmente.';
        }
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Formato de pedido directo y minimalista para WhatsApp
  const generateClientFallbackUrl = () => {
    const orderNumber = `LK-${Math.floor(1000 + Math.random() * 9000)}`;

    let text = `*PEDIDO LA KAMPIÑA* (#${orderNumber})\n`;
    text += `Cliente: ${name.trim()} (${phone.trim()})\n`;
    if (deliveryType === 'delivery') {
      text += `Entrega: Delivery (Pendiente a cotización)\n`;
      text += `Ubicación: ${mapsUrl.trim()}\n\n`;
    } else {
      text += `Entrega: Retiro en local\n\n`;
    }

    text += `*Pedido:*\n`;
    items.forEach((item) => {
      const optionText = item.selectedOption ? ` [${item.selectedOption.name}]` : '';
      const itemSubtotal = item.unitPrice * item.quantity;
      const unitBreakdown = item.quantity > 1 ? ` (${formatPrice(item.unitPrice)} c/u)` : '';
      text += `• ${item.quantity}x ${item.product?.name}${optionText} — ${formatPrice(itemSubtotal)}${unitBreakdown}\n`;
      if (item.notes) {
        text += `  Nota: ${item.notes}\n`;
      }
    });

    text += `\n*Total:* ${formatPrice(subtotal)}\n`;
    if (deliveryType === 'delivery') {
      text += `*Delivery:* Pendiente a cotización\n`;
    }
    text += `*Pago:* ${paymentMethod === 'qr' ? 'QR Simple' : 'Efectivo'}`;

    const encoded = encodeURIComponent(text);
    return `${RESTAURANT_INFO.whatsappOrderUrl}?text=${encoded}`;
  };

  const handleSendWhatsApp = async (e) => {
    e.preventDefault();

    // Verificación obligatoria: Si falta algún campo, NO se manda a WhatsApp
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const apiUrl = import.meta.env.VITE_API_URL;

    // Si no hay un servidor backend configurado explícitamente, enviamos a WhatsApp de inmediato (0s de espera)
    if (!apiUrl) {
      const targetUrl = generateClientFallbackUrl();
      window.open(targetUrl, '_blank');
      setIsLoading(false);
      setIsSuccess(true);
      clearCart();
      return;
    }

    const orderPayload = {
      customerName: name.trim(),
      phone: phone.trim(),
      deliveryType,
      mapsUrl: deliveryType === 'delivery' ? mapsUrl.trim() : undefined,
      paymentMethod,
      items: items.map((item) => ({
        productId: item.product?.id,
        optionId: item.selectedOption?.id || item.selectedOption?.name,
        quantity: item.quantity,
        notes: item.notes || '',
      })),
    };

    let targetUrl = '';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`${apiUrl}/orders/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.whatsappUrl) {
          targetUrl = data.whatsappUrl;
        }
      }
    } catch (err) {
      console.warn('Backend offline. Usando enlace directo a WhatsApp:', err);
    } finally {
      if (!targetUrl) {
        targetUrl = generateClientFallbackUrl();
      }

      window.open(targetUrl, '_blank');
      setIsLoading(false);
      setIsSuccess(true);
      clearCart();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[92dvh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-950 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <img
              src="/logokampina3.webp"
              alt="La Kampiña"
              className="h-7 sm:h-8 w-auto object-contain"
            />
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base uppercase tracking-wider text-white">
                {isSuccess ? 'Pedido Confirmado' : 'Datos de tu Pedido'}
              </h3>
              <p className="text-[10px] text-amber-300/80 font-medium">La Kampiña • Cochabamba</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsCheckoutOpen(false);
              setIsSuccess(false);
              setFormErrors({});
            }}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
            aria-label="Cerrar"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-6 text-center space-y-4 my-auto">
            <IconCheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
            <h4 className="text-xl font-black text-stone-900 uppercase">
              Pedido Listo en WhatsApp
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
              Tu pedido con la lista de platos y ubicación ya fue generado.
              Presiona "Enviar" en tu aplicación de WhatsApp para finalizar.
            </p>
            <button
              onClick={() => {
                setIsCheckoutOpen(false);
                setIsSuccess(false);
                setFormErrors({});
              }}
              className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl shadow transition cursor-pointer"
            >
              Volver al Menú
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendWhatsApp} className="flex flex-col flex-1 min-h-0 overflow-hidden" noValidate>
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-stone-900">
              {/* Alerta de campos obligatorios si hay errores */}
              {Object.keys(formErrors).length > 0 && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs text-rose-800 font-bold animate-fade-in flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>Por favor completa los campos marcados con (*) para enviar tu pedido.</span>
                </div>
              )}

              {/* Delivery or Pickup */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-700 mb-1.5">
                  Modalidad de entrega *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryType('delivery');
                      setFormErrors({});
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase border flex items-center justify-center space-x-2 transition cursor-pointer ${
                      deliveryType === 'delivery'
                        ? 'border-amber-500 bg-amber-50 text-stone-950 font-black shadow-sm ring-1 ring-amber-500/30'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <IconScooter className="w-4 h-4 text-amber-600" />
                    <span>Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryType('pickup');
                      setFormErrors({});
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase border flex items-center justify-center space-x-2 transition cursor-pointer ${
                      deliveryType === 'pickup'
                        ? 'border-amber-500 bg-amber-50 text-stone-950 font-black shadow-sm ring-1 ring-amber-500/30'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <IconStore className="w-4 h-4 text-amber-600" />
                    <span>Retiro en Local</span>
                  </button>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre y apellido"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    className={`w-full bg-white text-stone-950 font-bold placeholder:text-stone-400 placeholder:font-normal border rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none transition shadow-sm ${
                      formErrors.name
                        ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500'
                        : 'border-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 71234567"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    className={`w-full bg-white text-stone-950 font-bold placeholder:text-stone-400 placeholder:font-normal border rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none transition shadow-sm ${
                      formErrors.phone
                        ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500'
                        : 'border-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">{formErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* Google Maps link if delivery */}
              {deliveryType === 'delivery' && (
                <div className="pt-0.5">
                  <div className={`p-3.5 rounded-2xl border space-y-2 transition ${
                    formErrors.mapsUrl ? 'bg-rose-50/30 border-rose-400 ring-1 ring-rose-400' : 'bg-stone-50 border-stone-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black uppercase text-stone-800">
                        Ubicación Google Maps *
                      </label>
                      <button
                        type="button"
                        onClick={handleGetGPSLocation}
                        disabled={isLocating}
                        className="px-2.5 py-1 rounded-lg bg-[#cb6115]/10 hover:bg-[#cb6115]/20 text-[#cb6115] font-black text-[11px] flex items-center space-x-1 transition border border-[#cb6115]/30 cursor-pointer active:scale-95"
                        title="Obtener coordenadas GPS automáticamente"
                      >
                        <IconNavigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                        <span>{isLocating ? 'Buscando GPS...' : '📍 Obtener mi GPS'}</span>
                      </button>
                    </div>

                    <input
                      type="url"
                      required
                      placeholder="Pega tu enlace de Google Maps (ej: https://maps.app.goo.gl/...)"
                      value={mapsUrl}
                      onChange={(e) => {
                        setMapsUrl(e.target.value);
                        setLocationSuccess(false);
                        if (formErrors.mapsUrl) setFormErrors((prev) => ({ ...prev, mapsUrl: '' }));
                      }}
                      className={`w-full bg-white text-stone-950 font-bold placeholder:text-stone-400 placeholder:font-normal border rounded-xl px-3 py-2.5 text-xs focus:outline-none transition shadow-sm ${
                        formErrors.mapsUrl
                          ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                          : 'border-stone-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                      }`}
                    />

                    {formErrors.mapsUrl && (
                      <p className="text-[11px] text-rose-600 font-bold bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                        {formErrors.mapsUrl}
                      </p>
                    )}

                    {locationSuccess && (
                      <div className="flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                        <span className="font-bold">✓ Ubicación GPS capturada exitosamente</span>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold underline text-[#cb6115] flex items-center space-x-0.5"
                        >
                          <span>Ver mapa</span>
                          <IconExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {locationError && (
                      <p className="text-[11px] text-rose-600 font-medium bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                        {locationError}
                      </p>
                    )}

                    <p className="text-xs text-stone-500 font-medium leading-relaxed">
                      Pulsa en <strong>Obtener mi GPS</strong> y autoriza el acceso para fijar las coordenadas exactas de tu entrega.
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-stone-700">
                  Forma de pago *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qr')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold uppercase border flex items-center justify-center space-x-2 transition cursor-pointer ${
                      paymentMethod === 'qr'
                        ? 'border-[#cb6115] bg-[#cb6115] text-white font-black shadow-sm ring-1 ring-[#cb6115]/30'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <IconQrCode className="w-4 h-4" />
                    <span>Pago QR Simple</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold uppercase border flex items-center justify-center space-x-2 transition cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-[#cb6115] bg-[#cb6115] text-white font-black shadow-sm ring-1 ring-[#cb6115]/30'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <IconBanknote className="w-4 h-4" />
                    <span>Efectivo</span>
                  </button>
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal Platos:</span>
                  <span className="font-bold text-stone-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-stone-600">
                  <span>Costo de Delivery:</span>
                  <span className="font-bold text-amber-800 bg-amber-100/70 border border-amber-300/60 px-2 py-0.5 rounded text-[11px]">
                    {deliveryType === 'delivery' ? 'Pendiente a cotización' : '0 Bs (Retiro en local)'}
                  </span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-bold text-stone-900 pt-1.5 border-t border-stone-200">
                  <span className="font-display">TOTAL PRODUCTOS:</span>
                  <span className="text-orange-600 font-display font-bold">{formatPrice(subtotal)}</span>
                </div>
              </div>
            </div>

            {/* Fixed Footer inside modal: Always visible, never cut off */}
            <div className="p-3.5 sm:p-4 bg-stone-50 border-t border-stone-200 shrink-0">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1da851] hover:bg-[#189346] shadow-[0_4px_16px_rgba(29,168,81,0.35)] disabled:opacity-75 text-white font-display font-bold py-3.5 px-4 rounded-xl text-sm sm:text-base uppercase tracking-wider transition flex items-center justify-center space-x-2 active:scale-[0.98] cursor-pointer"
              >
                <IconMessageCircle className="w-5 h-5 text-white" />
                <span>{isLoading ? 'Preparando pedido...' : 'Enviar pedido por WhatsApp'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
