import { Box, Container } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import MessagingWidget from '../messaging/MessagingWidget';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  /** true: Container kullanmaz, children tam genişlik (soru detay gibi panel layout için) */
  fullWidth?: boolean;
}

const Layout = ({ children, fullWidth = false }: LayoutProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        {fullWidth ? children : <Container maxWidth="lg">{children}</Container>}
      </Box>
      <Footer />
      <MessagingWidget />
    </Box>
  );
};

export default Layout;
