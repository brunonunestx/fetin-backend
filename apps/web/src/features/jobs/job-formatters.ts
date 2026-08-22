const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  weekday: 'long',
});

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
});

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

function formatCurrency(value: string): string {
  return currencyFormatter.format(Number(value));
}

function formatJobDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function formatShortJobDate(value: string): string {
  return shortDateFormatter.format(new Date(value)).replace('.', '');
}

function formatJobTime(value: string): string {
  return timeFormatter.format(new Date(value));
}

function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
  }

  return parts.join(' e ');
}

function formatAddress({
  address,
  city,
  state,
  zipCode,
}: {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}): string {
  return `${address} — ${city}/${state} · CEP ${zipCode}`;
}

export {
  formatAddress,
  formatCurrency,
  formatDuration,
  formatJobDate,
  formatJobTime,
  formatShortJobDate,
};
