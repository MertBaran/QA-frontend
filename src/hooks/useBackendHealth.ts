import { useEffect, useRef } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setBackendUp, setBackendDown } from '../store/backendStatus/backendStatusSlice';
import { checkBackendHealth } from '../services/backendHealthService';
import config from '../config/config';

export function useBackendHealth(): void {
  const dispatch = useAppDispatch();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = async () => {
      const isUp = await checkBackendHealth();
      dispatch(isUp ? setBackendUp() : setBackendDown());
    };

    void check();

    intervalRef.current = setInterval(check, config.BACKEND_HEALTH_CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [dispatch]);
}
