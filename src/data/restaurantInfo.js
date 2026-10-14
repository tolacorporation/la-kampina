// Información Canónica del Restaurante La Kampiña
// Cochabamba, Bolivia

export const RESTAURANT_INFO = {
  name: 'La Kampiña',
  tagline: 'Sabor Tradicional',
  phoneDisplay: '63993851', // Sin código de país público
  phoneRaw: '63993851',
  phoneCallUrl: 'tel:63993851',
  whatsappNumber: '59163993851', // Código país Bolivia (591) requerido internamente por la API wa.me
  whatsappUrl: 'https://wa.me/59163993851?text=Hola%20La%20Kampi%C3%B1a,%20quisiera%20hacer%20una%20consulta',
  whatsappOrderUrl: 'https://wa.me/59163993851',
  
  location: {
    city: 'Cochabamba, Bolivia',
    municipality: 'Cochabamba Cercado',
    address: "Cochabamba, Av. D'orbigny Km 4 1/2, entre Avenida Segunda y Rafael Torrico Montaño",
    coordinates: {
      lat: -17.386419717819592,
      lng: -66.19790732996796,
    },
    // Iframe oficial de Google Maps
    embedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.5282314697683!2d-66.19790732996796!3d-17.386419717819592!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x93e3753d5a229d0d%3A0x34638884d69ed59!2sLa%20Kampi%C3%B1a!5e0!3m2!1ses!2sbo!4v1791904589718!5m2!1ses!2sbo',
    // Enlace directo universal a Google Maps (abre app nativa en Android y web en escritorio)
    googleMapsUrl:
      'https://www.google.com/maps/search/?api=1&query=-17.386419717819592,-66.19790732996796&query_place_id=ChIJDa0iWj1145MRmdWe1oSIYzQ',
    // Enlace directo a Apple Maps (abre app nativa de Mapas en iPhone, iPad y Mac)
    appleMapsUrl:
      'https://maps.apple.com/?q=La+Kampi%C3%B1a&ll=-17.386419717819592,-66.19790732996796',
  },
  
  schedule: {
    days: 'Miércoles a Domingo & Feriados',
    hours: '10:30 AM - 18:30 PM (Horario continuo)',
  },
};

/**
 * Detecta si el dispositivo del cliente pertenece al ecosistema Apple (iPhone, iPad, iPod, Mac).
 */
export function isAppleDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);
}

/**
 * Obtiene la información del mapa nativo según el dispositivo detectado:
 * - Apple (iOS / macOS): Apple Maps
 * - Android / Windows / Otros: Google Maps
 */
export function getDeviceMapInfo() {
  const isApple = isAppleDevice();
  return {
    isApple,
    appName: isApple ? 'Apple Maps' : 'Google Maps',
    url: isApple ? RESTAURANT_INFO.location.appleMapsUrl : RESTAURANT_INFO.location.googleMapsUrl,
  };
}

/**
 * Abre dinámicamente el mapa en la aplicación nativa del dispositivo:
 * - Dispositivos Apple (iOS / macOS): Abre Apple Maps
 * - Dispositivos Android / Otros: Abre Google Maps
 */
export function openDeviceMap() {
  if (typeof window === 'undefined') return;
  const { url } = getDeviceMapInfo();
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Calcula si el restaurante se encuentra actualmente en horario de atención:
 * Miércoles a Domingo de 10:30 AM a 18:30 PM (Hora de Bolivia UTC-4).
 */
export function getRestaurantOpenStatus() {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/La_Paz',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const map = {};
    for (const { type, value } of parts) {
      map[type] = value;
    }

    const day = map.weekday; // 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
    const hour = parseInt(map.hour, 10);
    const minute = parseInt(map.minute, 10);
    const currentMinutes = hour * 60 + minute;

    // Días de atención: Miércoles a Domingo (Wed, Thu, Fri, Sat, Sun)
    const openDays = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const isDayOpen = openDays.includes(day);

    // Horario continuo: 10:30 AM (630m) a 18:30 PM (1110m)
    const openMinutes = 10 * 60 + 30;
    const closeMinutes = 18 * 60 + 30;

    const isOpen = isDayOpen && currentMinutes >= openMinutes && currentMinutes < closeMinutes;

    let detail = '';
    if (isOpen) {
      detail = 'Atendiendo hasta 18:30';
    } else if (isDayOpen && currentMinutes < openMinutes) {
      detail = 'Abre hoy a las 10:30';
    } else if (day === 'Mon' || day === 'Tue' || (day === 'Sun' && currentMinutes >= closeMinutes)) {
      detail = 'Abre miércoles a las 10:30';
    } else {
      detail = 'Abre mañana a las 10:30';
    }

    return {
      isOpen,
      statusText: isOpen ? 'Abierto Ahora' : 'Cerrado Ahora',
      detailText: detail,
    };
  } catch (err) {
    return {
      isOpen: false,
      statusText: 'Cerrado Ahora',
      detailText: 'Mié a Dom 10:30 - 18:30',
    };
  }
}

