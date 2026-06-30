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
