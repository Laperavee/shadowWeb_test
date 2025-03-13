import { createClient } from '@supabase/supabase-js';

// Vérification des variables d'environnement
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

// Vérification initiale des variables d'environnement
const envCheck = {
    SUPABASE_URL: !!SUPABASE_URL,
    SUPABASE_KEY: !!SUPABASE_KEY,
    NODE_ENV: process.env.NODE_ENV,
    AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME
};

console.log('Environment check:', envCheck);

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase environment variables');
    console.log('SUPABASE_URL:', !!SUPABASE_URL);
    console.log('SUPABASE_KEY:', !!SUPABASE_KEY);
}

let supabase;
try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase client created successfully');
} catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
}

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

export const handler = async (event, context) => {
    console.log('🚀 Function started with event:', {
        httpMethod: event.httpMethod,
        path: event.path,
        headers: event.headers
    });

    // Vérifier si le client Supabase est initialisé
    if (!supabase) {
        console.error('❌ Supabase client not initialized');
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Database connection not initialized',
                env: envCheck
            })
        };
    }

    try {
        // Gérer les requêtes OPTIONS pour CORS
        if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }

        // GET /api/transactions/:tokenAddress
        if (event.httpMethod === 'GET') {
            try {
                console.log('📥 GET request received');
                console.log('Raw path:', event.path);
                
                // Extraire l'adresse du token de l'URL
                const pathParts = event.path.split('/');
                const tokenAddress = pathParts[pathParts.length - 1];
                
                console.log('Path parts:', pathParts);
                console.log('Extracted token address:', tokenAddress);

                if (!tokenAddress || tokenAddress === 'transactions') {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            error: 'Token address is required'
                        })
                    };
                }
                
                console.log('🔍 Processing request for token:', tokenAddress);

                // Test de connexion à Supabase
                const { data: testData, error: testError } = await supabase
                    .from('token_purchases')
                    .select('count(*)', { count: 'exact' })
                    .limit(1);

                if (testError) {
                    console.error('❌ Database connection test failed:', testError);
                    return {
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            error: 'Database connection test failed',
                            details: testError,
                            env: envCheck
                        })
                    };
                }

                // Requête principale
                console.log('📡 Fetching transactions...');
                const { data, error } = await supabase
                    .from('token_purchases')
                    .select('*')
                    .eq('token_address', tokenAddress)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('❌ Query error:', error);
                    return {
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            error: 'Failed to fetch transactions',
                            details: error,
                            query: {
                                table: 'token_purchases',
                                tokenAddress,
                                columns: '*'
                            }
                        })
                    };
                }

                console.log(`✅ Found ${data?.length || 0} transactions`);
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
                        error: 'Internal server error in GET handler',
                        details: error.message,
                        stack: error.stack,
                        env: envCheck
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
                success: false,
                error: 'Global handler error',
                details: error.message,
                stack: error.stack,
                env: envCheck
            })
        };
    }
}; 