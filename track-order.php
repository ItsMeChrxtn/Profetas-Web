<?php
$pageTitle = 'Track Order';
$activeNav = 'track';
require_once __DIR__ . '/includes/header.php';
require_login();

$customerId = current_customer_id();
$statusSteps = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Completed'];
$highlightOrderId = (int)($_GET['order_id'] ?? 0);

$ordersStmt = $pdo->prepare(
    'SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC'
);
$ordersStmt->execute([$customerId]);
$orders = $ordersStmt->fetchAll();

$itemsStmt = $pdo->prepare('SELECT * FROM order_items WHERE order_id = ?');
$paymentStmt = $pdo->prepare('SELECT * FROM payments WHERE order_id = ?');
?>

<div class="container" style="padding-top: 30px; padding-bottom: 60px;">
    <h2 class="section-title">Track Your Orders</h2>
    <p class="section-subtitle">Order status updates automatically as our team processes your order.</p>

    <?php if (empty($orders)): ?>
        <div class="farm-card text-center py-5">
            <i class="fas fa-box-open fa-2x mb-3" style="color: var(--text-muted);"></i>
            <p>You haven't placed any orders yet.</p>
            <a href="shop.php" class="btn btn-farm-primary">Start Shopping</a>
        </div>
    <?php endif; ?>

    <?php foreach ($orders as $order):
        $itemsStmt->execute([$order['order_id']]);
        $orderItems = $itemsStmt->fetchAll();
        $paymentStmt->execute([$order['order_id']]);
        $payment = $paymentStmt->fetch();
        $currentIndex = array_search($order['status'], $statusSteps, true);
        $isHighlighted = $order['order_id'] === $highlightOrderId;
    ?>
    <div class="farm-card mb-4 <?php echo $isHighlighted ? 'border border-2' : ''; ?>" style="<?php echo $isHighlighted ? 'border-color: var(--accent-amber) !important;' : ''; ?>">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
            <div>
                <span class="fw-bold fs-5">Order #<?php echo str_pad($order['order_id'], 6, '0', STR_PAD_LEFT); ?></span>
                <span class="text-muted small ms-2"><?php echo date('M d, Y \a\t g:i A', strtotime($order['order_date'])); ?></span>
            </div>
            <span class="fw-bold" style="color: var(--primary-green);"><?php echo peso($order['total_amount']); ?></span>
        </div>

        <?php if ($order['status'] === 'Cancelled'): ?>
            <div class="status-pill status-cancelled mb-3"><i class="fas fa-times-circle"></i> Order Cancelled</div>
        <?php else: ?>
            <div class="tracker">
                <?php foreach ($statusSteps as $i => $step):
                    $stateClass = $i < $currentIndex ? 'done' : ($i === $currentIndex ? 'current done' : '');
                    $icons = ['Pending' => 'fa-clock', 'Confirmed' => 'fa-check', 'Processing' => 'fa-cog', 'Shipped' => 'fa-truck', 'Completed' => 'fa-box-open'];
                ?>
                <div class="tracker-step <?php echo $stateClass; ?>">
                    <div class="tracker-dot"><i class="fas <?php echo $icons[$step]; ?>"></i></div>
                    <div class="tracker-label"><?php echo $step; ?></div>
                </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <div class="row g-3 mt-2">
            <div class="col-md-6">
                <div class="small text-muted mb-1">Items</div>
                <?php foreach ($orderItems as $item): ?>
                    <div class="small"><?php echo htmlspecialchars($item['product_name']); ?> &times; <?php echo (int)$item['quantity']; ?> &mdash; <?php echo peso($item['subtotal']); ?></div>
                <?php endforeach; ?>
            </div>
            <div class="col-md-3">
                <div class="small text-muted mb-1">Delivery</div>
                <div class="small fw-bold"><?php echo htmlspecialchars($order['delivery_method']); ?></div>
                <?php if ($order['delivery_method'] === 'Self-Pickup' && $order['pickup_date']): ?>
                    <div class="small text-muted"><?php echo date('M d, Y', strtotime($order['pickup_date'])); ?> at <?php echo date('g:i A', strtotime($order['pickup_time'])); ?></div>
                <?php elseif ($order['delivery_address']): ?>
                    <div class="small text-muted"><?php echo htmlspecialchars($order['delivery_address']); ?></div>
                <?php endif; ?>
                <?php if ($order['tracking_number']): ?>
                    <div class="small text-muted mt-1"><i class="fas fa-truck me-1"></i>Tracking #: <strong><?php echo htmlspecialchars($order['tracking_number']); ?></strong></div>
                <?php endif; ?>
            </div>
            <div class="col-md-3">
                <div class="small text-muted mb-1">Payment</div>
                <span class="status-pill <?php echo $payment && $payment['status'] === 'Verified' ? 'status-completed' : ($payment && $payment['status'] === 'Rejected' ? 'status-cancelled' : 'status-pending'); ?>">
                    <?php echo $payment ? htmlspecialchars($payment['status']) : 'N/A'; ?>
                </span>
            </div>
        </div>
    </div>
    <?php endforeach; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
