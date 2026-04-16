'use client';

import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  VerifiedUser,
  PlayArrow,
  Stop,
  FileDownload,
} from '@mui/icons-material';

interface ControlsProps {
  onTestCredentials: () => void;
  onRun: () => void;
  onStop: () => void;
  onExportLogs: () => void;
  isRunning: boolean;
  isTesting: boolean;
  isAuthenticated: boolean;
  hasLogs: boolean;
  canRun: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  onTestCredentials,
  onRun,
  onStop,
  onExportLogs,
  isRunning,
  isTesting,
  isAuthenticated,
  hasLogs,
  canRun,
}) => {
  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        py: 2,
        px: { xs: 0, md: 0 },
        background: 'linear-gradient(to top, rgba(10,14,26,1) 60%, rgba(10,14,26,0))',
        display: 'flex',
        gap: 1.5,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      <Button
        id="btn-test-credentials"
        variant="outlined"
        color={isAuthenticated ? 'success' : 'primary'}
        startIcon={
          isTesting ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <VerifiedUser />
          )
        }
        onClick={onTestCredentials}
        disabled={isTesting || isRunning}
        sx={{
          minWidth: 160,
          borderWidth: 2,
          '&:hover': { borderWidth: 2 },
          ...(isAuthenticated && {
            borderColor: 'success.main',
            color: 'success.main',
          }),
        }}
      >
        {isTesting
          ? 'Testing...'
          : isAuthenticated
          ? 'Verified ✓'
          : 'Test Credentials'}
      </Button>

      {!isRunning ? (
        <Button
          id="btn-run-test"
          variant="contained"
          color="primary"
          startIcon={<PlayArrow />}
          onClick={onRun}
          disabled={!isAuthenticated || !canRun || isTesting}
          sx={{
            minWidth: 140,
            background: isAuthenticated
              ? 'linear-gradient(135deg, #7C4DFF 0%, #448AFF 100%)'
              : undefined,
            boxShadow: isAuthenticated
              ? '0 4px 20px rgba(124, 77, 255, 0.4)'
              : 'none',
          }}
        >
          Run Test
        </Button>
      ) : (
        <Button
          id="btn-stop"
          variant="contained"
          color="error"
          startIcon={<Stop />}
          onClick={onStop}
          sx={{
            minWidth: 140,
            background: 'linear-gradient(135deg, #FF5252 0%, #FF1744 100%)',
            boxShadow: '0 4px 20px rgba(255, 82, 82, 0.4)',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 4px 20px rgba(255, 82, 82, 0.4)' },
              '50%': { boxShadow: '0 4px 30px rgba(255, 82, 82, 0.7)' },
              '100%': { boxShadow: '0 4px 20px rgba(255, 82, 82, 0.4)' },
            },
          }}
        >
          Stop
        </Button>
      )}

      {hasLogs && (
        <Button
          id="btn-export-logs"
          variant="outlined"
          color="secondary"
          startIcon={<FileDownload />}
          onClick={onExportLogs}
          disabled={isRunning}
          sx={{ minWidth: 130 }}
        >
          Export Logs
        </Button>
      )}
    </Box>
  );
};

export default Controls;
