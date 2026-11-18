import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fswlweejdyhrywvzhzvw.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eERIeKN2XIQRi6jfX107jQ_jXHu7Yq6';

export const supabase = createClient(supabaseUrl, supabaseKey);

