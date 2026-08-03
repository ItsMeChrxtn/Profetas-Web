import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import bootstrapHref from 'bootstrap/dist/css/bootstrap.min.css?url';
import siteCssHref from '../styles/site.css?url';
import { useStylesheets } from '../utils/useStylesheets.js';
import { Navbar } from '../components/site/Navbar.jsx';
import { Footer } from '../components/site/Footer.jsx';
import { ChatWidget } from '../components/site/ChatWidget.jsx';
import { settingsApi } from '../api/settings.js';

export function SiteLayout() {
  useStylesheets([bootstrapHref, siteCssHref]);
  const [settings, setSettings] = useState({ chatStatus: 'offline', facebookUrl: '', shopeeUrl: '', gcashNumber: '' });

  useEffect(() => {
    settingsApi
      .get()
      .then((data) => setSettings(data.settings))
      .catch(() => {});
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Outlet context={{ settings }} />
      </main>
      <Footer facebookUrl={settings.facebookUrl} shopeeUrl={settings.shopeeUrl} />
      <ChatWidget chatStatus={settings.chatStatus} facebookUrl={settings.facebookUrl} />
    </>
  );
}
