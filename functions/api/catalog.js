/**
 * Cloudflare Pages Function: GET /api/catalog
 * Patrón Búnker: Entrega el catálogo público desde Cloudflare KV (Edge Cache)
 * El cliente público NUNCA consulta directamente a Supabase.
 */

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 1. Intentar obtener desde Cloudflare KV
    if (env.CATALOG_KV) {
      const cached = await env.CATALOG_KV.get('public_catalog', { type: 'json' });
      if (cached) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=30, s-maxage=300',
            'X-Cache-Source': 'Cloudflare-KV',
          },
        });
      }
    }

    // 2. Fallback de arranque en frío (si KV está vacío): consultar Supabase
    const supabaseUrl = env.VITE_SUPABASE_URL || 'https://vmuezpofboixfymeinld.supabase.co';
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

    if (!supabaseKey) {
      return new Response(JSON.stringify({ error: 'Supabase anon key no configurada' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Consulta de categorías y productos activos
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

    // Consulta de store_settings (Live, Cierre, WhatsApp)
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

    // Formatear catálogo limpio
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

    const payload = {
      categories,
      storeSettings: settingsMap,
      generatedAt: new Date().toISOString(),
    };

    // Guardar en KV para todas las siguientes peticiones
    if (env.CATALOG_KV) {
      await env.CATALOG_KV.put('public_catalog', JSON.stringify(payload), {
        expirationTtl: 86400, // 24 horas
      });
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=300',
        'X-Cache-Source': 'Supabase-ColdStart',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Error al obtener catálogo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
