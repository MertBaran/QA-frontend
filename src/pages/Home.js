import { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, Card, Grid } from '@mui/material';
import { QuestionAnswer, TrendingUp, People } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { HomePageSkeleton } from '../components/ui/Skeleton';
import logger from '../utils/logger';

const Home = () => {
  const [loading, setLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      logger.user.action('home_page_loaded');
      logger.performance.measure('home_page_load', 1500, { component: 'Home' });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <HomePageSkeleton />
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', py: 6, mb: 6 }}>
          <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
            QA Platformuna Hoş Geldiniz
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            Sorularınızın cevaplarını bulun veya yeni sorular sorun! Topluluk ile birlikte öğrenin.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={RouterLink}
              to="/questions"
              variant="contained"
              size="large"
              sx={{ px: 4, py: 1.5 }}
              onClick={() => logger.user.action('click_questions_button')}
            >
              Soruları Görüntüle
            </Button>
            <Button
              component={RouterLink}
              to="/ask-question"
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5 }}
              onClick={() => logger.user.action('click_ask_question_button')}
            >
              Soru Sor
            </Button>
          </Box>
        </Box>

        {/* Stats Section */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ textAlign: 'center', p: 3 }}>
              <QuestionAnswer sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                1,234
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Toplam Soru
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ textAlign: 'center', p: 3 }}>
              <TrendingUp sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                5,678
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Toplam Cevap
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ textAlign: 'center', p: 3 }}>
              <People sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                890
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Aktif Kullanıcı
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Features Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
            Neden QA Platform?
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Typography variant="h5" gutterBottom>
                  🚀 Hızlı Cevap
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Topluluk sayesinde sorularınıza hızlıca cevap alın. Uzmanlar ve deneyimli kullanıcılar 
                  size yardımcı olmaya hazır.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Typography variant="h5" gutterBottom>
                  💡 Kaliteli İçerik
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Her soru ve cevap moderasyon sürecinden geçer. Kaliteli ve güvenilir içerik 
                  garantisi veriyoruz.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Typography variant="h5" gutterBottom>
                  🌟 Topluluk
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Binlerce kullanıcıdan oluşan aktif topluluğa katılın. Bilgi paylaşın, 
                  öğrenin ve büyüyün.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Typography variant="h5" gutterBottom>
                  📱 Kolay Kullanım
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Modern ve kullanıcı dostu arayüz ile sorularınızı kolayca sorun ve 
                  cevapları hızlıca bulun.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* CTA Section */}
        <Box sx={{ textAlign: 'center', py: 6, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom>
            Hemen Başlayın!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            Sorularınızı sorun, cevaplarınızı paylaşın ve topluluğa katılın. 
            Bilgi paylaşımının gücünü keşfedin.
          </Typography>
          <Button
            component={RouterLink}
            to="/register"
            variant="contained"
            size="large"
            sx={{ px: 4, py: 1.5 }}
            onClick={() => logger.user.action('click_register_button')}
          >
            Ücretsiz Kayıt Ol
          </Button>
        </Box>
      </Container>
    </Layout>
  );
};

export default Home;
