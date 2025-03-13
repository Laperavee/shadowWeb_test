import { createClient } from '@supabase/supabase-js';

// Vérification des variables d'environnement
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase environment variables');
    console.log('SUPABASE_URL:', !!SUPABASE_URL);
    console.log('SUPABASE_KEY:', !!SUPABASE_KEY);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

export const handler = async (event, context) => {
    console.log('🚀 Function started');
    console.log('Method:', event.httpMethod);
    console.log('Path:', event.path);

    try {
        // Gérer les requêtes OPTIONS pour CORS
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: ''
            };
        }

        // GET /api/transactions/:tokenAddress (récupérer les transactions d'un token)
        if (event.httpMethod === 'GET') {
            try {
                console.log('📥 GET request received');
                console.log('Raw path:', event.path);
                
                const tokenAddress = event.path.split('/transactions/')[1];
                if (!tokenAddress) {
                    console.error('❌ No token address provided');
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            error: 'Token address is required'
                        })
                    };
                }
                
                console.log('🔍 Token address:', tokenAddress);
                console.log('📊 Supabase config:', {
                    url: SUPABASE_URL ? '✅ Set' : '❌ Missing',
                    key: SUPABASE_KEY ? '✅ Set' : '❌ Missing'
                });

                // Vérifier la connexion à Supabase
                try {
                    const { data: testData, error: testError } = await supabase
                        .from('token_purchases')
                        .select('count(*)', { count: 'exact' })
                        .limit(1);

                    console.log('🔌 Supabase connection test:', {
                        success: !testError,
                        error: testError
                    });

                    if (testError) {
                        throw new Error(`Supabase connection test failed: ${testError.message}`);
                    }
                } catch (testError) {
                    console.error('❌ Supabase connection test error:', testError);
                    throw testError;
                }

                // Requête principale
                console.log('📡 Fetching transactions...');
                const { data, error } = await supabase
                    .from('token_purchases')
                    .select(`
                        id,
                        user_id,
                        token_address,
                        tx_hash,
                        amount,
                        cost,
                        action,
                        created_at
                    `)
                    .eq('token_address', tokenAddress)
                    .order('created_at', { ascending: false });

                console.log('📦 Query result:', {
                    success: !error,
                    dataCount: data?.length || 0,
                    error: error
                });

                if (error) {
                    throw error;
                }

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, data })
                };
            } catch (error) {
                console.error('❌ GET handler error:', error);
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
        }

        // POST /api/transactions (enregistrer une transaction)
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            const {
                user_id,
                token_address,
                tx_hash,
                amount,
                cost,
                action // true pour BUY, false pour SELL
            } = body;

            // Vérifier si la transaction existe déjà
            const { data: existingData, error: existingError } = await supabase
                .from('token_purchases')
                .select('id')
                .eq('tx_hash', tx_hash)
                .eq('user_id', user_id)
                .eq('token_address', token_address);

            if (existingError) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Failed to check existing transaction',
                        details: existingError 
                    })
                };
            }

            if (existingData && existingData.length > 0) {
                // Mettre à jour la transaction existante
                const { data, error } = await supabase
                    .from('token_purchases')
                    .update({ cost, action })
                    .eq('id', existingData[0].id)
                    .select();

                if (error) {
                    return {
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({ 
                            success: false, 
                            error: 'Failed to update transaction',
                            details: error 
                        })
                    };
                }

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, data })
                };
            }

            // Insérer une nouvelle transaction
            const { data, error } = await supabase
                .from('token_purchases')
                .insert([{
                    user_id,
                    token_address,
                    tx_hash,
                    amount: amount.toString(),
                    cost,
                    action,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Failed to insert transaction',
                        details: error 
                    })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, data })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('❌ Global handler error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                details: error.message
            })
        };
    }
}; 