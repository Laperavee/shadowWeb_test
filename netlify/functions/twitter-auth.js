const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  try {
    console.log('🔄 Starting twitter-auth function');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Récupérer l'URL de redirection depuis les paramètres de la requête
    const { redirectTo } = event.queryStringParameters || {};
    const finalRedirectTo = redirectTo || 'https://test12546158432897.netlify.app/shadow-fun#';
    console.log('🌐 Redirect URL:', finalRedirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: finalRedirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      console.error('❌ Twitter auth error:', error);
      throw error;
    }

    if (!data.url) {
      console.error('❌ No authentication URL returned');
      throw new Error('No authentication URL returned from Supabase');
    }

    console.log('✅ Twitter auth URL generated:', data.url);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({ url: data.url })
    };
  } catch (error) {
    console.error('❌ Error in twitter-auth:', error);
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