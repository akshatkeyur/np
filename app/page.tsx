'use client';

import React, { useState, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Alert,
  Snackbar,
} from '@mui/material';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BugReport, Bolt } from '@mui/icons-material';
import theme from './theme';
import Form from './components/Form';
import StatusPanel from './components/StatusPanel';
import Controls from './components/Controls';
import { useRunner } from './hooks/useRunner';
import { login } from './utils/api';
import { FormData } from './types';
import dayjs from 'dayjs';

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    base_url: '',
    username: '',
    password: '',
    concurrency: 5,
    concurrency_interval: 2000,
    start_time: dayjs().format('YYYY-MM-DDTHH:mm'),
    end_time: dayjs().add(5, 'minute').format('YYYY-MM-DDTHH:mm'),
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const { stats, start, stop, exportLogs } = useRunner();

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTestCredentials = useCallback(async () => {
    if (!formData.base_url || !formData.username || !formData.password) {
      showSnackbar('Please fill in all credential fields', 'warning');
      return;
    }
    setIsTesting(true);
    setIsAuthenticated(false);
    try {
      await login({
        base_url: formData.base_url,
        username: formData.username,
        password: formData.password,
      });
      setIsAuthenticated(true);
      showSnackbar('Credentials verified successfully!', 'success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setIsAuthenticated(false);
      showSnackbar(`Authentication failed: ${errorMsg}`, 'error');
    } finally {
      setIsTesting(false);
    }
  }, [formData]);

  const handleRun = useCallback(() => {
    if (!formData.start_time || !formData.end_time) {
      showSnackbar('Please set start and end times', 'warning');
      return;
    }
    if (dayjs(formData.end_time).isBefore(dayjs(formData.start_time))) {
      showSnackbar('End time must be after start time', 'error');
      return;
    }
    start(formData);
  }, [formData, start]);

  const canRun =
    !!formData.base_url &&
    !!formData.username &&
    !!formData.password &&
    !!formData.start_time &&
    !!formData.end_time;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 3, md: 4 } }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 1,
              }}
            >
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
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', maxWidth: 500, mx: 'auto' }}
            >
              Test your API endpoints with configurable concurrent requests,
              real-time monitoring, and detailed execution logs.
            </Typography>
          </Box>

          {/* Main Content */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Form
                formData={formData}
                onChange={setFormData}
                disabled={stats.isRunning}
              />
            </Grid>

            <Grid item xs={12} md={7}>
              <StatusPanel stats={stats} />
            </Grid>
          </Grid>

          {/* Controls */}
          <Controls
            onTestCredentials={handleTestCredentials}
            onRun={handleRun}
            onStop={stop}
            onExportLogs={exportLogs}
            isRunning={stats.isRunning}
            isTesting={isTesting}
            isAuthenticated={isAuthenticated}
            hasLogs={stats.logs.length > 0}
            canRun={canRun}
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
    </ThemeProvider>
  );
}
