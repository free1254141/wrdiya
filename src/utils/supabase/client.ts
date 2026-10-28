import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://csuifvyghfsibkrnxrby.supabase.co";
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_ii5camOEX4F2abN7XUYT0w_X9tdvsK9";

  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
};
