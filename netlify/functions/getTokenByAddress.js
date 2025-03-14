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
    // Extract token address from various possible locations
    let tokenAddress;
    
    if (event.pathParameters && event.pathParameters.address) {
      tokenAddress = event.pathParameters.address;
    } else if (event.path) {
      // Try different path splitting approaches
      const pathParts = event.path.split('/');      
      // Find the part that looks like an Ethereum address
      tokenAddress = pathParts.find(part => 
        part.startsWith('0x') && part.length === 42
      );
    }

    
    
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
      .maybeSingle();

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
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Token not found',
          debug: {
            searchedAddress: tokenAddress,
            path: event.path,
            pathParameters: event.pathParameters,
            queryParameters: event.queryStringParameters
          }
        })
      };
    }

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