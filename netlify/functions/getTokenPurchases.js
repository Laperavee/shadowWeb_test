const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  console.log('🚀 [getTokenPurchases] Démarrage de la fonction');
  console.log('📝 [getTokenPurchases] Méthode HTTP:', event.httpMethod);
  console.log('🔍 [getTokenPurchases] Path:', event.path);

  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    console.log('✨ [getTokenPurchases] Requête OPTIONS - CORS');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS enabled' })
    };
  }

  // Check for required environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ [getTokenPurchases] Variables d\'environnement manquantes:');
    console.error('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
    console.error('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅' : '❌');
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
    console.log('🔌 [getTokenPurchases] Initialisation du client Supabase');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Extract token address from path
    const path = event.path;
    const tokenAddress = path.split('/getTokenPurchases/')[1];

    console.log(`🎯 [getTokenPurchases] Adresse du token extraite: ${tokenAddress}`);
    
    if (!tokenAddress) {
      console.error('❌ [getTokenPurchases] Aucune adresse de token fournie');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Token address parameter is required' 
        })
      };
    }

    console.log(`📡 [getTokenPurchases] Requête Supabase pour le token: ${tokenAddress}`);
    
    // Vérifier d'abord si des données existent pour ce token
    const { count, error: countError } = await supabase
      .from('token_purchases')
      .select('*', { count: 'exact', head: true })
      .eq('token_address', tokenAddress);

    console.log(`🔍 [getTokenPurchases] Nombre total d'enregistrements trouvés:`, count);

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
      .eq('token_address', tokenAddress)
      .order('purchased_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('💥 [getTokenPurchases] Erreur Supabase:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: error.message,
          debug: {
            query: {
              table: 'token_purchases',
              filter: `token_address=${tokenAddress}`,
              total_records: count || 0
            }
          }
        })
      };
    }

    console.log(`✨ [getTokenPurchases] ${purchases?.length || 0} achats trouvés`);
    console.log('🔍 [getTokenPurchases] Requête utilisée:', {
      table: 'token_purchases',
      filter: `token_address=${tokenAddress}`,
      total_records: count || 0
    });

    // Format the data according to the actual schema
    console.log('🔄 [getTokenPurchases] Formatage des données...');
    const formattedData = (purchases || []).map(purchase => ({
      buyer: purchase.user_id || 'Unknown',
      type: purchase.action ? 'BUY' : 'SELL',
      amount: parseFloat(purchase.amount) || 0,
      estimated_value: parseFloat(purchase.cost) || 0,
      date: purchase.purchased_at,
      transaction_hash: purchase.tx_hash || ''
    }));

    console.log(`✅ [getTokenPurchases] Données formatées avec succès (${formattedData.length} entrées)`);
    if (formattedData.length > 0) {
      console.log('📊 [getTokenPurchases] Exemple d\'achat:', JSON.stringify(formattedData[0], null, 2));
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
    console.error('💥 [getTokenPurchases] Erreur inattendue:', error);
    console.error('Stack trace:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      })
    };
  }
}; 