import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bkcpnhdxybixkogcuszd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5196HOQDCW9WnWz0sICBeQ_Sk1sRevK';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
