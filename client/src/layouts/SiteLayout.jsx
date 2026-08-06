import { Outlet } from 'react-router-dom';
import bootstrapHref from 'bootstrap/dist/css/bootstrap.min.css?url';
import siteCssHref from '../styles/site.css?url';
import { useStylesheets } from '../utils/useStylesheets.js';
import { Navbar } from '../components/site/Navbar.jsx';
import { Footer } from '../components/site/Footer.jsx';
import { ChatWidget } from '../components/site/ChatWidget.jsx';
import { SiteSettingsProvider, useSiteSettings } from '../context/SiteSettingsContext.jsx';

function SiteLayoutInner() {
  const settings = useSiteSettings();
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer facebookUrl={settings.facebookUrl} shopeeUrl={settings.shopeeUrl} />
      <ChatWidget chatStatus={settings.chatStatus} facebookUrl={settings.facebookUrl} />
    </>
  );
}

export function SiteLayout() {
  useStylesheets([bootstrapHref, siteCssHref]);
  return (
    <SiteSettingsProvider>
      <SiteLayoutInner />
    </SiteSettingsProvider>
  );
}
