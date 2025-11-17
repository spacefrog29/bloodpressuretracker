import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://whkqkhgiprgklpntefvs.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indoa3FraGdpcHJna2xwbnRlZnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MjUzOTgsImV4cCI6MjA3MjMwMTM5OH0.YL53xPhzl21GeYhP3Waw5-qT47tuVzZ-FmrPjJARdhE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
