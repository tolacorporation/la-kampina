-- ==============================================================================
-- 🚀 ESQUEMA DE BASE DE DATOS: LA KAMPIÑA (PostgreSQL / Supabase)
-- ==============================================================================

-- 1. Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: CATEGORÍAS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(100),
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA: PRODUCTOS / PLATOS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    slug VARCHAR(150) UNIQUE,
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(100),
    description TEXT,
    image_url TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA: OPCIONES DE PORCIÓN Y PRECIO (Dúo, Trío, Personal)
CREATE TABLE IF NOT EXISTS public.product_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(100),
    badge VARCHAR(80),
    price DECIMAL(10, 2) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLA: EVENTOS Y PROMOCIONES (Jueves de Ají, Festivos, Banners)
CREATE TABLE IF NOT EXISTS public.event_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(250) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'BANNER_HEADER', -- 'BANNER_HEADER', 'DISCOUNT', 'SPECIAL_DISH', 'POPUP'
    banner_image_url TEXT,
    discount_percent INT DEFAULT 0,
    target_url VARCHAR(255),
    is_weekly BOOLEAN DEFAULT FALSE,
    day_of_week INT, -- 0: Dom, 1: Lun, 2: Mar, 3: Mié, 4: Jue, 5: Vie, 6: Sáb
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLA: CONFIGURACIÓN GENERAL DEL LOCAL
CREATE TABLE IF NOT EXISTS public.store_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ÍNDICES PARA ALTO RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_options_product_id ON public.product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_categories_active_order ON public.categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_products_active_order ON public.products(is_active, sort_order);

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Lectura pública (Rol 'anon'): Solo registros activos
CREATE POLICY "Lectura pública de categorías" 
  ON public.categories FOR SELECT TO anon USING (is_active = TRUE);

CREATE POLICY "Lectura pública de productos" 
  ON public.products FOR SELECT TO anon USING (is_active = TRUE);

CREATE POLICY "Lectura pública de opciones de porción" 
  ON public.product_options FOR SELECT TO anon USING (is_active = TRUE);

CREATE POLICY "Lectura pública de promociones" 
  ON public.event_promotions FOR SELECT TO anon USING (is_active = TRUE);

CREATE POLICY "Lectura pública de configuración" 
  ON public.store_settings FOR SELECT TO anon USING (TRUE);

-- Administración total para usuarios autenticados (Rol 'authenticated')
CREATE POLICY "Acceso total admin categorías" 
  ON public.categories FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Acceso total admin productos" 
  ON public.products FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Acceso total admin opciones" 
  ON public.product_options FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Acceso total admin promociones" 
  ON public.event_promotions FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Acceso total admin configuración" 
  ON public.store_settings FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- ==============================================================================
-- 7. POLÍTICAS DE ALMACENAMIENTO (Supabase Storage: dish-images)
-- ==============================================================================
-- Lectura pública para cualquier usuario:
CREATE POLICY "dish_images_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'dish-images');

-- Subida, actualización y borrado exclusivos para administradores autenticados:
CREATE POLICY "dish_images_admin_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dish-images');

CREATE POLICY "dish_images_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'dish-images')
  WITH CHECK (bucket_id = 'dish-images');

CREATE POLICY "dish_images_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'dish-images');

