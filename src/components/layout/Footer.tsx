import { Box, Container, Typography, Link, Grid, Divider, useTheme } from '@mui/material';
import { GitHub, LinkedIn, Email } from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';
import papyrusVertical1 from '../../asset/textures/papyrus_vertical_1.png';

const Footer = () => {
  const theme = useTheme();
  const { name: themeName } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(10px)',
        color: theme.palette.text.primary,
        position: 'relative',
        overflow: 'hidden',
        ...(isPapirus ? {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${papyrusVertical1})`,
            backgroundSize: '115%',
            backgroundPosition: 'center 15%',
            backgroundRepeat: 'no-repeat',
            opacity: theme.palette.mode === 'dark' ? 0.15 : 0.18,
            pointerEvents: 'none',
            zIndex: 0,
          },
          '& > *': {
            position: 'relative',
            zIndex: 1,
          },
        } : {}),
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
              }}
            >
              QA Platform
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.primary,
                lineHeight: 1.6,
              }}
            >
              A modern question and answer platform built with React and
              Node.js. Connect with experts, share knowledge, and find
              solutions.
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
              }}
            >
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link 
                href="/questions" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  textDecoration: 'none',
                  '&:hover': {
                    color: theme.palette.primary.main,
                    textDecoration: 'underline',
                  }
                }}
              >
                Browse Questions
              </Link>
              <Link 
                href="/ask" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  textDecoration: 'none',
                  '&:hover': {
                    color: theme.palette.primary.main,
                    textDecoration: 'underline',
                  }
                }}
              >
                Ask a Question
              </Link>
              <Link 
                href="/about" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  textDecoration: 'none',
                  '&:hover': {
                    color: theme.palette.primary.main,
                    textDecoration: 'underline',
                  }
                }}
              >
                About Us
              </Link>
              <Link 
                href="/contact" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  textDecoration: 'none',
                  '&:hover': {
                    color: theme.palette.primary.main,
                    textDecoration: 'underline',
                  }
                }}
              >
                Contact
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
              }}
            >
              Connect With Us
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Link 
                href="https://github.com" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main,
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <GitHub />
              </Link>
              <Link 
                href="https://linkedin.com" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main,
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <LinkedIn />
              </Link>
              <Link 
                href="mailto:contact@qaplatform.com" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main,
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <Email />
              </Link>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ 
          my: 3, 
          borderColor: theme.palette.divider,
        }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary,
            }}
          >
            © {new Date().getFullYear()} QA Platform. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: { xs: 1, sm: 0 } }}>
            <Link
              href="/privacy"
              variant="body2"
              sx={{ 
                color: theme.palette.text.secondary,
                textDecoration: 'none',
                '&:hover': {
                  color: theme.palette.primary.main,
                  textDecoration: 'underline',
                }
              }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              variant="body2"
              sx={{ 
                color: theme.palette.text.secondary,
                textDecoration: 'none',
                '&:hover': {
                  color: theme.palette.primary.main,
                  textDecoration: 'underline',
                }
              }}
            >
              Terms of Service
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
