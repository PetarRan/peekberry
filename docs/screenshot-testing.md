# Screenshot Capture Testing Guide

This document outlines how to test the screenshot capture functionality implemented in task 13.

## Overview

The screenshot capture system includes:

- Browser API integration for capturing visible tab content
- Image processing and compression for optimal file sizes
- Upload to webapp with metadata (page URL, title, edit count)
- Activity counter updates when screenshots are captured

## Components Implemented

### 1. Content Script (`src/app/(extension)/content/content.ts`)

- `captureScreenshot()` method that sends metadata to background script
- Screenshot button in chat panel UI
- User notifications for capture status

### 2. Background Script (`src/app/(extension)/background.ts`)

- `captureScreenshot()` method that uses Chrome tabs API
- `dataUrlToBlob()` utility for converting captured data
- Form data preparation and upload to webapp API
- Error handling for authentication and network issues

### 3. API Endpoint (`src/app/api/screenshots/route.ts`)

- POST handler for screenshot uploads
- File validation (type, size limits)
- Metadata parsing and validation
- Integration with Supabase storage and database

### 4. Database Integration

- Screenshot storage in Supabase
- Thumbnail generation and storage
- User statistics updates (screenshot count increment)
- Proper file cleanup on deletion

## Manual Testing Steps

### Prerequisites

1. Start the development server: `npm run dev`
2. Build the extension: `npm run build:extension:dev`
3. Load the extension in Chrome (Developer mode)
4. Authenticate through the webapp

### Test Scenarios

#### 1. Basic Screenshot Capture

1. Navigate to any webpage
2. Click the Peekberry bubble to open chat panel
3. Click the screenshot button (camera icon)
4. Verify success notification appears
5. Check webapp dashboard for new screenshot

#### 2. Screenshot with Edits

1. Make some DOM edits using Peekberry
2. Capture screenshot
3. Verify edit count is included in metadata
4. Check that activity counters are updated

#### 3. Error Handling

1. Test without authentication (should show auth error)
2. Test with network disconnected (should show network error)
3. Test on invalid pages (chrome://, extension pages)

#### 4. File Size and Quality

1. Capture screenshots on different page sizes
2. Verify files are reasonably sized (not too large)
3. Check image quality is acceptable

### Expected Results

#### Success Case

- User sees "Capturing screenshot..." notification
- Followed by "Screenshot captured and saved!" notification
- Screenshot appears in webapp dashboard
- User statistics are updated (screenshot count +1)
- File is stored in Supabase with proper metadata

#### Error Cases

- Authentication errors show appropriate messages
- Network errors provide retry guidance
- Invalid pages are handled gracefully
- File size limits are enforced

## API Testing

### Endpoint: POST /api/screenshots

#### Valid Request

```bash
curl -X POST http://localhost:3000/api/screenshots \
  -H "Authorization: Bearer <valid-token>" \
  -F "file=@screenshot.png" \
  -F "metadata={\"pageUrl\":\"https://example.com\",\"pageTitle\":\"Test\",\"editCount\":0,\"dimensions\":{\"width\":1920,\"height\":1080}}"
```

#### Expected Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "clerkUserId": "user_id",
    "filename": "screenshot.png",
    "url": "https://storage-url",
    "thumbnailUrl": "https://thumbnail-url",
    "metadata": {
      "pageUrl": "https://example.com",
      "pageTitle": "Test",
      "editCount": 0,
      "dimensions": { "width": 1920, "height": 1080 }
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "size": 12345
  }
}
```

## Database Verification

### Screenshots Table

```sql
SELECT * FROM screenshots WHERE clerk_user_id = 'user_id' ORDER BY created_at DESC LIMIT 5;
```

### User Statistics

```sql
SELECT * FROM user_stats WHERE clerk_user_id = 'user_id';
```

### Storage Files

Check Supabase storage bucket 'screenshots' for uploaded files.

## Performance Considerations

### File Size Optimization

- Images are captured as PNG but could be converted to JPEG for smaller size
- Current implementation skips compression in background script (DOM not available)
- Future enhancement: Move compression to content script or use different approach

### Upload Speed

- Large screenshots may take time to upload
- Consider showing progress indicator for large files
- Implement retry logic for failed uploads

## Known Limitations

1. **Compression**: Currently disabled in background script due to DOM API limitations
2. **File Size**: No client-side compression, relies on server-side limits
3. **Progress**: No upload progress indicator
4. **Retry**: Basic error handling, could be enhanced with automatic retry

## Future Enhancements

1. **Client-side compression**: Move image processing to content script
2. **Progress indicators**: Show upload progress for large files
3. **Batch uploads**: Support multiple screenshots at once
4. **Format options**: Allow user to choose PNG vs JPEG
5. **Quality settings**: User-configurable compression quality

## Troubleshooting

### Common Issues

#### "Failed to capture screenshot"

- Check if tab has necessary permissions
- Verify user is authenticated
- Check browser console for detailed errors

#### "Upload failed"

- Verify network connectivity
- Check authentication token validity
- Ensure file size is within limits (50MB)

#### Screenshots not appearing in dashboard

- Check database connection
- Verify Supabase storage configuration
- Check user statistics update function

### Debug Information

Enable debug logging in browser console:

```javascript
// In content script context
localStorage.setItem('peekberry-debug', 'true');
```

Check background script logs in Chrome extension developer tools.
