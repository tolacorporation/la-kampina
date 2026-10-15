import React, { useEffect } from 'react';
import { CATALOG_CATEGORIES } from '../../data/catalog';
import ProductCard from './ProductCard';
import { useCart } from '../../context/CartContext';
import { IconSearch, IconCloche } from '../common/Icons';

export default function StoreCatalog() {
  const { searchQuery, setActiveCategory, setIsInfoOpen, setSelectedProduct } = useCart();

  // Auto-sincronizar la categoría activa en la barra superior al hacer scroll
  useEffect(() => {
    if (searchQuery) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // 1. Si estamos en la parte superior de la página
          if (window.scrollY < 100) {
            if (CATALOG_CATEGORIES[0]) {
              setActiveCategory(CATALOG_CATEGORIES[0].id);
            }
            ticking = false;
            return;
          }

          // 2. Si estamos al fondo de la página (última categoría visible)
          const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;
          if (isAtBottom) {
            const lastCat = CATALOG_CATEGORIES[CATALOG_CATEGORIES.length - 1];
            if (lastCat) {
              setActiveCategory(lastCat.id);
            }
            ticking = false;
            return;
          }

          // 3. Detección precisa de la categoría visible según el scroll
          const headerOffset = 125; // Justo debajo de la cabecera sticky móvil
          const sections = CATALOG_CATEGORIES.map((cat) => document.getElementById(cat.id)).filter(Boolean);
          
          let currentActiveId = null;
          for (let i = 0; i < sections.length; i++) {
            const rect = sections[i].getBoundingClientRect();
            if (rect.top <= headerOffset) {
              currentActiveId = sections[i].id;
            }
          }

          if (currentActiveId) {
            setActiveCategory((prev) => (prev !== currentActiveId ? currentActiveId : prev));
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [searchQuery, setActiveCategory]);

  const filteredCategories = CATALOG_CATEGORIES.map((cat) => {
    if (!searchQuery) return cat;
    const query = searchQuery.toLowerCase();
    const matchingProducts = cat.products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
    return {
      ...cat,
      products: matchingProducts,
    };
  }).filter((cat) => cat.products.length > 0);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-8 sm:space-y-12">
      {searchQuery && (
        <div className="liquid-glass-card rounded-2xl p-4 text-xs md:text-sm text-stone-900 flex items-center justify-between shadow-sm">
          <span>
            Mostrando resultados para: <strong>"{searchQuery}"</strong> ({filteredCategories.reduce((acc, c) => acc + c.products.length, 0)} platos encontrados)
          </span>
        </div>
      )}

      {filteredCategories.length === 0 ? (
        <div className="text-center py-20 text-stone-500 bg-white rounded-3xl border border-stone-200 shadow-sm p-8">
          <IconSearch className="w-12 h-12 text-stone-300 mx-auto mb-3 stroke-[1.5]" />
          <p className="font-black text-lg text-stone-900">No encontramos resultados para "{searchQuery}"</p>
          <p className="text-xs text-stone-500 mt-2">
            Intenta buscando por "charque", "matahambre", "charkambre", "pique", "planchita", "ají" o "bebidas".
          </p>
        </div>
      ) : (
        filteredCategories.map((cat) => (
          <section key={cat.id} id={cat.id} className="scroll-mt-28 sm:scroll-mt-32">
            {/* Category Header */}
            <div className="mb-4 pb-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-wider drop-shadow-md">
                  {cat.name}
                </h2>
                {cat.badge && (
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-stone-950 px-3 py-0.5 rounded-full shadow-sm">
                    {cat.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Category Image Banner if provided (null safe) */}
            {cat.image && (
              <div className="mb-6 rounded-3xl overflow-hidden shadow-sm aspect-[21/9] max-h-48 w-full bg-stone-100">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {cat.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))
      )}

      {/* Store Footer en Card de Cristal */}
      <footer className="mt-16 pt-8 pb-24 sm:pb-12 text-center text-xs text-stone-400 space-y-4 border-t border-white/10">
        <div className="max-w-md mx-auto liquid-glass-card rounded-3xl p-6 shadow-sm border border-white/80 space-y-3">
          <div className="flex items-center justify-center space-x-2 text-stone-800">
            <img
              src="/logokampina3.webp"
              alt="La Kampiña"
              className="h-8 w-auto object-contain filter drop-shadow"
            />
            <span className="font-black text-base uppercase tracking-wider text-stone-900">La Kampiña</span>
          </div>
          <p className="font-bold text-stone-700 text-xs sm:text-sm">Tradición, Sabor & Abundancia Cochabambina</p>
          <button
            onClick={() => setIsInfoOpen(true)}
            className="text-stone-500 hover:text-[#cb6115] transition flex items-center justify-center space-x-1.5 mx-auto text-xs font-semibold cursor-pointer"
          >
            <span>Av. D'orbigny Km 4 1/2 • Cochabamba, Bolivia</span>
            <span className="text-[#cb6115] font-bold underline">Ver mapa</span>
          </button>
          <p className="text-[10px] text-stone-400">© 2026 La Kampiña. Pedidos directos vía Delivery y Retiro en Local.</p>
        </div>
      </footer>
    </main>
  );
}
