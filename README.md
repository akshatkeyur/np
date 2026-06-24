# np

Next.js API Stress Tester - A tool for stress-testing protected admin APIs.

## Project Overview

This project contains:
- **Web Dashboard**: Next.js 16 browser UI for API stress testing
- **CLI Tool**: Command-line interface for running stress tests without browser

See `PROJECT_CONTEXT.md` for detailed architecture and implementation notes.

## Prerequisites

- Node.js: `>= 20`
- npm or yarn
- Chrome browser (for Puppeteer-based credential capture)

## Getting Started

### Web Dashboard

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### CLI Tool

```bash
npm run stress -- --help
```

---

## CLI Documentation

The CLI tool allows you to run API stress tests from the command line without a browser.

### Installation

Dependencies are installed automatically with `npm install`.

### Basic Usage

```bash
# Run patient stress test (uses browser to capture credentials)
node cli/launcher.js --type patient

# Run dashboard stress test (uses browser to capture credentials)
node cli/launcher.js --type dashboard

# Via npm script
npm run stress -- --type patient
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--type <type>` | Test type: `patient` or `dashboard` | **required** |
| `--concurrency <number>` | Number of concurrent requests | `5` |
| `--interval <ms>` | Milliseconds between batches | `2000` |
| `--frontend-url <url>` | Frontend login URL for browser capture | `https://app.subqdocs.ai/login` |
| `--base-url <url>` | API base URL (required when providing credentials manually) | auto-captured |
| `--username <email>` | Username for login | - |
| `--password <pass>` | Plain password (for dashboard mode - will be encrypted automatically) | - |
| `--token <token>` | Bearer token (skip browser capture for patient mode) | - |
| `--help` | Show help | - |

### Examples

#### Patient Test with Browser Capture

```bash
npx tsx cli/index.ts --type patient --concurrency 10 --interval 1000
```

#### Dashboard Test with Plain Password (No Browser)

```bash
npx tsx cli/index.ts --type dashboard --username fre@yopmail.com --password Test@123 --base-url api.example.com
```

The password will be automatically encrypted before making API calls.

#### Patient Test with Pre-provided Token (No Browser)

```bash
npx tsx cli/index.ts --type patient --token "eyJhbGciOiJIUzI1NiIs..." --base-url app-api.subqdocs.ai
```

#### Dashboard Test with Browser Capture

```bash
npx tsx cli/index.ts --type dashboard --concurrency 5 --frontend-url https://app.example.com/login --username user@example.com --password secret123
```

### How It Works

1. **Credential Capture** (Browser Mode):
   - Launches headless Chrome browser
   - Navigates to frontend login URL
   - Fills username and password
   - Intercepts POST response to extract token/password
   - Extracts API base URL from intercepted request

2. **Plain Password Mode** (Dashboard):
   - Accepts plain password directly on CLI
   - Encrypts password using AES before API calls
   - No browser needed

3. **Token Mode** (Patient):
   - Accepts pre-provided bearer token
   - No browser needed

4. **Stress Test Loop**:
   - Fires `concurrency` number of parallel API requests
   - Waits `interval` milliseconds between batches
   - Continues until Ctrl+C

5. **Live Stats Display**:
   - Total requests
   - Success/failure counts
   - Success rate percentage
   - Elapsed time
   - Average response time

### Stopping the Test

Press **Ctrl+C** to gracefully stop the test. A final summary will be displayed.

### Output Example

```
══════════════════════════════════════════════════
  API STRESS TESTER CLI
══════════════════════════════════════════════════
  Type                dashboard
  Concurrency         5
  Interval           2000ms

[22:07:02] ℹ Using provided plain password (will be encrypted for API calls)
[22:07:02] ✓ Credentials ready!
[22:07:02] ℹ User: fre@yopmail.com
[22:07:02] ℹ Base URL: api.example.com

══════════════════════════════════════════════════
  STRESS TEST RUNNING
══════════════════════════════════════════════════

╔══════════════════════════════════════════════════════╗
║       API STRESS TESTER - LIVE STATS                    ║
╚══════════════════════════════════════════════════════╝

  Total:       450     Success:     448     Failed:    2
  Success Rate: 99.6%  Elapsed:     00:15    Avg Response:  45ms

^C

  ╔═══════════════════════════════════════════════════════╗
  ║              FINAL SUMMARY                            ║
  ╠═══════════════════════════════════════════════════════╣
  ║  Total Requests: 450                                  ║
  ║  Successful:     448 (99.6%)                          ║
  ║  Failed:        2                                    ║
  ║  Duration:       00:15                                ║
  ║  Avg Response:   45ms                                 ║
  ╚═══════════════════════════════════════════════════════╝
```

---

## Environment Variables

Create a `.env` file for web dashboard authentication:

```env
NEXT_PUBLIC_CRYPTO_SECRET_KEY=your_crypto_secret_key_here
JWT_SECRET=change_me_to_a_long_random_secret
AUTH_NOTIFY_EMAILS=admin@system.local
EMAIL_OTP_ENABLED=false
```

> **Note**: For CLI dashboard mode with plain passwords, the encryption key from `NEXT_PUBLIC_CRYPTO_SECRET_KEY` is used. If not set, a default key is used.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run stress` | Run CLI stress test tool |