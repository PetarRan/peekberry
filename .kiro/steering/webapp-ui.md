# Webapp UI Design Guidelines

## General Overview

The UI is a clean, modern, single-page application dashboard using a minimalist design with light backgrounds and clean sans-serif typography. The layout is divided into a main content area and a right-hand sidebar, designed to be responsive and adapt to different screen sizes.

## Color Palette

- **Primary Background**: Very light gray/off-white for main content area - `#F8FAFC`
- **Secondary Background**: Slightly darker gray for sidebar and card backgrounds - `#E2E8F0` or `#F1F5F9`
- **Text (Primary)**: Dark charcoal gray for headings and main text - `#1E293B`
- **Text (Secondary/Muted)**: Lighter gray for subheadings and descriptive text - `#64748B`
- **Accent Color**: Vibrant but soft blue for buttons and active states - `#3B82F6`
- **Border/Divider**: Very light gray for section separation - `#CBD5E1`
- **Success Indicator**: Green for "applied" tags - `#22C55E`

## Typography

- **Font Family**: Inter, Lato, or similar clean sans-serif font
- **Font Weights**:
  - **Bold**: For titles like "DOM Screenshots" and key metrics
  - **Semibold/Medium**: For labels and subheadings
  - **Regular**: For body text and descriptions

## Layout Structure

### Header (Top Section)

- **Left Side**:
  - Peekberry logo (icon + brand name)
  - Subtitle: "AI-Powered DOM Editor" positioned directly below logo
- **Right Side**:
  - User profile area with Clerk `<UserButton />` component
  - Shows user avatar/initial, name ("John Doe"), and dropdown arrow

### Main Content Area

- **Main Heading**: "DOM Screenshots"
- **Subtext**: "Screenshots of your live website taken after applying changes"
- **Screenshot Grid**:
  - Two-column layout (responsive grid that adjusts based on screen size)
  - Each screenshot is a self-contained card with light background
  - Card structure:
    - Title at top (e.g., "Landing page", "User Dashboard")
    - Timestamp below title (e.g., "30s ago")
    - Screenshot preview in 2:1 or 3:2 aspect ratio
    - Small circular button with magnifying glass icon for "quick view"
- **Empty State** (when no screenshots):
  - Heading: "No screenshots yet."
  - Description: "Your recently generated screenshots will appear here."
  - Prominent CTA button: "Take a screenshot" (uses accent color)

### Right Sidebar (Static Element)

#### AI Prompt Section

- **Heading**: "AI Prompt"
- **Text Area**: Large input field for user prompts
- **Placeholder**: "e.g., 'Make the signup button more prominent'"
- **Voice Input**: Circular icon button with microphone icon
- **Primary Action**: "Apply" button at bottom of section

#### Recent Changes Section

- **Heading**: "Recent Changes"
- **List Items**: Each change contains:
  - Brief description of the change
  - URL where change was applied
  - Timestamp
  - Status tags with rounded corners:
    - "text", "style" (neutral styling)
    - "applied" (green background `#22C55E` for success)

## Component Specifications

### Screenshot Cards

- Light background with subtle shadow
- Consistent padding and spacing
- Hover states for interactive elements
- Responsive image sizing

### Status Tags

- Small, rounded corner design
- Color-coded by status (green for "applied")
- Consistent typography and spacing

### Buttons

- Primary buttons use accent color `#3B82F6`
- Hover states with appropriate feedback
- Consistent sizing and typography

## Implementation Guidelines

- Use Material UI components following the established color palette
- Implement responsive design patterns (mobile-first approach)
- Maintain consistent spacing using 8px grid system
- Apply subtle shadows and borders for visual separation
- Ensure proper contrast ratios for accessibility
- All colors should be defined in MUI theme configuration
- Implement smooth transitions and loading states
