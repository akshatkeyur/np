# Graph Report - .  (2026-04-29)

## Corpus Check
- Corpus is ~12,420 words - fits in a single context window. You may not need a graph.

## Summary
- 91 nodes · 62 edges · 18 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Core UI Components|Core UI Components]]
- [[_COMMUNITY_API Implementation Utilities|API Implementation Utilities]]
- [[_COMMUNITY_Runner & Capture Logic|Runner & Capture Logic]]
- [[_COMMUNITY_Auth & Cache Services|Auth & Cache Services]]
- [[_COMMUNITY_Auth API Backend|Auth API Backend]]
- [[_COMMUNITY_System Context & Routing|System Context & Routing]]
- [[_COMMUNITY_App Shell Structure|App Shell Structure]]
- [[_COMMUNITY_ESLint Ruleset|ESLint Ruleset]]
- [[_COMMUNITY_System Log Schema|System Log Schema]]
- [[_COMMUNITY_Gemini Agent Docs|Gemini Agent Docs]]
- [[_COMMUNITY_Agents Documentation|Agents Documentation]]
- [[_COMMUNITY_Claude Assistant Docs|Claude Assistant Docs]]
- [[_COMMUNITY_Project Overview|Project Overview]]
- [[_COMMUNITY_Deployment Assets|Deployment Assets]]
- [[_COMMUNITY_OS Integration Icons|OS Integration Icons]]
- [[_COMMUNITY_Framework Branding|Framework Branding]]
- [[_COMMUNITY_Document UI Icons|Document UI Icons]]
- [[_COMMUNITY_Global Localization Assets|Global Localization Assets]]

## God Nodes (most connected - your core abstractions)
1. `Home Component` - 7 edges
2. `buildBackendUrl()` - 4 edges
3. `useRunner Hook` - 4 edges
4. `Request OTP API` - 4 edges
5. `Verify OTP API` - 4 edges
6. `fetchDashboard()` - 3 edges
7. `getAuditMetadata()` - 3 edges
8. `Status Panel` - 3 edges
9. `Encrypt Password Utility` - 3 edges
10. `Build Backend URL Utility` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Project Context` --rationale_for--> `useRunner Hook`  [EXTRACTED]
  PROJECT_CONTEXT.md → app/hooks/useRunner.ts
- `Project Context` --rationale_for--> `Capture Login API`  [EXTRACTED]
  PROJECT_CONTEXT.md → app/api/capture-login/route.ts
- `Project Context` --rationale_for--> `Request Proxy API`  [EXTRACTED]
  PROJECT_CONTEXT.md → app/api/proxy/route.ts
- `POST()` --calls--> `getAuditMetadata()`  [INFERRED]
  app/api/auth/request-otp/route.ts → lib/auth/metadata.util.ts
- `POST()` --calls--> `getAuditMetadata()`  [INFERRED]
  app/api/auth/verify-otp/route.ts → lib/auth/metadata.util.ts

## Hyperedges (group relationships)
- **Load Testing UI Layer** — page_home, form_form, statuspanel_statuspanel, controls_controls, capturepanel_capturepanel [INFERRED 0.95]
- **API Abstraction Layer** — api_getpatienttoken, api_fetchdashboard, api_fetchpatients, api_fetchhealth [INFERRED 0.90]
- **Application Theming & Styling** — theme_theme, layout_rootlayout, emotionregistry_emotionregistry [INFERRED 0.85]
- **OTP Authentication Flow** — request_otp_post, verify_otp_post, otp_service_otpservice, email_service_emailservice, cache_otpcache, cache_sessioncache, cache_ratelimitcache [EXTRACTED 1.00]
- **Puppeteer Capture Mechanism** — capture_login_post, capture_patient_token_post [INFERRED 0.90]

## Communities

### Community 0 - "Core UI Components"
Cohesion: 0.2
Nodes (10): Get Patient Token API Client, Authentication Gate, Execution Controls, Configuration Form, Home Component, Stat Card, Status Panel, MUI Theme Configuration (+2 more)

### Community 1 - "API Implementation Utilities"
Cohesion: 0.36
Nodes (5): buildBackendUrl(), fetchDashboard(), fetchHealth(), fetchPatients(), encryptPassword()

### Community 2 - "Runner & Capture Logic"
Cohesion: 0.32
Nodes (8): Build Backend URL Utility, Fetch Dashboard API Client, Fetch Health API Client, Fetch Patients API Client, Capture Panel, Encrypt Password Utility, Next.js Configuration, useRunner Hook

### Community 3 - "Auth & Cache Services"
Cohesion: 0.32
Nodes (8): OTP Cache, Rate Limit Cache, Session Cache, Email Service, Audit Metadata Utility, OTP Service, Request OTP API, Verify OTP API

### Community 4 - "Auth API Backend"
Cohesion: 0.33
Nodes (3): getAuditMetadata(), POST(), POST()

### Community 6 - "System Context & Routing"
Cohesion: 0.5
Nodes (4): Capture Login API, Capture Patient Token API, Project Context, Request Proxy API

### Community 15 - "App Shell Structure"
Cohesion: 1.0
Nodes (2): Emotion Registry, Root Layout

### Community 27 - "ESLint Ruleset"
Cohesion: 1.0
Nodes (1): ESLint Configuration

### Community 28 - "System Log Schema"
Cohesion: 1.0
Nodes (1): LogEntry Interface

### Community 29 - "Gemini Agent Docs"
Cohesion: 1.0
Nodes (1): Gemini Instructions

### Community 30 - "Agents Documentation"
Cohesion: 1.0
Nodes (1): Agents Configuration

### Community 31 - "Claude Assistant Docs"
Cohesion: 1.0
Nodes (1): Claude Instructions

### Community 32 - "Project Overview"
Cohesion: 1.0
Nodes (1): README

### Community 33 - "Deployment Assets"
Cohesion: 1.0
Nodes (1): Vercel Logo

### Community 34 - "OS Integration Icons"
Cohesion: 1.0
Nodes (1): Window Icon

### Community 35 - "Framework Branding"
Cohesion: 1.0
Nodes (1): Next.js Logo

### Community 36 - "Document UI Icons"
Cohesion: 1.0
Nodes (1): File Icon

### Community 37 - "Global Localization Assets"
Cohesion: 1.0
Nodes (1): Globe Icon

## Knowledge Gaps
- **26 isolated node(s):** `ESLint Configuration`, `Next.js Configuration`, `MUI Theme Configuration`, `FormData Interface`, `LogEntry Interface` (+21 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `App Shell Structure`** (2 nodes): `Emotion Registry`, `Root Layout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Ruleset`** (1 nodes): `ESLint Configuration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `System Log Schema`** (1 nodes): `LogEntry Interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Gemini Agent Docs`** (1 nodes): `Gemini Instructions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Agents Documentation`** (1 nodes): `Agents Configuration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Claude Assistant Docs`** (1 nodes): `Claude Instructions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Project Overview`** (1 nodes): `README`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Deployment Assets`** (1 nodes): `Vercel Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `OS Integration Icons`** (1 nodes): `Window Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Framework Branding`** (1 nodes): `Next.js Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Document UI Icons`** (1 nodes): `File Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Global Localization Assets`** (1 nodes): `Globe Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Home Component` connect `Core UI Components` to `Runner & Capture Logic`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `Capture Panel` connect `Runner & Capture Logic` to `Core UI Components`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `ESLint Configuration`, `Next.js Configuration`, `MUI Theme Configuration` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._