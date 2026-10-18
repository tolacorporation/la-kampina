/**
 * Cloudflare Pages Function: POST /api/sync-kv
 * Patrón Búnker: Sincroniza y refresca inmediatamente el catálogo en Cloudflare KV
 * Invocado por el Dashboard de administración al guardar cambios.
 */

export async function onRequestPost(context) {
  const { env } = context;

    const supabaseUrl = env.VITE_SUPABASE_URL || 'https://vmuezpofboixfymeinld.supabase.co';
    const supabaseKey =
      env.VITE_SUPABASE_ANON_KEY ||
      env.SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtdWV6cG9mYm9peGZ5bWVpbmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNjk4ODgsImV4cCI6MjEwNzg0NTg4OH0.f6S1npD_Hd13CqS0NOTTWScU_WrFREgUu1UZhQ8mNwQ';

    if (!supabaseKey) {
      return new Response(JSON.stringify({ error: 'Supabase anon key no configurada' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Obtener categorías y productos actualizados de Supabase
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

    // 2. Obtener store_settings actualizados
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

    // 3. Formatear catálogo limpio
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

    // 4. Guardar en Cloudflare KV
    if (env.CATALOG_KV) {
      await env.CATALOG_KV.put('public_catalog', JSON.stringify(payload), {
        expirationTtl: 86400,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cloudflare KV sincronizado exitosamente',
        itemCount: categories.reduce((sum, c) => sum + c.products.length, 0),
        timestamp: Date.now(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Error sincronizando KV' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
