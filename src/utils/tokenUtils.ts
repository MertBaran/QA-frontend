// JWT token parser (frontend için basit implementasyon)
const parseJwt = (token: string): any => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    return null;
  }
};

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Token'ın geçerli olup olmadığını kontrol eder
 */
export const isTokenValid = (token: string): boolean => {
  try {
    const decoded = parseJwt(token) as TokenPayload;
    if (!decoded || !decoded.exp) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

/**
 * Token'ın ne kadar süre sonra expire olacağını hesaplar (dakika)
 */
export const getTokenExpirationMinutes = (token: string): number => {
  try {
    const decoded = parseJwt(token) as TokenPayload;
    if (!decoded || !decoded.exp) return 0;

    const currentTime = Math.floor(Date.now() / 1000);
    const remainingSeconds = decoded.exp - currentTime;
    return Math.floor(remainingSeconds / 60);
  } catch (error) {
    return 0;
  }
};

/**
 * Token'ın 5 dakika içinde expire olup olmayacağını kontrol eder
 */
export const isTokenExpiringSoon = (token: string): boolean => {
  const expirationMinutes = getTokenExpirationMinutes(token);
  return expirationMinutes <= 5;
};

/**
 * Token'ı localStorage'dan alır
 */
export const getStoredToken = (): string | null => {
  return localStorage.getItem('access_token');
};

/**
 * Token'ı localStorage'a kaydeder
 */
export const setStoredToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

/**
 * Token'ı localStorage'dan siler
 */
export const removeStoredToken = (): void => {
  localStorage.removeItem('access_token');
};

/**
 * Kullanıcıyı logout yapar ve login sayfasına yönlendirir
 */
export const logout = (): void => {
  removeStoredToken();
  localStorage.removeItem('user');
  localStorage.removeItem('token'); // Eski token'ı da temizle
  sessionStorage.clear();

  // Login sayfasına yönlendir
  window.location.href = '/login';
};

/**
 * Token'ın geçerli olup olmadığını kontrol eder (logout yapmaz)
 */
export const isTokenValidAndNotExpired = (): boolean => {
  const token = getStoredToken();

  if (!token) {
    return false;
  }

  return isTokenValid(token);
};

/**
 * Token'ı kontrol eder ve sadece gerçekten expire olduğunda logout yapar
 */
export const checkTokenAndLogout = (): boolean => {
  const token = getStoredToken();

  if (!token) {
    logout();
    return false;
  }

  if (!isTokenValid(token)) {
    logout();
    return false;
  }

  return true;
};
