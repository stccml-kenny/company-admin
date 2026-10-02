import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vzhbclmnhxbinvembuah.supabase.co'
const supabaseAnonKey = 'sb_publishable_4XvNVAJVg6_6w4G5ZoxKjw_xxn6OoKy'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
