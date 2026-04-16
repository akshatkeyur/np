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
} from '@mui/material';
import {
  Link as LinkIcon,
  Person,
  Lock,
  Speed,
  Timer,
  CalendarMonth,
} from '@mui/icons-material';
import { FormData } from '../types';
import dayjs from 'dayjs';

interface FormProps {
  formData: FormData;
  onChange: (data: FormData) => void;
  disabled?: boolean;
}

const Form: React.FC<FormProps> = ({ formData, onChange, disabled }) => {
  const handleChange = (field: keyof FormData, value: string | number) => {
    onChange({ ...formData, [field]: value });
  };

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
          background: 'linear-gradient(90deg, #7C4DFF, #00E5FF, #69F0AE)',
          borderRadius: '16px 16px 0 0',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.15rem' } }}>
            API Configuration
          </Typography>
          <Chip
            label="Required"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 22 }}
          />
        </Box>

        <Grid container spacing={2}>
          {/* Credentials Section */}
          <Grid item xs={12}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}
            >
              Credentials
            </Typography>
          </Grid>

          <Grid item xs={12}>
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
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
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
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: 'primary.main', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
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
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ borderColor: 'rgba(124, 77, 255, 0.1)', my: 0.5 }} />
          </Grid>

          {/* Concurrency Section */}
          <Grid item xs={12}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}
            >
              Concurrency Settings
            </Typography>
          </Grid>

          <Grid item xs={6}>
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

          <Grid item xs={6}>
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

          <Grid item xs={12}>
            <Divider sx={{ borderColor: 'rgba(124, 77, 255, 0.1)', my: 0.5 }} />
          </Grid>

          {/* Time Window Section */}
          <Grid item xs={12}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}
            >
              Execution Window
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
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

          <Grid item xs={12} sm={6}>
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
