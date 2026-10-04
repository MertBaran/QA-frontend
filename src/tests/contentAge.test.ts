import { formatContentAge, formatExactDateTime } from '../utils/contentAge';

const now = new Date('2026-10-04T12:00:00.000Z');

function daysBefore(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('formatContentAge', () => {
  it('dakika, saat ve 30 güne kadar gün yazar', () => {
    expect(formatContentAge(new Date(now.getTime() - 30 * 1000).toISOString(), 'tr', now)).toBe('az önce');
    expect(formatContentAge(new Date(now.getTime() - 5 * 60 * 1000).toISOString(), 'tr', now)).toBe('5 dakika önce');
    expect(formatContentAge(new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), 'tr', now)).toBe('3 saat önce');
    expect(formatContentAge(daysBefore(1), 'tr', now)).toBe('1 gün önce');
    expect(formatContentAge(daysBefore(30), 'tr', now)).toBe('30 gün önce');
  });

  it('30 günden sonra yaklaşık ay, 1 yıldan sonra yaklaşık yıl yazar', () => {
    expect(formatContentAge(daysBefore(31), 'tr', now)).toBe('yaklaşık 1 ay önce');
    expect(formatContentAge(daysBefore(90), 'tr', now)).toBe('yaklaşık 3 ay önce');
    expect(formatContentAge('2025-10-04T12:00:00.000Z', 'tr', now)).toBe('yaklaşık 1 yıl önce');
    expect(formatContentAge('2024-10-05T12:00:00.000Z', 'tr', now)).toBe('yaklaşık 1 yıl önce');
  });

  it('2, 5, 10, 20, 30 ve 50 yıl kovalarına düşer', () => {
    expect(formatContentAge('2024-10-04T12:00:00.000Z', 'tr', now)).toBe('2 yıldan daha eski');
    expect(formatContentAge('2021-10-05T12:00:00.000Z', 'tr', now)).toBe('2 yıldan daha eski');
    expect(formatContentAge('2021-10-04T12:00:00.000Z', 'tr', now)).toBe('5 yıldan daha eski');
    expect(formatContentAge('2016-10-04T12:00:00.000Z', 'tr', now)).toBe('10 yıldan daha eski');
    expect(formatContentAge('2006-10-04T12:00:00.000Z', 'tr', now)).toBe('20 yıldan daha eski');
    expect(formatContentAge('1996-10-04T12:00:00.000Z', 'tr', now)).toBe('30 yıldan daha eski');
    expect(formatContentAge('1976-10-04T12:00:00.000Z', 'tr', now)).toBe('50 yıldan daha eski');
  });

  it('İngilizce ve Almanca etiket üretir', () => {
    expect(formatContentAge(daysBefore(2), 'en', now)).toBe('2 days ago');
    expect(formatContentAge('2024-10-04T12:00:00.000Z', 'de', now)).toBe('älter als 2 Jahre');
  });

  it('tam tarih ve saati dile göre yazar', () => {
    const exact = formatExactDateTime('2026-10-04T09:05:00.000Z', 'tr');
    expect(exact).toContain('2026');
    expect(exact).toMatch(/\d{2}:\d{2}/);
  });
});
