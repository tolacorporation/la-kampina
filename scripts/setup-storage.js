import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan credenciales de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  console.log('📦 Verificando buckets en Supabase Storage...');
  
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error('Error listando buckets:', listErr);
    return;
  }

  console.log('Buckets existentes:', buckets.map(b => b.name));

  const bucketName = 'dish-images';
  const exists = buckets.some(b => b.name === bucketName);

  if (!exists) {
    console.log(`Creando bucket público "${bucketName}"...`);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 5242880, // 5 MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    });

    if (error) {
      console.error('❌ Error creando bucket:', error);
    } else {
      console.log('✅ Bucket creado con éxito:', data);
    }
  } else {
    console.log(`✅ El bucket "${bucketName}" ya existe.`);
    // Asegurar que sea público
    await supabase.storage.updateBucket(bucketName, {
      public: true,
    });
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl('test.webp');
  console.log('Ejemplo de URL pública generada:', publicUrlData.publicUrl);

  // Probar subida de prueba con mimetype permitido
  console.log('🧪 Probando subida de archivo de prueba WebP...');
  // 1x1 transparente WebP buffer
  const webp1x1 = Buffer.from('UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AA/vm2QAP7/nP8AP75tkAD+/5z/AD++bZAA/v+c/wAA', 'base64');
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from(bucketName)
    .upload('test-verify.webp', webp1x1, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (uploadErr) {
    console.error('❌ Error en subida de prueba:', uploadErr);
  } else {
    console.log('✅ Archivo WebP subido con éxito:', uploadData);
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl('test-verify.webp');
    console.log('🔗 URL pública verificada:', publicUrlData.publicUrl);
    await supabase.storage.from(bucketName).remove(['test-verify.webp']);
    console.log('🧹 Archivo de prueba limpiado correctamente.');
  }
}

setupStorage();
