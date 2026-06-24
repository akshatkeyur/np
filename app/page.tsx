'use client';

import React, { useState, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Bolt, Key } from '@mui/icons-material';
import theme from './theme';
import Form from './components/Form';
import StatusPanel from './components/StatusPanel';
import Controls from './components/Controls';
import CapturePanel from './components/CapturePanel';
import AuthGate from './components/AuthGate';
import { useRunner } from './hooks/useRunner';
import { getPatientToken } from './utils/api';
import { FormData } from './types';
import dayjs from 'dayjs';

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    frontend_login_url: 'https://app.subqdocs.ai/login',
    base_url: '',
    username: 'adrian.tinajero@yopmail.com',
    password: 'Dev@1234',
    concurrency: 5,
    concurrency_interval: 2000,
    start_time: dayjs().format('YYYY-MM-DDTHH:mm'),
    end_time: dayjs().add(5, 'minute').format('YYYY-MM-DDTHH:mm'),
    manual_encrypted_password: undefined,
  });

  const [patientToken, setPatientToken] = useState<string | null>(null);
  const [patientTokenUser, setPatientTokenUser] = useState('');
  const [isGettingPatientToken, setIsGettingPatientToken] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const { stats, startDashboard, startPatient, stop, exportLogs } = useRunner();

  const showSnackbar = useCallback(
    (
      message: string,
      severity: 'success' | 'error' | 'info' | 'warning'
    ) => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  // ── Capture callback: auto-fills EVERYTHING so the user can just hit Run ──
  const handleCaptured = useCallback(
    (encryptedPassword: string, user: string, baseUrl: string) => {
      setFormData((prev) => ({
        ...prev,
        base_url: baseUrl || prev.base_url,
        username: user || prev.username,
        manual_encrypted_password: encryptedPassword,
      }));
      showSnackbar(
        '🔑 Credentials captured! Base URL & username auto-filled. Configure timing and hit Run Test.',
        'success'
      );
    },
    [showSnackbar]
  );

  const validateExecutionWindow = useCallback(() => {
    if (!formData.start_time || !formData.end_time) {
      showSnackbar('Please set start and end times', 'warning');
      return false;
    }
    if (dayjs(formData.end_time).isBefore(dayjs(formData.start_time))) {
      showSnackbar('End time must be after start time', 'error');
      return false;
    }
    return true;
  }, [formData.end_time, formData.start_time, showSnackbar]);

  const handleGetPatientToken = useCallback(async () => {
    if (!formData.frontend_login_url || !formData.username || !formData.password) {
      showSnackbar('Frontend login URL, username, and password are required.', 'warning');
      return;
    }
    setIsGettingPatientToken(true);
    try {
      const data = await getPatientToken({
        frontend_login_url: formData.frontend_login_url,
        username: formData.username,
        password: formData.password,
      });
      if (!data.success || !data.token) {
        showSnackbar(data.error ?? 'Failed to get patient token.', 'error');
        return;
      }

      const userLabel = data.user?.email
        || [data.user?.first_name, data.user?.last_name].filter(Boolean).join(' ').trim();

      setFormData((prev) => ({
        ...prev,
        base_url: data.capturedBaseUrl || prev.base_url,
      }));
      setPatientToken(data.token);
      setPatientTokenUser(userLabel);
      showSnackbar('Patient token acquired successfully. Patient Test is ready.', 'success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Token acquisition failed';
      showSnackbar(`Failed to get patient token: ${errorMsg}`, 'error');
    } finally {
      setIsGettingPatientToken(false);
    }
  }, [formData.frontend_login_url, formData.password, formData.username, showSnackbar]);

  // ── Run handler ──
  const handleRun = useCallback(() => {
    if (!validateExecutionWindow()) {
      return;
    }
    startDashboard(formData);
  }, [formData, startDashboard, validateExecutionWindow]);

  const handlePatientTest = useCallback(() => {
    if (!patientToken) {
      showSnackbar('Get a patient token before starting Patient Test.', 'warning');
      return;
    }
    if (!validateExecutionWindow()) {
      return;
    }
    startPatient(formData, patientToken);
  }, [formData, patientToken, showSnackbar, startPatient, validateExecutionWindow]);

  const hasCapturedPassword = !!formData.manual_encrypted_password;
  const hasPatientToken = !!patientToken;
  const hasBothCredentialModes = hasCapturedPassword && hasPatientToken;

  const canRunDashboard =
    !!formData.base_url &&
    !!formData.username &&
    (!!formData.password || hasCapturedPassword) &&
    !!formData.start_time &&
    !!formData.end_time &&
    (!hasPatientToken || hasBothCredentialModes);

  const canRunPatient =
    !!formData.base_url &&
    !!formData.start_time &&
    !!formData.end_time &&
    hasPatientToken &&
    (!hasCapturedPassword || hasBothCredentialModes);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthGate>
        <Box
        sx={{
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at top, #1a1040 0%, #0A0E1A 50%, #060810 100%)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%237C4DFF\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            pointerEvents: 'none',
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: { xs: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(124,77,255,0.2), rgba(0,229,255,0.2))',
                  border: '1px solid rgba(124,77,255,0.2)',
                  display: 'flex',
                }}
              >
                <Bolt sx={{ fontSize: 28, color: '#7C4DFF' }} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  background: 'linear-gradient(135deg, #F1F5F9, #7C4DFF)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.5rem', md: '2rem' },
                }}
              >
                API Stress Tester
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Concurrent API load testing with headless browser credential capture
              </Typography>
              {hasCapturedPassword && (
                <Chip
                  icon={<Key sx={{ fontSize: 14 }} />}
                  label="Captured Password Active"
                  size="small"
                  color="warning"
                  variant="filled"
                  sx={{ fontSize: '0.7rem', height: 22 }}
                />
              )}
            </Box>
          </Box>

          {/* Main Layout */}
          <Grid container spacing={3}>
            {/* Left: Config + Capture */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Form
                formData={formData}
                onChange={setFormData}
                onGetPatientToken={handleGetPatientToken}
                isGettingPatientToken={isGettingPatientToken}
                hasPatientToken={hasPatientToken}
                patientTokenUser={patientTokenUser}
                disabled={stats.isRunning}
              />
              <CapturePanel
                onCaptured={handleCaptured}
                isRunning={stats.isRunning}
              />
            </Grid>

            {/* Right: Status Panel */}
            <Grid size={{ xs: 12, md: 8 }}>
              <StatusPanel stats={stats} />
            </Grid>
          </Grid>

          {/* Controls */}
          <Controls
            onRun={handleRun}
            onPatientTest={handlePatientTest}
            onStop={stop}
            onExportLogs={exportLogs}
            isRunning={stats.isRunning}
            hasLogs={stats.logs.length > 0}
            canRunDashboard={canRunDashboard && !isGettingPatientToken}
            canRunPatient={canRunPatient && !isGettingPatientToken}
            hasCapturedPassword={hasCapturedPassword}
            hasPatientToken={hasPatientToken}
          />
        </Container>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </AuthGate>
    </ThemeProvider>
  );
}
