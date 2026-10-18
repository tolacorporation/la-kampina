// ==============================================================================
// 🚀 SCRIPT DE MIGRACIÓN Y SEEDING: LA KAMPIÑA → SUPABASE
// ==============================================================================
import { createClient } from '@supabase/supabase-js';
import { CATALOG_CATEGORIES } from '../src/data/catalog.js';
import { RESTAURANT_INFO } from '../src/data/restaurantInfo.js';
import fs from 'fs';
import path from 'path';

// Cargar variables desde .env.local si existe
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

loadEnvLocal();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Usar SERVICE_ROLE_KEY si existe (para saltarse RLS durante el seed), o fallback a ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan credenciales de Supabase en .env.local');
  console.error('Asegúrate de definir VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o VITE_SUPABASE_ANON_KEY).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log('🌱 Iniciando migración de datos a Supabase...');

  // 1. Limpiar datos existentes en orden inverso de claves foráneas
  console.log('🧹 Limpiando tablas previas...');
  await supabase.from('product_options').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('event_promotions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('store_settings').delete().neq('key', '__placeholder__');

  // 2. Insertar Configuración General
  console.log('⚙️ Insertando configuración de tienda (store_settings)...');
  const settingsData = [
    { key: 'restaurant_name', value: RESTAURANT_INFO.name, description: 'Nombre oficial' },
    { key: 'whatsapp_number', value: RESTAURANT_INFO.whatsappNumber, description: 'Número de WhatsApp para pedidos' },
    { key: 'phone_display', value: RESTAURANT_INFO.phoneDisplay, description: 'Teléfono visible' },
    { key: 'address', value: RESTAURANT_INFO.location.address, description: 'Dirección física' },
    { key: 'schedule_days', value: RESTAURANT_INFO.schedule.days, description: 'Días de atención' },
    { key: 'schedule_hours', value: RESTAURANT_INFO.schedule.hours, description: 'Horas de atención' },
    { key: 'google_maps_url', value: RESTAURANT_INFO.location.googleMapsUrl, description: 'Enlace a Google Maps' },
    { key: 'apple_maps_url', value: RESTAURANT_INFO.location.appleMapsUrl, description: 'Enlace a Apple Maps' }
  ];
  const { error: settingsErr } = await supabase.from('store_settings').insert(settingsData);
  if (settingsErr) console.warn('Advertencia settings:', settingsErr.message);

  // 3. Insertar Evento / Promoción: Jueves de Ají de Fideo
  console.log('🌶️ Insertando evento recurrente de Ají de Fideo...');
  await supabase.from('event_promotions').insert([
    {
      title: '¡Hoy es Jueves! Hay Ají de Fideo',
      description: 'Tradición valluna con fideo tostado a fuego lento, carne tierna, papas imillas y sarsa fresca.',
      type: 'BANNER_HEADER',
      target_url: '#cat-aji-fideo',
      is_weekly: true,
      day_of_week: 4, // Jueves
      is_active: true
    }
  ]);

  // 4. Insertar Categorías, Productos y Opciones
  console.log('🍲 Insertando categorías y platos del menú...');
  for (let cIdx = 0; cIdx < CATALOG_CATEGORIES.length; cIdx++) {
    const cat = CATALOG_CATEGORIES[cIdx];
    
    // Insertar Categoría
    const { data: createdCat, error: catErr } = await supabase
      .from('categories')
      .insert({
        slug: cat.id,
        name: cat.name,
        short_name: cat.shortName || cat.name,
        description: cat.description || null,
        sort_order: cIdx,
        is_active: true
      })
      .select()
      .single();

    if (catErr) {
      console.error(`Error insertando categoría ${cat.name}:`, catErr.message);
      continue;
    }

    // Insertar Productos de esta categoría
    for (let pIdx = 0; pIdx < cat.products.length; pIdx++) {
      const prod = cat.products[pIdx];

      const { data: createdProd, error: prodErr } = await supabase
        .from('products')
        .insert({
          category_id: createdCat.id,
          slug: prod.id,
          name: prod.name,
          short_name: prod.shortName || prod.name,
          description: prod.description || null,
          image_url: prod.image || null,
          sort_order: pIdx,
          is_active: true
        })
        .select()
        .single();

      if (prodErr) {
        console.error(`Error insertando producto ${prod.name}:`, prodErr.message);
        continue;
      }

      // Insertar Opción de porción correspondiente
      const { error: optErr } = await supabase
        .from('product_options')
        .insert({
          product_id: createdProd.id,
          name: prod.name,
          short_name: prod.badge || 'Porción',
          badge: prod.badge || null,
          price: prod.price,
          sort_order: 0,
          is_active: true
        });

      if (optErr) {
        console.error(`Error insertando opción de ${prod.name}:`, optErr.message);
      }
    }
  }

  console.log('✅ ¡Migración y Seeding completados exitosamente en Supabase!');
}

runSeed().catch((e) => {
  console.error('Error fatal durante el seed:', e);
  process.exit(1);
});
