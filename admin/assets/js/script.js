// Defined at top level (not inside the DOMContentLoaded block below) so it's
// ready the moment this file finishes loading — inline page scripts that fire
// on DOMContentLoaded can run before that block's listener does otherwise.
window.adminAlert = (type, message) => {
    if (!message || typeof Swal === 'undefined') return;
    Swal.fire({
        icon: type === 'error' ? 'error' : 'success',
        title: message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });
};

// Drop-in SweetAlert2 replacement for `onsubmit="return confirm('...')"`.
// Always returns false to block the native synchronous submit; if the user
// confirms, it submits the form itself (form.submit() skips onsubmit, so
// this doesn't loop back into itself).
window.adminConfirm = (form, message, options = {}) => {
    if (typeof Swal === 'undefined') return confirm(message);
    Swal.fire({
        title: options.title || 'Are you sure?',
        text: message,
        icon: options.icon || 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1B3C26',
        cancelButtonColor: '#6B7280',
        confirmButtonText: options.confirmButtonText || 'Yes, proceed',
    }).then((result) => {
        if (result.isConfirmed) form.submit();
    });
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Sidebar Toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Dropdowns
    const profileBtn = document.getElementById('profileDropdownBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const notifBtn = document.getElementById('notificationBtn');
    const notifDropdown = document.getElementById('notificationDropdown');

    function toggleDropdown(btn, dropdown) {
        if (!btn || !dropdown) return;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
            // Close other dropdowns
            [profileDropdown, notifDropdown].forEach(d => {
                if (d && d !== dropdown) d.classList.remove('show');
            });
        });
    }

    toggleDropdown(profileBtn, profileDropdown);
    toggleDropdown(notifBtn, notifDropdown);

    window.addEventListener('click', () => {
        if (profileDropdown) profileDropdown.classList.remove('show');
        if (notifDropdown) notifDropdown.classList.remove('show');
    });

    // Modal System
    const modalOverlay = document.getElementById('modalOverlay');
    const closeModal = document.getElementById('closeModal');
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });
    }

    window.showModal = (title, bodyHtml, footerHtml = '') => {
        document.getElementById('modalTitle').innerText = title;
        document.getElementById('modalBody').innerHTML = bodyHtml;
        document.getElementById('modalFooter').innerHTML = footerHtml;
        modalOverlay.style.display = 'flex';
    };

    // Toast System
    window.showToast = (message, type = 'success') => {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // Form Validation Simulation (skipped for forms marked data-real, which
    // actually submit to the server instead of faking a success toast)
    const forms = document.querySelectorAll('form:not([data-real])');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            let valid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    valid = false;
                    input.style.borderColor = 'var(--danger-text)';
                } else {
                    input.style.borderColor = 'var(--border-color)';
                }
            });

            if (valid) {
                showToast('Form submitted successfully!');
                if (modalOverlay) modalOverlay.style.display = 'none';
                form.reset();
            } else {
                showToast('Please fill all required fields', 'error');
            }
        });
    });

    // Table Search Simulation
    const searchInputs = document.querySelectorAll('input[placeholder*="Search"]');
    searchInputs.forEach(input => {
        input.addEventListener('keyup', () => {
            const filter = input.value.toLowerCase();
            const tables = document.querySelectorAll('table');
            
            tables.forEach(table => {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.innerText.toLowerCase();
                    row.style.display = text.includes(filter) ? '' : 'none';
                });
            });
        });
    });

    // Sorting Simulation
    const sortableHeaders = document.querySelectorAll('th[data-sort]');
    sortableHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            // Logic for sorting would go here
            showToast(`Sorting by ${header.innerText}`);
        });
    });
});
