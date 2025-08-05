import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Tooltip,
  Avatar,
  InputAdornment,
  Collapse,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Badge,
  Divider,
  Popover,
} from '@mui/material';
import {
  People,
  Search,
  Edit,
  Delete,
  Block,
  CheckCircle,
  Warning,
  FilterList,
  Add,
  Refresh,
  ExpandMore,
  ExpandLess,
  CalendarToday,
  OnlinePrediction,
  PersonAdd,
  PersonOff,
  Tune,
} from '@mui/icons-material';

import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';
import { adminService, AdminUser, UserFilters } from '../../services/adminService';

const AdminUsers: React.FC = () => {
  const { currentLanguage } = useAppSelector((state) => state.language);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    blocked: 0,
    online: 0,
    newThisMonth: 0,
  });

  // Filtreler
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    role: 'all',
    dateFrom: undefined,
    dateTo: undefined,
    isOnline: undefined,
  });

  // Popover state'leri
  const [searchTypeOpen, setSearchTypeOpen] = useState(false);
  const [searchTypeAnchor, setSearchTypeAnchor] = useState<HTMLElement | null>(null);
  const [dateOperatorOpen, setDateOperatorOpen] = useState(false);
  const [dateOperatorAnchor, setDateOperatorAnchor] = useState<HTMLElement | null>(null);



  // Kullanıcıları yükle
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUsers(
        filters,
        page + 1,
        rowsPerPage
      );
      setUsers(response.users);
      setTotalUsers(response.total);
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Kullanıcılar yüklenirken hata oluştu'
      });
    } finally {
      setLoading(false);
    }
  };

  // İstatistikleri yükle
  const loadStats = async () => {
    try {
      const stats = await adminService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Stats yüklenirken hata:', error);
    }
  };

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [page, rowsPerPage, filters]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleBlockUser = async (user: AdminUser) => {
    try {
      const updatedUser = await adminService.toggleUserBlock(user.id, !user.blocked);
      setUsers(users.map(u => u.id === user.id ? updatedUser : u));
      setAlert({
        type: 'success',
        message: user.blocked ? 'Kullanıcı engeli kaldırıldı' : 'Kullanıcı engellendi'
      });
      loadStats(); // İstatistikleri yenile
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'İşlem başarısız oldu'
      });
    }
  };

  const handleSaveUser = async (updatedUser: AdminUser) => {
    try {
      const savedUser = await adminService.updateUser(updatedUser.id, {
        name: updatedUser.name,
        email: updatedUser.email,
        blocked: updatedUser.blocked,
      });
      
      setUsers(users.map(u => u.id === updatedUser.id ? savedUser : u));
      setEditDialogOpen(false);
      setAlert({
        type: 'success',
        message: 'Kullanıcı başarıyla güncellendi'
      });
      loadStats(); // İstatistikleri yenile
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Güncelleme başarısız oldu'
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      await adminService.deleteUser(selectedUser.id);
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setDeleteDialogOpen(false);
      setAlert({
        type: 'success',
        message: 'Kullanıcı başarıyla silindi'
      });
      loadStats(); // İstatistikleri yenile
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Silme işlemi başarısız oldu'
      });
    }
  };

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0); // Filtre değiştiğinde ilk sayfaya dön
    
    // Filtre değiştiğinde kullanıcıları yeniden yükle (debounce ile)
    const timeoutId = setTimeout(() => {
      loadUsers();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      searchType: undefined,
      emailFilter: undefined,
      status: 'all',
      role: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      dateOperator: undefined,
      lastLoginOperator: undefined,
      isOnline: undefined,
    });
    setPage(0);
    loadUsers(); // Filtreleri sıfırladıktan sonra kullanıcıları yeniden yükle
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'moderator':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    return t(role, currentLanguage);
  };



  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <People color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h4">
          {t('user_management', currentLanguage)}
        </Typography>
      </Box>

      {alert && (
        <Alert 
          severity={alert.type} 
          sx={{ mb: 2 }}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      {/* İstatistik Kartları */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    {t('total_users', currentLanguage)}
                  </Typography>
                  <Typography variant="h4">{userStats.total}</Typography>
                </Box>
                <People color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    {t('active_users', currentLanguage)}
                  </Typography>
                  <Typography variant="h4" color="success.main">{userStats.active}</Typography>
                </Box>
                <CheckCircle color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    {t('online_users', currentLanguage)}
                  </Typography>
                  <Typography variant="h4" color="info.main">{userStats.online}</Typography>
                </Box>
                <OnlinePrediction color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    {t('blocked_users', currentLanguage)}
                  </Typography>
                  <Typography variant="h4" color="error.main">{userStats.blocked}</Typography>
                </Box>
                <PersonOff color="error" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    {t('new_this_month', currentLanguage)}
                  </Typography>
                  <Typography variant="h4" color="warning.main">{userStats.newThisMonth}</Typography>
                </Box>
                <PersonAdd color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      

      {/* Kullanıcılar Tablosu */}
      <Paper>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('user', currentLanguage)}</TableCell>
                <TableCell>{t('email', currentLanguage)}</TableCell>
                <TableCell>{t('roles', currentLanguage)}</TableCell>
                <TableCell>{t('status', currentLanguage)}</TableCell>
                <TableCell>{t('created_at', currentLanguage)}</TableCell>
                <TableCell>{t('last_login', currentLanguage)}</TableCell>
                <TableCell align="center">{t('actions', currentLanguage)}</TableCell>
              </TableRow>
            </TableHead>
            {/* Gelişmiş Filtreler - Tablo Kolonlarının Altında */}
            <TableBody>
              <TableRow>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TextField
                      size="small"
                      placeholder={t('search_users', currentLanguage)}
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setSearchTypeAnchor(e.currentTarget);
                        setSearchTypeOpen(!searchTypeOpen);
                      }}
                      sx={{ minWidth: 'auto' }}
                    >
                      <Tune />
                    </IconButton>
                    <Popover
                      open={searchTypeOpen}
                      anchorEl={searchTypeAnchor}
                      onClose={() => setSearchTypeOpen(false)}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                      }}
                    >
                      <Box p={2} minWidth={200}>
                        <Typography variant="subtitle2" gutterBottom>
                          {t('search_type', currentLanguage)}
                        </Typography>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={filters.searchType || 'contains'}
                            onChange={(e) => handleFilterChange('searchType', e.target.value)}
                            size="small"
                            displayEmpty
                          >
                            {[
                              { value: 'contains', label: t('search_type_contains', currentLanguage) },
                              { value: 'starts_with', label: t('search_type_starts_with', currentLanguage) },
                              { value: 'ends_with', label: t('search_type_ends_with', currentLanguage) },
                              { value: 'exact', label: t('search_type_exact', currentLanguage) }
                            ].map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Popover>
                  </Box>
                </TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth>
                    <InputLabel>{t('email_filter', currentLanguage)}</InputLabel>
                    <Select
                      value={filters.emailFilter || 'all'}
                      onChange={(e) => handleFilterChange('emailFilter', e.target.value)}
                      label={t('email_filter', currentLanguage)}
                    >
                      <MenuItem value="all">{t('all', currentLanguage)}</MenuItem>
                      <MenuItem value="verified">{t('verified', currentLanguage)}</MenuItem>
                      <MenuItem value="unverified">{t('unverified', currentLanguage)}</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth>
                    <InputLabel>{t('role', currentLanguage)}</InputLabel>
                    <Select
                      value={filters.role}
                      onChange={(e) => handleFilterChange('role', e.target.value)}
                      label={t('role', currentLanguage)}
                    >
                      <MenuItem value="all">{t('all', currentLanguage)}</MenuItem>
                      <MenuItem value="admin">{t('admin', currentLanguage)}</MenuItem>
                      <MenuItem value="moderator">{t('moderator', currentLanguage)}</MenuItem>
                      <MenuItem value="user">{t('user', currentLanguage)}</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth>
                    <InputLabel>{t('status', currentLanguage)}</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      label={t('status', currentLanguage)}
                    >
                      <MenuItem value="all">{t('all', currentLanguage)}</MenuItem>
                      <MenuItem value="active">{t('active', currentLanguage)}</MenuItem>
                      <MenuItem value="blocked">{t('blocked', currentLanguage)}</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TextField
                      size="small"
                      label={t('date_from', currentLanguage)}
                      type="date"
                      value={filters.dateFrom || ''}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setDateOperatorAnchor(e.currentTarget);
                        setDateOperatorOpen(!dateOperatorOpen);
                      }}
                      sx={{ minWidth: 'auto' }}
                    >
                      <Tune />
                    </IconButton>
                    <Popover
                      open={dateOperatorOpen}
                      anchorEl={dateOperatorAnchor}
                      onClose={() => setDateOperatorOpen(false)}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                      }}
                    >
                      <Box p={2} minWidth={200}>
                        <Typography variant="subtitle2" gutterBottom>
                          {t('date_operator', currentLanguage)}
                        </Typography>
                                                  <FormControl size="small" fullWidth>
                            <Select
                              value={filters.dateOperator || 'after'}
                              onChange={(e) => handleFilterChange('dateOperator', e.target.value)}
                              size="small"
                              displayEmpty
                            >
                              {[
                                { value: 'after', label: t('date_operator_after', currentLanguage) },
                                { value: 'before', label: t('date_operator_before', currentLanguage) },
                                { value: 'between', label: t('date_operator_between', currentLanguage) },
                                { value: 'exact', label: t('date_operator_exact', currentLanguage) }
                              ].map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        {filters.dateOperator === 'between' && (
                          <TextField
                            size="small"
                            label={t('date_to', currentLanguage)}
                            type="date"
                            value={filters.dateTo || ''}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    </Popover>
                  </Box>
                </TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth>
                    <InputLabel>{t('last_login_operator', currentLanguage)}</InputLabel>
                    <Select
                      value={filters.lastLoginOperator || 'all'}
                      onChange={(e) => handleFilterChange('lastLoginOperator', e.target.value)}
                      label={t('last_login_operator', currentLanguage)}
                      displayEmpty
                    >
                      {[
                        { value: 'all', label: t('last_login_operator_all', currentLanguage) },
                        { value: 'today', label: t('last_login_operator_today', currentLanguage) },
                        { value: 'this_week', label: t('last_login_operator_this_week', currentLanguage) },
                        { value: 'this_month', label: t('last_login_operator_this_month', currentLanguage) },
                        { value: 'never', label: t('last_login_operator_never', currentLanguage) }
                      ].map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Refresh />}
                    onClick={resetFilters}
                  >
                    {t('reset_filters', currentLanguage)}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Badge
                        color={user.isOnline ? 'success' : 'default'}
                        variant="dot"
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'right',
                        }}
                      >
                        <Avatar src={user.profile_image} sx={{ width: 32, height: 32 }}>
                          {user.name.charAt(0)}
                        </Avatar>
                      </Badge>
                      <Typography variant="body2">{user.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                                     <TableCell>
                     <Box display="flex" gap={0.5}>
                                               {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Chip
                              key={role}
                              label={getRoleLabel(role)}
                              color={getRoleColor(role) as any}
                              size="small"
                            />
                          ))
                        ) : (
                          <Chip
                            label={getRoleLabel('user')}
                            color="default"
                            size="small"
                          />
                        )}
                     </Box>
                   </TableCell>
                  <TableCell>
                    <Chip
                      label={user.blocked ? t('blocked', currentLanguage) : t('active', currentLanguage)}
                      color={user.blocked ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                                     <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={1} justifyContent="center">
                      <Tooltip title={t('edit_user', currentLanguage)}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={user.blocked ? t('unblock_user', currentLanguage) : t('block_user', currentLanguage)}>
                        <IconButton
                          size="small"
                          color={user.blocked ? 'success' : 'warning'}
                          onClick={() => handleBlockUser(user)}
                        >
                          {user.blocked ? <CheckCircle /> : <Block />}
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={t('delete_user', currentLanguage)}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteUser(user)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('edit_user', currentLanguage)}</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label={t('name', currentLanguage)}
                value={selectedUser.name}
                onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label={t('email', currentLanguage)}
                value={selectedUser.email}
                onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>{t('roles', currentLanguage)}</InputLabel>
                <Select
                  multiple
                  value={selectedUser.roles || []}
                  onChange={(e) => setSelectedUser({ 
                    ...selectedUser, 
                    roles: typeof e.target.value === 'string' ? [e.target.value] : e.target.value 
                  })}
                  label={t('roles', currentLanguage)}
                >
                  <MenuItem value="user">{t('user', currentLanguage)}</MenuItem>
                  <MenuItem value="moderator">{t('moderator', currentLanguage)}</MenuItem>
                  <MenuItem value="admin">{t('admin', currentLanguage)}</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedUser.blocked}
                    onChange={(e) => setSelectedUser({ ...selectedUser, blocked: e.target.checked })}
                  />
                }
                label={t('block_user', currentLanguage)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            {t('cancel', currentLanguage)}
          </Button>
          <Button 
            variant="contained" 
            onClick={() => selectedUser && handleSaveUser(selectedUser)}
          >
            {t('save', currentLanguage)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('delete_user', currentLanguage)}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('delete_user_confirmation', currentLanguage)} "{selectedUser?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('cancel', currentLanguage)}
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteConfirm}
          >
            {t('delete', currentLanguage)}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsers; 