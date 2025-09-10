# Undo/Redo Functionality Testing Guide

## Overview

This document describes how to test the enhanced undo/redo functionality implemented in task 12.

## Features Implemented

### 1. Enhanced Edit History Stack Management

- **Maximum history size**: Limited to 50 entries to prevent memory issues
- **Automatic cleanup**: Invalid entries (elements that no longer exist) are automatically removed
- **Unique IDs**: Each edit action has a unique ID for tracking
- **Chronological ordering**: Edits are maintained in chronological order

### 2. Improved Undo Functionality

- **Robust error handling**: Graceful handling when elements no longer exist
- **State validation**: Checks if elements are still available before undoing
- **Previous value capture**: Automatically captures current state before applying mutations
- **Button state updates**: Undo button is disabled when no undoable edits exist

### 3. Enhanced Redo System

- **Element validation**: Checks if target elements still exist before redoing
- **Stack management**: Maintains redo stack with size limits
- **Consistent state**: Ensures UI state remains consistent after redo operations
- **Button state updates**: Redo button is disabled when no redoable edits exist

### 4. Session Management

- **Navigation detection**: Clears edit history when navigating to different pages
- **Session end handling**: Clears history on browser session end (beforeunload/unload)
- **Page visibility**: Handles tab switching and window minimizing
- **SPA navigation**: Detects single-page application navigation changes

### 5. UI Feedback and Controls

- **Keyboard shortcuts**:
  - `Ctrl+Z` (or `Cmd+Z`) for undo
  - `Ctrl+Shift+Z` (or `Cmd+Shift+Z`) for redo
  - `Ctrl+Alt+R` (or `Cmd+Alt+R`) for emergency restore all
- **Button states**: Visual feedback for enabled/disabled states
- **Tooltips**: Dynamic tooltips showing available actions and counts
- **History panel**: View and revert to specific history entries

## Testing Instructions

### Basic Undo/Redo Testing

1. **Load a webpage** with the Peekberry extension installed
2. **Open Peekberry** by clicking the bubble in the bottom-right corner
3. **Select an element** by hovering and clicking on page elements
4. **Make an edit** by typing a command like "make this text red" and clicking Apply
5. **Test undo**:
   - Click the undo button or press `Ctrl+Z`
   - Verify the change is reverted
   - Check that the undo button becomes disabled if no more edits
6. **Test redo**:
   - Click the redo button or press `Ctrl+Shift+Z`
   - Verify the change is reapplied
   - Check that the redo button becomes disabled if no more redos

### Advanced Testing

#### Multiple Edits

1. Make several edits to different elements
2. Undo them one by one and verify each reverts correctly
3. Redo them and verify they reapply correctly
4. Mix undo and redo operations

#### Navigation Testing

1. Make some edits on a page
2. Navigate to a different page (or refresh)
3. Verify that edit history is cleared
4. Confirm that undo/redo buttons are disabled

#### Element Removal Testing

1. Make edits to elements
2. Use browser dev tools to remove those elements from DOM
3. Try to undo - should handle gracefully with appropriate error messages
4. Verify invalid entries are cleaned up automatically

#### History Panel Testing

1. Make several edits
2. Click the history button to open the history panel
3. Try reverting to different history entries
4. Verify the state is correctly restored

### Debug Console Testing

Open browser console and use these debug commands:

```javascript
// Get current edit history summary
peekberryDebug.getEditHistory();

// Validate history integrity
peekberryDebug.validateHistory();

// Repair any issues in history
peekberryDebug.repairHistory();

// Test undo/redo programmatically
peekberryDebug.testUndo();
peekberryDebug.testRedo();

// Clear history manually
peekberryDebug.clearHistory();
```

### Expected Behaviors

#### Requirements Compliance

✅ **Requirement 4.1**: When a user makes an edit, it's added to the undo stack
✅ **Requirement 4.2**: When a user requests undo, the most recent change is reverted and added to redo stack
✅ **Requirement 4.3**: When a user requests redo, the most recently undone change is reapplied
✅ **Requirement 4.4**: When the browser session ends, all edit history is cleared
✅ **Requirement 4.5**: Edits remain scoped to selected elements only
✅ **Requirement 4.6**: When navigating to a different page, the current edit session is cleared

#### Error Handling

- **Element not found**: Shows user-friendly error message
- **Invalid mutations**: Prevents unsafe changes with validation
- **Memory limits**: Automatically manages history size to prevent memory issues
- **Graceful degradation**: Continues working even if some operations fail

#### Performance

- **Efficient cleanup**: Automatically removes invalid entries
- **Size limits**: Prevents unlimited memory growth
- **Debounced operations**: Avoids excessive DOM queries
- **Optimized selectors**: Uses efficient element selection strategies

## Troubleshooting

### Common Issues

1. **Undo button disabled**: Check if there are any edits in history with `peekberryDebug.getEditHistory()`
2. **Elements not found**: Use `peekberryDebug.validateHistory()` to check for invalid entries
3. **History corruption**: Use `peekberryDebug.repairHistory()` to clean up issues
4. **Memory issues**: History is automatically limited to 50 entries per stack

### Debug Information

The debug object provides comprehensive information about the current state:

- `historyCount`: Number of edits in history
- `redoCount`: Number of edits available for redo
- `canUndo`: Whether undo is currently possible
- `canRedo`: Whether redo is currently possible
- `totalModifiedElements`: Number of elements currently modified by Peekberry

## Implementation Notes

### Key Improvements Made

1. **Better state management**: Enhanced tracking of edit states and validation
2. **Robust error handling**: Graceful handling of edge cases and failures
3. **Memory management**: Automatic cleanup and size limits
4. **User experience**: Clear visual feedback and intuitive controls
5. **Session handling**: Proper cleanup on navigation and session end
6. **Debugging support**: Comprehensive debug tools for troubleshooting

### Technical Details

- **Edit IDs**: Each edit has a unique ID combining timestamp and random string
- **Previous values**: Automatically captured before applying mutations for accurate undo
- **Element validation**: Checks element existence before operations
- **Chronological order**: Maintains proper order for consistent behavior
- **Stack management**: Separate history and redo stacks with size limits
