import { useEffect, useState } from 'react';
import { adminSettingsApi, adminLandingApi } from '../../api/admin/settings.js';
import { mediaUrl } from '../../utils/mediaUrl.js';
import { showToast } from '../../utils/toast.js';
import { confirmAction } from '../../utils/confirm.js';

function UploadButton({ slot, label, onUploaded, disabled }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    const data = new FormData();
    data.append('slot', slot);
    data.append('image', file);
    setUploading(true);
    try {
      const res = await adminLandingApi.addImage(data);
      onUploaded(res.settings);
      showToast('success', 'Image uploaded.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <label className={`btn btn-outline ${disabled || uploading ? 'disabled' : ''}`} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-upload'}`} /> {uploading ? 'Uploading...' : label}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        disabled={disabled || uploading}
        onChange={(e) => {
          handleFile(e.target.files[0]);
          e.target.value = '';
        }}
      />
    </label>
  );
}

function Thumb({ src, onRemove, children }) {
  return (
    <div className="landing-thumb">
      <img src={mediaUrl(src)} alt="" />
      <button type="button" className="landing-thumb-remove" title="Remove" onClick={onRemove}>
        <i className="fas fa-times" />
      </button>
      {children}
    </div>
  );
}

/** Admin control for the customer home page: hero slideshow, farm photos, and About section. */
export function LandingPageSettings() {
  const [settings, setSettings] = useState(null);
  const [aboutText, setAboutText] = useState('');
  const [captions, setCaptions] = useState([]);
  const [saving, setSaving] = useState(false);

  function applySettings(s) {
    setSettings(s);
    setAboutText(s.aboutText || '');
    setCaptions((s.glimpseImages || []).map((g) => g.caption || ''));
  }

  useEffect(() => {
    adminSettingsApi.get().then((data) => applySettings(data.settings));
  }, []);

  async function remove(slot, image) {
    const ok = await confirmAction('Remove this image from the home page?', { confirmButtonText: 'Yes, remove' });
    if (!ok) return;
    try {
      const res = await adminLandingApi.removeImage(slot, image);
      applySettings(res.settings);
    } catch (err) {
      showToast('error', err.message);
    }
  }

  async function saveText() {
    setSaving(true);
    try {
      const res = await adminLandingApi.updateContent({ aboutText, glimpseCaptions: captions });
      applySettings(res.settings);
      showToast('success', 'Landing page text saved.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return null;

  return (
    <div className="card" id="landing-page" style={{ marginTop: 30 }}>
      <div className="card-header">
        <h3 className="card-title">
          <i className="fas fa-home" /> Landing Page
        </h3>
      </div>

      <div className="landing-section">
        <div className="landing-section-head">
          <div>
            <h4>Hero Background</h4>
            <p>These photos slide behind the headline on the home page (up to 6). Wide landscape photos look best.</p>
          </div>
          <UploadButton slot="hero" label="Add Photo" disabled={settings.heroImages.length >= 6} onUploaded={applySettings} />
        </div>
        <div className="landing-thumbs">
          {settings.heroImages.map((src) => (
            <Thumb key={src} src={src} onRemove={() => remove('hero', src)} />
          ))}
          {settings.heroImages.length === 0 && <p className="landing-empty">No hero photos - the home page shows a plain maroon background.</p>}
        </div>
      </div>

      <div className="landing-section">
        <div className="landing-section-head">
          <div>
            <h4>A Glimpse of the Farm</h4>
            <p>Farm photos shown on the home page (up to 6), each with a short caption.</p>
          </div>
          <UploadButton slot="glimpse" label="Add Photo" disabled={settings.glimpseImages.length >= 6} onUploaded={applySettings} />
        </div>
        <div className="landing-thumbs">
          {settings.glimpseImages.map((g, i) => (
            <Thumb key={g.image} src={g.image} onRemove={() => remove('glimpse', g.image)}>
              <input
                className="form-control"
                placeholder="Caption"
                value={captions[i] ?? ''}
                onChange={(e) => setCaptions((prev) => prev.map((c, j) => (j === i ? e.target.value : c)))}
              />
            </Thumb>
          ))}
          {settings.glimpseImages.length === 0 && <p className="landing-empty">No farm photos yet - this section is hidden.</p>}
        </div>
      </div>

      <div className="landing-section">
        <div className="landing-section-head">
          <div>
            <h4>About the Company</h4>
            <p>The About section at the bottom of the home page.</p>
          </div>
          <UploadButton slot="about" label={settings.aboutImage ? 'Replace Photo' : 'Add Photo'} onUploaded={applySettings} />
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {settings.aboutImage && <Thumb src={settings.aboutImage} onRemove={() => remove('about', settings.aboutImage)} />}
          <textarea className="form-control" rows={7} style={{ flex: 1, minWidth: 260 }} value={aboutText} onChange={(e) => setAboutText(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button type="button" className="btn btn-primary" disabled={saving} onClick={saveText}>
          {saving ? 'Saving...' : 'Save Text & Captions'}
        </button>
      </div>
    </div>
  );
}
