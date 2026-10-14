import { Injectable } from '@nestjs/common';

export interface ProductOption {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string | null;
  price: number;
  badge?: string;
  isThursdayOnly?: boolean;
  options?: ProductOption[];
}

export interface Category {
  id: string;
  name: string;
  shortName?: string;
  badge?: string;
  isThursdayOnly?: boolean;
  description: string;
  image: string | null;
  products: Product[];
}

@Injectable()
export class CatalogService {
  // Catálogo Canónico y Seguro de La Kampiña Cochabamba (Fuente de la Verdad)
  // Premisas Oficiales del Menú:
  // • Charque: 2 Personas (DUO) 135 Bs / 3 Personas (TRIO) 155 Bs
  // • Matahambre: 2 Personas (DUO) 135 Bs / 3 Personas (TRIO) 155 Bs
  // • Charkambre: 2 Personas (DUO) 135 Bs / 3 Personas (TRIO) 155 Bs
  // • Pique Macho: 2 Personas (DUO) 135 Bs / 3 Personas (TRIO) 155 Bs
  // • Planchita de Bronce: 2 Personas (DUO) 135 Bs / 3 Personas (TRIO) 155 Bs
  // • Aji de Fideo (Solo Jueves): 45 Bs
  // • Bebidas:
  //   - Gaseosas: Popular 10 Bs, 2Lt 22 Bs
  //   - Jugo del Sol 1 Litro: 18 Bs
  //   - Chicha Kulli: Jarrita 15 Bs, Jarra 30 Bs, Cantarito 60 Bs
  //   - Paceña: 23 Bs, 25 Bs
  //   - Bicervecina: 20 Bs

  private readonly categories: Category[] = [
    {
      id: 'cat-charque',
      name: 'Charque',
      shortName: 'Charque',
      description: 'Tradicional charque cochabambino con carne desmenuzada bien crocante, abundante mote blanco de maíz, huevo duro y queso criollo frito.',
      image: null,
      products: [
        {
          id: 'prod-charque',
          name: 'Charque Cochabambino',
          description: 'Carne de res deshidratada y frita a punto crocante, servida con abundante mote de maíz, huevo duro, queso criollo dorado y llajwa fresca de batán.',
          image: null,
          price: 135,
          options: [
            { id: 'opt-charque-duo', name: '2 Personas (DUO)', price: 135 },
            { id: 'opt-charque-trio', name: '3 Personas (TRIO)', price: 155 },
          ],
        },
      ],
    },
    {
      id: 'cat-matahambre',
      name: 'Matahambre',
      shortName: 'Matahambre',
      description: 'Tierno y jugoso corte de matahambre de res marinado al estilo criollo, sellado a la plancha con mote, papas doradas y queso criollo frito.',
      image: null,
      products: [
        {
          id: 'prod-matahambre',
          name: 'Matahambre Criollo',
          description: 'Tierno corte de matahambre dorado a la plancha en su punto exacto de jugo, servido con mote tierno, papas doradas, queso criollo frito y llajwa recién molida.',
          image: null,
          price: 135,
          options: [
            { id: 'opt-matahambre-duo', name: '2 Personas (DUO)', price: 135 },
            { id: 'opt-matahambre-trio', name: '3 Personas (TRIO)', price: 155 },
          ],
        },
      ],
    },
    {
      id: 'cat-charkambre',
      name: 'Charkambre',
      shortName: 'Charkambre',
      description: 'La creación insignia de La Kampiña: la combinación perfecta de Charque crocante desmenuzado y Matahambre tierno y jugoso en una sola gran fuente.',
      image: null,
      products: [
        {
          id: 'prod-charkambre',
          name: 'Charkambre La Kampiña',
          description: 'Lo mejor de dos mundos en un solo plato: generosa porción de charque crujiente y matahambre tierno a la plancha, servidos con abundante mote blanco, huevo duro, queso criollo frito y llajwa de batán.',
          image: null,
          price: 135,
          options: [
            { id: 'opt-charkambre-duo', name: '2 Personas (DUO)', price: 135 },
            { id: 'opt-charkambre-trio', name: '3 Personas (TRIO)', price: 155 },
          ],
        },
      ],
    },
    {
      id: 'cat-pique-macho',
      name: 'Pique Macho',
      shortName: 'Pique Macho',
      description: 'El clásico más abundante y tradicional de Cochabamba: jugoso lomo de res y salchichas sobre una montaña de papas fritas caseras, huevo duro, tomate, cebolla y locoto fresco.',
      image: null,
      products: [
        {
          id: 'prod-pique-macho',
          name: 'Pique Macho Tradicional',
          description: 'Cortes selectos de lomo de res salteados en su jugo criollo con salchichas, abundantes papas fritas caseras, gajos de huevo duro, cebolla en pluma, tomate y rodajas de locoto fresco.',
          image: null,
          price: 135,
          options: [
            { id: 'opt-pique-duo', name: '2 Personas (DUO)', price: 135 },
            { id: 'opt-pique-trio', name: '3 Personas (TRIO)', price: 155 },
          ],
        },
      ],
    },
    {
      id: 'cat-planchita',
      name: 'Planchita de Bronce',
      shortName: 'Planchita de Bronce',
      description: 'Servida directamente en plancha de bronce caliente y humeante. Cortes mixtos de carne, chuleta, chorizo criollo, yucas doradas, plátano de freír y queso derretido.',
      image: null,
      products: [
        {
          id: 'prod-planchita',
          name: 'Planchita de Bronce Tradicional',
          description: 'Surtido caliente de lomo de res, chuleta jugosa de cerdo, chorizo parrillero, huevos fritos, yucas doradas crujientes, plátano dulce de freír y queso criollo derretido al calor del bronce.',
          image: null,
          price: 135,
          options: [
            { id: 'opt-planchita-duo', name: '2 Personas (DUO)', price: 135 },
            { id: 'opt-planchita-trio', name: '3 Personas (TRIO)', price: 155 },
          ],
        },
      ],
    },
    {
      id: 'cat-aji-fideo',
      name: 'Aji de Fideo (Solo Jueves)',
      shortName: 'Ají de Fideo',
      badge: 'Solo Jueves',
      isThursdayOnly: true,
      description: 'La clásica tradición valluna de los jueves: fideo tostado a punto cocido a fuego lento con ají rojo cochabambino, trozos de carne suave, papas imillas, arvejas tiernas y sarsa fresca.',
      image: null,
      products: [
        {
          id: 'prod-aji-fideo',
          name: 'Ají de Fideo (Solo Jueves)',
          description: 'Receta tradicional cochabambina elaborada pacientemente con fideo tostado en sartén, pulpa de carne tierna en ají colorado, papas, arvejas tiernas y sarsa criolla. Disponible exclusivamente los días jueves.',
          image: null,
          price: 45,
          badge: 'Solo Jueves',
          isThursdayOnly: true,
        },
      ],
    },
    {
      id: 'cat-bebidas',
      name: 'Bebidas',
      shortName: 'Bebidas',
      description: 'Refrescos y jugos naturales, auténtica Chicha Kulli artesanal y cervezas tradicionales bien frías.',
      image: null,
      products: [
        {
          id: 'prod-gaseosas',
          name: 'Gaseosas',
          description: 'Coca-Cola, Fanta o Sprite bien frías a elección.',
          image: null,
          price: 10,
          options: [
            { id: 'opt-gaseosa-pop', name: 'Popular', price: 10 },
            { id: 'opt-gaseosa-2l', name: '2 Litros (2Lt)', price: 22 },
          ],
        },
        {
          id: 'prod-jugo-del-sol',
          name: 'Jugo del Sol (1 Litro)',
          description: 'Jugo de fruta natural refrescante en presentación de 1 litro.',
          image: null,
          price: 18,
        },
        {
          id: 'prod-chicha-kulli',
          name: 'Chicha Kulli',
          description: 'Auténtica chicha morada cochabambina de maíz kulli fermentada artesanalmente, servida tradicionalmente en jarrita, jarra o cantarito.',
          image: null,
          price: 15,
          options: [
            { id: 'opt-chicha-jarrita', name: 'Jarrita', price: 15 },
            { id: 'opt-chicha-jarra', name: 'Jarra', price: 30 },
            { id: 'opt-chicha-cantarito', name: 'Cantarito', price: 60 },
          ],
        },
        {
          id: 'prod-pacena',
          name: 'Cerveza Paceña',
          description: 'Cerveza nacional clásica rubia bien fría.',
          image: null,
          price: 23,
          options: [
            { id: 'opt-pacena-620', name: 'Botella 620 ml', price: 23 },
            { id: 'opt-pacena-710', name: 'Botella 710 ml', price: 25 },
          ],
        },
        {
          id: 'prod-bicervecina',
          name: 'Bicervecina',
          description: 'Cerveza negra dulce tradicional y malteada bien fría.',
          image: null,
          price: 20,
        },
      ],
    },
  ];

  getCatalog(): Category[] {
    return this.categories;
  }

  findProduct(productId: string): Product | undefined {
    for (const cat of this.categories) {
      const prod = cat.products.find((p) => p.id === productId);
      if (prod) return prod;
    }
    return undefined;
  }

  // Validación de precios inmutable y segura
  findPrice(productId: string, optionId?: string): { price: number; productName: string; optionName?: string } {
    const product = this.findProduct(productId);
    if (!product) {
      return { price: 0, productName: 'Producto no encontrado' };
    }

    if (optionId && Array.isArray(product.options)) {
      const option = product.options.find((o) => o.id === optionId || o.name === optionId);
      if (option) {
        return {
          price: option.price,
          productName: product.name,
          optionName: option.name,
        };
      }
    }

    return {
      price: product.price || 0,
      productName: product.name,
    };
  }
}
