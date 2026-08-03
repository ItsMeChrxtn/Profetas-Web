<?php
/** Shared helper functions for the customer site. Requires $pdo (config/db.php). */

/** Queues a SweetAlert2 toast to show on the next page load (survives a redirect). */
function flash(string $type, string $message): void
{
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function peso(float $amount): string
{
    return '₱' . number_format($amount, 2);
}

function get_setting(PDO $pdo, string $key, string $default = ''): string
{
    $stmt = $pdo->prepare('SELECT setting_value FROM site_settings WHERE setting_key = ?');
    $stmt->execute([$key]);
    $value = $stmt->fetchColumn();
    return $value !== false ? $value : $default;
}

/** Turns a stock quantity into the same three-state label the admin panel uses. */
function stock_status(int $stockQty, int $lowStockThreshold): string
{
    if ($stockQty <= 0) {
        return 'Out of Stock';
    }
    if ($stockQty <= $lowStockThreshold) {
        return 'Low Stock';
    }
    return 'In Stock';
}

function stock_status_class(string $status): string
{
    return match ($status) {
        'In Stock'     => 'stock-in',
        'Low Stock'    => 'stock-low',
        'Out of Stock' => 'stock-out',
        default        => '',
    };
}

/** Cart is stored in session as [product_id => quantity]. */
function cart_count(): int
{
    return array_sum($_SESSION['cart'] ?? []);
}

function cart_add(int $productId, int $quantity): void
{
    if (!isset($_SESSION['cart'])) {
        $_SESSION['cart'] = [];
    }
    $_SESSION['cart'][$productId] = ($_SESSION['cart'][$productId] ?? 0) + $quantity;
}

function cart_update(int $productId, int $quantity): void
{
    if ($quantity <= 0) {
        unset($_SESSION['cart'][$productId]);
    } else {
        $_SESSION['cart'][$productId] = $quantity;
    }
}

function cart_remove(int $productId): void
{
    unset($_SESSION['cart'][$productId]);
}

function cart_clear(): void
{
    $_SESSION['cart'] = [];
}

const LOYALTY_THRESHOLDS = [1000, 5000, 10000];

/** Cumulative spend counts every non-cancelled order (spend is committed at order time). */
function customer_cumulative_spend(PDO $pdo, int $customerId): float
{
    $stmt = $pdo->prepare(
        "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = ? AND status != 'Cancelled'"
    );
    $stmt->execute([$customerId]);
    return (float)$stmt->fetchColumn();
}

/** Issues any newly-qualified vouchers. Idempotent - safe to call every time the loyalty page loads. */
function sync_loyalty_vouchers(PDO $pdo, int $customerId): void
{
    $spend = customer_cumulative_spend($pdo, $customerId);
    $stmt = $pdo->prepare(
        'INSERT IGNORE INTO loyalty_vouchers (customer_id, threshold_amount, code) VALUES (?, ?, ?)'
    );
    foreach (LOYALTY_THRESHOLDS as $threshold) {
        if ($spend >= $threshold) {
            $code = 'PF-' . $customerId . '-' . $threshold;
            $stmt->execute([$customerId, $threshold, $code]);
        }
    }
}

function time_ago(string $datetime): string
{
    $diff = time() - strtotime($datetime);
    if ($diff < 60) return 'just now';
    if ($diff < 3600) return floor($diff / 60) . 'm ago';
    if ($diff < 86400) return floor($diff / 3600) . 'h ago';
    return floor($diff / 86400) . 'd ago';
}
