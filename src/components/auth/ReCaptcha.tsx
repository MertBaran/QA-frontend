import React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Box, Typography } from '@mui/material';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';

interface ReCaptchaProps {
  onVerify: (token: string | null) => void;
  error?: boolean;
  disabled?: boolean;
}

const ReCaptchaComponent: React.FC<ReCaptchaProps> = ({ 
  onVerify, 
  error = false, 
  disabled = false 
}) => {
  const { currentLanguage } = useAppSelector(state => state.language);
  
  // Test için site key (production'da gerçek key kullanılacak)
  const siteKey = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Google'ın test key'i
  
  // Test ortamında reCAPTCHA'yı devre dışı bırak
  const isTestEnvironment = process.env.REACT_APP_DISABLE_RECAPTCHA === 'true' || 
                           process.env.NODE_ENV === 'test';
  
  // Test ortamında otomatik olarak token ver
  React.useEffect(() => {
    if (isTestEnvironment) {
      onVerify('test-environment-token');
    }
  }, [isTestEnvironment, onVerify]);
  
  // Test ortamında reCAPTCHA'yı gösterme
  if (isTestEnvironment) {
    return (
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ fontStyle: 'italic' }}
        >
          Test Environment - reCAPTCHA disabled
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ mb: 1 }}
      >
        {t('captcha_title', currentLanguage)}
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        border: error ? '1px solid #d32f2f' : 'none',
        borderRadius: 1,
        p: 1,
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto'
      }}>
        <ReCAPTCHA
          sitekey={siteKey}
          onChange={onVerify}
          theme="light"
          size="normal"
        />
      </Box>
      
      {error && (
        <Typography 
          variant="caption" 
          color="error" 
          sx={{ mt: 1, display: 'block' }}
        >
          {t('captcha_verify_error', currentLanguage)}
        </Typography>
      )}
    </Box>
  );
};

export default ReCaptchaComponent; 