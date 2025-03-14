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
    console.error('[TokenPurchases] Missing required environment variables');
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

    // Extract token address from path
    const path = event.path;
    const tokenAddress = path.split('/getTokenPurchases/')[1];

    console.log(`[TokenPurchases] Processing request for token: ${tokenAddress}`);
    
    if (!tokenAddress) {
      console.error('[TokenPurchases] No token address provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Token address parameter is required' 
        })
      };
    }

    console.log(`[TokenPurchases] Fetching purchases for token: ${tokenAddress}`);
    
    // Get purchases with the correct column names
    const { data: purchases, error } = await supabase
      .from('token_purchases')
      .select(`
        id,
        user_id,
        token_address,
        amount,
        purchased_at,
        tx_hash,
        cost,
        action
      `)
      .eq('token_address', tokenAddress.toLowerCase())
      .order('purchased_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[TokenPurchases] Database error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: error.message 
        })
      };
    }

    // Format the data according to the actual schema
    const formattedData = (purchases || []).map(purchase => ({
      buyer: purchase.user_id || 'Unknown',
      type: purchase.action ? 'BUY' : 'SELL',
      amount: parseFloat(purchase.amount) || 0,
      estimated_value: parseFloat(purchase.cost) || 0,
      date: purchase.purchased_at,
      transaction_hash: purchase.tx_hash || ''
    }));

    console.log(`[TokenPurchases] Found ${formattedData.length} purchases for token ${tokenAddress}`);
    if (formattedData.length > 0) {
      console.log('[TokenPurchases] Sample purchase:', JSON.stringify(formattedData[0], null, 2));
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: formattedData,
        debug: {
          raw_count: purchases?.length || 0,
          formatted_count: formattedData.length,
          token_address: tokenAddress,
          sample_raw: purchases?.[0] || null
        }
      })
    };
  } catch (error) {
    console.error('[TokenPurchases] Server error:', error);
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