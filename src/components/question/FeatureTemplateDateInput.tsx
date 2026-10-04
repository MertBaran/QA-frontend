import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Popover,
  useTheme,
} from '@mui/material';
import { Clear, Event, Check } from '@mui/icons-material';
import { t } from '../../utils/translations';
import {
  formatFeatureTemplateDate,
  parseFeatureTemplateDateInput,
  toDatetimeLocalValue,
  parseDatetimeLocalValue,
} from '../../utils/featureTemplateUtils';

export interface FeatureTemplateDateInputProps {
  label: string;
  value: string;
  onChange: (displayValue: string) => void;
  required?: boolean;
  disabled?: boolean;
  currentLanguage: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  /** true: satır dışındaki çarpı kullanılırken alan içi temizlemeyi gizle */
  hideClearButton?: boolean;
}

/** dd.MM.yyyy HH:mm görünümü; soru oluşturma ile aynı datetime-local popover. */
const FeatureTemplateDateInput: React.FC<FeatureTemplateDateInputProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  currentLanguage,
  size = 'small',
  fullWidth = true,
  hideClearButton = false,
}) => {
  const theme = useTheme();
  const fieldRootRef = useRef<HTMLDivElement | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [draftLocal, setDraftLocal] = useState('');

  const displayValue = (value ?? '').trim();
  const parsed = displayValue ? parseFeatureTemplateDateInput(displayValue) : null;
  const popoverOpen = Boolean(anchorEl);

  const openPopover = () => {
    if (disabled || !fieldRootRef.current) return;
    setDraftLocal(parsed ? toDatetimeLocalValue(parsed) : '');
    setAnchorEl(fieldRootRef.current);
  };

  const closePopover = () => setAnchorEl(null);

  const applyFromPopover = () => {
    const d = parseDatetimeLocalValue(draftLocal);
    if (required && !d) return;
    onChange(d ? formatFeatureTemplateDate(d) : '');
    setAnchorEl(null);
  };

  const draftValid = draftLocal.trim() !== '' && parseDatetimeLocalValue(draftLocal) != null;
  const tickDisabled = required ? !draftValid : false;

  return (
    <>
      <Box ref={fieldRootRef} sx={{ width: fullWidth ? '100%' : 'auto', minWidth: 0 }}>
        <TextField
          fullWidth={fullWidth}
          size={size}
          label={label}
          value={displayValue}
          disabled={disabled}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {!hideClearButton && !required && displayValue && !disabled ? (
                    <IconButton size="small" onClick={() => onChange('')} edge="end" aria-label={t('clear', currentLanguage)}>
                      <Clear fontSize="small" />
                    </IconButton>
                  ) : null}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPopover();
                    }}
                    disabled={disabled}
                    edge="end"
                    aria-label={t('feature_template_pick_date', currentLanguage)}
                  >
                    <Event fontSize="small" />
                  </IconButton>
                </Box>
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Popover
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={closePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        marginThreshold={0}
        PaperProps={{
          sx: { p: 1, zIndex: theme.zIndex.modal + 10, mt: 0.5 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <TextField
            type="datetime-local"
            size="small"
            value={draftLocal}
            onChange={(e) => setDraftLocal(e.target.value)}
            inputProps={{ step: 60 }}
            label={t('feature_template_pick_date', currentLanguage)}
            InputLabelProps={{ shrink: true }}
            autoFocus
          />
          <IconButton
            size="small"
            color="primary"
            onClick={applyFromPopover}
            disabled={tickDisabled}
            aria-label={t('feature_template_date_apply', currentLanguage)}
          >
            <Check sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Popover>
    </>
  );
};

export default FeatureTemplateDateInput;
