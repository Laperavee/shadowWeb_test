import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Connexion automatique avec un compte spécifique
async function authenticateSystemUser() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: import.meta.env.VITE_SYSTEM_USER_EMAIL,
        password: import.meta.env.VITE_SYSTEM_USER_PASSWORD,
    });

    if (error) {
        console.error('Authentication failed:', error.message);
        return null;
    }

    console.log('Authenticated as system user');
    return data.session;
}

export { supabase, authenticateSystemUser };
