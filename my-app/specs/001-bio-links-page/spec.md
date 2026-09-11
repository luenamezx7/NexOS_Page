# Feature Specification: Bio Links Page

**Feature Branch**: `001-bio-links-page`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "Construir uma página de bio links — alternativa estática ao Linktree. Criadores de conteúdo e desenvolvedores precisam de uma URL única para colocar na bio do Instagram, TikTok e YouTube que centralize todos os seus links importantes (portfolio, curso, redes sociais, WhatsApp, etc). Soluções como Linktree cobram por customização e hospedam em domínio deles. Queremos uma solução própria, gratuita e totalmente personalizável."

## User Scenarios & Testing

### User Story 1 - View Profile Information (Priority: P1)

As a visitor, I want to see the page owner's profile (photo, name, @handle, and short bio) so I can understand who I'm interacting with before clicking links.

**Why this priority**: The profile is the first thing visitors see and establishes identity/trust. Without it, visitors don't know whose page they're on.

**Independent Test**: Can be fully tested by loading the page and verifying profile elements render correctly with sample data.

**Acceptance Scenarios**:

1. **Given** the page loads, **When** the visitor views the page, **Then** the owner's photo, name, handle, and bio are visible
2. **Given** no profile image is configured, **When** the page loads, **Then** a default placeholder avatar is shown
3. **Given** bio text exceeds display limit, **When** the page renders, **Then** text is truncated with ellipsis or wraps appropriately

---

### User Story 2 - Navigate Links (Priority: P1)

As a visitor, I want to see a list of clearly labeled link buttons with icons and titles so I can quickly navigate to the destination that interests me without reading URLs.

**Why this priority**: Links are the core purpose of a bio page. If visitors can't easily find and click links, the page fails its primary function.

**Independent Test**: Can be fully tested by loading the page, verifying all configured links render as buttons with correct labels/icons, and clicking each opens the correct URL.

**Acceptance Scenarios**:

1. **Given** links are configured, **When** the page loads, **Then** each link appears as a button with icon, title, and optional description
2. **Given** a link is clicked, **When** the visitor taps/clicks it, **Then** the URL opens in a new browser tab
3. **Given** no links are configured, **When** the page loads, **Then** an empty state message is displayed
4. **Given** a link has no icon configured, **When** the page renders, **Then** a generic link icon is used as fallback

---

### User Story 3 - Mobile-First Experience (Priority: P1)

As a visitor, I want the page to work perfectly on mobile since that's where I access bio links from social media apps.

**Why this priority**: 95%+ of bio link traffic comes from mobile devices (Instagram, TikTok, YouTube apps). Desktop is secondary.

**Independent Test**: Can be fully tested by loading the page on mobile viewport (320px+) and verifying all elements are usable without horizontal scrolling.

**Acceptance Scenarios**:

1. **Given** a mobile viewport (320px width), **When** the page loads, **Then** all content fits without horizontal scroll
2. **Given** a touch device, **When** the visitor taps a link button, **Then** the tap target is at least 44x44px
3. **Given** varying screen sizes (320px to 768px), **When** the page loads, **Then** layout adapts fluidly with appropriate spacing
4. **Given** slow 3G connection, **When** the page loads, **Then** core content (profile + links) is visible within 2 seconds

---

### User Story 4 - Configure Page via Single File (Priority: P1)

As a page owner, I want to customize name, photo, bio, and all links by editing only a configuration file, without needing to understand code.

**Why this priority**: This is the key differentiator from Linktree - zero-code customization. If owners need to touch React components, the value proposition fails.

**Independent Test**: Can be fully tested by modifying the config file, rebuilding, and verifying all changes reflect on the page without code changes.

**Acceptance Scenarios**:

1. **Given** a config file with profile data, **When** the owner updates name/bio/photo, **Then** changes appear after rebuild
2. **Given** a config file with links array, **When** the owner adds/removes/reorders links, **Then** changes appear after rebuild
3. **Given** invalid config (missing required fields), **When** build runs, **Then** clear validation errors are shown
4. **Given** the config file path is documented, **When** a new owner clones the repo, **Then** they can customize within 5 minutes

---

### User Story 5 - Customize Theme Colors (Priority: P2)

As a page owner, I want to choose the page's color theme (primary color, background, buttons) through the configuration file.

**Why this priority**: Visual customization is the main paid feature on Linktree. Offering it free is a major value add.

**Independent Test**: Can be fully tested by changing theme values in config, rebuilding, and verifying colors apply correctly across all elements.

**Acceptance Scenarios**:

1. **Given** a config with primary color set, **When** the page loads, **Then** buttons, accents, and interactive elements use that color
2. **Given** a config with background color set, **When** the page loads, **Then** page background uses that color
3. **Given** a config with button style variant, **When** the page loads, **Then** buttons render with the selected style (filled, outlined, ghost)
4. **Given** no theme config provided, **When** the page loads, **Then** a professional default theme is used

---

### User Story 6 - Free Deploy to Static Hosting (Priority: P2)

As a page owner, I want to deploy my page for free to GitHub Pages, Vercel, or Netlify by simply running the build command.

**Why this priority**: Zero hosting cost is a core requirement. Complex deployment processes create friction.

**Independent Test**: Can be fully tested by running build, deploying output to each platform, and verifying the live site works.

**Acceptance Scenarios**:

1. **Given** the project builds successfully, **When** the owner runs `npm run build`, **Then** static output is generated in `out/` directory
2. **Given** the build output, **When** deployed to GitHub Pages, **Then** the site loads correctly at the custom domain
3. **Given** the build output, **When** deployed to Vercel/Netlify, **Then** the site loads with automatic HTTPS
4. **Given** a custom domain configured, **When** deployed, **Then** the bio link URL works on all three platforms

---

### Edge Cases

- What happens when the config file contains malformed JSON/YAML?
- How does the system handle missing or broken image URLs for profile photo?
- What happens when a link URL is invalid or unreachable?
- How does the page behave with 50+ links configured?
- What happens when the build runs in an environment without Node.js?
- How are special characters in bio text handled (emoji, RTL text, markdown)?

## Requirements

### Functional Requirements

- **FR-001**: System MUST display the page owner's profile including photo, display name, @handle, and bio text
- **FR-002**: System MUST render a list of links as clickable buttons with icon, title, and optional description
- **FR-003**: System MUST open all external links in a new browser tab (`target="_blank"` with `rel="noopener noreferrer"`)
- **FR-004**: System MUST be fully responsive and functional on viewports from 320px width upwards
- **FR-005**: System MUST load core content (profile + links) within 2 seconds on a simulated 3G connection
- **FR-006**: System MUST read all customizable content (profile, links, theme) from a single configuration file
- **FR-007**: System MUST support theme customization including primary color, background color, and button style variant
- **FR-008**: System MUST validate the configuration file at build time and fail with clear error messages for missing/invalid data
- **FR-009**: System MUST generate static HTML/CSS/JS output suitable for deployment to GitHub Pages, Vercel, and Netlify
- **FR-010**: System MUST compile without TypeScript errors in strict mode
- **FR-011**: System MUST provide sensible defaults for all optional configuration fields
- **FR-012**: System MUST support at least 20 link entries without performance degradation
- **FR-013**: System MUST include semantic HTML for accessibility (proper heading hierarchy, landmarks, ARIA labels)
- **FR-014**: System MUST support dark/light mode based on system preference with optional manual override via config
- **FR-015**: System MUST allow custom favicon and Open Graph meta tags via configuration

### Key Entities

- **Profile**: Represents the page owner's identity — attributes: name (string), handle (string), bio (string), photoUrl (string, optional)
- **Link**: Represents a single navigation destination — attributes: title (string), url (string), icon (string, optional), description (string, optional), order (number)
- **Theme**: Represents visual customization — attributes: primaryColor (hex string), backgroundColor (hex string), buttonVariant (enum: filled|outlined|ghost), fontFamily (string, optional)
- **Configuration**: Root configuration object containing profile, links[], theme, and metadata (favicon, ogTags)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Page loads and displays profile + links within 2 seconds on 3G connection (1.6 Mbps / 300ms RTT)
- **SC-002**: Page functions correctly on all viewports from 320px to 1920px width without horizontal scrolling
- **SC-003**: All external links open in new tab with security attributes (`noopener noreferrer`)
- **SC-004**: Page owner can customize all visible content by editing only the configuration file
- **SC-005**: Build completes without TypeScript errors in strict mode
- **SC-006**: Static build output deploys successfully to GitHub Pages, Vercel, and Netlify without configuration changes
- **SC-007**: Lighthouse performance score ≥ 90 on mobile audit
- **SC-008**: Lighthouse accessibility score ≥ 95
- **SC-009**: Page owner can create a new customized bio page from clone to live deploy in under 10 minutes

## Assumptions

- Target users have basic Git/GitHub knowledge (clone repo, edit file, push)
- Node.js 18+ is available in the build environment
- Configuration file format will be JSON (simpler than YAML, no extra dependency)
- Profile photo will be hosted externally (GitHub raw, Imgur, etc.) or placed in public folder
- Icons for links will use a standard icon library (lucide-react) referenced by name in config
- No backend/database needed — fully static generation
- No authentication required — public page only
- SEO/Open Graph tags are important for social sharing of the bio link itself
- The existing Next.js 16 + React 19 + TailwindCSS v4 stack in my-app will be used