import { describe, expect, it, vi } from 'vitest';
import {
  GeolocationRequestError,
  getGeolocationErrorMessage,
  requestCurrentCoordinates,
  type GeolocationReader,
} from '@/lib/geolocation';

function createGeolocation(
  implementation: GeolocationReader['getCurrentPosition'],
): GeolocationReader {
  return { getCurrentPosition: implementation };
}

describe('geolocation', () => {
  it('returns normalized coordinates with one explicit position request', async () => {
    const getCurrentPosition = vi.fn<GeolocationReader['getCurrentPosition']>((success) => {
      success({ coords: { latitude: -22.2345678, longitude: -45.9876543 } } as GeolocationPosition);
    });

    await expect(requestCurrentCoordinates(createGeolocation(getCurrentPosition))).resolves.toEqual(
      { latitude: -22.23457, longitude: -45.98765 },
    );
    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true, timeout: 10_000 }),
    );
  });

  it.each([
    [1, 'permission-denied'],
    [2, 'position-unavailable'],
    [3, 'timeout'],
  ] as const)('normalizes browser error %s as %s', async (browserCode, expectedCode) => {
    const geolocation = createGeolocation((_success, error) => {
      error?.({ code: browserCode } as GeolocationPositionError);
    });

    await expect(requestCurrentCoordinates(geolocation)).rejects.toMatchObject({
      code: expectedCode,
    });
  });

  it('explains unsupported browsers without exposing technical details', async () => {
    const error = new GeolocationRequestError('unsupported');

    await expect(requestCurrentCoordinates(null)).rejects.toMatchObject({
      code: 'unsupported',
    });
    expect(getGeolocationErrorMessage(error)).toBe(
      'Este navegador não oferece acesso à localização.',
    );
  });
});
