import { createContext, useContext, useEffect, useState } from 'react';
import { settingsApi } from '../api/settings.js';

const SiteSettingsContext = createContext(null);
const DEFAULTS = { chatStatus: 'offline', facebookUrl: '', shopeeUrl: '', gcashNumber: '' };

// A real React Context, not react-router's useOutletContext(): that mechanism only
// reaches routes rendered directly by the Outlet that received the context prop -
// a nested <Outlet /> inside RequireAuth (with no context of its own) breaks the
// chain for any route guarded by it, e.g. Checkout.
export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    settingsApi
      .get()
      .then((data) => setSettings(data.settings))
      .catch(() => {});
  }, []);

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  return ctx;
}
