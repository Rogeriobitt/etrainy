/**
 * Helpers for workout plan validity / expiry display.
 */

export function getValidityInfo(expiresAt: string | null | undefined): {
  label: string;
  color: string;
  expired: boolean;
  daysLeft: number | null;
} | null {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt).getTime();
  const now = Date.now();
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Vencida há ${Math.abs(diffDays)} dia(s)`,
      color: "text-destructive",
      expired: true,
      daysLeft: diffDays,
    };
  }
  if (diffDays === 0) {
    return { label: "Vence hoje", color: "text-destructive", expired: false, daysLeft: 0 };
  }
  if (diffDays <= 7) {
    return {
      label: `Vence em ${diffDays} dia(s)`,
      color: "text-yellow-400",
      expired: false,
      daysLeft: diffDays,
    };
  }
  return {
    label: `Vence em ${diffDays} dia(s)`,
    color: "text-muted-foreground",
    expired: false,
    daysLeft: diffDays,
  };
}

export function computeExpiresAt(validityMonths: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + validityMonths);
  return d.toISOString();
}

export const VALIDITY_OPTIONS = [
  { value: 1, label: "1 mês" },
  { value: 2, label: "2 meses" },
  { value: 3, label: "3 meses" },
] as const;
