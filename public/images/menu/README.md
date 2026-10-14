# Arquitectura de Imágenes del Menú - La Kampiña

Esta estructura modular contiene las carpetas organizadas por categoría gastronómica para alojar las fotografías oficiales de los platos y bebidas de La Kampiña.

## Estructura de Carpetas

```text
public/images/menu/
├── charque/            -> Fotografías del Charque tradicional y porciones
├── matahambre/         -> Fotografías del Matahambre criollo
├── charkambre/         -> Fotografías del Charkambre (Plato Insignia)
├── pique-macho/        -> Fotografías del Pique Macho tradicional
├── planchita/          -> Fotografías de la Planchita de Bronce
├── aji-fideo/          -> Fotografías del Ají de Fideo (Solo los jueves)
└── bebidas/            -> Fotografías de gaseosas, jugo, chicha kulli, cervezas
```

## Especificaciones Técnicas Recomendadas

- **Proporción de Aspecto para Platos (Cards):** `4:3` (ej. `800x600 px` o `1200x900 px`).
- **Proporción de Aspecto para Banners (Opcional):** `21:9` o `16:9` (ej. `1200x514 px`).
- **Formato recomendado:** `.webp` (o `.jpg` comprimido) para máxima velocidad de carga.
- **Peso objetivo:** Menor a `200 KB` por imagen.
- **Encuadre:** Plano cenital (desde arriba) o plano picado a 45° con iluminación cálida natural que destaque la abundancia y textura criolla.

## Activación en el Catálogo

Una vez agregadas las imágenes en estas carpetas, se activan cambiando la propiedad `image: null` por la ruta correspondiente en [`src/data/catalog.js`](file:///C:/Users/mijai/Downloads/ProyectoKampina/src/data/catalog.js).
