import React from 'react';
import { Box } from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import { useAppSelector } from '../../store/hooks';

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError: () => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
  const { currentLanguage } = useAppSelector(state => state.language);

  return (
    <Box sx={{ width: '100%', my: 2 }}>
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            void onSuccess(credentialResponse.credential);
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