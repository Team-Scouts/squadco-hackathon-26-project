---
version: "alpha"
name: "VeriSphere"
description: "A dark, modern fraud detection and intelligence platform for vendor verification, trust scoring, document intelligence, payment-linked telemetry, and fraud-ring detection."

colors:
  # Core dark system
  primary: "#F8FAFC"
  secondary: "#A1A1AA"
  accent: "#00E5FF"
  background: "#030303"
  surface: "#080808"
  surface-raised: "#0D0D0F"
  surface-soft: "#141416"
  surface-muted: "#1A1A1D"

  # Text
  text: "#F8FAFC"
  text-secondary: "#D4D4D8"
  text-muted: "#A1A1AA"
  text-subtle: "#71717A"
  text-disabled: "#52525B"
  on-primary: "#030303"
  on-accent: "#030303"
  on-danger: "#FFFFFF"

  # Borders and dividers
  border: "#27272A"
  border-soft: "#18181B"
  border-strong: "#3F3F46"
  divider: "#202024"

  # Intelligence accents
  intelligence: "#8B5CF6"
  signal: "#00E5FF"
  verified: "#22C55E"
  review: "#FACC15"
  danger: "#EF4444"
  critical: "#FF2E63"
  info: "#38BDF8"

  # Risk levels
  risk-low: "#22C55E"
  risk-medium: "#FACC15"
  risk-high: "#F97316"
  risk-critical: "#EF4444"

  # Chart colours should be used sparingly on dark backgrounds
  chart-1: "#00E5FF"
  chart-2: "#8B5CF6"
  chart-3: "#22C55E"
  chart-4: "#FACC15"
  chart-5: "#EF4444"

gradients:
  # Gradients must only combine black, near-black, grey, and white.
  page-radial: "radial-gradient(circle at top, rgba(255,255,255,0.09), rgba(3,3,3,0.96) 44%, #030303 100%)"
  panel-depth: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02) 45%, rgba(0,0,0,0.18) 100%)"
  glass-edge: "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))"
  black-white-sheen: "linear-gradient(110deg, rgba(255,255,255,0.16), rgba(255,255,255,0.02), rgba(0,0,0,0.25))"

typography:
  fontFamily:
    sans: "Inter, Geist, Satoshi, Manrope, Arial, Helvetica, sans-serif"
    mono: "JetBrains Mono, IBM Plex Mono, Consolas, monospace"

  display:
    fontFamily: "{typography.fontFamily.sans}"
    fontSize: "4rem"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.055em"

  h1:
    fontFamily: "{typography.fontFamily.sans}"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.045em"

  h2:
    fontFamily: "{typography.fontFamily.sans}"
    fontSize: "2.25rem"
    fontWeight: 650
    lineHeight: 1.12
    letterSpacing: "-0.035em"

  h3:
    fontFamily: "{typography.fontFamily.sans}"
    fontSize: "1.5rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.025em"

  h4:
    fontFamily: "{typography.fontFamily.sans}"
    fontSize: "1.125rem"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "-0.015em"

  body:
    fontFamily: "{typography.fontFamily.sans}"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "-0.005em"

  body-small:
    fontFamily: "{typography.fontFamily.sans}"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.002em"

  label:
    fontFamily: "{typography.fontFamily.sans}"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.01em"

  caption:
    fontFamily: "{typography.fontFamily.sans}"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.025em"

  code:
    fontFamily: "{typography.fontFamily.mono}"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.5

spacing:
  0: "0px"
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
  20: "80px"
  24: "96px"
  32: "128px"

layout:
  page-max-width: "1440px"
  content-max-width: "1180px"
  reading-max-width: "760px"
  sidebar-width: "280px"
  topbar-height: "72px"
  dashboard-gap: "{spacing.8}"
  card-gap: "{spacing.6}"
  section-padding-x: "{spacing.8}"
  section-padding-y: "{spacing.12}"

rounded:
  xs: "5px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  full: "9999px"

shadows:
  none: "none"
  soft: "0 18px 54px rgba(0, 0, 0, 0.52), 0 0 28px rgba(255, 255, 255, 0.035)"
  raised: "0 24px 70px rgba(0, 0, 0, 0.55), 0 0 36px rgba(0, 229, 255, 0.055)"
  glow-accent: "0 16px 38px rgba(0, 0, 0, 0.42), 0 0 34px rgba(0, 229, 255, 0.15)"
  glow-danger: "0 16px 38px rgba(0, 0, 0, 0.42), 0 0 34px rgba(239, 68, 68, 0.14)"
  glow-white: "0 16px 34px rgba(0, 0, 0, 0.42), 0 0 24px rgba(255,255,255,0.12)"
  inset-line: "inset 0 1px 0 rgba(255,255,255,0.06)"

motion:
  duration-fast: "140ms"
  duration-normal: "220ms"
  duration-slow: "360ms"
  easing-standard: "cubic-bezier(0.2, 0, 0, 1)"
  easing-emphasized: "cubic-bezier(0.16, 1, 0.3, 1)"

components:
  app-shell:
    background: "{colors.background}"
    color: "{colors.text}"
    minHeight: "100vh"
    backgroundImage: "{gradients.page-radial}"

  sidebar:
    width: "{layout.sidebar-width}"
    background: "rgba(8, 8, 8, 0.86)"
    borderRight: "1px solid {colors.border-soft}"
    padding: "{spacing.6}"
    backdropFilter: "blur(18px)"

  topbar:
    height: "{layout.topbar-height}"
    background: "rgba(3, 3, 3, 0.78)"
    borderBottom: "1px solid {colors.border-soft}"
    paddingX: "{spacing.8}"
    backdropFilter: "blur(18px)"

  nav-item:
    background: "transparent"
    color: "{colors.text-muted}"
    hoverBackground: "{colors.surface-soft}"
    hoverColor: "{colors.text}"
    activeBackground: "{colors.surface-raised}"
    activeColor: "{colors.text}"
    activeBorder: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
    gap: "{spacing.3}"

  card:
    background: "{colors.surface-raised}"
    backgroundImage: "{gradients.panel-depth}"
    color: "{colors.text}"
    border: "1px solid rgba(255,255,255,0.09)"
    rounded: "{rounded.xl}"
    padding: "{spacing.8}"
    shadow: "{shadows.soft}"

  card-compact:
    background: "{colors.surface}"
    border: "1px solid {colors.border-soft}"
    rounded: "{rounded.lg}"
    padding: "{spacing.6}"
    shadow: "{shadows.inset-line}"

  glass-panel:
    background: "rgba(13, 13, 15, 0.72)"
    backgroundImage: "{gradients.glass-edge}"
    border: "1px solid rgba(255,255,255,0.08)"
    rounded: "{rounded.xl}"
    padding: "{spacing.8}"
    backdropFilter: "blur(22px)"

  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    border: "1px solid {colors.primary}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    fontWeight: 650
    shadow: "{shadows.glow-white}"
    hoverBackgroundColor: "#FFFFFF"
    focusRing: "0 0 0 4px rgba(255,255,255,0.12)"

  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    border: "1px solid {colors.accent}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    fontWeight: 650
    shadow: "{shadows.glow-accent}"
    hoverBackgroundColor: "#67E8F9"
    focusRing: "0 0 0 4px rgba(0,229,255,0.18)"

  button-secondary:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.text}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    fontWeight: 600
    hoverBackgroundColor: "{colors.surface-muted}"

  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
    border: "1px solid {colors.danger}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
    fontWeight: 650
    shadow: "{shadows.glow-danger}"

  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    placeholderColor: "{colors.text-subtle}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: "13px 14px"
    focusBorder: "{colors.accent}"
    focusRing: "0 0 0 4px rgba(0,229,255,0.12)"

  select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: "13px 14px"

  table:
    background: "{colors.surface}"
    border: "1px solid {colors.border-soft}"
    rounded: "{rounded.xl}"
    headerBackground: "{colors.surface-raised}"
    rowBorder: "1px solid {colors.border-soft}"
    rowHover: "{colors.surface-soft}"

  badge-low-risk:
    backgroundColor: "rgba(34, 197, 94, 0.12)"
    textColor: "#86EFAC"
    border: "1px solid rgba(34, 197, 94, 0.28)"
    rounded: "{rounded.full}"

  badge-review:
    backgroundColor: "rgba(250, 204, 21, 0.12)"
    textColor: "#FDE68A"
    border: "1px solid rgba(250, 204, 21, 0.28)"
    rounded: "{rounded.full}"

  badge-high-risk:
    backgroundColor: "rgba(249, 115, 22, 0.12)"
    textColor: "#FDBA74"
    border: "1px solid rgba(249, 115, 22, 0.30)"
    rounded: "{rounded.full}"

  badge-critical:
    backgroundColor: "rgba(239, 68, 68, 0.12)"
    textColor: "#FCA5A5"
    border: "1px solid rgba(239, 68, 68, 0.32)"
    rounded: "{rounded.full}"

  risk-score-ring:
    trackColor: "{colors.surface-muted}"
    lowColor: "{colors.risk-low}"
    mediumColor: "{colors.risk-medium}"
    highColor: "{colors.risk-high}"
    criticalColor: "{colors.risk-critical}"
    thickness: "10px"

  graph-node-safe:
    fill: "{colors.verified}"
    stroke: "rgba(34,197,94,0.45)"

  graph-node-watch:
    fill: "{colors.review}"
    stroke: "rgba(250,204,21,0.45)"

  graph-node-risk:
    fill: "{colors.danger}"
    stroke: "rgba(239,68,68,0.45)"

  graph-edge:
    stroke: "#52525B"
    strokeWidth: "1.5px"

  graph-edge-suspicious:
    stroke: "{colors.critical}"
    strokeWidth: "2px"

states:
  focus:
    ring: "0 0 0 4px rgba(0,229,255,0.16)"
  hover:
    lift: "translateY(-1px)"
  pressed:
    scale: "scale(0.98)"
  disabled:
    opacity: 0.45

accessibility:
  minimumTextContrast: "4.5:1"
  minimumLargeTextContrast: "3:1"
  focusVisible: true
  reducedMotionSupport: true
---

# VeriSphere Design System

## Design Direction

VeriSphere should feel like a serious cyber intelligence workspace: dark, high-contrast, technical, and trustworthy. The product should look less like a generic fintech dashboard and more like a modern fraud operations command centre.

The visual style should be close to black, spacious, precise, and quietly energetic. Use stronger black/white contrast, clean typography, large empty space, dynamic shadow blur, and clear hierarchy. The interface should make complex fraud signals feel understandable without making the screen look crowded.

## Personality

VeriSphere is:

- Intelligent, but not flashy.
- Serious, but not intimidating.
- Technical, but still easy to understand.
- Premium, but not decorative.
- Investigative, but calm and controlled.
- Cyber-oriented, but not gimmicky or neon-heavy.

The UI should make users feel that they are looking at a reliable fraud intelligence system, not a colourful admin template.

## Core Layout Principles

Use a spacious dashboard layout with large margins, wide cards, and clear sections.

Prefer:

- A fixed left sidebar for main navigation.
- A top bar for search, account controls, environment status, and global actions.
- Large cards with generous padding.
- Separate pages for onboarding, vendors, risk cases, trust graph, documents, payments, and alerts.
- Clear empty states.
- Large readable data blocks.
- Tables with breathing room.
- Graph views that are visually clean and not overloaded.
- Moderate rounded corners: cards should feel softened, not pill-like.
- Consistent icon alignment using fixed icon containers when icons sit next to text.

Avoid:

- Dense tables without spacing.
- Too many cards in one row.
- Tiny text.
- Overuse of borders.
- Overuse of neon effects.
- Gradients using accent colours.
- Overly rounded cards that make the app feel soft or playful.

## Colour Usage

The app should be black or very close to black as the foundation.

Use white and near-white for important text. Use greys for secondary text, borders, empty states, timestamps, descriptions, and metadata, but do not let metadata become too faint to read.

Accent colours should only be used to communicate meaning:

- Cyan for intelligence, active states, scanning, and primary system signals.
- Green for verified, clean, approved, or low-risk.
- Yellow for review, caution, or pending investigation.
- Orange for high-risk warning.
- Red for confirmed danger, critical risk, rejected vendors, and fraud alerts.
- Purple for graph intelligence, pattern detection, and advanced AI insight.

Accent colours must not be used in gradients. Gradients should only be made from black, white, and grey values.

## Typography

Use sans-serif fonts only.

Primary font preference:

1. Inter
2. Geist
3. Satoshi
4. Manrope
5. Arial or Helvetica fallback

Headings should be bold, tight, and modern. Body text should be readable and calm. Labels and captions can use slightly increased letter spacing for a technical feel.

Use monospaced fonts only for transaction references, IDs, hashes, API events, logs, webhook payloads, and risk feature values.

## Navigation

Navigation should be simple and obvious.

Recommended main navigation:

- Overview
- Vendors
- Risk Cases
- Trust Graph
- Documents
- Payments
- Device Intelligence
- Alerts
- Reports
- Settings

The active navigation item should be clear but not loud. Use a raised dark surface, subtle border, and bright text. Avoid colourful sidebar backgrounds.

## Dashboard Structure

The main dashboard should show:

1. Overall fraud exposure
2. Vendors screened
3. High-risk vendors
4. Active investigations
5. Payment-linked risk signals
6. Recent alerts
7. Trust graph summary
8. Manual review queue

Use large numbers, short labels, and concise explanations. The dashboard should be scannable in less than ten seconds.

## Cards and Panels

Cards should be dark, moderately rounded, and spacious. Use subtle grey/white gradients only for depth. Do not use bright gradient cards.

Good card style:

- Near-black background
- Subtle white top highlight
- Thin dark border
- Large padding
- Moderate rounded corners
- Soft dynamic blur shadow

Cards should never feel cramped. If a card contains more than one major idea, split it into two cards.

Recommended card shape:

- Major cards: 18px to 20px radius.
- Inner panels: 14px to 16px radius.
- Avoid 28px+ card radii unless the surface is a modal or a large marketing container.

## Risk UI

Risk levels must be consistent everywhere.

Low Risk:
Use green. Text should say "Low Risk", "Verified", or "Clear".

Review Required:
Use yellow. Text should say "Review Required", "Needs Review", or "Manual Review".

High Risk:
Use orange. Text should say "High Risk" or "Suspicious".

Critical Risk:
Use red. Text should say "Critical", "Likely Fraud", or "Reject".

Never rely on colour alone. Always include labels, icons, or explanations.

## Trust Graph UI

The trust graph is a core product experience. It should feel like an intelligence map, not a random network diagram.

Graph design rules:

- Use dark background.
- Use muted grey edges by default.
- Highlight suspicious edges in red.
- Highlight active selected paths in cyan.
- Use green nodes for verified entities.
- Use yellow nodes for review entities.
- Use red nodes for risky entities.
- Use purple sparingly for AI-detected clusters.
- Keep node labels visible, clean, and short.
- Keep relationship labels subdued and use a side panel for detailed relationship text.
- Use selection states and subtle glow to show the active node or relationship.
- Show entity details in a side panel instead of cluttering the graph.

Graph nodes can represent vendors, people, bank accounts, devices, documents, IP addresses, transactions, and applications.

## Forms

Forms should be simple, calm, and broken into clear sections.

Vendor onboarding should feel guided:

1. Business details
2. Contact details
3. Bank information
4. Document upload
5. Payment verification
6. Risk review

Use progress indicators, clear descriptions, and strong validation messages.

Do not make long forms feel like one huge page. Use grouped cards or steps.

## Document Intelligence UI

Document screens should show:

- Uploaded file preview
- OCR extraction result
- Metadata checks
- Duplicate similarity result
- Tamper risk
- Document integrity score
- Explanation of suspicious signals

Use clear labels such as:

- "Text extracted successfully"
- "Duplicate pattern detected"
- "Metadata mismatch"
- "Possible image manipulation"
- "Template inconsistency"

Avoid claiming certainty unless the system has confirmed evidence.

## Payment Intelligence UI

Payment-related screens should show Squad-related telemetry as risk signals, not just payment status.

Show:

- Payment reference
- Channel
- Amount
- Timestamp
- Metadata match
- Vendor link
- Risk session link
- Webhook status
- Verification status

Use monospaced styling for transaction references and metadata keys.

## Empty States

Empty states should be useful and minimal.

Examples:

- "No high-risk vendors detected yet."
- "No payment events have been linked to this vendor."
- "Upload a document to begin integrity checks."
- "No suspicious graph clusters found."

Avoid jokes or playful copy.

## Buttons

Primary actions should be white or near-white on black and may use a subtle white blur shadow.

Use cyan accent buttons only for system intelligence actions such as:

- Run Risk Scan
- Analyze Document
- Open Trust Graph
- Recompute Score

Use red buttons only for destructive or severe actions:

- Reject Vendor
- Flag as Fraud
- Delete Case

Buttons should use moderate 12px to 16px corner radius. Do not make standard action buttons fully pill-shaped unless the control is a compact status/filter chip. Hover states should add subtle shadow blur, not bright gradients.

## Gradients

Allowed:

- Black to near-black
- Black to transparent
- White overlay to transparent
- Grey to black
- Subtle white radial light on black

Not allowed:

- Cyan gradients
- Purple gradients
- Green gradients
- Red gradients
- Multi-colour gradients
- Loud aurora backgrounds

## Icons

Use thin, modern, rounded icons. Icons should support navigation and comprehension, not decorate the interface.

Recommended style:

- Stroke icons
- 1.5px to 2px stroke width
- Rounded caps
- Minimal fills

Good icon categories:

- Shield
- Network
- Fingerprint
- File scan
- Alert triangle
- Banknote
- Activity
- Search
- Lock
- Eye
- User check

## Data Visualisation

Charts should be clean and easy to read on black backgrounds.

Use:

- Thin grid lines
- Muted axis labels
- Strong labels for important values
- Limited chart colours
- Clear legends
- Tooltips with explanations

Avoid:

- 3D charts
- Too many colours
- Overly bright backgrounds
- Decorative gradients
- Dense charts without labels

## AI and Explanation UI

When showing AI or risk outputs, always include reasons.

A good explanation format:

- Main decision
- Risk score
- Top contributing signals
- Evidence
- Recommended action

Example:

"Review Required because this vendor shares a device with three other applications, submitted a document with duplicate similarity, and has unusual payment timing."

Avoid black-box language like:

"The AI thinks this is fraud."

Prefer:

"The system detected risk signals that require review."

## Copy Style

Use short, direct, professional language.

Good:

- "Vendor requires manual review."
- "Shared device detected."
- "Payment verified."
- "Document integrity risk increased."
- "Three linked entities found."

Avoid:

- "Oops"
- "Amazing"
- "Magic"
- "Supercharged"
- "This vendor is definitely fraudulent" unless legally confirmed.

## Page Recommendations

### Overview

Use large summary cards and a recent alerts section. The user should immediately understand the platform's current risk state.

### Vendor Profile

Show trust score, document score, financial authenticity score, device risk score, and network fraud risk. Use a timeline for events and a side panel for decision history.

### Risk Case

Show the case status, evidence, graph connections, reviewer notes, and recommended decision.

### Trust Graph

Give the graph maximum space. Use filters for entity type, risk level, date, and relationship type.

### Document Review

Show preview on the left, analysis and extracted fields on the right.

### Payment Events

Use a spacious table with filters. Highlight failed, suspicious, duplicate, or mismatched transactions.

## Accessibility

The dark UI must remain readable.

Rules:

- Maintain strong text contrast.
- Never use grey text below readable contrast.
- Provide visible focus states.
- Do not use colour alone to communicate risk.
- Support reduced motion.
- Keep click targets large.
- Use clear form labels.

## Implementation Notes

Use Tailwind CSS tokens generated from this file where possible.

Do not introduce random one-off colours in components. If a new colour is necessary, add it to this file first.

Use the design system for:

- Dashboard cards
- Navigation
- Tables
- Badges
- Risk score components
- Trust graph panels
- Forms
- Upload states
- Alerts
- Modals
- Empty states

## Do

- Use black and near-black backgrounds.
- Use lots of spacing.
- Use white text for emphasis.
- Use subtle borders.
- Use accent colours only for meaning.
- Use moderate corners and subtle dynamic shadows for cyber-console depth.
- Keep layouts calm and easy to navigate.
- Show explanations beside AI decisions.
- Make graph intelligence feel like a premium investigation tool.

## Don't

- Do not use colourful gradients.
- Do not use serif fonts.
- Do not make the UI cramped.
- Do not overload dashboards with too many cards.
- Do not use neon effects everywhere.
- Do not rely only on colour for risk.
- Do not make cards overly round.
- Do not use placeholder snapshot data when real vendor data is available.
- Do not make AI outputs sound certain when the evidence is probabilistic.
- Do not copy Raven or GeoSpy directly; use the same dark, spacious intelligence-workspace direction without cloning their exact interface.
