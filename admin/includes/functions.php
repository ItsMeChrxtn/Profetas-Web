<?php
/** Small shared helpers for the admin pages that talk to the database. */

function admin_peso(float $amount): string
{
    return '₱' . number_format($amount, 2);
}

function admin_stock_status(int $stockQty, int $lowStockThreshold): string
{
    if ($stockQty <= 0) return 'Out of Stock';
    if ($stockQty <= $lowStockThreshold) return 'Low Stock';
    return 'In Stock';
}

/** CSS class for statuses not covered by admin/assets/css/style.css (Confirmed, Cancelled). */
function admin_status_style(string $status): string
{
    return match ($status) {
        'Confirmed' => 'background:#DBEAFE;color:#1E40AF;',
        'Cancelled', 'Rejected' => 'background:var(--danger-bg);color:var(--danger-text);',
        'Verified', 'Paid' => 'background:var(--success-bg);color:var(--success-text);',
        default => '',
    };
}

/**
 * Simulated Lalamove booking reference, formatted like a real tracking
 * number. No live courier account is wired up (would need an actual
 * Lalamove merchant API key), so this stands in for that call.
 */
function generate_tracking_number(string $deliveryMethod): string
{
    return match ($deliveryMethod) {
        'Lalamove' => 'LM' . date('Ymd') . '-' . random_int(1000, 9999),
        default => '',
    };
}
