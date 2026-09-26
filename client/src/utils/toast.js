import Swal from 'sweetalert2';

export function showToast(type, message) {
  Swal.fire({
    icon: type,
    title: message,
    position: 'center',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
}
