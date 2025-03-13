import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY
);

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

export const handler = async (event, context) => {
    // Gérer les requêtes OPTIONS pour CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
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

        // GET /api/transactions/:tokenAddress (récupérer les transactions d'un token)
        if (event.httpMethod === 'GET') {
            const tokenAddress = event.path.split('/transactions/')[1];
            
            console.log('Fetching transactions for token:', tokenAddress);

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

            if (error) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Failed to fetch transactions',
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
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
}; 