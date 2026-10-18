import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { CATALOG_CATEGORIES } from '../data/catalog';

export const CartContext = createContext();

export function isDiscountableDish(product, categoryId = '') {
  if (!product) return false;
  const cat = String(categoryId || product.categoryId || '').toLowerCase();
  if (cat.includes('bebida')) return false;
  const name = String(product.name || '').toLowerCase();
  if (
    name.includes('cerveza') ||
    name.includes('gaseosa') ||
    name.includes('chicha') ||
    name.includes('jugo') ||
    name.includes('bicervecina') ||
    name.includes('agua') ||
    name.includes('soda')
  ) {
    return false;
  }
  return true;
}

function formatSupabaseCatalog(rawCategories) {
  if (!Array.isArray(rawCategories)) return [];
  return rawCategories.map((cat) => {
    const products = (cat.products || [])
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((p) => {
        const options = (p.product_options || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        const firstOpt = options[0];
        const isThursday = p.slug?.includes('aji') || cat.slug?.includes('aji');
        return {
          id: p.slug || p.id,
          categoryId: cat.slug || cat.id,
          name: p.name,
          shortName: p.short_name || p.name,
          description: p.description || '',
          image: p.image_url || null,
          price: firstOpt ? parseFloat(firstOpt.price) : 0,
          badge: firstOpt?.badge || null,
          isThursdayOnly: isThursday,
          options: options.length > 1 ? options.map((o) => ({
            id: o.id,
            name: o.name,
            shortName: o.short_name,
            price: parseFloat(o.price),
            badge: o.badge,
          })) : null,
        };
      });

    const isThursdayCategory = cat.slug?.includes('aji');

    return {
      id: cat.slug || cat.id,
      name: cat.name,
      shortName: cat.short_name || cat.name,
      description: cat.description || '',
      badge: isThursdayCategory ? 'Solo Jueves' : null,
      isThursdayOnly: isThursdayCategory,
      products,
    };
  });
}

export function parsePrice(priceVal) {
  if (typeof priceVal === 'number') return priceVal;
  if (!priceVal) return 0;
  // Fallback for string formats like "128,00 Bs."
  const clean = String(priceVal).replace('Bs.', '').replace('Bs', '').trim().replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function formatPrice(amount) {
  if (typeof amount !== 'number') amount = parsePrice(amount);
  // Show clean integer if no decimals (e.g., "135 Bs.") or with 2 decimals if needed
  return amount % 1 === 0 ? `${amount} Bs.` : `${amount.toFixed(2).replace('.', ',')} Bs.`;
}

/**
 * 🛡️ Calcula el precio unitario real en vivo de cualquier ítem del carrito.
 * Si el Live terminó, o el precio en la base de datos cambió, devuelve el precio
 * actual y vigente sin permitir compras con precios congelados obsoletos.
 */
export function getItemCurrentUnitPrice(item, categoriesList, currentLiveDiscount) {
  if (!item) return 0;

  let basePrice = item.selectedOption?.price !== undefined
    ? parsePrice(item.selectedOption.price)
    : parsePrice(item.product?.price);

  let categoryFound = null;
  let productFound = null;

  if (Array.isArray(categoriesList) && categoriesList.length > 0) {
    for (const cat of categoriesList) {
      const p = cat.products?.find(
        (prod) => prod.id === item.product?.id || prod.slug === item.product?.id
      );
      if (p) {
        categoryFound = cat;
        productFound = p;
        break;
      }
    }
  }

  if (productFound) {
    if (item.selectedOption) {
      const opt = productFound.options?.find(
        (o) => o.id === item.selectedOption.id || o.name === item.selectedOption.name
      );
      if (opt && opt.price !== undefined) {
        basePrice = parsePrice(opt.price);
      }
    } else if (productFound.price !== undefined) {
      basePrice = parsePrice(productFound.price);
    }
  }

  const isDish = isDiscountableDish(
    productFound || item.product,
    categoryFound?.id || item.product?.categoryId
  );

  if (currentLiveDiscount?.active && isDish) {
    return Math.max(0, basePrice - (currentLiveDiscount.amount || 0));
  }

  return basePrice;
}

export function CartProvider({ children }) {
  // Inicialización perezosa desde localStorage
  const [items, setItems] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('kampina_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error cargando carrito de localStorage:', e);
      return [];
    }
  });

  const [categories, setCategories] = useState(() => {
    if (typeof window === 'undefined') return CATALOG_CATEGORIES;
    try {
      const cached = localStorage.getItem('kampina_catalog_cache');
      return cached ? JSON.parse(cached) : CATALOG_CATEGORIES;
    } catch {
      return CATALOG_CATEGORIES;
    }
  });
  const [storeSettings, setStoreSettings] = useState({});
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('cat-charque');
  const [zoomedImage, setZoomedImage] = useState(null);

  // Sincronización Patrón Búnker: Lectura pública exclusivamente desde Cloudflare KV (/api/catalog)
  // El cliente público NUNCA consulta directamente a Supabase, protegiendo las cuotas de base de datos.
  useEffect(() => {
    let isMounted = true;

    async function syncDynamicData(silent = false) {
      try {
        if (!silent) setIsCatalogLoading(true);

        const response = await fetch('/api/catalog');
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            if (data.categories && Array.isArray(data.categories)) {
              setCategories(data.categories);
              try {
                localStorage.setItem('kampina_catalog_cache', JSON.stringify(data.categories));
              } catch (e) {
                console.error('Error guardando catálogo en caché local:', e);
              }
            }
            if (data.storeSettings) {
              setStoreSettings(data.storeSettings);
            }
          }
        } else {
          throw new Error('Respuesta no exitosa de /api/catalog');
        }
      } catch (err) {
        console.warn('Operando con catálogo de respaldo en caché local:', err);
      } finally {
        if (isMounted) setIsCatalogLoading(false);
      }
    }

    // 1. Consulta inicial al montar
    syncDynamicData();

    // 2. Sincronizar automáticamente cuando el usuario vuelve a la pestaña o desbloquea su móvil
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        syncDynamicData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Latido de actualización periódica cada 30 segundos (consume Cloudflare KV Edge, 0 cuota de Supabase)
    const heartbeatInterval = setInterval(() => {
      if (isMounted && document.visibilityState === 'visible') {
        syncDynamicData(true);
      }
    }, 30000);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeatInterval);
    };
  }, []);

  // Sincronización automática con localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kampina_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Error guardando carrito en localStorage:', e);
    }
  }, [items]);

  const liveDiscount = useMemo(() => {
    const active = storeSettings.live_discount_active === 'true';
    const amount = Math.max(0, parseFloat(storeSettings.live_discount_amount) || 5);
    const title = storeSettings.live_discount_title || '¡Estamos en Vivo! Descuento especial en todos los platos';
    return { active, amount, title };
  }, [storeSettings]);

  // 🛡️ PROTECCIÓN ANTI-ABUSO: Revalidación Dinámica de Precios en el Carrito
  // Si la transmisión en vivo finaliza (Modo Live = false) o el restaurante actualiza precios,
  // el carrito recalcula automáticamente cada ítem al precio vigente en tiempo real.
  useEffect(() => {
    setItems((prevItems) => {
      if (!prevItems || prevItems.length === 0) return prevItems;
      let hasChanges = false;
      const updated = prevItems.map((item) => {
        const freshUnitPrice = getItemCurrentUnitPrice(item, categories, liveDiscount);
        if (freshUnitPrice !== item.unitPrice) {
          hasChanges = true;
          return { ...item, unitPrice: freshUnitPrice };
        }
        return item;
      });
      return hasChanges ? updated : prevItems;
    });
  }, [liveDiscount, categories]);

  const getDiscountedPrice = (basePrice, product, categoryId = '') => {
    const raw = parsePrice(basePrice);
    if (liveDiscount.active && isDiscountableDish(product, categoryId)) {
      return Math.max(0, raw - liveDiscount.amount);
    }
    return raw;
  };

  // Soporta agregar producto con o sin opción seleccionada (DUO/TRIO) y notas
  const addToCart = (product, quantity = 1, selectedOption = null, notes = '') => {
    if (!product) return;

    const optId = selectedOption ? (selectedOption.id || selectedOption.name) : 'base';
    const cleanNotes = typeof notes === 'string' ? notes.trim() : '';
    const lineId = `${product.id}__${optId}__${cleanNotes}`;
    
    // Determinar precio unitario actual y protegido contra abusos
    const tempItem = { product, selectedOption, notes: cleanNotes };
    const unitPrice = getItemCurrentUnitPrice(tempItem, categories, liveDiscount);

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === lineId);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }
      return [
        ...prev,
        {
          id: lineId,
          product,
          selectedOption: selectedOption || null,
          unitPrice,
          quantity,
          notes: cleanNotes,
        },
      ];
    });
  };

  const updateQuantity = (identifier, delta) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === identifier || item.product?.id === identifier) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (identifier) => {
    setItems((prev) =>
      prev.filter((item) => item.id !== identifier && item.product?.id !== identifier)
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = item.unitPrice !== undefined ? item.unitPrice : parsePrice(item.product?.price);
      return sum + price * item.quantity;
    }, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        cart: items, // Alias para compatibilidad
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCount,
        totalAmount,
        formatPrice,
        parsePrice,
        isCartOpen,
        setIsCartOpen,
        selectedProduct,
        setSelectedProduct,
        isInfoOpen,
        setIsInfoOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        searchQuery,
        setSearchQuery,
        isSearchOpen,
        setIsSearchOpen,
        activeCategory,
        setActiveCategory,
        zoomedImage,
        setZoomedImage,
        categories,
        setCategories,
        storeSettings,
        isCatalogLoading,
        liveDiscount,
        getDiscountedPrice,
        isDiscountableDish,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
