import { Outlet } from 'react-router-dom';
import bootstrapHref from 'bootstrap/dist/css/bootstrap.min.css?url';
import siteCssHref from '../styles/site.css?url';
import { useStylesheets } from '../utils/useStylesheets.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useMyNotifications } from '../hooks/useMyNotifications.js';
import { Navbar } from '../components/site/Navbar.jsx';
import { Footer } from '../components/site/Footer.jsx';
import { ChatWidget } from '../components/site/ChatWidget.jsx';
import { SiteSettingsProvider, useSiteSettings } from '../context/SiteSettingsContext.jsx';

function SiteLayoutInner() {
  const settings = useSiteSettings();
  const { user } = useAuth();
  const notifications = useMyNotifications(Boolean(user));

  return (
    <>
      <Navbar notifications={notifications} />
      <main>
        <Outlet />
      </main>
      <Footer facebookUrl={settings.facebookUrl} shopeeUrl={settings.shopeeUrl} />
      <ChatWidget chatStatus={settings.chatStatus} facebookUrl={settings.facebookUrl} />
    </>
  );
}

export function SiteLayout() {
  const stylesReady = useStylesheets([bootstrapHref, siteCssHref]);
  if (!stylesReady) return null;
  return (
    <SiteSettingsProvider>
      <SiteLayoutInner />
    </SiteSettingsProvider>
  );
}
