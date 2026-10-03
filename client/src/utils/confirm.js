import Swal from 'sweetalert2';

export async function confirmAction(message, options = {}) {
  const result = await Swal.fire({
    title: message,
    icon: options.icon || 'warning',
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || 'Yes',
    confirmButtonColor: '#7B1E2B',
  });
  return result.isConfirmed;
}
