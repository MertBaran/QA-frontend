import { Box, Container, Typography, Link, Grid, Divider } from '@mui/material';
import { GitHub, LinkedIn, Email } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        background: theme =>
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)'
            : 'linear-gradient(135deg, #0F4054 0%, #1D5367 100%)',
        borderTop: '1px solid rgba(255, 184, 0, 0.2)',
        backdropFilter: 'blur(10px)',
        color: theme =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[800]
            : 'white',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{
                background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
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
                color: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
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
                color: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.9)' : 'white',
                fontWeight: 600,
              }}
            >
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link 
                href="/questions" 
                sx={{ 
                  color: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
                  textDecoration: 'none',
                  '&:hover': {
                    color: '#FFB800',
                    textDecoration: 'underline',
                  }
                }}
              >
                Browse Questions
              </Link>
              <Link 
                href="/ask" 
                sx={{ 
                  color: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
                  textDecoration: 'none',
                  '&:hover': {
                    color: '#FFB800',
                    textDecoration: 'underline',
                  }
                }}
              >
                Ask a Question
              </Link>
              <Link 
                href="/about" 
                sx={{ 
                  color: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
                  textDecoration: 'none',
                  '&:hover': {
                    color: '#FFB800',
                    textDecoration: 'underline',
                  }
                }}
              >
                About Us
              </Link>
              <Link 
                href="/contact" 
                sx={{ 
                  color: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
                  textDecoration: 'none',
                  '&:hover': {
                    color: '#FFB800',
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
                color: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.9)' : 'white',
                fontWeight: 600,
              }}
            >
              Connect With Us
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Link 
                href="https://github.com" 
                sx={{ 
                  color: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    color: '#FFB800',
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
                  color: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    color: '#FFB800',
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
                  color: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    color: '#FFB800',
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
          borderColor: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,184,0,0.3)',
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
              color: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)',
            }}
          >
            © {new Date().getFullYear()} QA Platform. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: { xs: 1, sm: 0 } }}>
            <Link
              href="/privacy"
              variant="body2"
              sx={{ 
                color: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                '&:hover': {
                  color: '#FFB800',
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
                color: theme => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                '&:hover': {
                  color: '#FFB800',
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
