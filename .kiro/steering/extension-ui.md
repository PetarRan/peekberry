# Chrome Extension UI Design Guidelines

## General Overview

The Chrome extension UI uses a dark-themed, minimalist, and modern interface designed to be unobtrusive and blend seamlessly with websites. It features a clean sans-serif font and high-contrast color scheme for optimal readability. The layout is simple and linear, focusing on core LLM interaction functionality.

## Color Palette

- **Primary Background**: Deep black for main containers - `#0D0D0D`
- **Secondary Background**: Dark gray for overall background - `#1E1E1E`
- **Card Background**: Lighter dark gray for history cards and interactive elements - `#2C2C2C`
- **Tag Background**: Medium dark gray for interactive tags - `#333333`
- **Text (Primary)**: White or very light gray for main text - `#F0F0F0` or `#FFFFFF`
- **Text (Secondary)**: Lighter gray for timestamps and secondary info - `#AAAAAA`
- **Button (Primary)**: Black background with white text - `#000000` / `#FFFFFF`
- **Button (Secondary)**: Dark gray background with white text - `#2C2C2C` / `#FFFFFF`

## Typography

- **Font Family**: Clean, modern sans-serif (Arial, Helvetica, SF Pro, or system font)
- **Font Weight**: Regular for all text elements
- **Font Sizes**:
  - **Title**: Slightly larger for section headers like "History"
  - **Body**: Standard size for prompt text and main content
  - **Small**: Smaller size for timestamps and metadata

## Layout Structure

### Main Chat Interface

- **Container**: Rectangular chat input bar with rounded corners
- **Layout**: Horizontal flexbox arrangement from left to right
- **Left Icons**:
  - Gear icon (Settings)
  - Clock icon (History)
  - Upward arrow icon (Upload/Share)
  - All icons are small and gray
- **Central Input**:
  - Large multi-line text input field with dark background
  - Interactive tags/chips for selected elements (e.g., "h1", "paragraph")
  - Tags have rounded corners, darker background, white text, and "x" close icon
- **Right Controls**:
  - Model dropdown (e.g., "Claude-4")
  - Microphone icon (Voice input)
  - Camera/screenshot button (small square)
  - "Apply" button (pill-shaped, primary action)

### History UI

- **Layout**: Modal or slide-in view from the right
- **Header**:
  - Left arrow icon (Back)
  - "History" title
- **Content**: Vertical list of history entries
- **History Cards**:
  - Rectangular blocks with rounded corners
  - Contains previous prompt text
  - Timestamp below main text (e.g., "now", "4 minutes ago")
  - "Revert" button on the right side

## Component Specifications

### Interactive Tags/Chips

- **Shape**: Rectangular with rounded corners
- **Background**: Dark gray `#333333`
- **Text**: White `#FFFFFF`
- **Close Icon**: Light gray "x" `#AAAAAA`
- **Functionality**: Removable, represent selected DOM elements

### Buttons

- **Primary ("Apply")**:
  - Pill-shaped
  - Black background `#000000`
  - White text `#FFFFFF`
  - Prominent size for primary action
- **Secondary ("Revert")**:
  - Pill-shaped
  - Dark gray background `#2C2C2C`
  - White text `#FFFFFF`
  - Standard size for secondary actions

### Input Fields

- **Background**: Deep black `#0D0D0D`
- **Text**: Light gray `#F0F0F0`
- **Border**: Subtle or none
- **Placeholder**: Darker gray text

### Icons

- **Color**: Light gray `#AAAAAA` for inactive states
- **Size**: Small and consistent across interface
- **Style**: Simple, minimal line icons

## Interaction Guidelines

### Element Selection

- Selected DOM elements appear as interactive tags in the input field
- Tags can be removed individually using the "x" icon
- Visual feedback when hovering over tags

### Chat Interface

- Input field expands as needed for multi-line text
- Real-time tag creation when elements are selected
- Clear visual hierarchy between input and action buttons

### History Navigation

- Smooth slide-in animation for history view
- Easy navigation back to main interface
- Clear visual distinction between history entries

## Technical Considerations

### Dark Theme Implementation

- Use consistent dark color palette across all components
- Ensure high contrast ratios for accessibility
- Maintain readability in various lighting conditions

### Responsive Design

- Adapt to different screen sizes while maintaining usability
- Ensure touch targets are appropriately sized
- Maintain visual hierarchy on smaller screens

### Performance

- Minimize DOM impact with efficient rendering
- Use CSS transforms for smooth animations
- Optimize for quick loading and interaction

## Animation Guidelines

- **Transitions**: Smooth 200-300ms transitions for state changes
- **Slide Animations**: History panel slides in from right
- **Hover Effects**: Subtle feedback on interactive elements
- **Loading States**: Minimal, non-intrusive loading indicators

## Implementation Notes

- Use flexbox for horizontal layouts and proper alignment
- Apply consistent border-radius for rounded corners
- Implement proper focus states for keyboard navigation
- Ensure all interactive elements have appropriate hover states
- Maintain visual consistency with pill-shaped buttons and rounded containers
- Use the same sans-serif font family throughout the interface
