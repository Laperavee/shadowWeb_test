import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { fork } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement depuis le fichier .env à la racine du projet
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Configuration CORS
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:4173',
        'https://your-netlify-app.netlify.app', // Remplacez par votre domaine Netlify
    ],
    methods: ['GET', 'POST'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Vérifier que les variables d'environnement sont définies
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_SERVICE_KEY) {
    console.error('Missing required environment variables:');
    console.error('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✓' : '✗');
    console.error('VITE_SUPABASE_SERVICE_KEY:', process.env.VITE_SUPABASE_SERVICE_KEY ? '✓' : '✗');
    process.exit(1);
}

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_KEY
);

// Test de connexion à Supabase
const testSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase
            .from('tokens')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('Supabase connection test failed:', error);
            return false;
        }
        
        console.log('Supabase connection successful');
        return true;
    } catch (error) {
        console.error('Supabase connection test failed:', error);
        return false;
    }
};

// Endpoint pour récupérer les tokens
app.get('/api/tokens', async (req, res) => {
    try {
        const { network } = req.query;
        const { data, error } = await supabase
            .from('tokens')
            .select('*')
            .eq('network', network)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tokens:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint pour récupérer un token par son adresse
app.get('/api/tokens/address/:address', async (req, res) => {
    try {
        const { address } = req.params;

        const { data, error } = await supabase
            .from('tokens')
            .select('*')
            .eq('token_address', address)
            .single();

        if (error) {
            console.error('Error fetching token by address:', error);
            return res.status(404).json({ error: 'Token not found' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint pour récupérer les tokens d'un créateur
app.get('/api/tokens/creator/:address', async (req, res) => {
    try {
        const { address } = req.params;

        const { data, error } = await supabase
            .from('tokens')
            .select('*')
            .eq('deployer_address', address)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching creator tokens:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Nouvel endpoint pour récupérer les achats des top holders pour un token spécifique
app.get('/api/tokens/:address/top-holder-purchases', async (req, res) => {
    try {
        const { address } = req.params;
        console.log(`📡 Récupération des achats pour le token ${address}...`);
        
        // Récupérer tous les achats pour ce token
        const { data, error } = await supabase
            .from('token_purchases')
            .select('*')
            .eq('token_address', address)
            .order('purchased_at', { ascending: false });
            
        if (error) {
            console.error('❌ Error fetching token purchases:', error);
            return res.status(500).json({ error: error.message });
        }
        
        console.log(`✅ ${data?.length || 0} achats récupérés pour le token ${address}`);
        
        // Récupérer la liste des top holders
        const { data: topHolders, error: topHoldersError } = await supabase
            .from('top_holders')
            .select('user_id');
            
        if (topHoldersError) {
            console.error('❌ Error fetching top holders:', topHoldersError);
            return res.status(500).json({ error: topHoldersError.message });
        }
        
        console.log(`✅ ${topHolders?.length || 0} top holders récupérés`);
        
        // Convertir les adresses des top holders en minuscules pour la comparaison
        const topHolderAddresses = topHolders.map(holder => holder.user_id.toLowerCase());
        
        // Filtrer les achats pour ne garder que ceux des top holders
        const topHolderPurchases = data.filter(purchase => 
            topHolderAddresses.includes(purchase.user_id.toLowerCase())
        );
        
        console.log(`✅ ${topHolderPurchases.length} achats de top holders trouvés`);
        
        res.json({ success: true, data: topHolderPurchases });
    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/tokens', async (req, res) => {
    try {
        const {
            token_address,
            token_name,
            token_symbol,
            supply,
            liquidity,
            max_wallet_percentage,
            network,
            deployer_address,
            image_url,
            is_featured,
            tx_hash
        } = req.body;

        // Vérifier que tx_hash est fourni
        if (!tx_hash) {
            return res.status(400).json({ error: 'Transaction hash is required' });
        }

        const { data, error } = await supabase
            .from('tokens')
            .insert([{
                token_address,
                token_name,
                token_symbol,
                supply,
                liquidity,
                max_wallet_percentage,
                network,
                deployer_address,
                created_at: new Date(),
                image_url,
                is_featured: is_featured || false,
                tx_hash
            }])
            .select();

        if (error) {
            console.error('Error inserting token:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Nouvel endpoint pour mettre à jour le coût d'un achat
app.post('/api/token-purchases/:id/update-cost', async (req, res) => {
    try {
        const { id } = req.params;
        const { cost } = req.body;
        
        console.log(`📝 Mise à jour du coût pour l'achat ${id}: ${cost}`);
        
        if (!cost) {
            console.error('❌ Erreur: Le coût est requis');
            return res.status(400).json({ error: 'Cost is required' });
        }
        
        const { data, error } = await supabase
            .from('token_purchases')
            .update({ cost })
            .eq('id', id)
            .select();
            
        if (error) {
            console.error('❌ Erreur lors de la mise à jour du coût:', error);
            return res.status(500).json({ error: error.message });
        }
        
        console.log(`✅ Coût mis à jour avec succès pour l'achat ${id}`);
        
        res.json({ success: true, data });
    } catch (error) {
        console.error('❌ Erreur serveur:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fonction pour démarrer le token tracker
const startTokenTracker = () => {
  console.log('Starting token tracker...');
  
  // Vérifier si RPC_URL est défini
  if (!process.env.RPC_URL) {
    console.warn('⚠️ RPC_URL environment variable is missing.');
    console.warn('Le tracker utilisera des nœuds RPC publics par défaut.');
  }
  
  const trackerProcess = fork(path.join(__dirname, 'tokenTracker.js'));
  
  trackerProcess.on('message', (message) => {
    console.log('Message from token tracker:', message);
  });
  
  trackerProcess.on('error', (error) => {
    console.error('Token tracker error:', error);
  });
  
  trackerProcess.on('exit', (code, signal) => {
    console.log(`Token tracker exited with code ${code} and signal ${signal}`);
    // Redémarrer le tracker après un délai si le processus s'arrête
    setTimeout(() => {
      console.log('Restarting token tracker...');
      startTokenTracker();
    }, 10000);
  });
  
  return trackerProcess;
};

const PORT = process.env.PORT || 3002;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await testSupabaseConnection();
    
    // Démarrer le token tracker après la connexion à Supabase
    startTokenTracker();
}); 