import React, { createContext, useContext, useMemo, useState } from 'react';

const ActiveRideContext = createContext({
  activeRide: null,
  setActiveRide: () => {},
  clearActiveRide: () => {},
});

export function ActiveRideProvider({ children }) {
  const [activeRide, setActiveRideState] = useState(null);

  const setActiveRide = (ride) => setActiveRideState({ ...ride, startedAt: Date.now() });
  const clearActiveRide = () => setActiveRideState(null);

  const value = useMemo(
    () => ({ activeRide, setActiveRide, clearActiveRide }),
    [activeRide]
  );

  return (
    <ActiveRideContext.Provider value={value}>
      {children}
    </ActiveRideContext.Provider>
  );
}

export function useActiveRide() {
  return useContext(ActiveRideContext);
}
