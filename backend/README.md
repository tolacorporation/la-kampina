# 🍲 La Kampiña - Backend API (Nest.js)

Backend seguro, ligero y *stateless* para la aplicación web de pedidos de **La Kampiña**.

## 🛡️ Propósito y Seguridad
- **Fuente de la Verdad:** Contiene el catálogo oficial con precios inmutables.
- **Blindaje contra Manipulación de Precios:** Valida los ítems del carrito y recalcula el monto exacto antes de autorizar el pedido.
- **Zonas de Cochabamba:** Aplica los costos de delivery verificados (Colcapirhua, Quillacollo, Cercado, Zona Norte, Tiquipaya).
- **Generador de WhatsApp:** Construye la URL codificada con el mensaje oficial hacia el teléfono del restaurante.

## 🚀 Instalación y Ejecución Local

```bash
# Entrar a la carpeta backend
cd backend

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run start:dev
```

El servidor estará escuchando en `http://localhost:3001`.

## 🌐 Endpoints Disponibles

### 1. `GET /catalog`
Obtiene las categorías y platos oficiales con sus precios y opciones (DÚO / TRÍO).

### 2. `POST /orders/whatsapp`
Recibe el pedido del cliente y retorna la URL segura de WhatsApp:
```json
{
  "customerName": "Juan Pérez",
  "phone": "71234567",
  "deliveryType": "delivery",
  "zoneId": "z1",
  "address": "Av. D'orbigny Km 4 1/2",
  "paymentMethod": "qr",
  "items": [
    {
      "productId": "prod-charque",
      "optionId": "opt-charque-duo",
      "quantity": 1,
      "notes": "Llajwa bien picante"
    }
  ]
}
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "verifiedSubtotal": 135,
  "deliveryCost": 10,
  "verifiedTotal": 145,
  "whatsappUrl": "https://wa.me/59175333374?text=..."
}
```

## ☁️ Despliegue en Producción
Compatible con **Render**, **Railway** o **Koyeb**:
- **Build Command:** `npm run build`
- **Start Command:** `npm run start:prod`
- **Puerto:** Variable `PORT` inyectada automáticamente por la plataforma.
