const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS enabled' })
    };
  }

  // Check for required environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('[GetTokenByAddress] Missing required environment variables');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Server configuration error'
      })
    };
  }

  try {
    // Get token address from path parameters
    const tokenAddress = event.path.split('/').pop()?.toLowerCase();
    
    if (!tokenAddress) {
      console.error('[GetTokenByAddress] No token address provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Token address is required'
        })
      };
    }

    console.log(`[GetTokenByAddress] Fetching token: ${tokenAddress}`);

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Query the database for the token
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('token_address', tokenAddress)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully

    if (error) {
      console.error('[GetTokenByAddress] Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Database error',
          details: error.message
        })
      };
    }

    if (!data) {
      console.log(`[GetTokenByAddress] Token not found: ${tokenAddress}`);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Token not found'
        })
      };
    }

    console.log(`[GetTokenByAddress] Token found: ${tokenAddress}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data
      })
    };

  } catch (error) {
    console.error('[GetTokenByAddress] Server error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message
      })
    };
  }
}; 