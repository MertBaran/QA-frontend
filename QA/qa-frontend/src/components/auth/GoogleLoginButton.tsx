import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Google } from '@mui/icons-material';
import { GoogleLogin } from '@react-oauth/google';
import { useAppSelector } from '../../store/hooks';
import { t } from '../../utils/translations';

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError: () => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
  const { currentLanguage } = useAppSelector(state => state.language);

  return (
    <Box sx={{ width: '100%', my: 2 }}>
      <GoogleLogin
        onSuccess={async credentialResponse => {
          if (credentialResponse.credential) {
            await onSuccess(credentialResponse.credential);
          }
        }}
        onError={onError}
        width="100%"
        text="signin_with"
        locale={currentLanguage}
        theme="filled_blue"
        size="large"
        shape="rectangular"
        useOneTap={false}
      />
    </Box>
  );
};

export default GoogleLoginButton; 