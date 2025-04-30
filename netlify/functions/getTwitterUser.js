const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Vérifier la méthode HTTP
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Récupérer le username depuis les query params
  const { username } = event.queryStringParameters;
  if (!username) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Username is required' })
    };
  }

  try {
    // Initialiser le client Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Utiliser rpc pour chercher dans raw_user_meta_data
    const { data: users, error } = await supabase
      .rpc('get_user_by_twitter_username', { username })
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database error' })
      };
    }

    if (!users) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Extraire les informations pertinentes
    const userData = users.raw_user_meta_data;
    const response = {
      name: userData.name,
      displayName: userData.full_name,
      avatarUrl: userData.avatar_url,
      username: userData.user_name,
      verified: userData.email_verified
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}; 