'use client';

import React from 'react';
import {
  Card,
  CardContent,
  TextField,
  Grid,
  Typography,
  InputAdornment,
  Box,
  Divider,
  Chip,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Link as LinkIcon,
  Person,
  Lock,
  Speed,
  Timer,
  CalendarMonth,
  Key,
  CheckCircle,
  Login,
} from '@mui/icons-material';
import { FormData } from '../types';

interface FormProps {
  formData: FormData;
  onChange: (data: FormData) => void;
  onGetPatientToken: () => void;
  isGettingPatientToken: boolean;
  hasPatientToken: boolean;
  patientTokenUser?: string;
  disabled?: boolean;
}

const Form: React.FC<FormProps> = ({
  formData,
  onChange,
  onGetPatientToken,
  isGettingPatientToken,
  hasPatientToken,
  patientTokenUser,
  disabled,
}) => {
  const handleChange = (field: keyof FormData, value: string | number) => {
    onChange({ ...formData, [field]: value });
  };

  const isCaptured = !!formData.manual_encrypted_password;
  const canGetPatientToken =
    !!formData.frontend_login_url &&
    !!formData.username &&
    !!formData.password &&
    !disabled &&
    !isGettingPatientToken;

  return (
    <Card
      sx={{
        overflow: 'visible',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: isCaptured
            ? 'linear-gradient(90deg, #69F0AE, #00E5FF, #7C4DFF)'
            : 'linear-gradient(90deg, #7C4DFF, #00E5FF, #69F0AE)',
          borderRadius: '16px 16px 0 0',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.15rem' } }}>
            API Configuration
          </Typography>
          {isCaptured ? (
            <Chip
              icon={<CheckCircle sx={{ fontSize: 14 }} />}
              label="Auto-filled"
              size="small"
              color="success"
              variant="filled"
              sx={{ fontSize: '0.7rem', height: 22 }}
            />
          ) : (
            <Chip
              label="Required"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 22 }}
            />
          )}
          {hasPatientToken && (
            <Chip
              icon={<CheckCircle sx={{ fontSize: 14 }} />}
              label="Patient Token Ready"
              size="small"
              color="secondary"
              variant="filled"
              sx={{ fontSize: '0.7rem', height: 22 }}
            />
          )}
        </Box>

        {/* Captured mode info banner */}
        {isCaptured && (
          <Alert
            severity="success"
            icon={<Key sx={{ fontSize: 18 }} />}
            sx={{
              mb: 2,
              borderRadius: 3,
              fontSize: '0.78rem',
              background: 'rgba(105,240,174,0.06)',
              border: '1px solid rgba(105,240,174,0.15)',
              '& .MuiAlert-icon': { color: '#69F0AE' },
            }}
          >
            Credentials auto-filled from capture. Configure timing below, then hit <strong>Run Test</strong>.
          </Alert>
        )}

        {hasPatientToken && (
          <Alert
            severity="success"
            icon={<Login sx={{ fontSize: 18 }} />}
            sx={{
              mb: 2,
              borderRadius: 3,
              fontSize: '0.78rem',
              background: 'rgba(0,229,255,0.06)',
              border: '1px solid rgba(0,229,255,0.15)',
              '& .MuiAlert-icon': { color: '#00E5FF' },
            }}
          >
            Patient token acquired{patientTokenUser ? ` for ${patientTokenUser}` : ''}. <strong>Patient Test</strong> is ready.
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Credentials Section */}
          <Grid size={12}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}
            >
              {isCaptured ? 'Credentials (captured)' : 'Credentials'}
            </Typography>
          </Grid>

          <Grid size={12}>
            <TextField
              id="frontend-login-url"
              fullWidth
              label="Frontend Login URL"
              placeholder="https://app.example.com/login"
              value={formData.frontend_login_url}
              onChange={(e) => handleChange('frontend_login_url', e.target.value)}
              disabled={disabled}
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Login sx={{ color: 'secondary.main', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              id="base-url"
              fullWidth
              label="Base URL"
              placeholder="api.example.com"
              value={formData.base_url}
              onChange={(e) => handleChange('base_url', e.target.value)}
              disabled={disabled}
              size="small"
              slotProps={{
                input: {
                  readOnly: isCaptured,
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon sx={{ color: isCaptured ? '#69F0AE' : 'primary.main', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  ...(isCaptured && {
                    endAdornment: (
                      <InputAdornment position="end">
                        <CheckCircle sx={{ color: '#69F0AE', fontSize: 16 }} />
                      </InputAdornment>
                    ),
                  }),
                },
              }}
              sx={isCaptured ? {
                '& .MuiOutlinedInput-root': {
                  borderColor: 'rgba(105,240,174,0.3)',
                  '& fieldset': { borderColor: 'rgba(105,240,174,0.3)' },
                },
              } : {}}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              id="username"
              fullWidth
              label="Username"
              placeholder="admin@example.com"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              disabled={disabled}
              size="small"
              slotProps={{
                input: {
                  readOnly: isCaptured,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: isCaptured ? '#69F0AE' : 'primary.main', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  ...(isCaptured && {
                    endAdornment: (
                      <InputAdornment position="end">
                        <CheckCircle sx={{ color: '#69F0AE', fontSize: 16 }} />
                      </InputAdornment>
                    ),
                  }),
                },
              }}
              sx={isCaptured ? {
                '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(105,240,174,0.3)' },
              } : {}}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            {isCaptured ? (
              <TextField
                id="password"
                fullWidth
                label="Password"
                value="●●●●●●●● (encrypted)"
                size="small"
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Key sx={{ color: '#69F0AE', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <CheckCircle sx={{ color: '#69F0AE', fontSize: 16 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(105,240,174,0.3)' },
                }}
              />
            ) : (
              <TextField
                id="password"
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                disabled={disabled}
                size="small"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'primary.main', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          </Grid>

          <Grid size={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button
                id="btn-get-patient-token"
                variant="outlined"
                color={hasPatientToken ? 'success' : 'secondary'}
                startIcon={
                  isGettingPatientToken ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Login />
                  )
                }
                onClick={onGetPatientToken}
                disabled={!canGetPatientToken}
                sx={{
                  minWidth: 190,
                  borderWidth: 2,
                  '&:hover': { borderWidth: 2 },
                }}
              >
                {isGettingPatientToken
                  ? 'Getting Token...'
                  : hasPatientToken
                  ? 'Refresh Patient Token'
                  : 'Get Patient Token'}
              </Button>
            </Box>
          </Grid>

          <Grid size={12}>
            <Divider sx={{ borderColor: 'rgba(124, 77, 255, 0.1)', my: 0.5 }} />
          </Grid>

          {/* Concurrency Section */}
          <Grid size={12}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}
            >
              Concurrency Settings
            </Typography>
          </Grid>

          <Grid size={6}>
            <TextField
              id="concurrency"
              fullWidth
              label="Concurrency"
              type="number"
              value={formData.concurrency}
              onChange={(e) =>
                handleChange('concurrency', Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))
              }
              disabled={disabled}
              size="small"
              helperText="Max 20"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Speed sx={{ color: 'secondary.main', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
                htmlInput: { min: 1, max: 20 },
              }}
            />
          </Grid>

          <Grid size={6}>
            <TextField
              id="concurrency-interval"
              fullWidth
              label="Interval (ms)"
              type="number"
              value={formData.concurrency_interval}
              onChange={(e) =>
                handleChange('concurrency_interval', Math.max(500, parseInt(e.target.value) || 500))
              }
              disabled={disabled}
              size="small"
              helperText="Min 500ms"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Timer sx={{ color: 'secondary.main', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
                htmlInput: { min: 500, step: 100 },
              }}
            />
          </Grid>

          <Grid size={12}>
            <Divider sx={{ borderColor: 'rgba(124, 77, 255, 0.1)', my: 0.5 }} />
          </Grid>

          {/* Time Window Section */}
          <Grid size={12}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}
            >
              Execution Window
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              id="start-time"
              fullWidth
              label="Start Time"
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => handleChange('start_time', e.target.value)}
              disabled={disabled}
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonth sx={{ color: 'success.main', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
                inputLabel: { shrink: true },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              id="end-time"
              fullWidth
              label="End Time"
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => handleChange('end_time', e.target.value)}
              disabled={disabled}
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonth sx={{ color: 'error.main', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
                inputLabel: { shrink: true },
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default Form;
