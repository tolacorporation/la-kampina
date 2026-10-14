import React, { useState, useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import StoreApp from './components/mercat/StoreApp';
import CityLanding from './components/landing/CityLanding';

export default function App() {
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'store') return 'store';
      if (window.location.hash === '#store') return 'store';
      if (params.get('view') === 'landing') return 'landing';
      if (window.location.hash === '#landing') return 'landing';
    }
    return 'landing';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#landing') {
        setView('landing');
      } else if (window.location.hash === '#store') {
        setView('store');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectStore = (city) => {
    window.location.hash = '#store';
    setView('store');
  };

  const handleBackToLanding = () => {
    window.location.hash = '#landing';
    setView('landing');
  };

  return (
    <CartProvider>
      {view === 'store' ? (
        <StoreApp onBackToLanding={handleBackToLanding} />
      ) : (
        <CityLanding onSelectStore={handleSelectStore} />
      )}
    </CartProvider>
  );
}
