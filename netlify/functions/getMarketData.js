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
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
    console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Server configuration error: Missing environment variables' 
      })
    };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );

    const tokenAddress = event.queryStringParameters?.tokenAddress;
    const network = event.queryStringParameters?.network;
    
    if (!tokenAddress) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Token address parameter is required' 
        })
      };
    }

    console.log(`Fetching market data for token: ${tokenAddress} on network: ${network}`);
    
    const { data, error } = await supabase
      .from('market_data')
      .select('*')
      .eq('token_address', tokenAddress.toLowerCase())
      .single();

    if (error) {
      console.error('Error fetching market data:', error);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Market data not found',
          details: error.message
        })
      };
    }

    console.log(`Found market data for token ${tokenAddress}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data })
    };
  } catch (error) {
    console.error('Server error:', error);
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