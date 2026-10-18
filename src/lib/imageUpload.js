import { supabase } from './supabaseClient';


/**
 * Comprime y optimiza cualquier imagen directamente en el navegador del cliente.
 * Convierte a formato moderno WebP y escala a un máximo de 1200px.
 * Esto reduce una foto de 5-10 MB a ~80-150 KB en 50 milisegundos.
 */
export async function optimizeImageForWeb(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error leyendo la imagen del dispositivo.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el procesador de imágenes.'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) resolve(jpegBlob);
                  else reject(new Error('Error al comprimir la imagen.'));
                },
                'image/jpeg',
                quality
              );
            }
          },
          'image/webp',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Notifica al endpoint /api/sync-kv para que Cloudflare KV
 * refresque inmediatamente la copia estática de la carta.
 */
export async function triggerKvSync() {
  try {
    await fetch('/api/sync-kv', { method: 'POST' });
  } catch (err) {
    console.warn('Aviso: No se pudo sincronizar automáticamente Cloudflare KV:', err);
  }
}

/**
 * Sube una imagen optimizada al bucket de Supabase Storage ('dish-images')
 * y actualiza la URL en la tabla de productos de la base de datos.
 * Posteriormente dispara la actualización de Cloudflare KV (Patrón Búnker).
 */
export async function uploadAndAssignDishImage(productId, dishSlug, file) {
  if (!supabase) {
    throw new Error('Supabase no está configurado.');
  }

  // 1. Optimizar imagen en el cliente (conversión a WebP < 150 KB)
  const optimizedBlob = await optimizeImageForWeb(file);

  // 2. Generar nombre de archivo único
  const cleanSlug = (dishSlug || 'plato').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
  const fileName = `${cleanSlug}-${Date.now()}.webp`;
  const filePath = `dishes/${fileName}`;

  // 3. Subir al bucket 'dish-images' en Supabase Storage
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('dish-images')
    .upload(filePath, optimizedBlob, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (uploadErr) {
    throw uploadErr;
  }

  // 4. Obtener URL pública directa de la CDN de Supabase Storage
  const { data: publicUrlData } = supabase.storage
    .from('dish-images')
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl;

  // 5. Actualizar el registro en la base de datos (tabla products)
  const { error: dbErr } = await supabase
    .from('products')
    .update({
      image_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (dbErr) {
    throw dbErr;
  }

  // 6. Patrón Búnker: Sincronizar de inmediato el JSON estático en Cloudflare KV
  triggerKvSync();

  return { publicUrl, fileName };
}

/**
 * Elimina o desasigna la foto de un plato en Supabase Storage y BD
 */
export async function removeDishImage(productId, currentImageUrl = null) {
  if (!supabase) throw new Error('Supabase no está configurado.');

  // Si tenemos la ruta, intentar borrar el archivo físico del bucket para no consumir el 1 GB
  if (currentImageUrl) {
    const match = currentImageUrl.match(/dishes\/[^\s/?#]+/);
    if (match) {
      try {
        await supabase.storage.from('dish-images').remove([match[0]]);
      } catch (e) {
        console.warn('Aviso: No se pudo eliminar el archivo físico en Supabase Storage:', e);
      }
    }
  }

  // Actualizar base de datos a null
  const { error } = await supabase
    .from('products')
    .update({
      image_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (error) throw error;

  // Sincronizar Cloudflare KV
  triggerKvSync();

  return true;
}
