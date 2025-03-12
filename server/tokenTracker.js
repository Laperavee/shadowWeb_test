import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement depuis le fichier .env à la racine du projet
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Interface ABI pour l'événement Transfer des tokens ERC-20 et Swap des échanges comme Uniswap
const ERC20_TRANSFER_EVENT = [
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Interface pour Uniswap ou un autre échange avec l'événement Swap
const UNISWAP_SWAP_EVENT = [
    "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)"
];

// Vérifier que les variables d'environnement sont définies
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_SERVICE_KEY) {
    console.error('Missing required environment variables:');
    console.error('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✓' : '✗');
    console.error('VITE_SUPABASE_SERVICE_KEY:', process.env.VITE_SUPABASE_SERVICE_KEY ? '✓' : '✗');
    console.error('RPC_URL:', process.env.RPC_URL ? '✓' : '✗');
    
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_SERVICE_KEY) {
        console.error('Les variables Supabase sont requises pour le fonctionnement du tracker');
        process.exit(1);
    }
}

// Utiliser l'URL RPC d'Avalanche ou une URL de fallback
const RPC_URL = process.env.RPC_URL || 'https://api.avax.network/ext/bc/C/rpc';
// Nœuds RPC publics alternatifs pour Avalanche
const FALLBACK_URLS = [
    'https://avalanche-c-chain.publicnode.com',
    'https://rpc.ankr.com/avalanche',
    'https://avalanche.blockpi.network/v1/rpc/public'
];

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_KEY
);

// Variables globales pour le provider
let provider;
let isConnected = false;
let currentRpcUrl = RPC_URL;
let fallbackIndex = 0;

// Fonction pour analyser les logs de transaction et détecter les transferts de tokens ERC-20
async function analyzeTransactionLogs(txHash) {
    try {
        // Récupérer le reçu de la transaction
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt || !receipt.logs || receipt.logs.length === 0) {
            console.log(`⚠️ Aucun log trouvé pour la transaction ${txHash}`);
            return [];
        }
        
        console.log(`📜 Analyse des logs de la transaction ${txHash} (${receipt.logs.length} logs)`);

        // Créer une interface pour décoder les événements ERC-20 Transfer et Uniswap Swap
        const transferInterface = new ethers.Interface(ERC20_TRANSFER_EVENT);
        const swapInterface = new ethers.Interface(UNISWAP_SWAP_EVENT);
        
        const transfers = [];
        
        // Parcourir tous les logs
        for (const log of receipt.logs) {
            try {
                // Vérifier si c'est un événement ERC-20 Transfer
                if (log.topics && log.topics.length >= 3) {
                    try {
                        const decodedLog = transferInterface.parseLog({
                            topics: log.topics,
                            data: log.data
                        });
                        
                        if (decodedLog && decodedLog.name === 'Transfer') {
                            const tokenAddress = log.address;
                            const from = decodedLog.args[0].toLowerCase();
                            const to = decodedLog.args[1].toLowerCase();
                            const value = decodedLog.args[2].toString();
                            
                            transfers.push({
                                type: 'transfer',
                                tokenAddress,
                                from,
                                to,
                                value
                            });
                            
                            console.log(`🔄 Transfert ERC-20: ${from} -> ${to} (${value} tokens de ${tokenAddress})`);
                        }
                    } catch (err) {
                        // Ce n'est pas un événement Transfer, on continue
                    }
                }
                
                // Vérifier si c'est un événement Swap (ex: Uniswap)
                if (log.topics && log.topics.length >= 2) {
                    try {
                        const decodedLog = swapInterface.parseLog({
                            topics: log.topics,
                            data: log.data
                        });
                        
                        if (decodedLog && decodedLog.name === 'Swap') {
                            const sender = decodedLog.args[0].toLowerCase();
                            const amount0In = decodedLog.args[1].toString();
                            const amount1In = decodedLog.args[2].toString();
                            const amount0Out = decodedLog.args[3].toString();
                            const amount1Out = decodedLog.args[4].toString();
                            const to = decodedLog.args[5].toLowerCase();
                            
                            transfers.push({
                                type: 'swap',
                                sender,
                                amount0In,
                                amount1In,
                                amount0Out,
                                amount1Out,
                                to
                            });
                            
                            console.log(`🔄 Swap: ${sender} -> ${to} (In: ${amount0In}, ${amount1In} | Out: ${amount0Out}, ${amount1Out})`);
                        }
                    } catch (err) {
                        // Ce n'est pas un événement Swap, on continue
                    }
                }
            } catch (err) {
                // Si ce n'est pas un événement reconnu, ignorer le log
            }
        }
        
        return transfers;
    } catch (err) {
        console.error(`❌ Erreur lors de l'analyse des logs de la transaction ${txHash}:`, err);
        return [];
    }
}

// Fonction pour initialiser le provider
function setupProvider() {
    try {
        console.log(`🔌 Tentative de connexion à ${currentRpcUrl}`);
        
        // Créer le provider avec l'URL RPC
        provider = new ethers.JsonRpcProvider(currentRpcUrl);
        
        // Vérifier si la connexion est établie
        provider.getBlockNumber().then((blockNumber) => {
            console.log(`✅ Provider initialized successfully (current block: ${blockNumber})`);
            isConnected = true;
        }).catch(error => {
            console.error('❌ Failed to get block number:', error.message);
            isConnected = false;
            tryFallbackProvider();
        });
        
        return provider;
    } catch (error) {
        console.error('❌ Failed to initialize provider:', error.message);
        isConnected = false;
        tryFallbackProvider();
        return null;
    }
}

// Fonction pour essayer un provider de fallback
function tryFallbackProvider() {
    if (fallbackIndex < FALLBACK_URLS.length) {
        console.log(`🔄 Tentative avec un nœud RPC alternatif...`);
        currentRpcUrl = FALLBACK_URLS[fallbackIndex++];
        setTimeout(setupProvider, 5000);
    } else {
        console.error('❌ Tous les nœuds RPC ont échoué. Nouvelle tentative dans 30 secondes...');
        fallbackIndex = 0;
        currentRpcUrl = RPC_URL;
        setTimeout(setupProvider, 30000);
    }
}

// Récupérer les adresses des top holders depuis la base de données
async function getTopHolders() {
    const { data, error } = await supabase
        .from('top_holders')
        .select('user_id');

    if (error) {
        console.error("❌ Erreur lors de la récupération des top holders:", error);
        return [];
    }

    return data.map(holder => holder.user_id);
}

// Récupérer les adresses des tokens créés via Shadow Protocol
async function getTokensByShadow() {
    const { data, error } = await supabase
        .from('tokens')
        .select('token_address');

    if (error) {
        console.error("❌ Erreur lors de la récupération des tokens:", error);
        return [];
    }

    return data.map(token => token.token_address);
}

// Fonction pour démarrer le polling des blocs
let pollingInterval;
async function startPolling() {
    // Arrêter tout polling existant
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    // Récupérer les listes de holders et tokens
    const holders = await getTopHolders();
    const tokens = await getTokensByShadow();
    
    // Convertir les adresses en minuscules pour les comparaisons
    const tokensLowerCase = tokens.map(addr => addr.toLowerCase());
    const holdersLowerCase = holders.map(addr => addr.toLowerCase());
    
    console.log(`📡 Polling: Tracking ${holders.length} top holders`);
    console.log(`🎯 Polling: Tracking ${tokens.length} tokens`);
    
    // Afficher la liste complète des top holders
    console.log("Liste des top holders:");
    holders.forEach((holder, index) => {
        console.log(`  ${index + 1}. ${holder}`);
    });

    // Afficher la liste complète des tokens suivis
    console.log("Liste des tokens suivis:");
    tokens.forEach((token, index) => {
        console.log(`  ${index + 1}. ${token}`);
    });
    
    let lastBlockNumber = await provider.getBlockNumber().catch(err => {
        console.error('❌ Erreur lors de la récupération du dernier bloc:', err);
        return null;
    });
    
    if (lastBlockNumber === null) {
        console.error('❌ Impossible de démarrer le polling sans numéro de bloc initial');
        return;
    }
    
    console.log(`🔄 Démarrage du polling à partir du bloc ${lastBlockNumber}`);
    
    // Vérifier les nouveaux blocs toutes les 15 secondes
    pollingInterval = setInterval(async () => {
        try {
            if (!isConnected) {
                console.warn('⚠️ Provider non connecté, tentative de reconnexion...');
                setupProvider();
                return;
            }
            
            const currentBlockNumber = await provider.getBlockNumber();
            
            if (currentBlockNumber > lastBlockNumber) {
                console.log(`Nouveaux blocs détectés: ${lastBlockNumber + 1} à ${currentBlockNumber}`);
                
                // Traiter chaque bloc manqué
                for (let i = lastBlockNumber + 1; i <= currentBlockNumber; i++) {
                    try {
                        // Récupérer le bloc
                        const block = await provider.getBlock(i);
                        
                        if (block && block.transactions) {
                            console.log(`Traitement du bloc ${i} (${block.transactions.length} transactions)`);
                            
                            // Parcourir tous les hashes de transactions du bloc
                            for (const txHash of block.transactions) {
                                try {
                                    // Récupérer les détails complets de la transaction
                                    const tx = await provider.getTransaction(txHash);
                                    
                                    if (!tx) {
                                        continue;
                                    }
                                    
                                    // Si la transaction n'a pas les propriétés nécessaires, ignorer le reste du traitement
                                    if (!tx.from || !tx.to) {
                                        continue;
                                    }
                                    
                                    // Convertir les adresses en minuscules pour la comparaison
                                    const fromLower = tx.from.toLowerCase();
                                    const toLower = tx.to.toLowerCase();
                                    
                                    // Vérifier si l'adresse from est dans la liste des top holders
                                    const isFromTopHolder = holdersLowerCase.includes(fromLower);
                                    
                                    // Si l'expéditeur n'est pas un top holder, ignorer la transaction
                                    if (!isFromTopHolder) {
                                        continue;
                                    }
                                    
                                    console.log(`\n📝 Transaction de top holder: ${tx.hash}`);
                                    console.log(`  From: ${tx.from}`);
                                    console.log(`  To: ${tx.to}`);
                                    console.log(`  Value: ${ethers.formatEther(tx.value)} AVAX`);
                                    
                                    // Cas 1: Transaction directe vers un token suivi
                                    const isToTrackedToken = tokensLowerCase.includes(toLower);
                                    if (isToTrackedToken) {
                                        console.log(`✅ Achat direct détecté: ${tx.from} a acheté le token ${tx.to}`);
                                        
                                        // Récupérer le prix actuel du token
                                        const tokenPrice = await getTokenPrice(tx.to);
                                        const tokenAmount = parseFloat(ethers.formatEther(tx.value));
                                        const cost = tokenPrice > 0 ? (tokenAmount * tokenPrice).toString() : null;
                                        
                                        // Utiliser la fonction uniformisée pour enregistrer l'achat
                                        await recordPurchase(tx.from, tx.to, tx.hash, tx.value, cost, true);
                                    }
                                    
                                    // Cas 2: Analyser les logs de la transaction pour détecter les transferts de tokens
                                    console.log(`🔍 Analyse des logs de la transaction ${tx.hash}...`);
                                    const transfers = await analyzeTransactionLogs(tx.hash);
                                    
                                    if (transfers.length > 0) {
                                        // Parcourir tous les transferts pour trouver ceux qui impliquent des tokens suivis
                                        for (const transfer of transfers) {
                                            // Ne traiter que les transferts de type 'transfer'
                                            if (transfer.type !== 'transfer') continue;
                                            
                                            // Ignorer les transferts de 0 tokens (probablement des approbations)
                                            if (transfer.value === '0') {
                                                console.log(`⚠️ Transfert ignoré: montant de 0 tokens (probablement une approbation)`);
                                                continue;
                                            }
                                            
                                            // Vérifier si le token transféré est dans notre liste de tokens suivis
                                            const isTrackedToken = tokensLowerCase.includes(transfer.tokenAddress.toLowerCase());
                                            
                                            // Si le token n'est pas suivi, ignorer ce transfert
                                            if (!isTrackedToken) continue;
                                            
                                            // Vérifier si le top holder est impliqué dans le transfert
                                            const isFromTopHolder = transfer.from === fromLower;
                                            const isToTopHolder = transfer.to === fromLower;
                                            
                                            if (isToTopHolder) {
                                                // Le top holder reçoit des tokens = ACHAT
                                                console.log(`✅ Achat via DEX détecté: ${tx.from} a reçu ${transfer.value} tokens de ${transfer.tokenAddress}`);
                                                
                                                // Récupérer le prix actuel du token
                                                const tokenPrice = await getTokenPrice(transfer.tokenAddress);
                                                const tokenAmount = parseFloat(transfer.value) / 1e18;
                                                const cost = tokenPrice > 0 ? (tokenAmount * tokenPrice).toString() : null;
                                                
                                                // Utiliser la fonction uniformisée pour enregistrer l'achat
                                                await recordPurchase(tx.from, transfer.tokenAddress, tx.hash, transfer.value, cost, true);
                                            } else if (isFromTopHolder) {
                                                // Le top holder envoie des tokens = VENTE
                                                console.log(`🔴 Vente via DEX détectée: ${tx.from} a vendu ${transfer.value} tokens de ${transfer.tokenAddress}`);
                                                
                                                // Récupérer le prix actuel du token
                                                const tokenPrice = await getTokenPrice(transfer.tokenAddress);
                                                const tokenAmount = parseFloat(transfer.value) / 1e18;
                                                const cost = tokenPrice > 0 ? (tokenAmount * tokenPrice).toString() : null;
                                                
                                                // Utiliser la fonction uniformisée pour enregistrer la vente
                                                await recordPurchase(tx.from, transfer.tokenAddress, tx.hash, transfer.value, cost, false);
                                            }
                                        }
                                    }
                                } catch (err) {
                                    console.error(`❌ Erreur lors du traitement de la transaction ${txHash}:`, err);
                                }
                            }
                        }
                    } catch (err) {
                        console.error(`❌ Erreur lors du traitement du bloc ${i}:`, err);
                    }
                }
                
                lastBlockNumber = currentBlockNumber;
            }
        } catch (err) {
            console.error('❌ Erreur lors du polling:', err);
            isConnected = false;
            tryFallbackProvider();
        }
    }, 15000); // 15 secondes
    
    console.log("🚀 Polling démarré avec succès");
}

// Fonction pour démarrer le tracker
function startTracker() {
    // S'assurer que le provider est initialisé
    if (!provider) {
        console.log('🔄 Initialisation du provider...');
        const newProvider = setupProvider();
        
        // Si l'initialisation a échoué, on ne continue pas
        if (!newProvider) {
            console.warn('⚠️ Provider non initialisé, impossible de démarrer le tracker');
            return;
        }
    }
    
    // Attendre que la connexion soit établie
    if (!isConnected) {
        console.log('⏳ Attente de la connexion...');
        setTimeout(startTracker, 5000);
        return;
    }
    
    // Démarrer le polling des blocs
    startPolling().catch(error => {
        console.error('❌ Erreur dans le tracker:', error);
        console.log('🔄 Redémarrage du tracker dans 30 secondes...');
        setTimeout(startTracker, 30000);
    });
}

// Initialiser le provider et lancer le tracker
const initProvider = setupProvider();
if (!initProvider) {
    console.warn('⚠️ Le tracker ne sera pas démarré car le provider n\'a pas pu être initialisé');
} else {
    // Attendre un peu pour s'assurer que le provider est initialisé
    setTimeout(() => {
        startTracker();
    }, 5000);
}

console.log("📊 Token Tracker démarré");

// Exporter les fonctions pour les utiliser ailleurs si nécessaire
export { getTopHolders, getTokensByShadow };

// Fonction pour récupérer le prix actuel d'un token
async function getTokenPrice(tokenAddress) {
    try {
        // Essayer de récupérer le prix depuis DexScreener
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
        const data = await response.json();
        
        if (data && data.pairs && data.pairs.length > 0) {
            // Trier par volume pour obtenir la paire la plus active
            const sortedPairs = data.pairs.sort((a, b) => 
                parseFloat(b.volumeUsd24h || 0) - parseFloat(a.volumeUsd24h || 0)
            );
            
            const mainPair = sortedPairs[0];
            return parseFloat(mainPair.priceUsd || 0);
        }
        
        return 0;
    } catch (err) {
        console.error(`❌ Erreur lors de la récupération du prix du token ${tokenAddress}:`, err);
        return 0;
    }
}

// Fonction pour enregistrer un achat en base de données (uniformisée pour les achats directs et DEX)
async function recordPurchase(userId, tokenAddress, txHash, amount, cost = null, isBuy = true) {
    // Ignorer les transactions avec un montant de 0 (probablement des approbations)
    if (amount.toString() === '0') {
        console.log(`⚠️ Transaction ignorée: montant de 0 tokens (probablement une approbation)`);
        return false;
    }
    
    console.log(`📝 Enregistrement d'${isBuy ? 'un achat' : 'une vente'} pour l'utilisateur ${userId}`);
    console.log(`  Token: ${tokenAddress}`);
    console.log(`  Transaction: ${txHash}`);
    console.log(`  Montant: ${amount}`);
    console.log(`  Coût: ${cost || 'Non disponible'}`);
    console.log(`  Action: ${isBuy ? 'true (BUY)' : 'false (SELL)'}`);
    
    try {
        // Vérifier si cette transaction existe déjà dans la base de données
        const { data: existingData, error: existingError } = await supabase
            .from('token_purchases')
            .select('id')
            .eq('tx_hash', txHash)
            .eq('user_id', userId)
            .eq('token_address', tokenAddress);
            
        if (existingError) {
            console.error('❌ Erreur lors de la vérification des achats existants:', existingError);
        } else if (existingData && existingData.length > 0) {
            console.log(`⚠️ Cette transaction existe déjà dans la base de données (ID: ${existingData[0].id}), mise à jour uniquement`);
            
            // Mettre à jour la transaction existante si nécessaire (par exemple, mettre à jour le coût)
            if (cost) {
                const { data: updateData, error: updateError } = await supabase
                    .from('token_purchases')
                    .update({ cost, action: isBuy })
                    .eq('id', existingData[0].id)
                    .select();
                    
                if (updateError) {
                    console.error('❌ Erreur lors de la mise à jour de la transaction:', updateError);
                    return false;
                } else {
                    console.log('✅ Transaction mise à jour avec succès');
                    console.log('📊 Données mises à jour:', updateData);
                    return true;
                }
            }
            
            return true; // La transaction existe déjà, pas besoin de l'insérer à nouveau
        }
        
        // Insérer la nouvelle transaction
        const { data, error } = await supabase
            .from('token_purchases')
            .insert([
                {
                    user_id: userId,
                    token_address: tokenAddress,
                    tx_hash: txHash,
                    amount: amount.toString(),
                    cost,
                    action: isBuy,
                    purchased_at: new Date().toISOString()
                }
            ])
            .select();
        
        if (error) {
            console.error('❌ Erreur d\'insertion en DB:', error);
            return false;
        } else {
            console.log(`✅ ${isBuy ? 'Achat' : 'Vente'} enregistré(e) en base de données avec succès`);
            console.log('📊 Données insérées:', data);
            
            // Vérifier que les données ont bien été insérées
            if (!data || data.length === 0) {
                console.warn('⚠️ Les données semblent avoir été insérées mais aucune donnée n\'a été retournée');
            } else {
                console.log(`✅ ID de la transaction insérée: ${data[0].id}`);
            }
            
            if (cost) {
                console.log(`💰 Coût estimé: $${parseFloat(cost).toFixed(2)}`);
            }
            
            // Vérifier que l'événement a bien été déclenché
            console.log('🔔 L\'événement d\'insertion devrait être déclenché automatiquement par Supabase');
            
            return true;
        }
    } catch (err) {
        console.error('❌ Erreur lors de l\'enregistrement de la transaction:', err);
        return false;
    }
} 