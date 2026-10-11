/** Shared client form messages (UA) — Jarvis-style required/format hints. */
export const FIELD_MSG = {
  required: "Обовʼязкове поле",
  email: "Вкажіть коректний email",
  passwordMin: "Пароль має містити щонайменше 6 символів",
  phone: "Вкажіть коректний телефон",
} as const;

export function isBlank(v: string | undefined | null): boolean {
  return !String(v ?? "").trim();
}

export function isValidEmail(v: string): boolean {
  const s = v.trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export type FieldErrors = Record<string, string>;

export function firstError(errors: FieldErrors): string | undefined {
  return Object.values(errors)[0];
}
