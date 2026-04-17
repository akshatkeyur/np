'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  AccessTime,
  TrendingUp,
  FiberManualRecord,
} from '@mui/icons-material';
import { RunnerStats } from '../types';

interface StatusPanelProps {
  stats: RunnerStats;
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  glow?: string;
}> = ({ icon, label, value, color, glow }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 3,
      background: 'rgba(17, 24, 39, 0.6)',
      border: `1px solid ${color}22`,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
        border: `1px solid ${color}44`,
        transform: 'translateY(-2px)',
      },
      '&::after': glow
        ? {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: glow,
          }
        : undefined,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
      {icon}
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
    </Box>
    <Typography
      variant="h5"
      sx={{
        fontWeight: 700,
        color,
        fontVariantNumeric: 'tabular-nums',
        fontSize: { xs: '1.3rem', md: '1.5rem' },
      }}
    >
      {value}
    </Typography>
  </Box>
);

const StatusPanel: React.FC<StatusPanelProps> = ({ stats }) => {
  const successRate =
    stats.totalRequests > 0
      ? Math.round((stats.successCount / stats.totalRequests) * 100)
      : 0;

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          background: stats.isRunning
            ? 'linear-gradient(90deg, #69F0AE, #00E5FF, #7C4DFF)'
            : 'linear-gradient(90deg, #475569, #64748B)',
          borderRadius: '16px 16px 0 0',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.15rem' } }}>
              Live Status
            </Typography>
            <Chip
              icon={
                <FiberManualRecord
                  sx={{
                    fontSize: 10,
                    animation: stats.isRunning ? 'blink 1s infinite' : 'none',
                    '@keyframes blink': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.3 },
                    },
                  }}
                />
              }
              label={stats.isRunning ? 'Running' : stats.startedAt ? 'Stopped' : 'Idle'}
              size="small"
              color={stats.isRunning ? 'success' : 'default'}
              variant={stats.isRunning ? 'filled' : 'outlined'}
              sx={{ fontSize: '0.7rem', height: 24 }}
            />
          </Box>
          {stats.startedAt && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Started: {stats.startedAt} · Elapsed: {formatElapsed(stats.elapsed)}
            </Typography>
          )}
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard
              icon={<TrendingUp sx={{ fontSize: 16, color: '#7C4DFF' }} />}
              label="Total"
              value={stats.totalRequests.toLocaleString()}
              color="#7C4DFF"
              glow="linear-gradient(90deg, transparent, #7C4DFF, transparent)"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard
              icon={<CheckCircle sx={{ fontSize: 16, color: '#69F0AE' }} />}
              label="Success"
              value={stats.successCount.toLocaleString()}
              color="#69F0AE"
              glow="linear-gradient(90deg, transparent, #69F0AE, transparent)"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard
              icon={<Cancel sx={{ fontSize: 16, color: '#FF5252' }} />}
              label="Failed"
              value={stats.failureCount.toLocaleString()}
              color="#FF5252"
              glow="linear-gradient(90deg, transparent, #FF5252, transparent)"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard
              icon={<AccessTime sx={{ fontSize: 16, color: '#00E5FF' }} />}
              label="Success Rate"
              value={`${successRate}%`}
              color="#00E5FF"
              glow="linear-gradient(90deg, transparent, #00E5FF, transparent)"
            />
          </Grid>
        </Grid>

        {/* Progress Bar */}
        {stats.isRunning && (
          <LinearProgress
            variant="indeterminate"
            sx={{
              mb: 2,
              borderRadius: 4,
              height: 4,
              backgroundColor: 'rgba(124, 77, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #7C4DFF, #00E5FF, #69F0AE)',
                borderRadius: 4,
              },
            }}
          />
        )}

        {/* Last Response */}
        {stats.lastResponse && (
          <>
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, display: 'block', mb: 1 }}>
              Last Response
            </Typography>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(124, 77, 255, 0.1)',
                mb: 2,
                maxHeight: 80,
                overflow: 'auto',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  fontSize: '0.72rem',
                  wordBreak: 'break-all',
                  color: '#94A3B8',
                }}
              >
                {stats.lastResponse}
              </Typography>
            </Box>
          </>
        )}

        <Divider sx={{ borderColor: 'rgba(124, 77, 255, 0.1)', mb: 2 }} />

        {/* Logs */}
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, display: 'block', mb: 1 }}>
          Execution Logs ({stats.logs.length})
        </Typography>
        <Box
          sx={{
            maxHeight: { xs: 200, md: 300 },
            overflow: 'auto',
            borderRadius: 2,
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(124, 77, 255, 0.08)',
            p: 1,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(124, 77, 255, 0.3)',
              borderRadius: 3,
            },
          }}
        >
          {stats.logs.length === 0 ? (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                textAlign: 'center',
                py: 3,
                fontStyle: 'italic',
              }}
            >
              No logs yet. Run a test to see results.
            </Typography>
          ) : (
            stats.logs.map((log) => (
              <Box
                key={log.id}
                sx={{
                  display: 'flex',
                  gap: 1,
                  py: 0.4,
                  px: 1,
                  borderRadius: 1,
                  '&:hover': {
                    background: 'rgba(124, 77, 255, 0.05)',
                  },
                  alignItems: 'flex-start',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    color: 'text.secondary',
                    fontSize: '0.65rem',
                    whiteSpace: 'nowrap',
                    pt: '2px',
                  }}
                >
                  {log.timestamp}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.7rem',
                    color:
                      log.status === 'success'
                        ? '#69F0AE'
                        : log.status === 'error'
                        ? '#FF5252'
                        : log.status === 'warning'
                        ? '#FFD740'
                        : '#94A3B8',
                    wordBreak: 'break-word',
                  }}
                >
                  {log.message}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatusPanel;
