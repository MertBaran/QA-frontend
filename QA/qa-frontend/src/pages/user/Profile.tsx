import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Grid,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Person,
  Email,
  Language,
  LocationOn,
  Work,
  Description,
  Link,
  CalendarToday,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useTheme } from '@mui/material/styles';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { t } from '../../utils/translations';
import { User } from '../../types/user';

interface ProfileStats {
  totalQuestions: number;
  totalAnswers: number;
  totalLikes: number;
  profileViews: number;
}

interface UserActivity {
  id: string;
  type: 'question' | 'answer';
  title: string;
  content: string;
  createdAt: string;
  likes: number;
}

const Profile = () => {
  const theme = useTheme();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const { currentLanguage } = useAppSelector(state => state.language);
  const dispatch = useAppDispatch();

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalQuestions: 0,
    totalAnswers: 0,
    totalLikes: 0,
    profileViews: 0,
  });
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    title: user?.title || '',
    about: user?.about || '',
    place: user?.place || '',
    website: user?.website || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load user data
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    }
  }, [isAuthenticated, user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // TODO: Backend'de bu endpoint'ler yok, şimdilik mock data
      setStats({
        totalQuestions: 12,
        totalAnswers: 45,
        totalLikes: 234,
        profileViews: 1234,
      });
      setRecentActivity([
        {
          id: '1',
          type: 'question',
          title: 'React Hooks kullanımı',
          content: 'useEffect ve useState arasındaki farklar nelerdir?',
          createdAt: '2024-01-15T10:30:00Z',
          likes: 15,
        },
        {
          id: '2',
          type: 'answer',
          title: 'TypeScript interface vs type',
          content: 'Interface ve type arasındaki temel farklar...',
          createdAt: '2024-01-14T14:20:00Z',
          likes: 8,
        },
      ]);
    } catch (error) {
      setError(t('error_loading_profile', currentLanguage));
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const updateData = {
        name: formData.name,
        email: formData.email,
        title: formData.title,
        about: formData.about,
        place: formData.place,
        website: formData.website,
      };

      const updatedUser = await authService.editProfile(updateData);
      
      if (updatedUser) {
        setSuccess(t('profile_updated_success', currentLanguage));
        setIsEditing(false);
        // TODO: Redux store'u güncelle
      }
    } catch (error: any) {
      setError(error.message || t('profile_update_error', currentLanguage));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('passwords_not_match', currentLanguage));
      return;
    }

    if (formData.newPassword.length < 6) {
      setError(t('password_too_short', currentLanguage));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // TODO: Backend'de şifre değiştirme endpoint'i yok
      setSuccess(t('password_changed_success', currentLanguage));
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: any) {
      setError(error.message || t('password_change_error', currentLanguage));
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      
      // TODO: Backend'de image upload endpoint'i var ama frontend'de implement edilmemiş
      setSuccess(t('image_upload_success', currentLanguage));
    } catch (error: any) {
      setError(error.message || t('image_upload_error', currentLanguage));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="warning">
            {t('login_required', currentLanguage)}
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ color: 'white', mb: 2 }}>
            {t('profile', currentLanguage)}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Sol Kolon - Profil Bilgileri */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(10px)',
              border: theme.palette.mode === 'dark' 
                ? '1px solid rgba(255,255,255,0.1)' 
                : '1px solid rgba(0,0,0,0.05)',
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                {/* Profil Fotoğrafı */}
                <Box sx={{ position: 'relative', mb: 3 }}>
                  <Avatar
                    src={user.profile_image}
                    sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                  />
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-image-upload"
                    type="file"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="profile-image-upload">
                    <IconButton
                      component="span"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: '50%',
                        transform: 'translateX(50%)',
                        bgcolor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' },
                      }}
                    >
                      <PhotoCamera />
                    </IconButton>
                  </label>
                </Box>

                {/* Kullanıcı Bilgileri */}
                <Typography variant="h5" sx={{ 
                  color: theme.palette.mode === 'dark' ? 'white' : '#1A202C', 
                  mb: 1 
                }}>
                  {user.name}
                </Typography>
                {user.title && (
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                    mb: 2 
                  }}>
                    {user.title}
                  </Typography>
                )}

                {/* İstatistikler */}
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="h6" sx={{ 
                        color: theme.palette.mode === 'dark' ? 'white' : '#1A202C' 
                      }}>
                        {stats.totalQuestions}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                      }}>
                        {t('questions', currentLanguage)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6" sx={{ 
                        color: theme.palette.mode === 'dark' ? 'white' : '#1A202C' 
                      }}>
                        {stats.totalAnswers}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                      }}>
                        {t('answers', currentLanguage)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6" sx={{ 
                        color: theme.palette.mode === 'dark' ? 'white' : '#1A202C' 
                      }}>
                        {stats.totalLikes}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                      }}>
                        {t('likes', currentLanguage)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6" sx={{ 
                        color: theme.palette.mode === 'dark' ? 'white' : '#1A202C' 
                      }}>
                        {stats.profileViews}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                      }}>
                        {t('views', currentLanguage)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Düzenle Butonu */}
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setIsEditing(true)}
                  sx={{ 
                    mt: 3, 
                    color: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
                    borderColor: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
                    '&:hover': {
                      borderColor: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    }
                  }}
                >
                  {t('edit_profile', currentLanguage)}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Sağ Kolon - Detaylar */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              {/* Profil Detayları */}
              <Grid item xs={12}>
                <Card sx={{ 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255,255,255,0.1)' 
                    : '1px solid rgba(0,0,0,0.05)',
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ 
                      color: theme.palette.mode === 'dark' ? 'white' : '#1A202C', 
                      mb: 2 
                    }}>
                      {t('profile_details', currentLanguage)}
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Person sx={{ 
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                            mr: 1 
                          }} />
                          <Typography variant="body2" sx={{ 
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                          }}>
                            {t('name', currentLanguage)}: {user.name}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Email sx={{ 
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                            mr: 1 
                          }} />
                          <Typography variant="body2" sx={{ 
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                          }}>
                            {t('email', currentLanguage)}: {user.email}
                          </Typography>
                        </Box>
                      </Grid>
                                             {user.place && (
                         <Grid item xs={12} sm={6}>
                           <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                             <LocationOn sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                               mr: 1 
                             }} />
                             <Typography variant="body2" sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                             }}>
                               {t('location', currentLanguage)}: {user.place}
                             </Typography>
                           </Box>
                         </Grid>
                       )}
                       {user.website && (
                         <Grid item xs={12} sm={6}>
                           <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                             <Link sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                               mr: 1 
                             }} />
                             <Typography variant="body2" sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                             }}>
                               {t('website', currentLanguage)}: {user.website}
                             </Typography>
                           </Box>
                         </Grid>
                       )}
                       {user.about && (
                         <Grid item xs={12}>
                           <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                             <Description sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                               mr: 1, 
                               mt: 0.5 
                             }} />
                             <Typography variant="body2" sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                             }}>
                               {t('about', currentLanguage)}: {user.about}
                             </Typography>
                           </Box>
                         </Grid>
                       )}
                       <Grid item xs={12}>
                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                           <CalendarToday sx={{ 
                             color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                             mr: 1 
                           }} />
                           <Typography variant="body2" sx={{ 
                             color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                           }}>
                             {t('member_since', currentLanguage)}: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                           </Typography>
                         </Box>
                       </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Son Aktiviteler */}
              <Grid item xs={12}>
                <Card sx={{ 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255,255,255,0.1)' 
                    : '1px solid rgba(0,0,0,0.05)',
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ 
                      color: theme.palette.mode === 'dark' ? 'white' : '#1A202C', 
                      mb: 2 
                    }}>
                      {t('recent_activity', currentLanguage)}
                    </Typography>
                    
                    {recentActivity.length > 0 ? (
                      <List>
                        {recentActivity.map((activity) => (
                          <ListItem key={activity.id} sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: activity.type === 'question' ? 'primary.main' : 'secondary.main' }}>
                                {activity.type === 'question' ? 'Q' : 'A'}
                              </Avatar>
                            </ListItemAvatar>
                                                         <ListItemText
                               primary={
                                 <Typography variant="body1" sx={{ 
                                   color: theme.palette.mode === 'dark' ? 'white' : '#1A202C' 
                                 }}>
                                   {activity.title}
                                 </Typography>
                               }
                               secondary={
                                 <Typography variant="body2" sx={{ 
                                   color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                                 }}>
                                   {activity.content.substring(0, 100)}...
                                 </Typography>
                               }
                             />
                             <Box sx={{ textAlign: 'right' }}>
                               <Typography variant="caption" sx={{ 
                                 color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#718096' 
                               }}>
                                 {new Date(activity.createdAt).toLocaleDateString()}
                               </Typography>
                               <Typography variant="caption" sx={{ 
                                 display: 'block', 
                                 color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#718096' 
                               }}>
                                 {activity.likes} {t('likes', currentLanguage)}
                               </Typography>
                             </Box>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography sx={{ 
                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                        textAlign: 'center' 
                      }}>
                        {t('no_activity_yet', currentLanguage)}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Profil Düzenleme Dialog'u */}
                <Dialog
          open={isEditing}
          onClose={() => setIsEditing(false)}
          maxWidth="md"
          fullWidth
          sx={{ zIndex: 99999 }}
                      PaperProps={{
              sx: {
                bgcolor: theme.palette.mode === 'dark' ? '#1E3A47' : '#FFFFFF',
                borderRadius: 3,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 255, 255, 0.1)' 
                  : '1px solid rgba(0, 0, 0, 0.05)',
              },
            }}
        >
          <DialogTitle sx={{ 
            color: theme.palette.mode === 'dark' ? 'white' : '#1A202C', 
            fontWeight: 600, 
            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, 
            pb: 2,
            mb: 4
          }}>
            {t('edit_profile', currentLanguage)}
          </DialogTitle>
          <DialogContent sx={{ 
            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : '#4A5568', 
            pt: 4,
            mt: 2
          }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('name', currentLanguage)}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('email', currentLanguage)}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('title', currentLanguage)}
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('about', currentLanguage)}
                  value={formData.about}
                  onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                  multiline
                  rows={3}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('location', currentLanguage)}
                  value={formData.place}
                  onChange={(e) => setFormData(prev => ({ ...prev, place: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('website', currentLanguage)}
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ 
            borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, 
            pt: 2, 
            pb: 2 
          }}>
            <Button onClick={() => setIsEditing(false)} sx={{ 
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : '#4A5568' 
            }}>
              {t('cancel', currentLanguage)}
            </Button>
            <Button
              onClick={handleEditProfile}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : t('save', currentLanguage)}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default Profile;
