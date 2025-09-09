import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  UserStatsRow,
  UserStatsInsert,
  UserStatsUpdate,
} from '@/types/database';
import {
  transformUserStatsFromDB,
  transformUserStatsToDB,
} from '@/types/database';
import type { UserStats } from '@/schema';

export class UserStatsService {
  // Note: This service is currently not used in the MVP
  // All methods have been temporarily disabled to fix build issues
  // The stats functionality is implemented directly in the API routes
  // TODO: Refactor to use this service when needed
}
