import { createContext, useContext, useState } from 'react';

const SoundContext = createContext();

export function SoundProvider({ children }) {
  const [isMuted, setIsMuted] = useState(false);

  const playSound = (soundName) => {
    // Temporairement désactivé
    console.log('Playing sound:', soundName);
  };

  return (
    <SoundContext.Provider value={{ playSound, isMuted, setIsMuted }}>
      {children}
    </SoundContext.Provider>
  );
}

export const useSound = () => useContext(SoundContext);

export default SoundProvider; 