import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff, Lock } from '@mui/icons-material';
import { SecurePasswordState } from '../../utils/passwordSecurity';

interface SecurePasswordFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: boolean;
  helperText?: string;
  showPassword: boolean;
  onTogglePassword: () => void;
  disabled?: boolean;
}

const SecurePasswordField: React.FC<SecurePasswordFieldProps> = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  showPassword,
  onTogglePassword,
  disabled = false,
}) => {
  const [secureState] = useState(() => new SecurePasswordState());
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const updateDisplayValue = useCallback(() => {
    setDisplayValue(secureState.getDisplayValue());
  }, [secureState]);

  // Password değerini güvenli şekilde sakla
  useEffect(() => {
    secureState.setPassword(value);
    updateDisplayValue();
  }, [value, secureState, updateDisplayValue]);

  // Görünürlük değiştiğinde display value'yu güncelle
  useEffect(() => {
    secureState.setVisible(showPassword);
    updateDisplayValue();
  }, [showPassword, secureState, updateDisplayValue]);

  // Custom onChange handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Eğer maskeleme değeri geliyorsa, gerçek değeri hesapla
    let realValue = newValue;
    if (newValue.includes('•')) {
      // Maskeleme değerini gerçek değere çevir
      const currentPassword = secureState.getPassword();
      const currentLength = currentPassword.length;
      const newLength = newValue.length;
      
      if (newLength > currentLength) {
        // Yeni karakter eklendi - son karakteri al
        const lastChar = newValue.charAt(newLength - 1);
        if (lastChar !== '•') {
          realValue = currentPassword + lastChar;
        } else {
          realValue = currentPassword;
        }
      } else if (newLength < currentLength) {
        // Karakter silindi
        realValue = currentPassword.slice(0, newLength);
      } else {
        // Aynı uzunluk
        realValue = currentPassword;
      }
    }
    
    // Gerçek password değerini güvenli state'e kaydet
    secureState.setPassword(realValue);
    updateDisplayValue();
    
    // Event'i gerçek değerle güncelle
    const updatedEvent = {
      ...e,
      target: {
        ...e.target,
        value: realValue, // Gerçek değeri gönder
        name: e.target.name,
      }
    };
    
    // Orijinal onChange'i çağır
    onChange(updatedEvent as React.ChangeEvent<HTMLInputElement>);
  };

  // Input'a focus olduğunda gerçek değeri göster
  const handleFocus = () => {
    if (inputRef.current && !showPassword) {
      inputRef.current.type = 'text';
      inputRef.current.value = secureState.getPassword();
    }
  };

  // Input'tan focus çıktığında maskele
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (inputRef.current && !showPassword) {
      inputRef.current.type = 'password';
      inputRef.current.value = displayValue;
    }
    onBlur(e);
  };

  return (
    <TextField
      margin="normal"
      required
      fullWidth
      name={name}
      label={label}
      type={showPassword ? 'text' : 'password'}
      id={name}
      autoComplete="current-password"
      value={showPassword ? secureState.getPassword() : displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      error={error}
      helperText={helperText}
      disabled={disabled}
      inputRef={inputRef}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Lock />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={onTogglePassword}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      InputLabelProps={{
        shrink: true,
      }}
      inputProps={{
        'data-secure': showPassword ? 'false' : 'true',
        'data-no-inspect': showPassword ? 'false' : 'true',
        'data-protected': showPassword ? 'false' : 'true',
        'data-mask': showPassword ? 'false' : 'true',
        'data-encrypted': showPassword ? 'false' : 'true',
        readOnly: false,
      }}
      sx={{
        '& input[type="password"]': {
          WebkitTextSecurity: ('disc' as any),
          textSecurity: ('disc' as any),
        },
        '& input[data-secure="true"]': {
          WebkitTextSecurity: showPassword ? 'none' : ('disc' as any),
          textSecurity: showPassword ? 'none' : ('disc' as any),
        },
        '& input': {
          caretColor: showPassword ? 'auto' : 'transparent',
        },
      }}
    />
  );
};

export default SecurePasswordField; 