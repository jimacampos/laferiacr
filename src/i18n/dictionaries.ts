import type { DayOfWeek } from "@/data/types";

export const LANGUAGES = ["es", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "es";

export type Messages = Record<string, string>;

export const dictionaries: Record<Language, Messages> = {
  es: {
    "app.title": "La Feria CR",
    "app.tagline": "Ferias del agricultor en Costa Rica",
    "app.description":
      "Encontrá cuándo y dónde abren las ferias del agricultor en Costa Rica.",

    "language.toggle": "English",
    "language.label": "Cambiar idioma",

    "filters.heading": "Buscar ferias",
    "filters.day": "Día",
    "filters.region": "Región",
    "filters.search": "Buscar",
    "filters.searchPlaceholder": "Buscar por lugar…",
    "filters.allRegions": "Todas las regiones",
    "filters.clear": "Limpiar filtros",

    "day.weekend": "Este fin de semana",
    "day.all": "Cualquier día",

    "results.weekend": "Ferias de este fin de semana",
    "results.all": "Todas las ferias",
    "results.list": "Ferias",
    "results.one": "{count} feria",
    "results.many": "{count} ferias",

    "card.days": "Días",
    "card.organizer": "Organiza",
    "card.call": "Llamar a {name}",

    "detail.back": "Volver a las ferias",
    "detail.hours": "Horario",
    "detail.hoursUnknown": "Horario no confirmado todavía",
    "detail.location": "Ubicación",
    "detail.locationUnknown": "Ubicación no confirmada todavía",
    "detail.phones": "Teléfonos",
    "detail.provenance.official": "Lista oficial 2026",
    "detail.provenance.community": "Agregada por la comunidad",
    "detail.updated": "Actualizado: {date}",
    "detail.notFound.title": "Feria no encontrada",
    "detail.notFound.message":
      "No encontramos esa feria. Puede que haya cambiado o ya no exista.",

    "map.loading": "Cargando mapa…",
    "map.unavailable": "El mapa no está disponible en este momento.",
    "map.pinLabel": "Ubicación de {name}",

    "auth.signIn": "Iniciar sesión",
    "auth.signOut": "Cerrar sesión",
    "auth.loading": "Cargando…",

    "empty.title": "No hay ferias que coincidan",
    "empty.message": "Probá con otro día, región o término de búsqueda.",

    "footer.source": "Datos: {source}",
    "footer.updated": "Actualizado: {date}",
    "footer.note": "Los horarios pueden variar. Confirmá con la feria antes de visitarla.",
  },
  en: {
    "app.title": "La Feria CR",
    "app.tagline": "Costa Rica farmer's markets",
    "app.description":
      "Find when and where Costa Rica's farmer's markets are open.",

    "language.toggle": "Español",
    "language.label": "Change language",

    "filters.heading": "Find markets",
    "filters.day": "Day",
    "filters.region": "Region",
    "filters.search": "Search",
    "filters.searchPlaceholder": "Search by place…",
    "filters.allRegions": "All regions",
    "filters.clear": "Clear filters",

    "day.weekend": "This weekend",
    "day.all": "Any day",

    "results.weekend": "Markets open this weekend",
    "results.all": "All markets",
    "results.list": "Markets",
    "results.one": "{count} market",
    "results.many": "{count} markets",

    "card.days": "Days",
    "card.organizer": "Organized by",
    "card.call": "Call {name}",

    "detail.back": "Back to markets",
    "detail.hours": "Hours",
    "detail.hoursUnknown": "Hours not confirmed yet",
    "detail.location": "Location",
    "detail.locationUnknown": "Location not confirmed yet",
    "detail.phones": "Phone",
    "detail.provenance.official": "Official 2026 list",
    "detail.provenance.community": "Community-added",
    "detail.updated": "Updated: {date}",
    "detail.notFound.title": "Market not found",
    "detail.notFound.message":
      "We couldn't find that market. It may have changed or no longer exist.",

    "map.loading": "Loading map…",
    "map.unavailable": "The map isn't available right now.",
    "map.pinLabel": "{name} location",

    "auth.signIn": "Sign in",
    "auth.signOut": "Sign out",
    "auth.loading": "Loading…",

    "empty.title": "No markets match",
    "empty.message": "Try a different day, region, or search term.",

    "footer.source": "Data: {source}",
    "footer.updated": "Updated: {date}",
    "footer.note": "Hours may change. Confirm with the market before visiting.",
  },
};

interface DayLabel {
  long: string;
  short: string;
}

export const dayNames: Record<Language, Record<DayOfWeek, DayLabel>> = {
  es: {
    mon: { long: "Lunes", short: "Lun" },
    tue: { long: "Martes", short: "Mar" },
    wed: { long: "Miércoles", short: "Mié" },
    thu: { long: "Jueves", short: "Jue" },
    fri: { long: "Viernes", short: "Vie" },
    sat: { long: "Sábado", short: "Sáb" },
    sun: { long: "Domingo", short: "Dom" },
  },
  en: {
    mon: { long: "Monday", short: "Mon" },
    tue: { long: "Tuesday", short: "Tue" },
    wed: { long: "Wednesday", short: "Wed" },
    thu: { long: "Thursday", short: "Thu" },
    fri: { long: "Friday", short: "Fri" },
    sat: { long: "Saturday", short: "Sat" },
    sun: { long: "Sunday", short: "Sun" },
  },
};
