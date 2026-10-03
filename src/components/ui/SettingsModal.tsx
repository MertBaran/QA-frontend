import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  useTheme,
} from '@mui/material';
import { Close, Person, Palette, Language, QuestionAnswer, ExpandLess, ExpandMore, SmartToy, WorkspacePremium, ListAlt, Assistant } from '@mui/icons-material';
import { deepPurple, indigo } from '@mui/material/colors';
import QuestionFeatureTemplatesPanel from '../question/QuestionFeatureTemplatesPanel';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setTheme } from '../../store/theme/themeSlice';
import { setLanguage } from '../../store/language/languageSlice';
import { t } from '../../utils/translations';
import themeMolumeIcon from '../../asset/icons/home/themes/theme_molume.png';
import themePapirusIcon from '../../asset/icons/home/themes/theme_papirus.png';
import themeMagnefiteIcon from '../../asset/icons/home/themes/theme_magnefite.png';

const themes = [
  { id: 'molume' as const, nameKey: 'molume', icon: themeMolumeIcon },
  { id: 'papirus' as const, nameKey: 'papirus', icon: themePapirusIcon },
  { id: 'magnefite' as const, nameKey: 'magnefite', icon: themeMagnefiteIcon },
];

const languages = [
  { id: 'tr', nameKey: 'tr' },
  { id: 'en', nameKey: 'en' },
  { id: 'de', nameKey: 'de' },
];

type SettingsSection = 'plan' | 'appearance' | 'language' | 'question' | 'template_management' | 'profile' | 'ai_connection' | 'agents';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const questionNavIconColor = isDark ? indigo[300] : indigo[600];
  const questionSubNavIconColor = isDark ? indigo[200] : indigo[800];
  const aiNavIconColor = isDark ? deepPurple[300] : deepPurple[600];
  const aiSubNavIconColor = isDark ? deepPurple[200] : deepPurple[800];
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector((s) => s.language);
  const { name: themeName } = useAppSelector((s) => s.theme);
  const [section, setSection] = useState<SettingsSection>('plan');
  const [questionExpanded, setQuestionExpanded] = useState(false);
  const [aiConnectionExpanded, setAiConnectionExpanded] = useState(false);

  const handleGoToProfile = () => {
    onClose();
    navigate('/profile');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          maxHeight: '85vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6">{t('settings', currentLanguage)}</Typography>
        <IconButton onClick={onClose} size="small" aria-label="close">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'row', minHeight: 0 }}>
        {/* Sol menü */}
        <Box
          sx={{
            width: 220,
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'action.hover',
          }}
        >
          <List disablePadding>
            <ListItemButton
              selected={section === 'plan'}
              onClick={() => setSection('plan')}
              sx={{
                py: 1.5,
                '&.Mui-selected': { bgcolor: 'action.selected', borderRight: 2, borderColor: 'primary.main' },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: theme.palette.warning.main,
                }}
              >
                <WorkspacePremium />
              </ListItemIcon>
              <ListItemText primary={t('plan', currentLanguage)} />
            </ListItemButton>
            <ListItemButton
              selected={section === 'appearance'}
              onClick={() => setSection('appearance')}
              sx={{
                py: 1.5,
                '&.Mui-selected': { bgcolor: 'action.selected', borderRight: 2, borderColor: 'primary.main' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: theme.palette.primary.main }}>
                <Palette />
              </ListItemIcon>
              <ListItemText primary={t('appearance', currentLanguage)} />
            </ListItemButton>
            <ListItemButton
              selected={section === 'language'}
              onClick={() => setSection('language')}
              sx={{
                py: 1.5,
                '&.Mui-selected': { bgcolor: 'action.selected', borderRight: 2, borderColor: 'primary.main' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: theme.palette.info.main }}>
                <Language />
              </ListItemIcon>
              <ListItemText primary={t('language_selection', currentLanguage)} />
            </ListItemButton>
            <ListItemButton
              selected={section === 'question'}
              onClick={() => {
                setQuestionExpanded(!questionExpanded);
                setSection('question');
              }}
              sx={{
                py: 1.5,
                '&.Mui-selected': { bgcolor: 'action.selected', borderRight: 2, borderColor: 'primary.main' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: questionNavIconColor }}>
                <QuestionAnswer />
              </ListItemIcon>
              <ListItemText primary={t('question', currentLanguage)} />
              {questionExpanded ? (
                <ExpandLess sx={{ color: 'text.secondary' }} />
              ) : (
                <ExpandMore sx={{ color: 'text.secondary' }} />
              )}
            </ListItemButton>
            <Collapse in={questionExpanded} timeout="auto" unmountOnExit>
              <List disablePadding>
                <ListItemButton
                  selected={section === 'template_management'}
                  onClick={() => {
                    setSection('template_management');
                    setQuestionExpanded(true);
                  }}
                  sx={{
                    pl: 4,
                    py: 1.25,
                    '&.Mui-selected': { bgcolor: 'action.selected', borderRight: 2, borderColor: 'primary.main' },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: questionSubNavIconColor,
                    }}
                  >
                    <ListAlt fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={t('template_management', currentLanguage)} />
                </ListItemButton>
              </List>
            </Collapse>
            <ListItemButton
              selected={section === 'profile'}
              onClick={() => setSection('profile')}
              sx={{
                py: 1.5,
                '&.Mui-selected': { bgcolor: 'action.selected', borderRight: 2, borderColor: 'primary.main' },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: theme.palette.text.secondary,
                }}
              >
                <Person />
              </ListItemIcon>
              <ListItemText primary={t('profile', currentLanguage)} />
            </ListItemButton>
            <ListItemButton
              selected={section === 'ai_connection'}
              onClick={() => {
                setAiConnectionExpanded(!aiConnectionExpanded);
                setSection('ai_connection');
              }}
              sx={{
                py: 1.5,
                '&.Mui-selected': { bgcolor: 'action.selected', borderRight: 2, borderColor: 'primary.main' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: aiNavIconColor }}>
                <SmartToy />
              </ListItemIcon>
              <ListItemText primary={t('ai_connection', currentLanguage)} />
              {aiConnectionExpanded ? (
                <ExpandLess sx={{ color: 'text.secondary' }} />
              ) : (
                <ExpandMore sx={{ color: 'text.secondary' }} />
              )}
            </ListItemButton>
            <Collapse in={aiConnectionExpanded} timeout="auto" unmountOnExit>
              <List disablePadding>
                <ListItemButton
                  selected={section === 'agents'}
                  onClick={() => {
                    setSection('agents');
                    setAiConnectionExpanded(true);
                  }}
                  sx={{
                    pl: 4,
                    py: 1.25,
                    '&.Mui-selected': { bgcolor: 'action.selected', borderRight: 2, borderColor: 'primary.main' },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: aiSubNavIconColor,
                    }}
                  >
                    <Assistant fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={t('agents', currentLanguage)} />
                </ListItemButton>
              </List>
            </Collapse>
          </List>
        </Box>

        {/* Sağ içerik */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {section === 'plan' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('plan', currentLanguage)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('coming_soon', currentLanguage)}
              </Typography>
            </Box>
          )}

          {section === 'appearance' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('appearance', currentLanguage)}
              </Typography>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                {t('theme', currentLanguage)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {themes.map((th) => (
                  <Box
                    key={th.id}
                    component="button"
                    onClick={() => dispatch(setTheme(th.id))}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.5,
                      borderRadius: 1.5,
                      border: `2px solid`,
                      borderColor: themeName === th.id ? 'primary.main' : 'divider',
                      bgcolor: themeName === th.id ? 'action.selected' : 'transparent',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box component="img" src={th.icon} alt={th.id} sx={{ width: 36, height: 28, objectFit: 'contain' }} />
                    <Typography variant="body2">{t(th.nameKey, currentLanguage)}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {section === 'question' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('question', currentLanguage)}
              </Typography>
            </Box>
          )}

          {section === 'template_management' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('template_management', currentLanguage)}
              </Typography>
              <QuestionFeatureTemplatesPanel embedded />
            </Box>
          )}

          {section === 'ai_connection' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('ai_connection', currentLanguage)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('coming_soon', currentLanguage)}
              </Typography>
            </Box>
          )}

          {section === 'agents' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('agents', currentLanguage)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('coming_soon', currentLanguage)}
              </Typography>
            </Box>
          )}

          {section === 'language' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('language_selection', currentLanguage)}
              </Typography>
              <FormControl size="medium" sx={{ minWidth: 200 }}>
                <InputLabel>{t('language_selection', currentLanguage)}</InputLabel>
                <Select
                  value={currentLanguage}
                  label={t('language_selection', currentLanguage)}
                  onChange={(e) => dispatch(setLanguage(e.target.value))}
                >
                  {languages.map((lang) => (
                    <MenuItem key={lang.id} value={lang.id}>
                      {lang.id.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {section === 'profile' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('profile', currentLanguage)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('edit_profile', currentLanguage)}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Person />}
                onClick={handleGoToProfile}
              >
                {t('profile', currentLanguage)}
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
