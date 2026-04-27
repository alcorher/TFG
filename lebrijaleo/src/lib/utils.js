import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getFriendlyErrorMessage(errorData, fallback = "Ha ocurrido un error.") {
  if (!errorData) return fallback;

  if (typeof errorData === "string") {
    return errorData;
  }

  if (Array.isArray(errorData.detail)) {
    return errorData.detail
      .map((item) => item?.msg || item?.message || item)
      .filter(Boolean)
      .join(" ") || fallback;
  }

  if (typeof errorData.detail === "string") {
    return errorData.detail;
  }

  if (typeof errorData.message === "string") {
    return errorData.message;
  }

  return fallback;
}
