/** Keeps only the digits of what was typed or pasted (contact numbers, GCash references). */
export function digitsOnly(value, maxLength) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return maxLength ? digits.slice(0, maxLength) : digits;
}

// Number inputs still let people type "-", "+", "e" and "."; block those where only whole, positive values make sense.
export function blockNonDigitKeys(e) {
  if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
}
