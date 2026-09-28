import { useState, useEffect, useCallback } from 'react';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationState {
  coords: Coordinates | null;
  error: string | null;
  loading: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    coords: null,
    error: null,
    loading: false,
  });

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMsg = 'An unknown error occurred';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'User denied the request for Geolocation';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMsg = 'The request to get user location timed out';
            break;
        }
        setState({
          coords: null,
          error: errorMsg,
          loading: false,
        });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  return { ...state, getLocation };
}
