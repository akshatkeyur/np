'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Fade,
} from '@mui/material';
import { Lock } from '@mui/icons-material';

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check local storage for existing token
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@system.local' }),
      });
      const data = await res.json();
      if (data.success) {
        setStep(2);
      } else {
        setError(data.message || 'Failed to request OTP');
      }
    } catch {
      setError('Network error. Is the backend running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@system.local', otp }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('auth_token', data.token);
        setIsAuthenticated(true);
      } else {
        setError(data.message || 'Invalid or expired OTP');
      }
    } catch {
      setError('Network error during verification.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
      <Fade in={true}>
        <Paper
          elevation={12}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            borderRadius: 4,
            bgcolor: 'rgba(15, 20, 35, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(124,77,255,0.2)',
            zIndex: 1,
            position: 'relative',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'rgba(124,77,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                border: '1px solid rgba(124,77,255,0.3)'
              }}
            >
              <Lock sx={{ color: '#7C4DFF', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
              Secure Access
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
              {step === 1 ? 'Click below to receive a secure code.' : 'Check your configured email for the 6-digit code.'}
            </Typography>
          </Box>

          <form onSubmit={step === 1 ? handleRequestOtp : handleVerifyOtp}>
            {step === 1 ? null : (
              <TextField
                fullWidth
                placeholder="123456"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                autoFocus
                sx={{
                  mb: 3,
                  input: {
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    letterSpacing: '0.2em',
                  },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.2)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(124,77,255,0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#7C4DFF' },
                  },
                }}
              />
            )}

            {error && (
              <Typography color="error" variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
                {error}
              </Typography>
            )}

            <Button
              fullWidth
              type="submit"
              disabled={loading}
              variant="contained"
              sx={{
                py: 1.5,
                bgcolor: '#7C4DFF',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: '#651FFF',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : step === 1 ? (
                'Send OTP'
              ) : (
                'Verify & Login'
              )}
            </Button>
            
            
            {step === 2 && (
              <Button
                fullWidth
                variant="text"
                disabled={loading}
                onClick={() => setStep(1)}
                sx={{ mt: 1, color: 'rgba(255,255,255,0.6)', textTransform: 'none' }}
              >
                Go back
              </Button>
            )}
          </form>
        </Paper>
      </Fade>
    </Box>
  );
}
