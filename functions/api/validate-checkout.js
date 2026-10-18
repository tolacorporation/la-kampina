/**
 * Cloudflare Pages Function: POST /api/validate-checkout
 * Patrón Búnker: Checkout Seguro.
 * Valida los IDs y cantidades contra los precios oficiales de Cloudflare KV,
 * previene manipulación en el cliente y genera el enlace verificado de WhatsApp.
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const orderData = await request.json();
    const { customerName, phone, deliveryType, mapsUrl, paymentMethod, items } = orderData;

    if (!customerName || !phone || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Datos de pedido incompletos (nombre, teléfono o ítems faltantes).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Obtener catálogo oficial desde Cloudflare KV (o fallback a Supabase)
    let catalog = null;
    if (env.CATALOG_KV) {
      catalog = await env.CATALOG_KV.get('public_catalog', { type: 'json' });
    }

      const supabaseUrl = env.VITE_SUPABASE_URL || 'https://vmuezpofboixfymeinld.supabase.co';
      const supabaseKey =
        env.VITE_SUPABASE_ANON_KEY ||
        env.SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtdWV6cG9mYm9peGZ5bWVpbmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNjk4ODgsImV4cCI6MjEwNzg0NTg4OH0.f6S1npD_Hd13CqS0NOTTWScU_WrFREgUu1UZhQ8mNwQ';

      if (supabaseKey) {
        const catRes = await fetch(
          `${supabaseUrl}/rest/v1/categories?select=id,slug,name,products(id,slug,name,is_active,product_options(id,name,price,is_active))&is_active=eq.true`,
          { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
        );
        const cats = await catRes.json();

        const setRes = await fetch(`${supabaseUrl}/rest/v1/store_settings?select=key,value`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
        });
        const setts = await setRes.json();
        const settingsMap = {};
        if (Array.isArray(setts)) {
          setts.forEach((s) => (settingsMap[s.key] = s.value));
        }

        catalog = {
          categories: (cats || []).map((c) => ({
            id: c.slug || c.id,
            products: (c.products || []).map((p) => ({
              id: p.slug || p.id,
              name: p.name,
              categoryId: c.slug || c.id,
              options: (p.product_options || []).map((o) => ({
                id: o.id,
                name: o.name,
                price: parseFloat(o.price),
              })),
            })),
          })),
          storeSettings: settingsMap,
        };
      }
    }

    if (!catalog || !catalog.categories) {
      return new Response(JSON.stringify({ error: 'No se pudo cargar el catálogo de referencia.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Indexar productos y opciones para validación O(1)
    const productMap = new Map();
    const optionMap = new Map();

    catalog.categories.forEach((cat) => {
      (cat.products || []).forEach((prod) => {
        productMap.set(prod.id, { ...prod, categoryId: cat.id });
        (prod.options || []).forEach((opt) => {
          optionMap.set(opt.id, { ...opt, productId: prod.id });
        });
      });
    });

    const settings = catalog.storeSettings || {};
    const isLiveActive = settings.live_discount_active === 'true';
    const liveDiscountAmount = parseFloat(settings.live_discount_amount || '5');

    // 3. Validar cada ítem del carrito y recalcular precios oficiales
    let verifiedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        continue; // Omitir productos no encontrados o inactivos
      }

      let unitPrice = 0;
      let optionName = null;

      if (item.optionId) {
        const opt = optionMap.get(item.optionId) || (prod.options || []).find((o) => o.id === item.optionId || o.name === item.optionId);
        if (opt) {
          unitPrice = opt.price;
          optionName = opt.name;
        } else if (prod.price !== undefined) {
          unitPrice = prod.price;
        }
      } else if (prod.price !== undefined) {
        unitPrice = prod.price;
      }

      // Aplicar descuento Live oficial si corresponde (platos de comida)
      const isDrinkOrExtra =
        prod.categoryId?.toLowerCase().includes('bebida') ||
        prod.categoryId?.toLowerCase().includes('refresco') ||
        prod.categoryId?.toLowerCase().includes('guarnicion') ||
        prod.categoryId?.toLowerCase().includes('extra');

      const itemDiscountable = isLiveActive && !isDrinkOrExtra;
      const effectiveUnitPrice = itemDiscountable ? Math.max(0, unitPrice - liveDiscountAmount) : unitPrice;

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemSubtotal = effectiveUnitPrice * qty;
      verifiedTotal += itemSubtotal;

      validatedItems.push({
        name: prod.name,
        optionName,
        quantity: qty,
        unitPrice: effectiveUnitPrice,
        originalUnitPrice: unitPrice,
        subtotal: itemSubtotal,
        notes: item.notes ? String(item.notes).trim() : '',
      });
    }

    if (validatedItems.length === 0) {
      return new Response(JSON.stringify({ error: 'Ningún ítem válido en el pedido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Generar string final verificado para WhatsApp
    const orderNumber = `LK-${Math.floor(1000 + Math.random() * 9000)}`;

    let text = `*PEDIDO LA KAMPIÑA* (#${orderNumber})\n`;
    text += `Cliente: ${customerName.trim()} (${phone.trim()})\n`;
    if (deliveryType === 'delivery') {
      text += `Entrega: Delivery (Pendiente a cotización)\n`;
      text += `Ubicación: ${(mapsUrl || '').trim()}\n\n`;
    } else {
      text += `Entrega: Retiro en local\n\n`;
    }

    text += `*Pedido Verificado:*\n`;
    validatedItems.forEach((item) => {
      const optStr = item.optionName ? ` [${item.optionName}]` : '';
      const breakdown = item.quantity > 1 ? ` (${item.unitPrice} Bs. c/u)` : '';
      text += `• ${item.quantity}x ${item.name}${optStr} — ${item.subtotal} Bs.${breakdown}\n`;
      if (item.notes) {
        text += `  Nota: ${item.notes}\n`;
      }
    });

    text += `\n*Total Verificado:* ${verifiedTotal} Bs.\n`;
    if (isLiveActive) {
      text += `*Promo Live Aplicada:* -${liveDiscountAmount} Bs. en platos\n`;
    }
    if (deliveryType === 'delivery') {
      text += `*Delivery:* Pendiente a cotización\n`;
    }
    text += `*Pago:* ${paymentMethod === 'qr' ? 'QR Simple' : 'Efectivo'}`;

    const whatsappNumber = settings.whatsapp_number || '59163993851';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;

    return new Response(
      JSON.stringify({
        success: true,
        orderNumber,
        verifiedTotal,
        whatsappUrl,
        itemCount: validatedItems.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Error validando pedido' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
