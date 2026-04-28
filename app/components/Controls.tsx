'use client';

import React from 'react';
import {
  Box,
  Button,
  Chip,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  FileDownload,
  Key,
  PeopleAlt,
} from '@mui/icons-material';

interface ControlsProps {
  onRun: () => void;
  onPatientTest: () => void;
  onStop: () => void;
  onExportLogs: () => void;
  isRunning: boolean;
  hasLogs: boolean;
  canRunDashboard: boolean;
  canRunPatient: boolean;
  hasCapturedPassword: boolean;
  hasPatientToken: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  onRun,
  onPatientTest,
  onStop,
  onExportLogs,
  isRunning,
  hasLogs,
  canRunDashboard,
  canRunPatient,
  hasCapturedPassword,
  hasPatientToken,
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
        alignItems: 'center',
      }}
    >
      {hasCapturedPassword && (
        <Chip
          icon={<Key sx={{ fontSize: 16 }} />}
          label="Capture Verified — Ready to Run"
          color="success"
          variant="filled"
          sx={{ fontWeight: 600, fontSize: '0.78rem', height: 32, px: 1 }}
        />
      )}

      {hasPatientToken && (
        <Chip
          icon={<PeopleAlt sx={{ fontSize: 16 }} />}
          label="Patient Token Ready"
          color="secondary"
          variant="filled"
          sx={{ fontWeight: 600, fontSize: '0.78rem', height: 32, px: 1 }}
        />
      )}

      {!isRunning ? (
        <>
          <Button
            id="btn-run-test"
            variant="contained"
            color="primary"
            startIcon={<PlayArrow />}
            onClick={onRun}
            disabled={!canRunDashboard}
            sx={{
              minWidth: 140,
              background: canRunDashboard
                ? 'linear-gradient(135deg, #7C4DFF 0%, #448AFF 100%)'
                : undefined,
              boxShadow: canRunDashboard
                ? '0 4px 20px rgba(124, 77, 255, 0.4)'
                : 'none',
            }}
          >
            Run Test
          </Button>

          <Button
            id="btn-patient-test"
            variant="contained"
            color="secondary"
            startIcon={<PeopleAlt />}
            onClick={onPatientTest}
            disabled={!canRunPatient}
            sx={{
              minWidth: 140,
              background: canRunPatient
                ? 'linear-gradient(135deg, #00E5FF 0%, #00B8D4 100%)'
                : undefined,
              color: canRunPatient ? '#04131A' : undefined,
              boxShadow: canRunPatient
                ? '0 4px 20px rgba(0, 229, 255, 0.35)'
                : 'none',
            }}
          >
            Patient Test
          </Button>
        </>
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
