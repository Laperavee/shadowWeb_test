import { supabase } from '../utils/supabase';

class RealtimeService {
  constructor() {
    this.channels = {};
    this.listeners = {};
  }

  // S'abonner aux changements de la table tokens
  subscribeToTokens(network, callback) {
    const channelId = `tokens-${network}`;
    
    // Si un canal existe déjà pour ce réseau, on le désabonne d'abord
    if (this.channels[channelId]) {
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
          console.log('Token update:', payload);
          if (callback && typeof callback === 'function') {
            callback(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${channelId}:`, status);
      });

    // Stocker le callback pour pouvoir le réutiliser
    this.listeners[channelId] = callback;
    
    return () => this.unsubscribeFromTokens(network);
  }

  // Se désabonner des changements de la table tokens
  unsubscribeFromTokens(network) {
    const channelId = `tokens-${network}`;
    
    if (this.channels[channelId]) {
      supabase.removeChannel(this.channels[channelId]);
      delete this.channels[channelId];
      delete this.listeners[channelId];
      console.log(`Unsubscribed from ${channelId}`);
    }
  }

  // Se désabonner de tous les canaux
  unsubscribeAll() {
    Object.keys(this.channels).forEach(channelId => {
      supabase.removeChannel(this.channels[channelId]);
      console.log(`Unsubscribed from ${channelId}`);
    });
    
    this.channels = {};
    this.listeners = {};
  }
}

export const realtimeService = new RealtimeService(); 