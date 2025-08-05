import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
} from '@mui/material';
import {
  People,
  QuestionAnswer,
  Security,
  TrendingUp,
  Notifications,
  Warning,
  Dashboard as DashboardIcon,
  Home,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { t } from '../../utils/translations';

const AdminDashboard: React.FC = () => {
  const { user, roles } = useAppSelector((state) => state.auth);
  const { currentLanguage } = useAppSelector((state) => state.language);
  const navigate = useNavigate();

  // Mock data - gerçek implementasyonda API'den gelecek
  const stats = {
    totalUsers: 1250,
    activeUsers: 890,
    totalQuestions: 3450,
    pendingQuestions: 45,
    totalAnswers: 12800,
    pendingAnswers: 23,
    systemHealth: 'Good',
    lastBackup: '2 hours ago',
  };

  const recentActivities = [
    {
      id: 1,
      type: 'user_registration',
      message: 'New user registered: john.doe@example.com',
      timestamp: '2 minutes ago',
      severity: 'info',
    },
    {
      id: 2,
      type: 'question_created',
      message: 'New question created: "How to implement React hooks?"',
      timestamp: '5 minutes ago',
      severity: 'info',
    },
    {
      id: 3,
      type: 'system_warning',
      message: 'High memory usage detected',
      timestamp: '10 minutes ago',
      severity: 'warning',
    },
    {
      id: 4,
      type: 'admin_action',
      message: 'User account blocked: spam@example.com',
      timestamp: '15 minutes ago',
      severity: 'error',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <People fontSize="small" />;
      case 'question_created':
        return <QuestionAnswer fontSize="small" />;
      case 'system_warning':
        return <Warning fontSize="small" />;
      case 'admin_action':
        return <Security fontSize="small" />;
      default:
        return <Notifications fontSize="small" />;
    }
  };

  const handleGoToUserInterface = () => {
    navigate('/dashboard');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('admin_dashboard', currentLanguage)}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {t('welcome_admin', currentLanguage)} {user?.name}
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('total_users', currentLanguage)}
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.activeUsers} {t('active', currentLanguage)}
                  </Typography>
                </Box>
                <People color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('total_questions', currentLanguage)}
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalQuestions.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.pendingQuestions} {t('pending', currentLanguage)}
                  </Typography>
                </Box>
                <QuestionAnswer color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('total_answers', currentLanguage)}
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalAnswers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.pendingAnswers} {t('pending', currentLanguage)}
                  </Typography>
                </Box>
                <TrendingUp color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('system_health', currentLanguage)}
                  </Typography>
                  <Typography variant="h4">
                    {stats.systemHealth}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('last_backup', currentLanguage)}: {stats.lastBackup}
                  </Typography>
                </Box>
                <Security color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activities */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('recent_activities', currentLanguage)}
            </Typography>
            <List>
              {recentActivities.map((activity) => (
                <ListItem key={activity.id} divider>
                  <ListItemIcon>
                    {getActivityIcon(activity.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.message}
                    secondary={activity.timestamp}
                  />
                  <Chip
                    label={activity.severity}
                    color={getSeverityColor(activity.severity)}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('admin_roles', currentLanguage)}
            </Typography>
            <Box>
              {roles && roles.length > 0 ? (
                roles.map((role) => (
                  <Chip
                    key={role}
                    label={role}
                    color="primary"
                    size="small"
                    sx={{ m: 0.5 }}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('no_roles_assigned', currentLanguage)}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard; 