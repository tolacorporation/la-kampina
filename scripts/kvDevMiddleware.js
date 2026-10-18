import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Almacén en memoria que simula Cloudflare KV localmente
let localKvCache = null;

async function fetchFromSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vmuezpofboixfymeinld.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY no configurada en .env.local');
  }

  const catRes = await fetch(
    `${supabaseUrl}/rest/v1/categories?select=id,slug,name,short_name,description,sort_order,products(id,slug,name,short_name,description,image_url,sort_order,is_active,product_options(id,name,short_name,badge,price,sort_order,is_active))&is_active=eq.true&order=sort_order.asc`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  const rawCategories = await catRes.json();

  const setRes = await fetch(`${supabaseUrl}/rest/v1/store_settings?select=key,value`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  const rawSettings = await setRes.json();
  const settingsMap = {};
  if (Array.isArray(rawSettings)) {
    rawSettings.forEach((item) => {
      settingsMap[item.key] = item.value;
    });
  }

  const categories = Array.isArray(rawCategories)
    ? rawCategories.map((cat) => ({
        id: cat.slug || cat.id,
        name: cat.name,
        shortName: cat.short_name || cat.name,
        description: cat.description || '',
        badge: cat.slug?.includes('aji') ? 'Solo Jueves' : null,
        isThursdayOnly: Boolean(cat.slug?.includes('aji')),
        products: (cat.products || [])
          .filter((p) => p.is_active !== false)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((p) => {
            const activeOptions = (p.product_options || [])
              .filter((o) => o.is_active !== false)
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
            const firstOpt = activeOptions[0];
            return {
              id: p.slug || p.id,
              categoryId: cat.slug || cat.id,
              name: p.name,
              shortName: p.short_name || p.name,
              description: p.description || '',
              image: p.image_url || null,
              price: firstOpt ? parseFloat(firstOpt.price) : 0,
              badge: firstOpt?.badge || null,
              isThursdayOnly: Boolean(p.slug?.includes('aji') || cat.slug?.includes('aji')),
              options:
                activeOptions.length > 1
                  ? activeOptions.map((o) => ({
                      id: o.id,
                      name: o.name,
                      shortName: o.short_name,
                      price: parseFloat(o.price),
                      badge: o.badge,
                    }))
                  : null,
            };
          }),
      }))
    : [];

  return {
    categories,
    storeSettings: settingsMap,
    generatedAt: new Date().toISOString(),
  };
}

export function handleKvCatalog(req, res) {
  (async () => {
    try {
      if (!localKvCache) {
        localKvCache = await fetchFromSupabase();
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('X-Cache-Source', 'Local-KV-Dev');
      res.end(JSON.stringify(localKvCache));
    } catch (err) {
      console.error('Error en /api/catalog dev middleware:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message }));
    }
  })();
}

export function handleKvSync(req, res) {
  (async () => {
    try {
      localKvCache = await fetchFromSupabase();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          message: 'Cloudflare KV (Local Dev) sincronizado exitosamente',
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      console.error('Error en /api/sync-kv dev middleware:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message }));
    }
  })();
}

export function handleKvValidateCheckout(req, res) {
  let bodyStr = '';
  req.on('data', (chunk) => {
    bodyStr += chunk;
  });

  req.on('end', async () => {
    try {
      const orderData = JSON.parse(bodyStr || '{}');
      const { customerName, phone, deliveryType, mapsUrl, paymentMethod, items } = orderData;

      if (!customerName || !phone || !Array.isArray(items) || items.length === 0) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Datos de pedido incompletos.' }));
        return;
      }

      if (!localKvCache) {
        localKvCache = await fetchFromSupabase();
      }

      const productMap = new Map();
      const optionMap = new Map();

      localKvCache.categories.forEach((cat) => {
        (cat.products || []).forEach((prod) => {
          productMap.set(prod.id, { ...prod, categoryId: cat.id });
          (prod.options || []).forEach((opt) => {
            optionMap.set(opt.id, { ...opt, productId: prod.id });
          });
        });
      });

      const settings = localKvCache.storeSettings || {};
      const isLiveActive = settings.live_discount_active === 'true';
      const liveDiscountAmount = parseFloat(settings.live_discount_amount || '5');

      let verifiedTotal = 0;
      const validatedItems = [];

      for (const item of items) {
        const prod = productMap.get(item.productId);
        if (!prod) continue;

        let unitPrice = 0;
        let optionName = null;

        if (item.optionId) {
          const opt =
            optionMap.get(item.optionId) ||
            (prod.options || []).find((o) => o.id === item.optionId || o.name === item.optionId);
          if (opt) {
            unitPrice = opt.price;
            optionName = opt.name;
          } else if (prod.price !== undefined) {
            unitPrice = prod.price;
          }
        } else if (prod.price !== undefined) {
          unitPrice = prod.price;
        }

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
          subtotal: itemSubtotal,
          notes: item.notes ? String(item.notes).trim() : '',
        });
      }

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

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          orderNumber,
          verifiedTotal,
          whatsappUrl,
          itemCount: validatedItems.length,
        })
      );
    } catch (err) {
      console.error('Error en /api/validate-checkout dev middleware:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}
