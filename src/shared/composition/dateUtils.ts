const ITALIAN_MONTHS = [
  'GENNAIO', 'FEBBRAIO', 'MARZO', 'APRILE', 'MAGGIO', 'GIUGNO',
  'LUGLIO', 'AGOSTO', 'SETTEMBRE', 'OTTOBRE', 'NOVEMBRE', 'DICEMBRE'
];

/** Validate calendar dates without JavaScript's rollover or timezone conversion. */
export function isValidEventDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}

export function formatDateToItalian(dateString: string): { day: string; month: string } {
  if (!dateString) return { day: '01', month: 'GENNAIO' };
  
  const [year, monthStr, dayStr] = dateString.split('-');
  const monthIndex = parseInt(monthStr, 10) - 1;
  const day = dayStr ? dayStr.padStart(2, '0') : '01';
  const month = ITALIAN_MONTHS[monthIndex] || 'GENNAIO';

  return { day, month };
}

export function getCurrentDateForInput(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
