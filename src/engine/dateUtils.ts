const ITALIAN_MONTHS = [
  'GENNAIO', 'FEBBRAIO', 'MARZO', 'APRILE', 'MAGGIO', 'GIUGNO',
  'LUGLIO', 'AGOSTO', 'SETTEMBRE', 'OTTOBRE', 'NOVEMBRE', 'DICEMBRE'
];

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
