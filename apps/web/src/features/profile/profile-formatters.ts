const BRAZIL_COUNTRY_CODE = '55';

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function getNationalPhoneDigits(value: string): string {
  const digits = onlyDigits(value);
  const withoutCountryCode =
    digits.startsWith(BRAZIL_COUNTRY_CODE) && digits.length > 11 ? digits.slice(2) : digits;

  return withoutCountryCode.slice(0, 11);
}

function formatPhone(value: string): string {
  const digits = getNationalPhoneDigits(value);

  if (!digits) {
    return '';
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const areaCode = digits.slice(0, 2);
  const subscriber = digits.slice(2);

  if (subscriber.length <= 4) {
    return `(${areaCode}) ${subscriber}`;
  }

  const prefixLength = subscriber.length > 8 ? 5 : 4;
  const prefix = subscriber.slice(0, prefixLength);
  const suffix = subscriber.slice(prefixLength);

  return `(${areaCode}) ${prefix}${suffix ? `-${suffix}` : ''}`;
}

function normalizePhone(value: string): string {
  return `+${BRAZIL_COUNTRY_CODE}${getNationalPhoneDigits(value)}`;
}

function isValidPhone(value: string): boolean {
  return /^\+55[1-9]\d{9,10}$/.test(normalizePhone(value));
}

function getInitials(name: string | null): string {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (words.length === 0) {
    return 'TF';
  }

  const firstWord = words[0] ?? '';
  const selectedWords = words.length === 1 ? [firstWord] : [firstWord, words.at(-1) ?? firstWord];
  return selectedWords
    .map((word) => word.charAt(0))
    .join('')
    .toLocaleUpperCase('pt-BR');
}

export { formatPhone, getInitials, isValidPhone, normalizePhone };
