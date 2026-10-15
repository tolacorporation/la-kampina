import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export const CartContext = createContext();

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

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('cat-charque');
  const [zoomedImage, setZoomedImage] = useState(null);

  // Sincronización automática con localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kampina_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Error guardando carrito en localStorage:', e);
    }
  }, [items]);

  // Soporta agregar producto con o sin opción seleccionada (DUO/TRIO) y notas
  const addToCart = (product, quantity = 1, selectedOption = null, notes = '') => {
    if (!product) return;

    const optId = selectedOption ? (selectedOption.id || selectedOption.name) : 'base';
    const cleanNotes = typeof notes === 'string' ? notes.trim() : '';
    const lineId = `${product.id}__${optId}__${cleanNotes}`;
    
    // Determinar precio unitario real
    const unitPrice = selectedOption && selectedOption.price !== undefined
      ? parsePrice(selectedOption.price)
      : parsePrice(product.price);

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
