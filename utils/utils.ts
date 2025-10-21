// utils/time.ts
export const formatRelativeTime = (dateString: string | Date): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffSeconds < 60) return `${diffSeconds} soniya oldin`;
  if (diffMinutes < 60) return `${diffMinutes} daqiqa oldin`;
  if (diffHours < 24) return `${diffHours} soat oldin`;
  if (diffDays < 30) return `${diffDays} kun oldin`;
  if (diffMonths < 12) return `${diffMonths} oy oldin`;
  return `${diffYears} yil oldin`;
};