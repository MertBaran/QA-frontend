export interface ThemeState {
  mode: 'light' | 'dark';
  language: 'tr' | 'en';
  fontSize: 'small' | 'medium' | 'large';
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
  };
  preferences: {
    autoSave: boolean;
    showTutorial: boolean;
    compactMode: boolean;
  };
}
