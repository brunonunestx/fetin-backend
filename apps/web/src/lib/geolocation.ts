type CurrentCoordinates = {
  latitude: number;
  longitude: number;
};

type GeolocationErrorCode =
  'permission-denied' | 'position-unavailable' | 'timeout' | 'unsupported';

type GeolocationReader = Pick<Geolocation, 'getCurrentPosition'>;

class GeolocationRequestError extends Error {
  readonly code: GeolocationErrorCode;

  constructor(code: GeolocationErrorCode) {
    super(code);
    this.name = 'GeolocationRequestError';
    this.code = code;
  }
}

const positionOptions: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 5 * 60 * 1_000,
  timeout: 10_000,
};

function normalizeCoordinate(value: number): number {
  return Number(value.toFixed(5));
}

function mapGeolocationError(error: GeolocationPositionError): GeolocationRequestError {
  if (error.code === 1) {
    return new GeolocationRequestError('permission-denied');
  }

  if (error.code === 2) {
    return new GeolocationRequestError('position-unavailable');
  }

  return new GeolocationRequestError('timeout');
}

function requestCurrentCoordinates(
  geolocation: GeolocationReader | null | undefined = typeof navigator === 'undefined'
    ? undefined
    : navigator.geolocation,
): Promise<CurrentCoordinates> {
  if (!geolocation) {
    return Promise.reject(new GeolocationRequestError('unsupported'));
  }

  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      ({ coords }) => {
        resolve({
          latitude: normalizeCoordinate(coords.latitude),
          longitude: normalizeCoordinate(coords.longitude),
        });
      },
      (error) => reject(mapGeolocationError(error)),
      positionOptions,
    );
  });
}

function getGeolocationErrorMessage(error: unknown): string {
  if (!(error instanceof GeolocationRequestError)) {
    return 'Não conseguimos acessar sua localização agora. Tente novamente.';
  }

  const messages: Record<GeolocationErrorCode, string> = {
    'permission-denied':
      'A localização não foi permitida. Você pode liberar o acesso nas configurações do navegador.',
    'position-unavailable':
      'Não conseguimos encontrar sua localização. Verifique se a localização do aparelho está ligada.',
    timeout: 'A localização demorou demais. Vá para um lugar aberto e tente novamente.',
    unsupported: 'Este navegador não oferece acesso à localização.',
  };

  return messages[error.code];
}

export { GeolocationRequestError, getGeolocationErrorMessage, requestCurrentCoordinates };
export type { CurrentCoordinates, GeolocationErrorCode, GeolocationReader };
