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
    // Log the full event for debugging
    console.log('[GetTokenByAddress] Event path:', event.path);
    console.log('[GetTokenByAddress] Event params:', event.pathParameters);
    console.log('[GetTokenByAddress] Query params:', event.queryStringParameters);

    // Extract token address from various possible locations
    let tokenAddress;
    
    if (event.pathParameters && event.pathParameters.address) {
      tokenAddress = event.pathParameters.address;
    } else if (event.path) {
      // Try different path splitting approaches
      const pathParts = event.path.split('/');
      console.log('[GetTokenByAddress] Path parts:', pathParts);
      
      // Find the part that looks like an Ethereum address
      tokenAddress = pathParts.find(part => 
        part.startsWith('0x') && part.length === 42
      );
    }

    
    console.log('[GetTokenByAddress] Extracted token address:', tokenAddress);
    
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

    // Log the query we're about to make
    console.log(`[GetTokenByAddress] Querying database for token_address: ${tokenAddress}`);

    // Query the database for the token
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('token_address', tokenAddress)
      .maybeSingle();

    // Log the query results
    console.log('[GetTokenByAddress] Query result:', { data, error });

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

    console.log(`[GetTokenByAddress] Token found:`, data);
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