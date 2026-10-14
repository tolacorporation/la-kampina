import React from 'react';
import { useCart } from '../../context/CartContext';
import {
  IconMeat,
  IconCloche,
  IconBeer,
  IconDessert,
  IconUtensils,
  IconSliders,
  IconPlus,
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
    return <IconMeat className="w-8 h-8 md:w-9 md:h-9 text-[#cb6115] stroke-[1.5]" />;
  }
  if (lower.includes('ají') || lower.includes('aji') || lower.includes('picante')) {
    return <IconCloche className="w-8 h-8 md:w-9 md:h-9 text-[#cb6115] stroke-[1.5]" />;
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
    return <IconBeer className="w-8 h-8 md:w-9 md:h-9 text-[#cb6115] stroke-[1.5]" />;
  }
  if (lower.includes('helado') || lower.includes('empanada')) {
    return <IconDessert className="w-8 h-8 md:w-9 md:h-9 text-[#cb6115] stroke-[1.5]" />;
  }
  return <IconUtensils className="w-8 h-8 md:w-9 md:h-9 text-[#cb6115] stroke-[1.5]" />;
}

export default function ProductCard({ product }) {
  const { setSelectedProduct, addToCart, formatPrice } = useCart();
  const hasOptions = Array.isArray(product.options) && product.options.length > 0;

  const handleActionClick = (e) => {
    e.stopPropagation();
    if (hasOptions) {
      setSelectedProduct(product);
    } else {
      addToCart(product, 1, null, '');
    }
  };

  const displayPrice = hasOptions
    ? `Desde ${formatPrice(product.price || product.options[0].price)}`
    : formatPrice(product.price);

  return (
    <div
      onClick={() => setSelectedProduct(product)}
      className="relative liquid-glass-card rounded-3xl p-3 sm:p-3.5 hover:shadow-[0_20px_45px_-8px_rgba(203,97,21,0.22)] hover:border-[#cb6115]/50 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer group hover:-translate-y-1.5 specular-highlight"
    >
      {/* Reflejo de luz superior tipo cristal líquido */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none" />

      {/* Product Image / Gastro-Lens Showcase */}
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 border border-white/10 shadow-inner flex items-center justify-center">
        {/* Glow cálido ambiental detrás del elemento */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(203,97,21,0.32)_0%,transparent_70%)] pointer-events-none" />

        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300 relative z-10"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-200 p-4 relative z-10 select-none">
            {/* Pedestal de Cristal Líquido Flotante */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_10px_25px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] flex items-center justify-center group-hover:scale-110 group-hover:rotate-2 transition-all duration-300">
              {getDishGraphic(product.name)}
            </div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-200/90 mt-2.5">
              La Kampiña VIP
            </span>
          </div>
        )}

        {/* Badges Flotantes de Cristal */}
        {product.badge && (
          <span className="absolute top-2.5 left-2.5 z-20 bg-amber-400 text-stone-950 text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md border border-white/30">
            {product.badge}
          </span>
        )}

        {hasOptions && (
          <span className="absolute top-2.5 right-2.5 z-20 bg-stone-950/85 backdrop-blur-md text-amber-300 border border-amber-400/40 text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
            Dúo / Trío
          </span>
        )}
      </div>

      {/* Info & Actions */}
      <div className="pt-3.5 pb-1 px-1 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-display font-bold text-sm md:text-base text-stone-900 uppercase tracking-tight line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors duration-200">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed font-normal">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-2.5 border-t border-amber-900/10 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase font-bold text-stone-600 tracking-wider">
              {hasOptions ? 'Desde' : 'Precio'}
            </span>
            <span className="text-sm md:text-base font-display font-bold text-stone-950 tracking-tight">
              {displayPrice.replace('Desde ', '')}
            </span>
          </div>

          <button
            onClick={handleActionClick}
            className="btn-vibrant-flame text-white text-xs font-bold uppercase tracking-wider px-3.5 sm:px-4 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer"
          >
            {hasOptions ? (
              <>
                <IconSliders className="w-3.5 h-3.5" />
                <span>Opciones</span>
              </>
            ) : (
              <>
                <IconPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Pedir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
