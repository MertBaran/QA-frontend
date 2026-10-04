const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const LOCALES: Record<string, string> = {
  tr: 'tr-TR',
  en: 'en-GB',
  de: 'de-DE',
};

const PHRASES: Record<string, Record<string, string>> = {
  time_just_now: { tr: 'az önce', en: 'just now', de: 'gerade eben' },
  time_minute_ago: { tr: '{n} dakika önce', en: '{n} minute ago', de: 'vor {n} Minute' },
  time_minutes_ago: { tr: '{n} dakika önce', en: '{n} minutes ago', de: 'vor {n} Minuten' },
  time_hour_ago: { tr: '{n} saat önce', en: '{n} hour ago', de: 'vor {n} Stunde' },
  time_hours_ago: { tr: '{n} saat önce', en: '{n} hours ago', de: 'vor {n} Stunden' },
  time_day_ago: { tr: '{n} gün önce', en: '{n} day ago', de: 'vor {n} Tag' },
  time_days_ago: { tr: '{n} gün önce', en: '{n} days ago', de: 'vor {n} Tagen' },
  time_about_month_ago: { tr: 'yaklaşık {n} ay önce', en: 'about {n} month ago', de: 'vor etwa {n} Monat' },
  time_about_months_ago: { tr: 'yaklaşık {n} ay önce', en: 'about {n} months ago', de: 'vor etwa {n} Monaten' },
  time_about_year_ago: { tr: 'yaklaşık 1 yıl önce', en: 'about 1 year ago', de: 'vor etwa 1 Jahr' },
  time_older_than_years: { tr: '{n} yıldan daha eski', en: 'older than {n} years', de: 'älter als {n} Jahre' },
};

function phrase(key: string, language: string, count?: number): string {
  const text = PHRASES[key]?.[language] ?? PHRASES[key]?.tr ?? key;
  return count === undefined ? text : text.replace('{n}', String(count));
}

function completedYears(from: Date, to: Date): number {
  let years = to.getFullYear() - from.getFullYear();
  const anniversary = new Date(from);
  anniversary.setFullYear(from.getFullYear() + years);
  if (to.getTime() < anniversary.getTime()) years -= 1;
  return Math.max(0, years);
}

function olderThanYears(years: number): number {
  if (years >= 50) return 50;
  if (years >= 30) return 30;
  if (years >= 20) return 20;
  if (years >= 10) return 10;
  if (years >= 5) return 5;
  return 2;
}

export function formatContentAge(
  value: string | Date,
  language = 'tr',
  now: Date = new Date()
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diff = Math.max(0, now.getTime() - date.getTime());
  const minutes = Math.floor(diff / MINUTE);
  const hours = Math.floor(diff / HOUR);
  const days = Math.floor(diff / DAY);

  if (minutes < 1) return phrase('time_just_now', language);
  if (minutes < 60) {
    return phrase(minutes === 1 ? 'time_minute_ago' : 'time_minutes_ago', language, minutes);
  }
  if (hours < 24) {
    return phrase(hours === 1 ? 'time_hour_ago' : 'time_hours_ago', language, hours);
  }
  if (days <= 30) {
    return phrase(days === 1 ? 'time_day_ago' : 'time_days_ago', language, days);
  }

  const years = completedYears(date, now);
  if (years < 1) {
    const months = Math.min(11, Math.max(1, Math.round(days / 30)));
    return phrase(months === 1 ? 'time_about_month_ago' : 'time_about_months_ago', language, months);
  }
  if (years < 2) return phrase('time_about_year_ago', language);
  return phrase('time_older_than_years', language, olderThanYears(years));
}

export function formatExactDateTime(value: string | Date, language = 'tr'): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(LOCALES[language] ?? 'tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
