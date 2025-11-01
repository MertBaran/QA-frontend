// Toast notification utility
export const showToast = (
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
) => {
  // Basit toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    z-index: 9999;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Animasyon
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);

  // 3 saniye sonra kaldır
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
};

export const showSuccessToast = (message: string) => showToast(message, 'success');
export const showErrorToast = (message: string) => showToast(message, 'error');
export const showWarningToast = (message: string) => showToast(message, 'warning');
export const showInfoToast = (message: string) => showToast(message, 'info');
