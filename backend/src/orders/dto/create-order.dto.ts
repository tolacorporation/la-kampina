export class OrderItemDto {
  productId: string;
  optionId?: string;
  quantity: number;
  notes?: string;
}

export class CreateOrderDto {
  customerName: string;
  phone: string;
  deliveryType: 'delivery' | 'pickup';
  zoneId?: string;
  address?: string;
  paymentMethod: 'qr' | 'cash';
  items: OrderItemDto[];
}
