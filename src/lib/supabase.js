import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hvcdptpuvlrigreenhxg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2Y2RwdHB1dmxyaWdyZWVuaHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDYzNjYsImV4cCI6MjA3OTU4MjM2Nn0.id-3YlQSK-XFa6W4qO_XCaPGBOsFj6oiQYKnoSTNgbg'
console.log('🔗 Supabase Initializing with:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
