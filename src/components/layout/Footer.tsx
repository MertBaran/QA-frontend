import { Box, Container, Typography, Link, Grid, Divider } from '@mui/material';
import { GitHub, LinkedIn, Email } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: theme =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              QA Platform
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A modern question and answer platform built with React and
              Node.js. Connect with experts, share knowledge, and find
              solutions.
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/questions" color="inherit" underline="hover">
                Browse Questions
              </Link>
              <Link href="/ask" color="inherit" underline="hover">
                Ask a Question
              </Link>
              <Link href="/about" color="inherit" underline="hover">
                About Us
              </Link>
              <Link href="/contact" color="inherit" underline="hover">
                Contact
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Connect With Us
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Link href="https://github.com" color="inherit">
                <GitHub />
              </Link>
              <Link href="https://linkedin.com" color="inherit">
                <LinkedIn />
              </Link>
              <Link href="mailto:contact@qaplatform.com" color="inherit">
                <Email />
              </Link>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} QA Platform. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: { xs: 1, sm: 0 } }}>
            <Link
              href="/privacy"
              color="inherit"
              variant="body2"
              underline="hover"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              color="inherit"
              variant="body2"
              underline="hover"
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
