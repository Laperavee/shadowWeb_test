import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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