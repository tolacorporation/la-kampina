import { Injectable, BadRequestException } from '@nestjs/common';
import { CatalogService } from '../catalog/catalog.service';
import { CreateOrderDto } from './dto/create-order.dto';

export interface DeliveryZone {
  id: string;
  name: string;
  cost: number;
}

@Injectable()
export class OrdersService {
  // Zonas oficiales verificadas de delivery en Cochabamba
  private readonly zones: Record<string, DeliveryZone> = {
    z1: { id: 'z1', name: "Zona D'orbigny / Av. Beijing / Km 4 a 5", cost: 10 },
    z2: { id: 'z2', name: 'Cochabamba Centro / Cala Cala', cost: 15 },
    z3: { id: 'z3', name: 'Zona Norte / Av. América / Queru Queru', cost: 20 },
    z4: { id: 'z4', name: 'Colcapirhua / Quillacollo', cost: 25 },
    z5: { id: 'z5', name: 'Tiquipaya / Cruce Taquiña', cost: 25 },
  };

  private readonly restaurantPhone = '59163993851'; // WhatsApp oficial La Kampiña (63993851)

  constructor(private readonly catalogService: CatalogService) {}

  generateWhatsAppOrder(orderDto: CreateOrderDto) {
    if (!orderDto.items || orderDto.items.length === 0) {
      throw new BadRequestException('El pedido debe incluir al menos un producto.');
    }

    let subtotalSeguro = 0;
    let orderDetailsText = '';

    // 1. Recalcular precios desde el servidor (Blindaje contra fraude del cliente)
    for (const item of orderDto.items) {
      const quantity = Math.max(1, Math.floor(item.quantity || 1));
      const verified = this.catalogService.findPrice(item.productId, item.optionId);

      const lineTotal = verified.price * quantity;
      subtotalSeguro += lineTotal;

      const optionLabel = verified.optionName ? ` [${verified.optionName}]` : '';
      orderDetailsText += `• ${quantity}x ${verified.productName}${optionLabel} (${lineTotal} Bs.)\n`;

      if (item.notes && item.notes.trim()) {
        orderDetailsText += `   ↳ Nota: ${item.notes.trim()}\n`;
      }
    }

    // 2. Determinar costo de envío real según zona verificada
    let deliveryCost = 0;
    let zoneName = 'Retiro en Local';

    if (orderDto.deliveryType === 'delivery') {
      const zone = this.zones[orderDto.zoneId || 'z1'] || this.zones['z1'];
      deliveryCost = zone.cost;
      zoneName = zone.name;
    }

    // 3. Total inmutable
    const totalSeguro = subtotalSeguro + deliveryCost;

    // 4. Formatear mensaje para WhatsApp
    const clientName = orderDto.customerName?.trim() || 'Cliente';
    const clientPhone = orderDto.phone?.trim() || 'No especificado';
    const paymentLabel = orderDto.paymentMethod === 'qr' ? 'Pago QR Simple' : 'Efectivo contra entrega';

    let waMessage = `🍲 *NUEVO PEDIDO VERIFICADO - LA KAMPIÑA*\n\n`;
    waMessage += `👤 *Cliente:* ${clientName}\n`;
    waMessage += `📱 *Teléfono:* ${clientPhone}\n`;
    waMessage += `🛵 *Modalidad:* ${orderDto.deliveryType === 'delivery' ? `Delivery (${zoneName})` : 'Retiro en Local'}\n`;

    if (orderDto.deliveryType === 'delivery') {
      waMessage += `📍 *Dirección & Ref:* ${orderDto.address?.trim() || 'A coordinar'}\n`;
      waMessage += `🚚 *Envío:* ${deliveryCost} Bs.\n`;
    }

    waMessage += `💳 *Método de Pago:* ${paymentLabel}\n\n`;
    waMessage += `📦 *DETALLE DE PLATOS Y BEBIDAS:*\n${orderDetailsText}`;
    waMessage += `\n───────────────\n`;
    waMessage += `🍽️ *Subtotal:* ${subtotalSeguro} Bs.\n`;
    if (orderDto.deliveryType === 'delivery') {
      waMessage += `🛵 *Envío:* ${deliveryCost} Bs.\n`;
    }
    waMessage += `💰 *TOTAL A PAGAR:* ${totalSeguro} Bs.\n`;
    waMessage += `───────────────\n`;
    waMessage += `\n_Pedido validado y generado por el Servidor Oficial La Kampiña_`;

    // 5. Retornar URL oficial codificada
    const encoded = encodeURIComponent(waMessage);
    const whatsappUrl = `https://wa.me/${this.restaurantPhone}?text=${encoded}`;

    return {
      success: true,
      verifiedSubtotal: subtotalSeguro,
      deliveryCost,
      verifiedTotal: totalSeguro,
      whatsappUrl,
    };
  }
}
