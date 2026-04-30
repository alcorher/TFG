/**
 * Utilidades compartidas – versión React Native.
 * Adaptado de lebrijaleo/src/lib/utils.js
 */

export function formatDateES(
  dateValue: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },
): string {
  if (!dateValue) return '';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return date.toLocaleDateString('es-ES', options);
}

export function formatDateLong(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function getFriendlyErrorMessage(
  errorData: unknown,
  fallback = 'Ha ocurrido un error.',
): string {
  if (!errorData) return fallback;

  if (typeof errorData === 'string') return errorData;

  const data = errorData as Record<string, unknown>;

  if (Array.isArray(data.detail)) {
    return (
      data.detail
        .map((item: Record<string, string>) => item?.msg || item?.message || item)
        .filter(Boolean)
        .join(' ') || fallback
    );
  }

  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.message === 'string') return data.message;

  return fallback;
}
