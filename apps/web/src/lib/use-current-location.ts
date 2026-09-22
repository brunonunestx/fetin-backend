import { useCallback, useEffect, useRef, useState } from 'react';
import { requestCurrentCoordinates, type CurrentCoordinates } from '@/lib/geolocation';

type CurrentLocationStatus = 'error' | 'idle' | 'loading' | 'success';

function useCurrentLocation() {
  const requestId = useRef(0);
  const [coordinates, setCoordinates] = useState<CurrentCoordinates>();
  const [error, setError] = useState<unknown>();
  const [status, setStatus] = useState<CurrentLocationStatus>('idle');

  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );

  const request = useCallback(async () => {
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    setError(undefined);
    setStatus('loading');

    try {
      const currentCoordinates = await requestCurrentCoordinates();

      if (requestId.current !== currentRequestId) {
        return;
      }

      setCoordinates(currentCoordinates);
      setStatus('success');
    } catch (requestError) {
      if (requestId.current !== currentRequestId) {
        return;
      }

      setCoordinates(undefined);
      setError(requestError);
      setStatus('error');
    }
  }, []);

  const clear = useCallback(() => {
    requestId.current += 1;
    setCoordinates(undefined);
    setError(undefined);
    setStatus('idle');
  }, []);

  return { clear, coordinates, error, request, status };
}

export { useCurrentLocation };
export type { CurrentLocationStatus };
