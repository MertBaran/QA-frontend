// Password güvenliği için utility fonksiyonları

// Güvenli şifreleme - Unicode karakterleri destekler
const encryptPassword = (password: string): string => {
  try {
    // Unicode karakterleri güvenli şekilde encode et
    const encoded = encodeURIComponent(password);
    return btoa(encoded);
  } catch (error) {
    console.error('Password encryption error:', error);
    return '';
  }
};

const decryptPassword = (encrypted: string): string => {
  try {
    // Unicode karakterleri güvenli şekilde decode et
    const decoded = atob(encrypted);
    return decodeURIComponent(decoded);
  } catch (error) {
    console.error('Password decryption error:', error);
    return '';
  }
};

// Password değerini maskeleme
export const maskPassword = (password: string): string => {
  return '•'.repeat(password.length);
};

// Güvenli password state yönetimi
export class SecurePasswordState {
  private encryptedValue: string = '';
  private isVisible: boolean = false;
  private passwordLength: number = 0;

  setPassword(password: string) {
    try {
      this.encryptedValue = encryptPassword(password);
      this.passwordLength = password.length;
    } catch (error) {
      console.error('Error setting password:', error);
      // Fallback: sadece uzunluğu sakla
      this.passwordLength = password.length;
      this.encryptedValue = '';
    }
  }

  getPassword(): string {
    if (!this.encryptedValue) return '';
    try {
      return decryptPassword(this.encryptedValue);
    } catch (error) {
      console.error('Error getting password:', error);
      return '';
    }
  }

  getDisplayValue(): string {
    if (this.isVisible) {
      return this.getPassword();
    }
    return maskPassword(this.getPassword());
  }

  setVisible(visible: boolean) {
    this.isVisible = visible;
  }

  isPasswordVisible(): boolean {
    return this.isVisible;
  }

  hasPassword(): boolean {
    return this.passwordLength > 0;
  }

  clear() {
    this.encryptedValue = '';
    this.isVisible = false;
    this.passwordLength = 0;
  }
}

// Global password state instance
export const securePasswordState = new SecurePasswordState();
