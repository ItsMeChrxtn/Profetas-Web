import Swal from 'sweetalert2';

const BRAND = '#7B1E2B';

export async function confirmAction(message, options = {}) {
  const result = await Swal.fire({
    title: message,
    text: options.text,
    icon: options.icon || 'warning',
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || 'Yes',
    confirmButtonColor: BRAND,
  });
  return result.isConfirmed;
}

/**
 * Asks for a reason (e.g. for cancelling or rejecting) and requires one.
 * Resolves to the trimmed reason, or null if the admin backs out.
 */
export async function promptReason(title, options = {}) {
  const result = await Swal.fire({
    title,
    text: options.text,
    icon: options.icon || 'warning',
    input: 'textarea',
    inputLabel: options.label || 'Reason',
    inputPlaceholder: options.placeholder || 'Type the reason here...',
    inputAttributes: { maxlength: 300 },
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || 'Submit',
    confirmButtonColor: BRAND,
    inputValidator: (value) => (!value?.trim() ? 'Please enter a reason.' : undefined),
  });
  return result.isConfirmed ? result.value.trim() : null;
}

/** Log out after a confirmation - used by every Logout button. */
export async function confirmLogout(logout) {
  const ok = await confirmAction('Log out?', { icon: 'question', text: 'You will need to log in again to continue.', confirmButtonText: 'Yes, log out' });
  if (ok) await logout();
}
