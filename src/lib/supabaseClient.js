import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.SUPABASE_URL
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase

// Configurer l'écoute des changements
const channel = supabase
  .channel('responses')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'responses' },
    (payload) => {
      console.log('Nouvelle réponse!', payload)
    }
  )
  .subscribe()

export { channel } 