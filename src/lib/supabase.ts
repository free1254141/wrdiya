import { createClient as createBrowserClient } from '@/utils/supabase/client';

// Supabase client instance for client-side queries
export const supabase = createBrowserClient();
