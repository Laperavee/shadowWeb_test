import { supabase } from '../utils/supabase';

class RealtimeService {
  constructor() {
    this.channels = {};
    this.listeners = {};
    console.log('🚀 Service de temps réel initialisé');
  }

  // S'abonner aux changements de la table tokens
  subscribeToTokens(network, callback) {
    const channelId = `tokens-${network}`;
    console.log(`📡 Tentative d'abonnement aux tokens du réseau ${network}`);
    
    // Si un canal existe déjà pour ce réseau, on le désabonne d'abord
    if (this.channels[channelId]) {
      console.log(`⚠️ Un canal existe déjà pour ${channelId}, désabonnement...`);
      this.unsubscribeFromTokens(network);
    }

    // Créer un nouveau canal pour ce réseau
    this.channels[channelId] = supabase
      .channel(channelId)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tokens',
          filter: `network=eq.${network}`
        }, 
        (payload) => {
          console.log('📣 Token update:', payload);
          if (callback && typeof callback === 'function') {
            callback(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Statut de l'abonnement pour ${channelId}:`, status);
      });

    // Stocker le callback pour pouvoir le réutiliser
    this.listeners[channelId] = callback;
    console.log(`✅ Abonnement aux tokens du réseau ${network} réussi`);
    
    return () => this.unsubscribeFromTokens(network);
  }

  // S'abonner aux achats des top holders pour un token spécifique
  subscribeToTokenPurchases(tokenAddress, callback) {
    const channelId = `token-purchases-${tokenAddress}`;
    console.log(`📡 Tentative d'abonnement aux achats du token ${tokenAddress}`);
    
    // Si un canal existe déjà pour ce token, on le désabonne d'abord
    if (this.channels[channelId]) {
      console.log(`⚠️ Un canal existe déjà pour ${channelId}, désabonnement...`);
      this.unsubscribeFromTokenPurchases(tokenAddress);
    }

    try {
      // Créer un nouveau canal pour ce token
      this.channels[channelId] = supabase
        .channel(channelId)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'token_purchases',
            filter: `token_address=eq.${tokenAddress}`
          }, 
          (payload) => {
            console.log('📣 Nouvel achat de token détecté:', payload);
            if (callback && typeof callback === 'function') {
              callback({
                ...payload,
                eventType: 'INSERT'  // S'assurer que eventType est défini
              });
            }
          }
        )
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'token_purchases',
            filter: `token_address=eq.${tokenAddress}`
          }, 
          (payload) => {
            console.log('📣 Mise à jour d\'un achat de token détectée:', payload);
            if (callback && typeof callback === 'function') {
              callback({
                ...payload,
                eventType: 'UPDATE'  // S'assurer que eventType est défini
              });
            }
          }
        )
        .subscribe((status) => {
          console.log(`📡 Statut de l'abonnement pour ${channelId}:`, status);
          
          // Vérifier si l'abonnement a réussi
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Abonnement aux achats du token ${tokenAddress} réussi`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ Erreur lors de l'abonnement aux achats du token ${tokenAddress}`);
          }
        });

      // Stocker le callback pour pouvoir le réutiliser
      this.listeners[channelId] = callback;
      
      return () => this.unsubscribeFromTokenPurchases(tokenAddress);
    } catch (error) {
      console.error(`❌ Erreur lors de la création du canal pour ${channelId}:`, error);
      return () => {};
    }
  }

  // Se désabonner des changements de la table tokens
  unsubscribeFromTokens(network) {
    const channelId = `tokens-${network}`;
    
    if (this.channels[channelId]) {
      console.log(`🔕 Désabonnement de ${channelId}...`);
      supabase.removeChannel(this.channels[channelId]);
      delete this.channels[channelId];
      delete this.listeners[channelId];
      console.log(`✅ Désabonnement de ${channelId} réussi`);
    }
  }

  // Se désabonner des achats des top holders pour un token spécifique
  unsubscribeFromTokenPurchases(tokenAddress) {
    const channelId = `token-purchases-${tokenAddress}`;
    
    if (this.channels[channelId]) {
      console.log(`🔕 Désabonnement de ${channelId}...`);
      supabase.removeChannel(this.channels[channelId]);
      delete this.channels[channelId];
      delete this.listeners[channelId];
      console.log(`✅ Désabonnement de ${channelId} réussi`);
    }
  }

  // Se désabonner de tous les canaux
  unsubscribeAll() {
    console.log(`🔕 Désabonnement de tous les canaux...`);
    Object.keys(this.channels).forEach(channelId => {
      supabase.removeChannel(this.channels[channelId]);
      console.log(`✅ Désabonnement de ${channelId} réussi`);
    });
    
    this.channels = {};
    this.listeners = {};
    console.log(`✅ Tous les canaux ont été désabonnés`);
  }
}

export const realtimeService = new RealtimeService(); 