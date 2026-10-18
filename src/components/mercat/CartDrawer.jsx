import React from 'react';
import { useCart } from '../../context/CartContext';
import { IconShoppingBag, IconX, IconUtensils, IconCloche, IconArrowRight, IconEmptyBag, IconAlertTriangle } from '../common/Icons';

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalCount,
    totalAmount,
    formatPrice,
    setIsCheckoutOpen,
    liveDiscount,
    storeSettings,
  } = useCart();

  const isClosed = storeSettings?.is_closed_override === 'true';
  const closedMessage = storeSettings?.closed_message || 'Hoy cerrado por evento privado';

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-white shadow-2xl flex flex-col h-full max-h-[100dvh]">
          {/* Drawer Header */}
          <div className="p-4 bg-stone-950 text-white flex items-center justify-between border-b border-stone-800">
            <div className="flex items-center space-x-2.5">
              <IconShoppingBag className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm md:text-base font-display font-bold uppercase tracking-wider text-white">
                Tu Pedido • La Kampiña
              </h2>
              <span className="bg-gradient-to-r from-[#d95e0e] to-[#f59e0b] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                {totalCount}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-stone-400 hover:text-white p-1 rounded-lg transition"
              aria-label="Cerrar pedido"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body / Items List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-stone-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500 my-auto">
                {/* Contenedor del Icono con destello cálido de brasa */}
                <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mb-4 shadow-inner text-[#cb6115]">
                  <IconEmptyBag className="w-10 h-10 stroke-[1.6]" />
                </div>
                <p className="font-display font-bold text-lg text-stone-900 tracking-wide uppercase">Tu bolsa está vacía</p>
                <p className="text-xs text-stone-500 mt-1.5 max-w-xs leading-relaxed font-medium">
                  Aún no has agregado platos. Explora nuestro charque crujiente, charkambre, pique macho o bebidas típicas.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 bg-gradient-to-r from-[#cb6115] to-[#e67a28] hover:brightness-110 active:scale-95 text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl shadow-md shadow-[#cb6115]/25 transition cursor-pointer"
                >
                  Ver Menú de Platos →
                </button>
              </div>
            ) : (
              items.map((item) => {
                const itemKey = item.id;
                const unit = item.unitPrice;
                const subtotal = unit * item.quantity;
                return (
                  <div key={itemKey} className="py-3.5 flex items-start space-x-3">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl bg-stone-900 border border-stone-800 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                      <IconCloche className="w-6 h-6 text-amber-400 stroke-[1.5] absolute" />
                      {item.product?.image && (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          decoding="async"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          className="w-full h-full object-cover relative z-10"
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-xs md:text-sm text-stone-900 truncate tracking-[0.02em]">
                          {item.product?.name}
                        </h4>
                        <span className="text-xs md:text-sm font-black text-stone-900 ml-2 whitespace-nowrap">
                          {formatPrice(subtotal)}
                        </span>
                      </div>

                      {/* Porción seleccionada */}
                      {item.selectedOption && (
                        <span className="inline-block mt-0.5 bg-amber-50 text-amber-900 border border-amber-200/60 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                          Porción: {item.selectedOption.name}
                        </span>
                      )}

                      <p className="text-[11px] text-stone-500 mt-0.5">{formatPrice(unit)} c/u</p>

                      {item.notes && (
                        <p className="text-[11px] text-amber-800 italic mt-0.5 line-clamp-1 bg-amber-50/70 px-1.5 py-0.5 rounded">
                          Nota: {item.notes}
                        </p>
                      )}

                      {/* Quantity + Remove */}
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center border border-stone-300 rounded-lg px-2 py-0.5 bg-stone-50 text-xs">
                          <button
                            onClick={() => updateQuantity(itemKey, -1)}
                            className="font-bold px-1.5 text-stone-600 hover:text-black"
                          >
                            -
                          </button>
                          <span className="px-2 font-black text-stone-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(itemKey, 1)}
                            className="font-bold px-1.5 text-stone-600 hover:text-black"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(itemKey)}
                          className="text-xs text-rose-600 hover:text-rose-700 font-bold transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-700">
                {liveDiscount?.active && (
                  <div className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200/80 px-2.5 py-1.5 rounded-xl flex items-center justify-between mb-2">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                      <span>Descuento En Vivo aplicado</span>
                    </span>
                    <span className="text-[9px] uppercase font-black bg-red-600 text-white px-1.5 py-0.2 rounded">
                      Live
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Productos:</span>
                  <span className="font-bold text-stone-900">{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Delivery:</span>
                  <span className="text-amber-800 font-bold bg-amber-100/70 border border-amber-300/60 px-2 py-0.5 rounded text-[11px]">
                    Pendiente a cotización
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                  <span className="font-display">TOTAL:</span>
                  <span className="text-orange-600 font-display font-bold">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {isClosed ? (
                  <div className="w-full bg-amber-50 border border-amber-300 p-3.5 rounded-2xl text-center space-y-1">
                    <div className="flex items-center justify-center space-x-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
                      <IconAlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>Recepción de Pedidos Pausada</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-snug">
                      {closedMessage}. No es posible procesar pedidos por WhatsApp por el momento.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleCheckout}
                    className="w-full btn-vibrant-flame text-white font-bold py-3.5 px-4 rounded-2xl text-sm uppercase tracking-wider flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-display">Continuar Pedido</span>
                    <div className="flex items-center space-x-1 font-display font-bold">
                      <span>{formatPrice(totalAmount)}</span>
                      <IconArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </button>
                )}
                <button
                  onClick={clearCart}
                  className="w-full text-center text-xs text-stone-400 hover:text-stone-600 py-1 font-semibold cursor-pointer"
                >
                  Vaciar pedido
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
