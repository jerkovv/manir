import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://caqjobwfcuwvxojengky.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_yJopNgZzXJqW5UX8SIMoBw_WRFp2KpZ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
  },
});
