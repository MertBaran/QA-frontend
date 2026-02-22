import config from '../config/config';

const HEALTH_URL = `${config.API_ORIGIN}/health/quick`;

export interface HealthResponse {
  status: 'healthy' | 'starting' | 'unhealthy';
  message?: string;
}

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(HEALTH_URL, {
      method: 'GET',
      signal: controller.signal,
      credentials: 'omit',
    });
    clearTimeout(timeoutId);
    if (!response.ok) return false;
    const data = (await response.json()) as HealthResponse;
    return data.status === 'healthy';
  } catch {
    return false;
  }
};
