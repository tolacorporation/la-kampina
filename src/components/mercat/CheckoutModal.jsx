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

  // Formato tipo Boleta Electrónica sin rodeos y sin emojis
  const generateClientFallbackUrl = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const orderNumber = `LK-${Math.floor(1000 + Math.random() * 9000)}`;

    let text = `*LA KAMPIÑA - COCHABAMBA*\n`;
    text += `*BOLETA ELECTRÓNICA DE PEDIDO*\n`;
    text += `Nro. Pedido: #${orderNumber}\n`;
    text += `Fecha y hora: ${dateStr}\n`;
    text += `----------------------------------------\n\n`;

    text += `CLIENTE:\n`;
    text += `- Nombre: ${name.trim()}\n`;
    text += `- Telefono: ${phone.trim()}\n\n`;

    text += `ENTREGA:\n`;
    if (deliveryType === 'delivery') {
      text += `- Modalidad: Delivery a Domicilio (A cotizacion)\n`;
      text += `- Ubicacion Google Maps / GPS:\n${mapsUrl.trim()}\n`;
      text += `- Costo de Delivery: A cotizar segun ubicacion\n\n`;
    } else {
      text += `- Modalidad: Retiro en Local\n`;
      text += `- Direccion del Local: Cochabamba, Av. D'orbigny Km 4 1/2\n`;
      text += `- Costo de Delivery: 0 Bs (Sin costo)\n\n`;
    }

    text += `DETALLE DEL PEDIDO:\n`;
    items.forEach((item, index) => {
      const optionText = item.selectedOption ? ` [${item.selectedOption.name}]` : '';
      const itemSubtotal = item.unitPrice * item.quantity;
      text += `${index + 1}. ${item.quantity}x ${item.product?.name}${optionText}\n`;
      text += `   Precio: ${formatPrice(item.unitPrice)} c/u | Subtotal: ${formatPrice(itemSubtotal)}\n`;
      if (item.notes) {
        text += `   Nota: ${item.notes}\n`;
      }
    });

    text += `\n----------------------------------------\n`;
    text += `TOTAL PRODUCTOS: ${formatPrice(subtotal)}\n`;
    if (deliveryType === 'delivery') {
      text += `DELIVERY: A cotizacion segun ubicacion\n`;
    } else {
      text += `DELIVERY: 0 Bs (Retiro en local)\n`;
    }
    text += `FORMA DE PAGO: ${paymentMethod === 'qr' ? 'Pago por QR Simple' : 'Efectivo contra entrega'}\n\n`;

    if (paymentMethod === 'qr') {
      if (deliveryType === 'delivery') {
        text += `INDICACION DE PAGO:\nEn un momento le mandamos el QR para ingresar el pedido mas la cotizacion de delivery.\n`;
      } else {
        text += `INDICACION DE PAGO:\nEn un momento le mandamos el QR para ingresar y confirmar el pedido.\n`;
      }
    } else {
      text += `INDICACION DE PAGO:\nPago en efectivo al recibir el pedido.\n`;
    }

    text += `----------------------------------------\n`;
    text += `Pedido generado en La Kampina Web`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-stone-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-3">
            <img
              src="/logokampina3.webp"
              alt="La Kampiña"
              className="h-8 w-auto object-contain"
            />
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base uppercase tracking-wider text-white">
                {isSuccess ? 'Boleta Generada' : 'Boleta Electrónica de Pedido'}
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
            className="text-stone-400 hover:text-white p-1 rounded-lg"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4">
              <IconCheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
              <h4 className="text-xl font-black text-stone-900 uppercase">
                Boleta Lista en WhatsApp
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
                Tu boleta electrónica con tus platos y enlace de Google Maps ya fue generada.
                Solo presiona "Enviar" en tu aplicación de WhatsApp.
              </p>
              {paymentMethod === 'qr' && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 max-w-sm mx-auto text-xs text-amber-950 font-bold">
                  En un momento le mandamos el código QR para ingresar el pedido más la cotización de delivery.
                </div>
              )}
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
            <form onSubmit={handleSendWhatsApp} className="space-y-4" noValidate>
              {/* Alerta de campos obligatorios si hay errores */}
              {Object.keys(formErrors).length > 0 && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-3 text-xs text-rose-800 font-bold animate-fade-in flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>Todos los campos marcados con (*) son obligatorios para poder enviar tu pedido por WhatsApp.</span>
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
                        ? 'border-amber-500 bg-amber-50 text-stone-950 font-black shadow-sm'
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
                        ? 'border-amber-500 bg-amber-50 text-stone-950 font-black shadow-sm'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <IconStore className="w-4 h-4 text-amber-600" />
                    <span>Retiro en Local</span>
                  </button>
                </div>
              </div>

              {/* Delivery info banner */}
              {deliveryType === 'delivery' && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <IconMapPin className="w-3.5 h-3.5 text-[#cb6115]" />
                    <span className="uppercase text-[11px] tracking-wide">Delivery a Cotización (Sin zonas limitadas)</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Cotizamos el envío de forma justa según la distancia exacta de tu ubicación de Google Maps. Te enviaremos la tarifa exacta por WhatsApp antes del despacho.
                  </p>
                </div>
              )}

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
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
                    className={`w-full border rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none transition ${
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
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
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
                    className={`w-full border rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none transition ${
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

              {/* Google Maps link if delivery (Dirección removida ya que se usa Google Maps) */}
              {deliveryType === 'delivery' && (
                <div className="pt-1">
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
                      className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-medium text-stone-800 focus:outline-none transition ${
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

                    <p className="text-[10px] text-stone-400 leading-normal">
                      Pega tu link de Google Maps o pulsa en <strong>📍 Obtener mi GPS</strong>. El repartidor se guiará directamente por este punto para cotizar y entregar tu pedido.
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-stone-600">
                  Forma de pago *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qr')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold uppercase border flex items-center justify-center space-x-2 transition cursor-pointer ${
                      paymentMethod === 'qr'
                        ? 'border-[#cb6115] bg-[#cb6115] text-white font-black shadow-sm'
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
                        ? 'border-[#cb6115] bg-[#cb6115] text-white font-black shadow-sm'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <IconBanknote className="w-4 h-4" />
                    <span>Efectivo</span>
                  </button>
                </div>

                {/* Mensaje al marcar Pago por QR */}
                {paymentMethod === 'qr' && (
                  <div className="bg-gradient-to-r from-amber-500/10 via-[#cb6115]/10 to-amber-500/10 border-2 border-[#cb6115]/30 rounded-2xl p-3.5 text-xs text-stone-800 shadow-sm animate-fade-in space-y-1.5">
                    <div className="flex items-center space-x-2 text-[#cb6115] font-black uppercase text-[11px] tracking-wide">
                      <IconQrCode className="w-4 h-4" />
                      <span>Instrucción de Pago por QR</span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-900 font-black leading-snug">
                      En un momento le mandamos el código QR para ingresar el pedido más la cotización de delivery.
                    </p>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Al enviar este pedido a nuestro WhatsApp, calcularemos la cotización exacta del envío con tu ubicación de Google Maps y te compartiremos el QR bancario para tu transferencia.
                    </p>
                  </div>
                )}

                {/* Mensaje al marcar Efectivo */}
                {paymentMethod === 'cash' && (
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs text-stone-700 animate-fade-in space-y-1">
                    <div className="flex items-center space-x-2 font-bold text-stone-900">
                      <IconBanknote className="w-4 h-4 text-emerald-600" />
                      <span>Pago en Efectivo contra entrega</span>
                    </div>
                    <p className="text-[11px] text-stone-600">
                      Pagas al momento de recibir tus platos. Te confirmaremos por WhatsApp el total sumando la cotización del delivery.
                    </p>
                  </div>
                )}
              </div>

              {/* Breakdown */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1.5 text-xs sm:text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal Platos:</span>
                  <span className="font-bold text-stone-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-stone-600">
                  <span>Costo de Delivery:</span>
                  <span className="font-bold text-amber-800 bg-amber-100/70 border border-amber-300/60 px-2 py-0.5 rounded text-[11px]">
                    {deliveryType === 'delivery' ? 'A cotización según ubicación' : '0 Bs (Retiro en local)'}
                  </span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-bold text-stone-900 pt-2 border-t border-amber-900/10">
                  <span className="font-display">TOTAL PLATOS:</span>
                  <span className="text-orange-600 font-display font-bold">{formatPrice(subtotal)}</span>
                </div>
                {deliveryType === 'delivery' && (
                  <p className="text-[10px] text-stone-500 italic text-right font-normal">
                    * El costo final incluirá la cotización de delivery informada por WhatsApp
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1da851] hover:bg-[#189346] shadow-[0_6px_20px_rgba(29,168,81,0.35)] disabled:opacity-75 text-white font-display font-bold py-3.5 px-4 rounded-xl text-sm sm:text-base uppercase tracking-wider transition flex items-center justify-center space-x-2 active:scale-[0.98] cursor-pointer"
              >
                <IconMessageCircle className="w-5 h-5 text-white" />
                <span>{isLoading ? 'Preparando pedido...' : 'Enviar pedido por WhatsApp'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
