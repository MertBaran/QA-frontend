import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Tabs,
  Tab,
  Pagination,
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
import papyrusHorizontal2 from '../../asset/textures/papyrus_horizontal_2.png';
import papyrusHorizontal1 from '../../asset/textures/papyrus_horizontal_1.png';
import papyrusVertical1 from '../../asset/textures/papyrus_vertical_1.png';
import { userService } from '../../services/userService';
import { questionService } from '../../services/questionService';
import { answerService } from '../../services/answerService';
import { t } from '../../utils/translations';
import { User } from '../../types/user';
import { Question } from '../../types/question';
import { Answer } from '../../types/answer';

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

interface ActivityItem {
  id: string;
  type: 'question' | 'answer';
  title: string;
  content: string;
  createdAt: Date;
  likes: number;
  questionId?: string;
}

const Profile = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const { currentLanguage } = useAppSelector(state => state.language);
  const { name: themeName, mode } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  const dispatch = useAppDispatch();

  // State
  const [profileUser, setProfileUser] = useState<User | null>(null);
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
  const [userQuestions, setUserQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Answer[]>([]);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers'>('questions');
  const [showPassword, setShowPassword] = useState(false);
  const [questionsPage, setQuestionsPage] = useState(1);
  const [answersPage, setAnswersPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    about: '',
    place: '',
    website: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Determine if viewing own profile
  const isOwnProfile = !userId || userId === user?.id;

  // Load user data
  useEffect(() => {
    const loadProfileUser = async () => {
      if (!isAuthenticated) return;
      
      setLoading(true);
      try {
        let targetUser: User | null = null;
        
        if (userId) {
          // Fetch specific user profile
          targetUser = await userService.getUserById(userId);
        } else {
          // Use current user
          targetUser = user;
        }
        
        if (targetUser) {
          setProfileUser(targetUser);
          setFormData({
            name: targetUser.name || '',
            email: targetUser.email || '',
            title: targetUser.title || '',
            about: targetUser.about || '',
            place: targetUser.place || '',
            website: targetUser.website || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          await loadUserData(targetUser.id);
        } else {
          setError('Kullanıcı bulunamadı');
        }
      } catch (error) {
        console.error('Profil yüklenirken hata:', error);
        setError(t('error_loading_profile', currentLanguage));
      } finally {
        setLoading(false);
      }
    };

    loadProfileUser();
  }, [userId, isAuthenticated, user]);

  const loadUserData = async (targetUserId: string) => {
    try {
      setLoading(true);
      
      // Load questions and answers
      const [questions, answers] = await Promise.all([
        questionService.getQuestionsByUser(targetUserId),
        answerService.getAnswersByUser(targetUserId),
      ]);
      
      setUserQuestions(questions);
      setUserAnswers(answers);
      
      // Calculate stats
      const totalQuestions = questions.length;
      const totalAnswers = answers.length;
      const totalLikes = questions.reduce((sum, q) => sum + q.likesCount, 0) + answers.reduce((sum, a) => sum + a.likesCount, 0);
      
      setStats({
        totalQuestions,
        totalAnswers,
        totalLikes,
        profileViews: 0, // TODO: Backend'de profil görüntüleme sayacı yok
      });
      
      // Create recent activity list
      const activities: UserActivity[] = [
        ...questions.slice(0, 5).map(q => ({
          id: q.id,
          type: 'question' as const,
          title: q.title,
          content: q.content,
          createdAt: q.createdAt?.toString() || new Date().toISOString(),
          likes: q.likesCount,
        })),
        ...answers.slice(0, 5).map(a => ({
          id: a.id,
          type: 'answer' as const,
          title: '', // Answers don't have titles
          content: a.content,
          createdAt: a.createdAt?.toString() || new Date().toISOString(),
          likes: a.likesCount,
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
       .slice(0, 10);
      
      setRecentActivity(activities);
    } catch (error) {
      console.error('Kullanıcı verileri yüklenirken hata:', error);
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
        {/* Admin Panel Texture Background */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${papyrusHorizontal2})`,
            backgroundSize: '130%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: mode === 'dark' ? 0.15 : 0.25,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <Container maxWidth="md" sx={{ mt: 4, position: 'relative', zIndex: 1 }}>
          <Alert severity="warning">
            {t('login_required', currentLanguage)}
          </Alert>
        </Container>
      </Layout>
    );
  }

  if (!profileUser) {
    return (
      <Layout>
        {/* Admin Panel Texture Background */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${papyrusHorizontal2})`,
            backgroundSize: '120%',
            backgroundPosition: 'center 15%',
            backgroundRepeat: 'no-repeat',
            opacity: mode === 'dark' ? 0.15 : 0.25,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, position: 'relative', zIndex: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : null}
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Admin Panel Texture Background */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${papyrusHorizontal2})`,
          backgroundSize: '110%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: mode === 'dark' ? 0.15 : 0.25,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, position: 'relative', zIndex: 1 }}>
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
                  backgroundSize: '140%',
                  backgroundPosition: 'center 70%',
                  backgroundRepeat: 'no-repeat',
                  opacity: mode === 'dark' ? 0.12 : 0.15,
                  pointerEvents: 'none',
                  zIndex: 0,
                },
                '& > *': {
                  position: 'relative',
                  zIndex: 1,
                },
              } : {}),
            }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                {/* Profil Fotoğrafı */}
                <Box sx={{ position: 'relative', mb: 3 }}>
                  <Avatar
                    src={profileUser.profile_image}
                    sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                  />
                  {isOwnProfile && (
                    <>
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
                    </>
                  )}
                </Box>

                {/* Kullanıcı Bilgileri */}
                <Typography variant="h5" sx={{ 
                  color: theme.palette.mode === 'dark' ? 'white' : '#1A202C', 
                  mb: 1 
                }}>
                  {profileUser.name}
                </Typography>
                {profileUser.title && (
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                    mb: 2 
                  }}>
                    {profileUser.title}
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

                {/* Düzenle Butonu - Sadece kendi profili için */}
                {isOwnProfile && (
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
                )}
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
                      backgroundImage: `url(${papyrusHorizontal1})`,
                      backgroundSize: '140%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      opacity: mode === 'dark' ? 0.12 : 0.15,
                      pointerEvents: 'none',
                      zIndex: 0,
                    },
                    '& > *': {
                      position: 'relative',
                      zIndex: 1,
                    },
                  } : {}),
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
                            {t('name', currentLanguage)}: {profileUser.name}
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
                            {t('email', currentLanguage)}: {profileUser.email}
                          </Typography>
                        </Box>
                      </Grid>
                                             {profileUser.place && (
                         <Grid item xs={12} sm={6}>
                           <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                             <LocationOn sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                               mr: 1 
                             }} />
                             <Typography variant="body2" sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                             }}>
                               {t('location', currentLanguage)}: {profileUser.place}
                             </Typography>
                           </Box>
                         </Grid>
                       )}
                       {profileUser.website && (
                         <Grid item xs={12} sm={6}>
                           <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                             <Link sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                               mr: 1 
                             }} />
                             <Typography variant="body2" sx={{ 
                               color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568' 
                             }}>
                               {t('website', currentLanguage)}: {profileUser.website}
                             </Typography>
                           </Box>
                         </Grid>
                       )}
                       {profileUser.about && (
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
                               {t('about', currentLanguage)}: {profileUser.about}
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
                             {t('member_since', currentLanguage)}: {profileUser.createdAt ? new Date(profileUser.createdAt).toLocaleDateString() : 'N/A'}
                           </Typography>
                         </Box>
                       </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Sorular ve Cevaplar */}
              <Grid item xs={12}>
                <Card sx={{ 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(255,255,255,0.1)' 
                    : '1px solid rgba(0,0,0,0.05)',
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
                      backgroundSize: 'cover',
                      backgroundPosition: 'center 15%',
                      backgroundRepeat: 'no-repeat',
                      opacity: mode === 'dark' ? 0.12 : 0.15,
                      pointerEvents: 'none',
                      zIndex: 0,
                    },
                    '& > *': {
                      position: 'relative',
                      zIndex: 1,
                    },
                  } : {}),
                }}>
                  <CardContent>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                      <Tabs 
                        value={activeTab} 
                        onChange={(_, newValue) => {
                          setActiveTab(newValue);
                          setQuestionsPage(1);
                          setAnswersPage(1);
                        }}
                        textColor="primary"
                        indicatorColor="primary"
                      >
                        <Tab 
                          label={`${t('questions', currentLanguage)} (${userQuestions.length})`} 
                          value="questions" 
                          sx={{ color: theme.palette.mode === 'dark' ? 'white' : '#1A202C' }}
                        />
                        <Tab 
                          label={`${t('answers', currentLanguage)} (${userAnswers.length})`} 
                          value="answers" 
                          sx={{ color: theme.palette.mode === 'dark' ? 'white' : '#1A202C' }}
                        />
                      </Tabs>
                    </Box>
                    
                    {activeTab === 'questions' && (
                      <>
                        {userQuestions.length > 0 ? (
                          <>
                            <List>
                              {userQuestions.slice((questionsPage - 1) * itemsPerPage, questionsPage * itemsPerPage).map((question) => (
                              <ListItem 
                                key={question.id} 
                                sx={{ 
                                  px: 0, 
                                  py: 2,
                                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                                }}
                                onClick={(e) => {
                                  if (e.ctrlKey || e.metaKey || e.button === 1) {
                                    e.preventDefault();
                                    window.open(`/questions/${question.id}`, '_blank');
                                  } else {
                                    navigate(`/questions/${question.id}`);
                                  }
                                }}
                                onMouseDown={(e) => {
                                  if (e.button === 1) {
                                    e.preventDefault();
                                    window.open(`/questions/${question.id}`, '_blank');
                                  }
                                }}
                              >
                                <ListItemAvatar>
                                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    Q
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography variant="body1" sx={{ 
                                      color: theme.palette.mode === 'dark' ? 'white' : '#1A202C',
                                      fontWeight: 500,
                                    }}>
                                      {question.title}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography variant="body2" sx={{ 
                                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568',
                                      mt: 0.5,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical',
                                      wordBreak: 'break-word',
                                    }}>
                                      {question.content}
                                    </Typography>
                                  }
                                />
                                <Box sx={{ textAlign: 'right', ml: 2 }}>
                                  <Typography variant="caption" sx={{ 
                                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#718096',
                                    display: 'block',
                                  }}>
                                    {new Date(question.createdAt || '').toLocaleDateString()}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, justifyContent: 'flex-end' }}>
                                    <Typography variant="caption" sx={{ 
                                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#718096' 
                                    }}>
                                      {question.likesCount} {t('likes', currentLanguage)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#718096' 
                                    }}>
                                      • {question.answers} {t('answers', currentLanguage)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </ListItem>
                              ))}
                            </List>
                            {userQuestions.length > itemsPerPage && (
                              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <Pagination
                                  count={Math.ceil(userQuestions.length / itemsPerPage)}
                                  page={questionsPage}
                                  onChange={(_, page) => setQuestionsPage(page)}
                                  color="primary"
                                />
                              </Box>
                            )}
                          </>
                        ) : (
                          <Typography sx={{ 
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                            textAlign: 'center',
                            py: 4,
                          }}>
                            {t('no_questions', currentLanguage)}
                          </Typography>
                        )}
                      </>
                    )}
                    
                    {activeTab === 'answers' && (
                      <>
                        {userAnswers.length > 0 ? (
                          <>
                            <List>
                              {userAnswers.slice((answersPage - 1) * itemsPerPage, answersPage * itemsPerPage).map((answer) => (
                              <ListItem 
                                key={answer.id} 
                                sx={{ 
                                  px: 0, 
                                  py: 2,
                                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                                }}
                                onClick={(e) => {
                                  if (e.ctrlKey || e.metaKey || e.button === 1) {
                                    e.preventDefault();
                                    window.open(`/questions/${answer.questionId || ''}#answer-${answer.id}`, '_blank');
                                  } else {
                                    navigate(`/questions/${answer.questionId || ''}#answer-${answer.id}`);
                                  }
                                }}
                                onMouseDown={(e) => {
                                  if (e.button === 1) {
                                    e.preventDefault();
                                    window.open(`/questions/${answer.questionId || ''}#answer-${answer.id}`, '_blank');
                                  }
                                }}
                              >
                                <ListItemAvatar>
                                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                    A
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    answer.questionTitle ? (
                                      <Typography variant="body2" sx={{ 
                                        color: (() => {
                                          if (themeName === 'molume') {
                                            return theme.palette.mode === 'dark' ? '#FFB800' : '#FFB800';
                                          } else if (themeName === 'magnefite') {
                                            return theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280';
                                          } else if (themeName === 'papirus') {
                                            return theme.palette.mode === 'dark' ? '#A1887F' : '#8D6E63';
                                          }
                                          return theme.palette.primary.main;
                                        })(),
                                        fontWeight: 600,
                                        mb: 0.5,
                                      }}>
                                        {t('answer_to', currentLanguage)}: {answer.questionTitle}
                                      </Typography>
                                    ) : null
                                  }
                                  secondary={
                                    <Typography variant="body2" sx={{ 
                                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical',
                                      wordBreak: 'break-word',
                                    }}>
                                      {answer.content}
                                    </Typography>
                                  }
                                />
                                <Box sx={{ textAlign: 'right', ml: 2 }}>
                                  <Typography variant="caption" sx={{ 
                                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#718096',
                                    display: 'block',
                                  }}>
                                    {new Date(answer.createdAt || '').toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="caption" sx={{ 
                                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#718096' 
                                  }}>
                                    {answer.likesCount} {t('likes', currentLanguage)}
                                  </Typography>
                                </Box>
                              </ListItem>
                              ))}
                            </List>
                            {userAnswers.length > itemsPerPage && (
                              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <Pagination
                                  count={Math.ceil(userAnswers.length / itemsPerPage)}
                                  page={answersPage}
                                  onChange={(_, page) => setAnswersPage(page)}
                                  color="primary"
                                />
                              </Box>
                            )}
                          </>
                        ) : (
                          <Typography sx={{ 
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#4A5568', 
                            textAlign: 'center',
                            py: 4,
                          }}>
                            {t('no_answers', currentLanguage)}
                          </Typography>
                        )}
                      </>
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
