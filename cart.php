<?php
$pageTitle = 'Your Cart';
require_once __DIR__ . '/includes/header.php';

// Handle quantity updates / removals (POST-redirect-GET keeps refresh-safe)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $productId = (int)($_POST['product_id'] ?? 0);

    if ($action === 'update') {
        cart_update($productId, max(0, (int)($_POST['quantity'] ?? 1)));
    } elseif ($action === 'remove') {
        cart_remove($productId);
    } elseif ($action === 'clear') {
        cart_clear();
    }

    header('Location: cart.php');
    exit;
}

$cart = $_SESSION['cart'] ?? [];
$items = [];
$subtotal = 0;

if (!empty($cart)) {
    $ids = array_map('intval', array_keys($cart));
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare(
        "SELECT p.product_id, p.name, p.price, p.unit, p.image,
                COALESCE(i.stock_qty, 0) AS stock_qty
         FROM products p
         LEFT JOIN inventory i ON i.product_id = p.product_id
         WHERE p.product_id IN ($placeholders) AND p.status = 'Active'"
    );
    $stmt->execute($ids);
    foreach ($stmt->fetchAll() as $row) {
        $qty = min((int)$cart[$row['product_id']], (int)$row['stock_qty']);
        if ($qty <= 0) continue;
        $lineTotal = $qty * $row['price'];
        $subtotal += $lineTotal;
        $items[] = $row + ['quantity' => $qty, 'line_total' => $lineTotal];
    }
}
?>

<div class="container" style="padding-top: 30px; padding-bottom: 60px;">
    <h2 class="section-title">Your Cart</h2>

    <?php if (empty($items)): ?>
        <div class="farm-card text-center py-5">
            <i class="fas fa-shopping-basket fa-2x mb-3" style="color: var(--text-muted);"></i>
            <p>Your cart is empty.</p>
            <a href="shop.php" class="btn btn-farm-primary">Start Shopping</a>
        </div>
    <?php else: ?>
        <div class="row g-4">
            <div class="col-lg-8">
                <div class="farm-card p-0">
                    <?php foreach ($items as $item): ?>
                    <div class="d-flex align-items-center gap-3 p-3 border-bottom">
                        <img src="<?php echo htmlspecialchars($item['image'] ?: 'assets/img/products/placeholder.jpg'); ?>" alt="" style="width:70px;height:70px;object-fit:cover;border-radius:10px;" onerror="this.onerror=null;this.src='assets/img/placeholder.svg'">
                        <div class="flex-grow-1">
                            <div class="fw-bold"><?php echo htmlspecialchars($item['name']); ?></div>
                            <div class="small text-muted"><?php echo peso($item['price']); ?> / <?php echo htmlspecialchars($item['unit']); ?></div>
                        </div>
                        <form method="post" class="d-flex align-items-center gap-2">
                            <input type="hidden" name="action" value="update">
                            <input type="hidden" name="product_id" value="<?php echo (int)$item['product_id']; ?>">
                            <input type="number" name="quantity" value="<?php echo (int)$item['quantity']; ?>" min="1" max="<?php echo (int)$item['stock_qty']; ?>" class="form-control form-control-sm" style="width:70px;">
                            <button type="submit" class="btn btn-sm btn-farm-outline">Update</button>
                        </form>
                        <div class="fw-bold text-end" style="width:100px; color:var(--primary-green);"><?php echo peso($item['line_total']); ?></div>
                        <form method="post">
                            <input type="hidden" name="action" value="remove">
                            <input type="hidden" name="product_id" value="<?php echo (int)$item['product_id']; ?>">
                            <button type="submit" class="btn btn-sm text-danger"><i class="far fa-trash-alt"></i></button>
                        </form>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="farm-card">
                    <h5 class="fw-bold mb-3">Order Summary</h5>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">Subtotal</span>
                        <span class="fw-bold"><?php echo peso($subtotal); ?></span>
                    </div>
                    <p class="small text-muted">Delivery fees are calculated at checkout based on your chosen delivery method.</p>
                    <a href="checkout.php" class="btn btn-farm-primary w-100 mt-2">Proceed to Checkout <i class="fas fa-arrow-right ms-1"></i></a>
                </div>
                <?php if ($subtotal >= 10000): ?>
                <div class="alert alert-warning mt-3 small">
                    <i class="fas fa-info-circle me-1"></i> Ordering ₱10,000+? Consider our <a href="wholesale.php">Wholesale Inquiry</a> for bulk pricing.
                </div>
                <?php endif; ?>
            </div>
        </div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
