import Swal from 'sweetalert2';

export async function confirmAction(message, options = {}) {
  const result = await Swal.fire({
    title: message,
    icon: options.icon || 'warning',
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || 'Yes',
    confirmButtonColor: '#1B3C26',
  });
  return result.isConfirmed;
}
