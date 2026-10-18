import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import {
  IconMeat,
  IconCloche,
  IconBeer,
  IconDessert,
  IconUtensils,
  IconX,
  IconZoomIn,
} from '../common/Icons';

function getDishGraphic(name = '') {
  const lower = name.toLowerCase();
  if (
    lower.includes('charque') ||
    lower.includes('matahambre') ||
    lower.includes('charkambre') ||
    lower.includes('pique') ||
    lower.includes('planchita') ||
    lower.includes('lapping') ||
    lower.includes('silpancho') ||
    lower.includes('chicharrón') ||
    lower.includes('chicharron')
  ) {
    return <IconMeat className="w-12 h-12 text-[#cb6115] stroke-[1.5]" />;
  }
  if (lower.includes('ají') || lower.includes('aji') || lower.includes('picante')) {
    return <IconCloche className="w-12 h-12 text-[#cb6115] stroke-[1.5]" />;
  }
  if (
    lower.includes('chicha') ||
    lower.includes('garapiña') ||
    lower.includes('cerveza') ||
    lower.includes('paceña') ||
    lower.includes('pacena') ||
    lower.includes('bicervecina') ||
    lower.includes('jugo') ||
    lower.includes('gaseosa') ||
    lower.includes('mocochinchi') ||
    lower.includes('soda') ||
    lower.includes('agua')
  ) {
    return <IconBeer className="w-12 h-12 text-[#cb6115] stroke-[1.5]" />;
  }
  if (lower.includes('helado') || lower.includes('empanada')) {
    return <IconDessert className="w-12 h-12 text-[#cb6115] stroke-[1.5]" />;
  }
  return <IconUtensils className="w-12 h-12 text-[#cb6115] stroke-[1.5]" />;
}

export default function ProductModal() {
  const {
    selectedProduct,
    setSelectedProduct,
    addToCart,
    formatPrice,
    parsePrice,
    setZoomedImage,
    liveDiscount,
    isDiscountableDish,
  } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [notes, setNotes] = useState('');
  const [modalImgLoaded, setModalImgLoaded] = useState(false);
  const [modalImgError, setModalImgError] = useState(false);

  useEffect(() => {
    if (selectedProduct) {
      setQuantity(1);
      setNotes('');
      setModalImgLoaded(false);
      setModalImgError(false);
      if (Array.isArray(selectedProduct.options) && selectedProduct.options.length > 0) {
        setSelectedOption(selectedProduct.options[0]);
      } else {
        setSelectedOption(null);
      }
    }
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const hasOptions = Array.isArray(selectedProduct.options) && selectedProduct.options.length > 0;
  
  const rawUnitPrice = selectedOption
    ? parsePrice(selectedOption.price)
    : parsePrice(selectedProduct.price);

  const isEligibleForLiveDiscount = liveDiscount?.active && isDiscountableDish(selectedProduct);
  const unitPrice = isEligibleForLiveDiscount
    ? Math.max(0, rawUnitPrice - liveDiscount.amount)
    : rawUnitPrice;

  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    addToCart(selectedProduct, quantity, selectedOption, notes.trim());
    setSelectedProduct(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={() => setSelectedProduct(null)}
    >
      <div
        className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-white/70 flex flex-col max-h-[92vh] animate-scale-up specular-highlight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Image banner */}
        <div
          className={`relative bg-stone-900 aspect-video w-full overflow-hidden flex items-center justify-center ${
            selectedProduct.image && !modalImgError ? 'cursor-pointer group' : ''
          }`}
          onClick={() => {
            if (selectedProduct.image && !modalImgError) {
              setZoomedImage({
                src: selectedProduct.image,
                alt: selectedProduct.name,
                title: selectedProduct.name,
                badge: selectedProduct.badge,
                description: selectedProduct.description,
              });
            }
          }}
        >
          {/* Respaldo elegante si no hay foto, mientras carga o si falla */}
          {(!selectedProduct.image || modalImgError || !modalImgLoaded) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-900 via-stone-950 to-black text-stone-200 p-6 z-0 select-none">
              {/* Glow spotlight */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(203,97,21,0.32),transparent_70%)] pointer-events-none" />

              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl relative z-10">
                {getDishGraphic(selectedProduct.name)}
              </div>
            </div>
          )}

          {/* Fotografía del plato protegida contra errores */}
          {selectedProduct.image && !modalImgError && (
            <>
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                decoding="async"
                onLoad={() => setModalImgLoaded(true)}
                onError={() => setModalImgError(true)}
                className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 relative z-10 ${
                  modalImgLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-black/30 pointer-events-none z-10" />

              {/* Botón flotante para ver en grande / zoom */}
              {modalImgLoaded && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomedImage({
                      src: selectedProduct.image,
                      alt: selectedProduct.name,
                      title: selectedProduct.name,
                      badge: selectedProduct.badge,
                      description: selectedProduct.description,
                    });
                  }}
                  className="absolute bottom-3 right-3 z-20 flex items-center space-x-1.5 bg-black/70 hover:bg-black/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/25 shadow-xl transition-all duration-200 group-hover:scale-105"
                  title="Ver plato en grande y hacer zoom"
                >
                  <IconZoomIn className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver en grande / Zoom</span>
                </button>
              )}
            </>
          )}

          {/* Badge Flotante */}
          {selectedProduct.badge && (
            <span className="absolute top-4 left-4 z-20 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg border border-white/30 backdrop-blur-md">
              {selectedProduct.badge}
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProduct(null);
            }}
            className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-black/85 text-white w-9 h-9 rounded-full flex items-center justify-center transition shadow-lg border border-white/20 backdrop-blur-sm"
            aria-label="Cerrar ventana"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div>
            <div className="flex items-start justify-between">
              <h2 className="text-xl md:text-2xl font-display font-bold text-stone-900 tracking-[0.02em] leading-snug">
                {selectedProduct.name}
              </h2>
              <div className="flex flex-col items-end ml-3 whitespace-nowrap">
                {isEligibleForLiveDiscount && (
                  <span className="text-xs text-stone-400 line-through mb-0.5">
                    {formatPrice(rawUnitPrice)}
                  </span>
                )}
                <span
                  className={`text-xl md:text-2xl font-display font-bold ${
                    isEligibleForLiveDiscount ? 'text-red-600' : 'text-orange-600'
                  }`}
                >
                  {formatPrice(unitPrice)}
                </span>
              </div>
            </div>
            {selectedProduct.description && (
              <p className="text-xs md:text-sm text-stone-600 mt-2 leading-relaxed font-normal">
                {selectedProduct.description}
              </p>
            )}
          </div>

          {/* Selector de Porciones / Opciones (DÚO / TRÍO) */}
          {hasOptions && (
            <div className="space-y-2 bg-amber-500/[0.06] p-4 rounded-2xl border border-amber-500/20">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-800">
                Selecciona la porción:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {selectedProduct.options.map((opt) => {
                  const isSelected = selectedOption?.name === opt.name;
                  return (
                    <button
                      key={opt.id || opt.name}
                      type="button"
                      onClick={() => setSelectedOption(opt)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#d95e0e] to-[#f59e0b] border-transparent text-white shadow-md shadow-orange-500/30 font-bold'
                          : 'bg-white border-amber-900/10 hover:border-orange-500/60 text-stone-800 font-semibold'
                      }`}
                    >
                      <span className="text-xs">{opt.name}</span>
                      <span className="text-sm mt-1 font-display font-bold">{formatPrice(opt.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes textarea */}
          <div>
            <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
              Instrucciones especiales para cocina (opcional)
            </label>
            <textarea
              rows="2"
              placeholder="Ej: Llajwa bien picante, sin cebolla en la sarsa, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white text-stone-950 font-medium placeholder:text-stone-400 border border-stone-300 rounded-xl p-3 text-xs md:text-sm focus:outline-none focus:border-[#cb6115] focus:ring-1 focus:ring-[#cb6115] shadow-sm"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          {/* Quantity Controls */}
          <div className="flex items-center bg-white border border-stone-300 rounded-2xl px-2 py-1 shadow-sm">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center text-lg font-bold text-stone-600 hover:text-black transition"
            >
              -
            </button>
            <span className="w-8 text-center font-black text-base text-stone-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 flex items-center justify-center text-lg font-bold text-stone-600 hover:text-black transition"
            >
              +
            </button>
          </div>

          {/* Add to Cart Submit */}
          <button
            onClick={handleAdd}
            className="flex-1 btn-vibrant-flame text-white font-bold py-3.5 px-5 rounded-2xl text-sm md:text-base uppercase tracking-wider flex items-center justify-between cursor-pointer active:scale-[0.98]"
          >
            <span className="font-display">Agregar al pedido</span>
            <span className="font-display font-bold">{formatPrice(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
