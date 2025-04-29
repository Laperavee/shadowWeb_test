const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  try {
    console.log('🔄 Starting get-twitter-user function');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Récupérer les cookies de la requête
    const cookies = event.headers.cookie || '';
    console.log('🍪 Cookies received:', cookies);

    // Récupérer le token d'accès depuis l'URL si présent
    const url = new URL(event.rawUrl);
    const accessToken = url.hash.split('access_token=')[1]?.split('&')[0];
    
    if (accessToken) {
      console.log('🔑 Access token found in URL');
      // Définir la session avec le token
      const { data: { session }, error: setSessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: url.hash.split('refresh_token=')[1]?.split('&')[0]
      });
      
      if (setSessionError) {
        console.error('❌ Error setting session:', setSessionError);
        throw setSessionError;
      }
    }

    // Vérifier la session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔍 Session check result:', { session: !!session, error: sessionError });
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      throw sessionError;
    }

    if (!session) {
      console.log('⚠️ No active session found');
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true'
        },
        body: JSON.stringify({ error: 'No active session' })
      };
    }

    console.log('✅ Session found:', {
      user: session.user?.id,
      expires_at: session.expires_at
    });

    // Récupérer les informations de l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 User data:', { user: user?.id, error: userError });
    
    if (userError) {
      console.error('❌ User error:', userError);
      throw userError;
    }

    // Extraire le handle Twitter et l'avatar
    const twitterHandle = user?.user_metadata?.user_name || null;
    const avatar = user?.user_metadata?.avatar_url || null;

    console.log('📊 Returning user info:', { twitterHandle, avatar });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({ twitterHandle, avatar })
    };
  } catch (error) {
    console.error('❌ Error in get-twitter-user:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
}; 