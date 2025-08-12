import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://loakfoqfdgegvzjgkjnv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYWtmb3FmZGdlZ3Z6amdram52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg4NDgsImV4cCI6MjA2OTM4NDg0OH0.a1-90tbgDWTHhNy7ScSysaycji6wBAKXs2378u5Twik'

// Crear una única instancia del cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
