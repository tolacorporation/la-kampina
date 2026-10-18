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
      lat: -17.3868948,
      lng: -66.1975043,
    },
    // Iframe oficial de Google Maps
    embedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1903.7641157348842!2d-66.1978188!3d-17.3867512!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x93e3753d5a229d0d%3A0x34638884d69ed59!2sLa%20Kampi%C3%B1a!5e0!3m2!1ses!2sbo!4v1791904589718!5m2!1ses!2sbo',
    // Enlace directo universal a Google Maps (abre app nativa en Android y web en escritorio)
    googleMapsUrl:
      'https://maps.app.goo.gl/MFppzZKKQJBMrJku5',
    // Enlace directo verificado a Apple Maps (abre ficha oficial del local en iPhone, iPad y Mac)
    appleMapsUrl:
      'https://maps.apple/p/97YkcGn7PveVRw',
  },
  
  schedule: {
    days: 'Miércoles a Domingo & Feriados',
    hours: '12:00 PM - 18:00 PM (Horario continuo)',
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
 * Parsea el rango de horarios configurado en store_settings o por defecto (12:00 a 18:00).
 */
export function parseScheduleHours(hoursString) {
  // Horario oficial: 12:00 PM (720 min) a 18:00 PM (1080 min)
  let openHour = 12;
  let openMin = 0;
  let closeHour = 18;
  let closeMin = 0;

  if (typeof hoursString === 'string') {
    const times = hoursString.match(/\b(\d{1,2}):(\d{2})\b/g);
    if (times && times.length >= 2) {
      const [startH, startM] = times[0].split(':').map(Number);
      const [endH, endM] = times[1].split(':').map(Number);

      openHour = startH;
      openMin = startM;
      closeHour = endH < 10 ? endH + 12 : endH;
      closeMin = endM;
    }
  }

  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  const openLabel = `${String(openHour).padStart(2, '0')}:${String(openMin).padStart(2, '0')}`;
  const closeLabel = `${String(closeHour).padStart(2, '0')}:${String(closeMin).padStart(2, '0')}`;

  return { openMinutes, closeMinutes, openLabel, closeLabel };
}

/**
 * Calcula si el restaurante se encuentra actualmente en horario de atención.
 * Admite configuración dinámica de store_settings desde el portal de control.
 */
export function getRestaurantOpenStatus(storeSettings = null) {
  try {
    // 1. Control de Cierre Temporal Maestro desde el Portal de Control
    if (storeSettings?.is_closed_override === 'true') {
      return {
        isOpen: false,
        statusText: 'Local Cerrado',
        detailText: storeSettings.closed_message || 'Cerrado temporalmente',
      };
    }

    // 2. Horario dinámico desde store_settings o canónico (12:00 a 18:00)
    const { openMinutes, closeMinutes, openLabel, closeLabel } = parseScheduleHours(
      storeSettings?.schedule_hours || RESTAURANT_INFO.schedule.hours
    );

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

    const isOpen = isDayOpen && currentMinutes >= openMinutes && currentMinutes < closeMinutes;

    let detail = '';
    if (isOpen) {
      detail = `Atendiendo hasta ${closeLabel}`;
    } else if (isDayOpen && currentMinutes < openMinutes) {
      detail = `Abre hoy a las ${openLabel}`;
    } else if (day === 'Mon' || day === 'Tue' || (day === 'Sun' && currentMinutes >= closeMinutes)) {
      detail = `Abre miércoles a las ${openLabel}`;
    } else {
      detail = `Abre mañana a las ${openLabel}`;
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
      detailText: 'Mié a Dom 12:00 - 18:00',
    };
  }
}

/**
 * Detecta si hoy es jueves en la zona horaria de Bolivia (America/La_Paz).
 * Usado para mostrar el banner festivo del Ají de Fideo.
 */
export function isThursday() {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/La_Paz',
      weekday: 'short',
    });
    return formatter.format(new Date()) === 'Thu';
  } catch {
    return new Date().getDay() === 4;
  }
}
