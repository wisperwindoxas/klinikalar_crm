/**
 * O'zbekiston telefon raqamini formatlash utility
 * Format: +998 (90) 123-45-67
 */
export function formatUzbekPhone(value: string): string {
  if (!value) return '';

  // Faqat raqamlarni ajratib olish
  let digits = value.replace(/\D/g, '');

  // Agar 998 bilan boshlangan bo'lsa, uni olib tashlaymiz
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }

  // Maksimal 9 ta raqam (operator kodi 2 ta + raqam 7 ta)
  digits = digits.slice(0, 9);

  if (digits.length === 0) {
    return value.startsWith('+') ? '+998 ' : '';
  }

  let formatted = '+998 (' + digits.slice(0, 2);

  if (digits.length > 2) {
    formatted += ') ' + digits.slice(2, 5);
  }
  if (digits.length > 5) {
    formatted += '-' + digits.slice(5, 7);
  }
  if (digits.length > 7) {
    formatted += '-' + digits.slice(7, 9);
  }

  return formatted;
}

/**
 * Telefon raqamini tozalash (faqat raqamlar yoki standart +998XXXXXXXXX)
 */
export function cleanUzbekPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    return '+' + digits.slice(0, 12);
  }
  return '+998' + digits.slice(0, 9);
}
