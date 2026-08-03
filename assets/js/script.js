// Profetas Farm - Customer site shared JS

function toggleChatPanel() {
    document.getElementById('chatPanel')?.classList.toggle('open');
}

function updateCartBadge(count) {
    const badge = document.getElementById('cartCountBadge');
    if (!badge) return;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}

/** Adds a product to the session cart via AJAX and refreshes the nav badge. */
function addToCart(productId, quantity = 1, btn = null) {
    const originalHtml = btn ? btn.innerHTML : null;
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    fetch('cart-add.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `product_id=${encodeURIComponent(productId)}&quantity=${encodeURIComponent(quantity)}`
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                updateCartBadge(data.cart_count);
                showFarmToast('Added to cart');
            } else {
                showFarmToast(data.message || 'Could not add to cart', true);
            }
        })
        .catch(() => showFarmToast('Network error. Please try again.', true))
        .finally(() => {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        });
}

function showFarmToast(message, isError = false) {
    let container = document.getElementById('farmToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'farmToastContainer';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:1060;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `padding:12px 20px;border-radius:8px;color:#fff;font-weight:600;font-size:14px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.15);background:${isError ? '#EF4444' : '#1B3C26'};`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function stepQuantity(inputId, delta, max = null) {
    const input = document.getElementById(inputId);
    if (!input) return;
    let value = parseInt(input.value || '1', 10) + delta;
    if (value < 1) value = 1;
    if (max !== null && value > max) value = max;
    input.value = value;
}
