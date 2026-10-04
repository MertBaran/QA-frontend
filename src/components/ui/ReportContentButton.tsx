import React, { useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { FlagOutlined } from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';
import { t } from '../../utils/translations';

/** Sağ alt köşeye oturan göstermelik bildir düğmesi. Kayıt tutmaz. */
const ReportContentButton: React.FC = () => {
  const { currentLanguage } = useAppSelector(state => state.language);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);
  const ignoreNextClick = useRef(false);

  const close = () => {
    ignoreNextClick.current = true;
    setOpen(false);
    setReason('');
    setSent(false);
  };

  return (
    <>
      <Tooltip title={t('report', currentLanguage)}>
        <IconButton
          size="small"
          aria-label={t('report', currentLanguage)}
          onClick={event => {
            event.stopPropagation();
            if (ignoreNextClick.current) {
              ignoreNextClick.current = false;
              return;
            }
            setOpen(true);
          }}
          sx={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            zIndex: 3,
            color: 'text.secondary',
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            '&:hover': { color: 'primary.main' },
          }}
        >
          <FlagOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={close}
        fullWidth
        maxWidth="sm"
        onMouseDown={event => event.stopPropagation()}
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <DialogTitle>{t('report_title', currentLanguage)}</DialogTitle>
        <DialogContent>
          {sent ? (
            <Typography sx={{ pt: 1 }}>{t('report_sent', currentLanguage)}</Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('report_placeholder_body', currentLanguage)}
              </Typography>
              <TextField
                label={t('report_reason', currentLanguage)}
                placeholder={t('report_reason_placeholder', currentLanguage)}
                value={reason}
                onChange={event => setReason(event.target.value.slice(0, 500))}
                fullWidth
                multiline
                minRows={3}
                inputProps={{ maxLength: 500 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          {sent ? (
            <Button
              onMouseDown={event => event.preventDefault()}
              onClick={event => {
                event.stopPropagation();
                close();
              }}
            >
              {t('close', currentLanguage)}
            </Button>
          ) : (
            <>
              <Button
                onMouseDown={event => event.preventDefault()}
                onClick={event => {
                  event.stopPropagation();
                  close();
                }}
              >
                {t('cancel', currentLanguage)}
              </Button>
              <Button
                variant="contained"
                onMouseDown={event => event.preventDefault()}
                onClick={event => {
                  event.stopPropagation();
                  setSent(true);
                }}
                disabled={!reason.trim()}
              >
                {t('report_submit', currentLanguage)}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReportContentButton;
