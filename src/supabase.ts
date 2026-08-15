import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bqcjvrffhueqkleepevw.supabase.co'
const supabasePublishableKey = 'sb_publishable_VUwOj9pZhFcMdhwKVsSJpw_aeAjnsfP'

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
)
