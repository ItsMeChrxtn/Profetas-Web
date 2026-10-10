import { useState } from 'react';

/** Password field with a show/hide (eye) toggle. Extra props go to the <input>. */
export function PasswordInput({ value, onChange, className = 'form-control', ...rest }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input type={visible ? 'text' : 'password'} className={className} value={value} onChange={onChange} {...rest} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
      >
        <i className={`far ${visible ? 'fa-eye-slash' : 'fa-eye'}`} />
      </button>
    </div>
  );
}

export const MIN_PASSWORD_LENGTH = 8;

function Hint({ ok, children }) {
  return (
    <div className={`password-hint ${ok ? 'ok' : ''}`}>
      <i className={`fas ${ok ? 'fa-check-circle' : 'fa-circle'}`} /> {children}
    </div>
  );
}

/** Shown right under the new-password field. */
export function PasswordLengthHint({ password }) {
  return (
    <div className="small mt-1">
      <Hint ok={password.length >= MIN_PASSWORD_LENGTH}>
        <strong>Password Length:</strong> must contain at least {MIN_PASSWORD_LENGTH} characters
      </Hint>
    </div>
  );
}

/** Shown right under the confirm-password field. */
export function PasswordMatchHint({ password, confirmPassword }) {
  return (
    <div className="small mt-1">
      <Hint ok={confirmPassword.length > 0 && password === confirmPassword}>Passwords match</Hint>
    </div>
  );
}
