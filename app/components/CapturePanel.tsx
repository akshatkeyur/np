'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Chip,
  Collapse,
  Divider,
  InputAdornment,
  IconButton,
  Alert,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  CameraAlt,
  Key,
  Link as LinkIcon,
  Person,
  Lock,
  ExpandMore,
  ExpandLess,
  Refresh,
  CheckCircle,
  Code,
  ContentCopy,
  Schedule,
  BugReport,
} from '@mui/icons-material';
import dayjs from 'dayjs';

interface CapturePanelProps {
  onCaptured: (encryptedPassword: string, user: string, baseUrl: string) => void;
  isRunning: boolean;
}

interface DebugLog {
  time: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

interface CaptureState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  encryptedPassword: string;
  capturedUser: string;
  capturedAt: string | null;
  rawPayload: string | null;
  debugLogs: DebugLog[];
}

const CapturePanel: React.FC<CapturePanelProps> = ({ onCaptured, isRunning }) => {
  const [loginUrl, setLoginUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showDebugLogs, setShowDebugLogs] = useState(true); // auto-open on error
  const [usernameSelector, setUsernameSelector] = useState('');
  const [passwordSelector, setPasswordSelector] = useState('');
  const [submitSelector, setSubmitSelector] = useState('');
  const [copied, setCopied] = useState(false);

  const [capture, setCapture] = useState<CaptureState>({
    status: 'idle',
    message: '',
    encryptedPassword: '',
    capturedUser: '',
    capturedAt: null,
    rawPayload: null,
    debugLogs: [],
  });

  const handleCapture = async () => {
    if (!loginUrl || !username || !password) {
      setCapture((prev) => ({
        ...prev,
        status: 'error',
        message: 'Login URL, username, and password are required.',
      }));
      return;
    }

    setCapture({
      status: 'loading',
      message: 'Launching headless browser and intercepting login request...',
      encryptedPassword: '',
      capturedUser: '',
      capturedAt: null,
      rawPayload: null,
      debugLogs: [],
    });
    setShowDebugLogs(false);

    try {
      const res = await fetch('/api/capture-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frontend_login_url: loginUrl,
          username,
          password,
          ...(usernameSelector && { username_selector: usernameSelector }),
          ...(passwordSelector && { password_selector: passwordSelector }),
          ...(submitSelector && { submit_selector: submitSelector }),
        }),
      });

      const data = await res.json();

      if (data.success) {
        const now = dayjs().format('HH:mm:ss');
        setCapture({
          status: 'success',
          message: '✅ Encrypted password captured successfully!',
          encryptedPassword: data.encryptedPassword,
          capturedUser: data.user,
          capturedAt: now,
          rawPayload: JSON.stringify(data.rawPayload, null, 2),
          debugLogs: data.debugLogs ?? [],
        });
        onCaptured(data.encryptedPassword, data.user, data.capturedBaseUrl ?? '');
      } else {
        setCapture({
          status: 'error',
          message: data.error ?? 'Capture failed for an unknown reason.',
          encryptedPassword: '',
          capturedUser: '',
          capturedAt: null,
          rawPayload: null,
          debugLogs: data.debugLogs ?? [],
        });
        setShowDebugLogs(true); // auto-expand on error
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Network error';
      setCapture({
        status: 'error',
        message: `Request failed: ${errMsg}`,
        encryptedPassword: '',
        capturedUser: '',
        capturedAt: null,
        rawPayload: null,
        debugLogs: [],
      });
      setShowDebugLogs(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(capture.encryptedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = capture.status === 'loading';

  return (
    <Card
      sx={{
        overflow: 'visible',
        position: 'relative',
        mt: 2,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #FF6B6B, #FFD740, #69F0AE)',
          borderRadius: '16px 16px 0 0',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(255,107,107,0.2), rgba(255,215,64,0.2))',
              border: '1px solid rgba(255,107,107,0.3)',
              display: 'flex',
            }}
          >
            <CameraAlt sx={{ fontSize: 20, color: '#FFD740' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
              Capture Encrypted Password
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              One-time capture via headless browser interception
            </Typography>
          </Box>
          {capture.status === 'success' && (
            <Chip
              icon={<CheckCircle sx={{ fontSize: 14 }} />}
              label="Captured"
              size="small"
              color="success"
              sx={{ ml: 'auto', fontSize: '0.7rem', height: 22 }}
            />
          )}
        </Box>

        {isLoading && (
          <LinearProgress
            sx={{
              mb: 2,
              borderRadius: 4,
              height: 3,
              backgroundColor: 'rgba(255, 215, 64, 0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #FF6B6B, #FFD740, #69F0AE)',
              },
            }}
          />
        )}

        {/* Status alert */}
        {capture.status !== 'idle' && (
          <Alert
            severity={
              capture.status === 'success'
                ? 'success'
                : capture.status === 'error'
                ? 'error'
                : 'info'
            }
            sx={{ mb: 2, borderRadius: 3, fontSize: '0.8rem' }}
          >
            {capture.message}
          </Alert>
        )}

        {/* Login URL */}
        <TextField
          id="capture-login-url"
          fullWidth
          label="Frontend Login URL"
          placeholder="https://app.example.com/login"
          value={loginUrl}
          onChange={(e) => setLoginUrl(e.target.value)}
          disabled={isLoading || isRunning}
          size="small"
          sx={{ mb: 1.5 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon sx={{ color: '#FFD740', fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
          <TextField
            id="capture-username"
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading || isRunning}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: '#FFD740', fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            id="capture-password"
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading || isRunning}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#FFD740', fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {/* Advanced selectors */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            mb: 1,
            color: 'text.secondary',
            '&:hover': { color: 'text.primary' },
            transition: 'color 0.2s',
          }}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? <ExpandLess sx={{ fontSize: 18, mr: 0.5 }} /> : <ExpandMore sx={{ fontSize: 18, mr: 0.5 }} />}
          <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
            CUSTOM SELECTORS (optional)
          </Typography>
        </Box>
        <Collapse in={showAdvanced}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,215,64,0.1)',
              mb: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <TextField
              id="capture-username-selector"
              fullWidth
              label='Username Selector (default: input[name="username"])'
              value={usernameSelector}
              onChange={(e) => setUsernameSelector(e.target.value)}
              disabled={isLoading}
              size="small"
              placeholder='input[name="username"]'
            />
            <TextField
              id="capture-password-selector"
              fullWidth
              label='Password Selector (default: input[name="password"])'
              value={passwordSelector}
              onChange={(e) => setPasswordSelector(e.target.value)}
              disabled={isLoading}
              size="small"
              placeholder='input[name="password"]'
            />
            <TextField
              id="capture-submit-selector"
              fullWidth
              label='Submit Selector (default: button[type="submit"])'
              value={submitSelector}
              onChange={(e) => setSubmitSelector(e.target.value)}
              disabled={isLoading}
              size="small"
              placeholder='button[type="submit"]'
            />
          </Box>
        </Collapse>

        {/* Capture button */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            id="btn-capture-password"
            variant="contained"
            startIcon={isLoading ? undefined : capture.status === 'success' ? <Refresh /> : <CameraAlt />}
            onClick={handleCapture}
            disabled={isLoading || isRunning}
            sx={{
              flex: 1,
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FFD740 100%)',
              color: '#0A0E1A',
              fontWeight: 700,
              '&:hover': {
                background: 'linear-gradient(135deg, #FF5252 0%, #FFC400 100%)',
              },
              '&.Mui-disabled': {
                opacity: 0.5,
              },
            }}
          >
            {isLoading
              ? 'Capturing...'
              : capture.status === 'success'
              ? 'Re-capture'
              : 'Capture Encrypted Password'}
          </Button>
        </Box>

        {/* Captured result */}
        {capture.status === 'success' && (
          <>
            <Divider sx={{ borderColor: 'rgba(105,240,174,0.15)', my: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Key sx={{ fontSize: 16, color: '#69F0AE' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                Captured Encrypted Password
              </Typography>
              {capture.capturedAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                  <Schedule sx={{ fontSize: 12, color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                    {capture.capturedAt}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: 'rgba(105,240,174,0.05)',
                border: '1px solid rgba(105,240,174,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.68rem',
                  color: '#69F0AE',
                  wordBreak: 'break-all',
                  flex: 1,
                }}
              >
                {capture.encryptedPassword.slice(0, 100)}
                {capture.encryptedPassword.length > 100 ? '...' : ''}
              </Typography>
              <Tooltip title={copied ? 'Copied!' : 'Copy full value'}>
                <IconButton size="small" onClick={handleCopy}>
                  <ContentCopy sx={{ fontSize: 16, color: copied ? '#69F0AE' : 'text.secondary' }} />
                </IconButton>
              </Tooltip>
            </Box>

            <Typography variant="caption" sx={{ color: 'success.main', mt: 0.5, display: 'block' }}>
              ✓ Autofilled into runner — will be used directly without re-encryption
            </Typography>

            {/* Debug mode */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                mt: 1.5,
                color: 'text.secondary',
                '&:hover': { color: 'text.primary' },
              }}
              onClick={() => setShowDebug(!showDebug)}
            >
              <Code sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {showDebug ? 'Hide' : 'Show'} raw intercepted payload
              </Typography>
            </Box>
            <Collapse in={showDebug}>
              <Box
                sx={{
                  mt: 1,
                  p: 1.5,
                  borderRadius: 2,
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(0,229,255,0.1)',
                  maxHeight: 150,
                  overflow: 'auto',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.68rem',
                    color: '#94A3B8',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {capture.rawPayload}
                </Typography>
              </Box>
            </Collapse>
          </>
        )}
        {/* Debug Logs Panel - shown after any capture attempt */}
        {(capture.debugLogs.length > 0) && (
          <>
            <Divider sx={{ borderColor: 'rgba(255,215,64,0.1)', my: 2 }} />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                mb: 1,
                color: capture.status === 'error' ? 'error.main' : 'text.secondary',
                '&:hover': { color: 'text.primary' },
              }}
              onClick={() => setShowDebugLogs(!showDebugLogs)}
            >
              {showDebugLogs ? <ExpandLess sx={{ fontSize: 16, mr: 0.5 }} /> : <ExpandMore sx={{ fontSize: 16, mr: 0.5 }} />}
              <BugReport sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                DEBUG LOGS ({capture.debugLogs.length} entries)
              </Typography>
              <Tooltip title="Copy all logs">
                <IconButton
                  size="small"
                  sx={{ ml: 'auto' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const text = capture.debugLogs
                      .map((l) => `[${l.time}] [${l.level.toUpperCase()}] ${l.message}`)
                      .join('\n');
                    navigator.clipboard.writeText(text);
                  }}
                >
                  <ContentCopy sx={{ fontSize: 14, color: 'text.secondary' }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Collapse in={showDebugLogs}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,215,64,0.1)',
                  maxHeight: 280,
                  overflow: 'auto',
                  '&::-webkit-scrollbar': { width: 4 },
                  '&::-webkit-scrollbar-thumb': { background: 'rgba(255,215,64,0.2)', borderRadius: 4 },
                }}
              >
                {capture.debugLogs.map((entry, i) => {
                  const color =
                    entry.level === 'error'
                      ? '#FF5252'
                      : entry.level === 'warn'
                      ? '#FFD740'
                      : entry.level === 'success'
                      ? '#69F0AE'
                      : '#94A3B8';
                  return (
                    <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.3 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: 'rgba(148,163,184,0.5)', fontFamily: 'monospace', fontSize: '0.65rem', whiteSpace: 'nowrap' }}
                      >
                        {entry.time}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color,
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: '0.68rem',
                          wordBreak: 'break-all',
                          lineHeight: 1.6,
                        }}
                      >
                        {entry.message}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Collapse>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CapturePanel;
