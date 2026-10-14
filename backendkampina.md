# 🚀 Guía de Migración y Arquitectura: La Kampiña Web App

## 1. Resumen de Arquitectura (MVP Seguro y Stateless)
El proyecto muta de un catálogo 100% estático en el frontend (heredado de Tropical Chicken) a una arquitectura híbrida y segura, utilizando tu stack de preferencia (React + Nest.js) sin necesidad inicial de una base de datos externa.

*   **Frontend (Cloudflare Pages):** React 18 + Vite + Tailwind CSS. Rápido, cacheado globalmente y con estado persistente en el navegador.
*   **Backend (Nest.js):** Actúa como validador y orquestador. Almacena el catálogo en memoria, calcula totales para evitar fraudes desde el cliente y genera la URL oficial de WhatsApp.
*   **Base de Datos:** Ninguna (Stateless). El estado del pedido vive en el carrito del cliente y finaliza en el chat de WhatsApp del restaurante. Esto reduce costos de infraestructura a cero en esta etapa.

---

## 2. Frontend: Mutación Visual y Estado (React + Vite)

### A. Colores Corporativos (Tailwind CSS)
Ajustamos la paleta para reflejar la identidad de La Kampiña (Negro, Naranja, Blanco).

```javascript
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        kampina: {
          black: '#1a1a1a', 
          orange: '#f59e0b',
          white: '#ffffff', 
          gray: '#333333'
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

### B. Persistencia del Carrito (Context API)
Añadimos `localStorage` para evitar que el usuario pierda su pedido si recarga la página (Prioridad Alta).

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

  // Funciones addToCart, removeFromCart, etc.
  
  return (
    <CartContext.Provider value={{ cart, setCart }}>
      {children}
    </CartContext.Provider>
  );
};
```

---

## 3. Backend: Lógica de Negocio y Seguridad (Nest.js)

### A. Catálogo en Memoria (Fuente de la Verdad)
El backend guarda los precios inmutables basados en el menú oficial fotográfico. Si los precios cambian, se actualiza este archivo y se redespliega.

```typescript
// src/catalog/catalog.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class CatalogService {
  private readonly menu = [
    {
      id: "c1",
      name: "Charque",
      options: [
        { id: "c1-duo", name: "2 Personas (DUO)", price: 135 },
        { id: "c1-trio", name: "3 Personas (TRIO)", price: 155 }
      ]
    },
    {
      id: "c2",
      name: "Matahambre",
      options: [
        { id: "c2-duo", name: "2 Personas (DUO)", price: 135 },
        { id: "c2-trio", name: "3 Personas (TRIO)", price: 155 }
      ]
    },
    {
      id: "c6",
      name: "Ají de Fideo",
      price: 45 // Solo Jueves
    },
    {
      id: "b1",
      name: "Gaseosas",
      options: [
        { id: "b1-pop", name: "Popular", price: 10 },
        { id: "b1-2l", name: "2 Litros", price: 22 }
      ]
    }
  ];

  findPrice(productId: string, optionId?: string): number {
    const product = this.menu.find(p => p.id === productId);
    if (!product) return 0;
    
    if (optionId && product.options) {
      const option = product.options.find(o => o.id === optionId);
      return option ? option.price : 0;
    }
    return product.price || 0;
  }
}
```

### B. Generador de Orden Segura a WhatsApp
El frontend envía el pedido (IDs y cantidades) a este endpoint. Nest.js recalcula todo para evitar que un usuario manipule los precios desde el navegador.

```typescript
// src/orders/orders.service.ts
import { Injectable } from '@nestjs/common';
import { CatalogService } from '../catalog/catalog.service';

@Injectable()
export class OrdersService {
  constructor(private catalogService: CatalogService) {}

  generateWhatsAppOrder(orderDto: any) {
    let totalSeguro = 0;
    let orderDetailsText = '';

    // 1. Recalcular precios desde el servidor (Seguridad)
    for (const item of orderDto.items) {
      const realPrice = this.catalogService.findPrice(item.productId, item.optionId);
      const lineTotal = realPrice * item.quantity;
      totalSeguro += lineTotal;
      orderDetailsText += `▪️ ${item.quantity}x ${item.name} - ${lineTotal} Bs.\n`;
    }

    // 2. Sumar costo de envío dinámico
    const deliveryCost = orderDto.deliveryType === 'delivery' ? (orderDto.zoneCost || 0) : 0;
    totalSeguro += deliveryCost;

    // 3. Formatear mensaje para WhatsApp
    const waMessage = `*NUEVO PEDIDO - La Kampiña*\n\n`
      + `👤 *Cliente:* ${orderDto.customerName}\n`
      + `📍 *Tipo:* ${orderDto.deliveryType}\n\n`
      + `*DETALLE:*\n${orderDetailsText}\n`
      + `🚚 *Envío:* ${deliveryCost} Bs.\n`
      + `💰 *TOTAL A PAGAR:* ${totalSeguro} Bs.\n`;

    // 4. Retornar URL de WhatsApp al Frontend
    const encodedMessage = encodeURIComponent(waMessage);
    const restaurantPhone = '59170000000'; // Actualizar con el número real
    
    return {
      success: true,
      whatsappUrl: `https://wa.me/${restaurantPhone}?text=${encodedMessage}`
    };
  }
}
```

---

## 4. Estrategia de Despliegue y Escalabilidad

1. **Frontend (Vite + React):** 
   * **Plataforma:** Cloudflare Pages.
   * **Flujo:** Se conecta con el repositorio de GitHub. Cada vez que haces `git push` a la rama `main`, Cloudflare construye tu app ejecutando `npm run build` de forma nativa.
2. **Backend (Nest.js):** 
   * **Plataforma:** Render, Railway o Koyeb (Web Service).
   * **Flujo:** Despliegue continuo desde GitHub. Al no requerir base de datos externa, el despliegue es inmediato y sin configuraciones de variables de entorno complejas.
3. **Escalabilidad Futura:** 
   * Cuando La Kampiña requiera un panel de control, simplemente se reemplaza el array del `CatalogService` por llamadas a Prisma (`this.prisma.product.findMany()`) conectando un clúster de PostgreSQL. 
   * El Frontend en React y el flujo de WhatsApp seguirán funcionando sin modificaciones drásticas.