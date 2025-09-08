# Supabase Database Setup

This directory contains the database schema and configuration for Peekberry.

## Quick Start

1. **Set up your environment variables** in `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Initialize the database**:
   ```bash
   node scripts/init-db.js
   ```

## Database Schema

### Tables

#### `screenshots`

Stores screenshot metadata and references to files in Supabase storage.

| Column          | Type      | Description                            |
| --------------- | --------- | -------------------------------------- |
| `id`            | UUID      | Primary key                            |
| `clerk_user_id` | VARCHAR   | References Clerk user ID               |
| `filename`      | VARCHAR   | Original filename                      |
| `url`           | VARCHAR   | Public URL to the screenshot           |
| `thumbnail_url` | VARCHAR   | URL to thumbnail (optional)            |
| `page_url`      | VARCHAR   | URL of the page that was screenshotted |
| `page_title`    | VARCHAR   | Title of the page                      |
| `edit_count`    | INTEGER   | Number of edits made before screenshot |
| `width`         | INTEGER   | Image width in pixels                  |
| `height`        | INTEGER   | Image height in pixels                 |
| `file_size`     | INTEGER   | File size in bytes                     |
| `created_at`    | TIMESTAMP | When the screenshot was created        |

#### `user_stats`

Tracks user activity and usage statistics.

| Column                   | Type      | Description                            |
| ------------------------ | --------- | -------------------------------------- |
| `clerk_user_id`          | VARCHAR   | Primary key, references Clerk user ID  |
| `edits_this_month`       | INTEGER   | Number of edits made this month        |
| `screenshots_this_month` | INTEGER   | Number of screenshots taken this month |
| `total_edits`            | INTEGER   | Total number of edits ever made        |
| `total_screenshots`      | INTEGER   | Total number of screenshots ever taken |
| `last_activity`          | TIMESTAMP | Last time user was active              |
| `updated_at`             | TIMESTAMP | Last time stats were updated           |

### Storage

#### `screenshots` bucket

- **Public**: Yes (files are publicly accessible)
- **File size limit**: 50MB
- **Allowed types**: JPEG, PNG, WebP
- **Organization**: Files are organized by user ID (`{clerk_user_id}/{timestamp}-{random}.{ext}`)

### Security

#### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure users can only access their own data.

#### Authentication

The system uses Clerk for authentication. The Clerk user ID is stored in the `clerk_user_id` field and used for data isolation.

## API Services

### ScreenshotService

Located in `src/utils/api/screenshots.ts`

- `getScreenshotsByUserId()` - Get all screenshots for a user
- `getScreenshotById()` - Get a specific screenshot
- `createScreenshot()` - Create a new screenshot record
- `updateScreenshot()` - Update screenshot metadata
- `deleteScreenshot()` - Delete a screenshot
- `getScreenshotsPaginated()` - Get screenshots with pagination

### UserStatsService

Located in `src/utils/api/userStats.ts`

- `getUserStats()` - Get user statistics
- `createUserStats()` - Create initial stats record
- `getOrCreateUserStats()` - Ensure stats exist for user
- `incrementEditCount()` - Increment edit counter
- `incrementScreenshotCount()` - Increment screenshot counter
- `resetMonthlyCounters()` - Reset monthly counters
- `updateLastActivity()` - Update last activity timestamp

### ImageUploadService

Located in `src/utils/supabase/imageUpload.ts`

- `uploadScreenshot()` - Upload screenshot file
- `uploadScreenshotBlob()` - Upload from blob (for extension)
- `deleteScreenshot()` - Delete screenshot file
- `createThumbnail()` - Generate thumbnail
- `uploadScreenshotWithThumbnail()` - Upload both full and thumbnail

## Development

### Local Development with Supabase CLI

If you want to use local Supabase development:

1. **Install Supabase CLI**:

   ```bash
   npm install -g supabase
   ```

2. **Initialize local project**:

   ```bash
   supabase init
   ```

3. **Start local services**:

   ```bash
   supabase start
   ```

4. **Apply migrations**:
   ```bash
   supabase db push
   ```

### Generating Types

To generate TypeScript types from your database schema:

```bash
supabase gen types typescript --local > src/types/database.ts
```

## Troubleshooting

### Common Issues

1. **Authentication errors**: Make sure your Clerk JWT is properly configured in Supabase
2. **RLS policy errors**: Ensure the JWT contains the correct user ID claim
3. **Storage upload errors**: Check file size limits and allowed MIME types
4. **Migration errors**: Run migrations one at a time to identify issues

### Useful Queries

Check table contents:

```sql
SELECT * FROM screenshots LIMIT 10;
SELECT * FROM user_stats LIMIT 10;
```

Check storage usage:

```sql
SELECT
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size
FROM storage.objects
GROUP BY bucket_id;
```

## Production Deployment

1. Create a new Supabase project
2. Run the migration script: `node scripts/init-db.js`
3. Configure your environment variables
4. Set up proper backup and monitoring
5. Configure Clerk integration for JWT validation
