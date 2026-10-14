# Plan de Migración y Escalabilidad: Proyecto "La Kampiña"

Este documento detalla la transformación del proyecto base a la identidad de "La Kampiña", analizando el stack tecnológico, la arquitectura, seguridad y las implementaciones de código necesarias.

## 1. Análisis del Stack y Ecosistema (Vite + Tu Stack Habitual)

Mencionaste que usas **Nest.js, React, Cloudflare Pages y GitHub**. El hecho de que el proyecto actual use **Vite** no es un problema; al contrario, es una ventaja.

*   **Vite (Frontend):** Sustituye a herramientas lentas como Webpack. Compila tu código React al instante. Es 100% compatible con tu flujo de GitHub.
*   **Cloudflare Pages (Hosting):** Vite genera una carpeta `dist` estática ultrarrápida que Cloudflare Pages aloja de maravilla. Es el combo ideal para tu frontend.
*   **Nest.js (Backend):** Actualmente, el proyecto no tiene backend (todo es mock estático y el checkout va a WhatsApp). Si en el futuro quieres abandonar WhatsApp y tener un panel de administración, Nest.js es la pieza perfecta para construir esa API REST/GraphQL.

## 2. Arquitectura Escalable, Seguridad y Optimización

### Arquitectura Escalable
*   **Enrutamiento:** Abandonar el enrutamiento por hash (`#store`) e implementar `react-router-dom` v6. Esto permitirá URLs limpias (ej. `lakampina.com/menu`, `lakampina.com/checkout`) y mejor SEO.
*   **Estado Global:** El `CartContext` actual está bien para empezar, pero si la app crece, migrar a **Zustand** o **Redux Toolkit** mejorará el rendimiento y evitará re-renderizados innecesarios.
*   **Separación Backend/Frontend:** Para escalar de verdad, el archivo `catalog.js` debe desaparecer y los productos deben venir de tu futuro backend en Nest.js.

### Seguridad
*   **Validación de Precios (Crucial):** En el modelo actual (frontend enviando a WhatsApp), un usuario malintencionado podría modificar el código en su navegador para cambiar los precios antes de enviar el mensaje. Cuando integres Nest.js, **nunca** confíes en el precio que envía el frontend; el backend debe recalcular el total basándose en el ID del producto de la base de datos.
*   **Protección XSS:** Sanitizar cualquier input de usuario en las "notas personalizadas" del pedido para evitar inyección de scripts.

### Optimización
*   **Imágenes:** Usar formatos de nueva generación (WebP o AVIF). Cloudflare ofrece optimización de imágenes nativa.
*   **Code Splitting:** Usar `React.lazy()` para cargar el `CheckoutModal` o el `CityLanding` solo cuando el usuario los necesite, reduciendo el peso inicial de la app.

---

## 3. Implementación Técnica (La Mutación)

A continuación, los cambios de código para aplicar la identidad de "La Kampiña", normalizar datos e implementar mejoras urgentes.

### A. Configuración de Tema (Tailwind CSS)
```javascript
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        kampina: {
          black: '#1a1a1a',  // Fondo menú
          orange: '#f59e0b', // Acentos y botones
          white: '#ffffff',  // Textos
          gray: '#333333',   // Tarjetas
        }
      },
      fontFamily: {
        sans: ['Barlow Semi Condensed', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
```

### B. Catálogo Normalizado (Números en lugar de Strings)
```javascript
// src/data/catalog.js
export const catalog = [
  {
    id: "cat-comidas",
    category: "Comidas",
    items: [
      {
        id: "c1",
        name: "Charque",
        description: "Tradicional charque cochabambino.",
        image: "/assets/charque.jpg",
        options: [
          { name: "2 Personas (DUO)", price: 135 },
          { name: "3 Personas (TRIO)", price: 155 }
        ]
      },
      {
        id: "c4",
        name: "Pique Macho",
        description: "Clásico pique macho con carne, salchicha, papas y huevo.",
        image: "/assets/pique.jpg",
        options: [
          { name: "2 Personas (DUO)", price: 135 },
          { name: "3 Personas (TRIO)", price: 155 }
        ]
      },
      {
        id: "c6",
        name: "Ají de Fideo",
        description: "(Solo Jueves)",
        image: "/assets/aji.jpg",
        price: 45 // Precio normalizado a número
      }
    ]
  },
  // ... agregar bebidas (Chicha, Cerveza, etc.) siguiendo el mismo formato
];
```

### C. Persistencia del Carrito (LocalStorage)
```javascript
// src/context/CartContext.jsx
import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Inicialización perezosa leyendo el localStorage
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('kampina_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      return [];
    }
  });

  // Guardar en localStorage ante cualquier cambio
  useEffect(() => {
    localStorage.setItem('kampina_cart', JSON.stringify(cart));
  }, [cart]);

  // ... resto de funciones (addToCart, updateQuantity, etc.)

  return (
    <CartContext.Provider value={{ cart, setCart }}>
      {children}
    </CartContext.Provider>
  );
};
```

### D. Zonas de Envío Dinámicas
```javascript
// src/components/mercat/CheckoutModal.jsx
import { useState, useContext, useMemo } from 'react';
import { CartContext } from '../../context/CartContext';

const ZONAS = [
  { id: 'z1', nombre: 'Colcapirhua / Centro', costo: 10 },
  { id: 'z2', nombre: 'Quillacollo', costo: 15 },
  { id: 'z3', nombre: 'Cochabamba Centro', costo: 20 },
];

export const CheckoutModal = () => {
  const { cart } = useContext(CartContext);
  const [tipoEntrega, setTipoEntrega] = useState('delivery');
  const [zonaId, setZonaId] = useState(ZONAS[0].id);

  // Cálculos limpios gracias a la normalización numérica
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cart]);

  const costoEnvio = tipoEntrega === 'delivery' 
    ? ZONAS.find(z => z.id === zonaId)?.costo || 0 
    : 0;

  const total = subtotal + costoEnvio;

  return (
    <div className="bg-kampina-black text-kampina-white p-6 rounded-xl shadow-lg">
      <h2 className="text-kampina-orange text-2xl font-bold mb-4">Resumen de Pedido</h2>
      
      {/* Selector de Modalidad */}
      <select 
        value={tipoEntrega}
        onChange={(e) => setTipoEntrega(e.target.value)}
        className="w-full mb-4 p-3 bg-kampina-gray rounded border border-kampina-orange/50"
      >
        <option value="delivery">Delivery</option>
        <option value="retiro">Retiro en Local</option>
      </select>

      {/* Zonas Dinámicas */}
      {tipoEntrega === 'delivery' && (
        <select 
          value={zonaId}
          onChange={(e) => setZonaId(e.target.value)}
          className="w-full mb-6 p-3 bg-kampina-gray rounded border border-kampina-orange/50"
        >
          {ZONAS.map(z => (
            <option key={z.id} value={z.id}>
              {z.nombre} (+{z.costo} Bs.)
            </option>
          ))}
        </select>
      )}

      {/* Totales */}
      <div className="border-t border-gray-600 pt-4 space-y-2">
        <p className="flex justify-between"><span>Subtotal:</span> <span>{subtotal} Bs.</span></p>
        {tipoEntrega === 'delivery' && (
          <p className="flex justify-between text-gray-400"><span>Envío:</span> <span>{costoEnvio} Bs.</span></p>
        )}
        <p className="flex justify-between text-xl font-bold text-kampina-orange pt-2 border-t border-gray-700">
          <span>Total:</span> <span>{total} Bs.</span>
        </p>
      </div>
    </div>
  );
};
```