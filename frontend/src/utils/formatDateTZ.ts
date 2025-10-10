// Helper de formato de fechas con zona horaria del usuario (F6)
// Uso: formatDateTZ(utcIsoString, userTimezone, options)

export type DateTimeFormatPreset = 'short' | 'medium' | 'long' | 'time' | 'date';

export interface FormatDateTZOptions {
    preset?: DateTimeFormatPreset;
    locale?: string;
}

const PRESET_TO_OPTIONS: Record<DateTimeFormatPreset, Intl.DateTimeFormatOptions> = {
    short: { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' },
    medium: { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' },
    long: { year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
    date: { year: 'numeric', month: '2-digit', day: '2-digit' }
};

export function formatDateTZ(
    utcDateOrString: string | Date,
    userTimezone: string,
    options: FormatDateTZOptions = { preset: 'short' }
): string {
    if (!utcDateOrString) return '';
    const date = typeof utcDateOrString === 'string' ? new Date(utcDateOrString) : utcDateOrString;
    if (Number.isNaN(date.getTime())) return '';

    const { preset = 'short', locale } = options;
    const fmtOptions: Intl.DateTimeFormatOptions = {
        timeZone: userTimezone || 'UTC',
        ...(PRESET_TO_OPTIONS[preset] ?? PRESET_TO_OPTIONS.short)
    };

    try {
        return new Intl.DateTimeFormat(locale || 'es-ES', fmtOptions).format(date);
    } catch {
        // Fallback a ISO en caso de TZ inválida
        return date.toISOString();
    }
}

export function formatRangeTZ(
    startUtc: string | Date,
    endUtc: string | Date,
    userTimezone: string,
    locale = 'es-ES'
): string {
    const start = typeof startUtc === 'string' ? new Date(startUtc) : startUtc;
    const end = typeof endUtc === 'string' ? new Date(endUtc) : endUtc;
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';

    try {
        // Algunos navegadores soportan formatRange
        const formatter = new Intl.DateTimeFormat(locale, { timeZone: userTimezone, year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        // @ts-expect-error: formatRange no está tipado en TS estándar
        if (typeof formatter.formatRange === 'function') {
            // @ts-ignore
            return formatter.formatRange(start, end);
        }
    } catch { /* noop */ }
    return `${formatDateTZ(start, userTimezone, { preset: 'short', locale })} – ${formatDateTZ(end, userTimezone, { preset: 'short', locale })}`;
}

export default formatDateTZ;


