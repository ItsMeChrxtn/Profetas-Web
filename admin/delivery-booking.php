<?php
$pageTitle = 'Delivery Booking';
$pageSubtitle = 'Book a delivery and update the order status.';
$activePage = 'delivery-booking';
$headerActions = '<button class="btn btn-outline" onclick="window.location.href=\'orders.php\'"><i class="fas fa-arrow-left"></i> Back to Orders</button>';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/includes/functions.php';
include 'includes/header.php';

$validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
$orderId = (int)($_GET['order_id'] ?? 0);
$order = null;
$updateMessage = '';

if ($orderId > 0 && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['new_status'])) {
    $newStatus = $_POST['new_status'];
    if (in_array($newStatus, $validStatuses, true)) {
        $stmt = $pdo->prepare('UPDATE orders SET status = ? WHERE order_id = ?');
        $stmt->execute([$newStatus, $orderId]);
        $updateMessage = 'Order status updated to ' . $newStatus . '.';
    }
} elseif ($orderId > 0 && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['book_courier'])) {
    // Admin-initiated booking (simulated - see generate_tracking_number()).
    // Admin books the Lalamove rider once the order is ready to go out.
    $methodStmt = $pdo->prepare('SELECT delivery_method, tracking_number FROM orders WHERE order_id = ?');
    $methodStmt->execute([$orderId]);
    $methodRow = $methodStmt->fetch();
    if ($methodRow && !$methodRow['tracking_number'] && $methodRow['delivery_method'] === 'Lalamove') {
        $trackingNumber = generate_tracking_number($methodRow['delivery_method']);
        $pdo->prepare('UPDATE orders SET tracking_number = ?, status = IF(status IN ("Pending", "Confirmed"), "Processing", status) WHERE order_id = ?')
            ->execute([$trackingNumber, $orderId]);
        $updateMessage = 'Booked with Lalamove - tracking number ' . $trackingNumber . '.';
    }
}

if ($orderId > 0) {
    $stmt = $pdo->prepare(
        "SELECT o.*, c.first_name, c.last_name, c.contact_number, c.email
         FROM orders o JOIN customers c ON c.customer_id = o.customer_id
         WHERE o.order_id = ?"
    );
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();

    if ($order) {
        $paymentStmt = $pdo->prepare('SELECT * FROM payments WHERE order_id = ?');
        $paymentStmt->execute([$orderId]);
        $payment = $paymentStmt->fetch();

        $itemsStmt = $pdo->prepare('SELECT * FROM order_items WHERE order_id = ?');
        $itemsStmt->execute([$orderId]);
        $orderItems = $itemsStmt->fetchAll();
    }
}
?>

<style>
    .booking-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        align-items: start;
    }

    .booking-card {
        background: var(--white);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-sm);
        padding: 30px;
        margin-bottom: 30px;
    }

    .booking-card-title {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 25px;
        color: var(--text-main);
    }

    .booking-card-title i {
        color: var(--primary-green);
        font-size: 20px;
    }

    .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        font-size: 14px;
    }

    .info-label {
        color: var(--text-muted);
        font-weight: 500;
    }

    .info-value {
        color: var(--text-main);
        font-weight: 600;
        text-align: right;
    }

    .order-id-badge {
        font-size: 24px;
        font-weight: 800;
        color: var(--text-main);
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .status-badge {
        padding: 6px 15px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    .status-pending-light {
        background: #FEE2E2;
        color: #991B1B;
        border: 1px solid #FECACA;
    }

    .section-divider {
        height: 1px;
        background: var(--border-color);
        margin: 25px 0;
    }

    .lalamove-integration {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 10px;
    }

    .lalamove-logo {
        color: #F68B1E;
        font-size: 24px;
    }

    .lalamove-text {
        font-size: 18px;
        font-weight: 700;
    }

    .lalamove-sub {
        font-size: 14px;
        color: var(--text-muted);
        margin-bottom: 25px;
    }

    .location-box {
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 15px 20px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 15px;
        transition: all 0.2s;
    }

    .location-icon {
        width: 40px;
        height: 40px;
        background: #F3F4F6;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--primary-green);
        font-size: 18px;
    }

    .location-details {
        flex: 1;
    }

    .location-name {
        font-weight: 700;
        font-size: 14px;
        margin-bottom: 2px;
    }

    .location-addr {
        font-size: 12px;
        color: var(--text-muted);
    }

    .alert-box {
        background: #F0FDF4;
        border: 1px solid #DCFCE7;
        border-radius: var(--radius-md);
        padding: 15px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 25px;
        font-size: 13px;
        color: #166534;
    }

    .btn-book {
        width: 100%;
        background: var(--primary-green);
        color: white;
        padding: 16px;
        border-radius: var(--radius-md);
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border: none;
        cursor: pointer;
        font-size: 16px;
    }
    .btn-book[disabled] { opacity: 0.5; cursor: not-allowed; }

    .update-status-section { margin-top: 10px; }

    .update-status-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
        font-size: 16px;
        margin-bottom: 10px;
    }

    .update-status-sub {
        font-size: 13px;
        color: var(--text-muted);
        margin-bottom: 20px;
    }

    .btn-update {
        width: 100%;
        background: var(--primary-green);
        color: white;
        padding: 14px;
        border-radius: var(--radius-md);
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border: none;
        cursor: pointer;
        margin-top: 15px;
    }
    .btn-update[disabled] { opacity: 0.5; cursor: not-allowed; }

    .delivery-info-card {
        background: #F9FAFB;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 20px;
        display: flex;
        align-items: flex-start;
        gap: 15px;
    }

    .delivery-info-icon {
        width: 40px;
        height: 40px;
        background: white;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--primary-green);
        font-size: 18px;
    }

    .delivery-info-content h4 { font-size: 14px; font-weight: 700; margin-bottom: 5px; }
    .delivery-info-content p { font-size: 12px; color: var(--text-muted); line-height: 1.5; }

    .label-group { margin-bottom: 15px; }
    .label-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; }

    @media (max-width: 992px) {
        .booking-grid { grid-template-columns: 1fr; }
    }
</style>

<?php if ($updateMessage): ?>
    <script>document.addEventListener('DOMContentLoaded', () => adminAlert('success', <?php echo json_encode($updateMessage); ?>));</script>
<?php endif; ?>

<?php if (!$order): ?>
<div class="booking-card" style="text-align:center; padding: 60px 30px;">
    <i class="far fa-file-alt" style="font-size: 40px; color: var(--text-muted); margin-bottom: 15px;"></i>
    <p style="color: var(--text-muted);">No order selected. Open an order from the <a href="orders.php">Orders</a> page to view its delivery booking and update its status.</p>
</div>
<?php else: ?>
<div class="booking-grid">
    <!-- Left Column -->
    <div class="booking-column">
        <div class="booking-card">
            <div class="booking-card-title"><i class="far fa-file-alt"></i> Order Details</div>

            <div class="order-id-badge">
                <span>Order #<br>#<?php echo str_pad($order['order_id'], 6, '0', STR_PAD_LEFT); ?></span>
                <span class="status-badge status-pending-light" style="<?php echo admin_status_style($order['status']); ?>">
                    <i class="far fa-clock"></i> <?php echo htmlspecialchars($order['status']); ?>
                </span>
            </div>

            <div class="info-row"><span class="info-label">Order Date</span><span class="info-value"><?php echo date('M d, Y g:i A', strtotime($order['order_date'])); ?></span></div>
            <div class="info-row"><span class="info-label">Payment Method</span><span class="info-value">GCash &mdash; <?php echo $payment ? htmlspecialchars($payment['status']) : 'No record'; ?></span></div>
            <div class="info-row"><span class="info-label">Order Total</span><span class="info-value"><?php echo admin_peso($order['total_amount']); ?></span></div>

            <div class="section-divider"></div>

            <div class="booking-card-title"><i class="far fa-user"></i> Customer Information</div>
            <div class="info-row"><span class="info-label">Customer Name</span><span class="info-value"><?php echo htmlspecialchars($order['first_name'] . ' ' . $order['last_name']); ?></span></div>
            <div class="info-row"><span class="info-label">Contact Number</span><span class="info-value"><?php echo htmlspecialchars($order['contact_number'] ?: '—'); ?></span></div>
            <div class="info-row" style="flex-direction: column; align-items: flex-start; gap: 5px;">
                <span class="info-label">Delivery Address</span>
                <span class="info-value" style="text-align: left;">
                    <?php if ($order['delivery_method'] === 'Self-Pickup'): ?>
                        Self-Pickup on <?php echo date('M d, Y', strtotime($order['pickup_date'])); ?> at <?php echo date('g:i A', strtotime($order['pickup_time'])); ?>
                    <?php else: ?>
                        <?php echo htmlspecialchars($order['delivery_address'] ?: '—'); ?><?php echo $order['delivery_landmark'] ? ' (near ' . htmlspecialchars($order['delivery_landmark']) . ')' : ''; ?>
                    <?php endif; ?>
                </span>
            </div>

            <div class="section-divider"></div>
            <div class="booking-card-title" style="margin-bottom: 10px;"><i class="far fa-clipboard"></i> Items</div>
            <?php foreach ($orderItems as $item): ?>
                <div class="info-row"><span class="info-label"><?php echo htmlspecialchars($item['product_name']); ?> &times; <?php echo (int)$item['quantity']; ?></span><span class="info-value"><?php echo admin_peso($item['subtotal']); ?></span></div>
            <?php endforeach; ?>
        </div>

        <div class="booking-card">
            <div class="update-status-section">
                <div class="update-status-title" id="statusUpdate"><i class="fas fa-sync-alt"></i> Status Update</div>
                <p class="update-status-sub">Update the order status once the delivery booking is confirmed.</p>

                <form method="post" data-real>
                    <div class="label-group">
                        <label>Update Status</label>
                        <select name="new_status" id="statusSelect" class="form-control">
                            <?php foreach ($validStatuses as $s): ?>
                                <option value="<?php echo $s; ?>" <?php echo $order['status'] === $s ? 'selected' : ''; ?>><?php echo $s; ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <button type="submit" class="btn-update"><i class="far fa-check-circle"></i> Update Status</button>
                </form>
            </div>
        </div>
    </div>

    <!-- Right Column -->
    <div class="booking-column">
        <div class="booking-card">
            <?php if ($order['delivery_method'] === 'Self-Pickup'): ?>
                <div class="lalamove-integration"><i class="fas fa-store lalamove-logo" style="color: var(--primary-green);"></i><span class="lalamove-text">Self-Pickup</span></div>
                <p class="lalamove-sub">Customer will pick up their order at the farm.</p>
                <div class="label-group">
                    <div class="location-box">
                        <div class="location-icon"><i class="fas fa-calendar-alt"></i></div>
                        <div class="location-details">
                            <div class="location-name"><?php echo date('M d, Y', strtotime($order['pickup_date'])); ?></div>
                            <div class="location-addr"><?php echo date('g:i A', strtotime($order['pickup_time'])); ?></div>
                        </div>
                    </div>
                </div>
                <div class="alert-box"><i class="fas fa-info-circle"></i><span>Have the order ready and packed by the scheduled pickup time.</span></div>
            <?php else: ?>
                <div class="lalamove-integration">
                    <i class="fas fa-dove lalamove-logo"></i>
                    <span class="lalamove-text">Lalamove Booking</span>
                </div>
                <p class="lalamove-sub">Book a Lalamove delivery for this order.</p>

                <div class="label-group">
                    <label>Pickup Location</label>
                    <div class="location-box">
                        <div class="location-icon"><i class="fas fa-store"></i></div>
                        <div class="location-details">
                            <div class="location-name">Profetas Farm</div>
                            <div class="location-addr">Tres Cruces, Tanza, Cavite</div>
                        </div>
                    </div>
                </div>

                <div class="label-group">
                    <label>Delivery Address</label>
                    <div class="location-box">
                        <div class="location-icon"><i class="fas fa-map-marker-alt"></i></div>
                        <div class="location-details">
                            <div class="location-name"><?php echo htmlspecialchars($order['first_name'] . ' ' . $order['last_name']); ?></div>
                            <div class="location-addr"><?php echo htmlspecialchars($order['delivery_address'] ?: '—'); ?></div>
                        </div>
                    </div>
                </div>

                <?php if ($order['delivery_lat'] && $order['delivery_lng']): ?>
                <div class="alert-box"><i class="fas fa-map-marked-alt"></i><span>Pinned location: <?php echo number_format($order['delivery_lat'], 5); ?>, <?php echo number_format($order['delivery_lng'], 5); ?></span></div>
                <?php endif; ?>

                <?php if ($order['tracking_number']): ?>
                    <div class="alert-box" style="background:#DBEAFE; color:#1E40AF; margin-bottom:0;"><i class="fas fa-check-circle"></i><span>Booked with Lalamove &mdash; tracking number <strong><?php echo htmlspecialchars($order['tracking_number']); ?></strong></span></div>
                <?php else: ?>
                    <form method="post" data-real>
                        <input type="hidden" name="book_courier" value="1">
                        <button type="submit" class="btn-book"><i class="fas fa-truck"></i> Book with Lalamove</button>
                    </form>
                <?php endif; ?>
            <?php endif; ?>
        </div>

        <div class="delivery-info-card">
            <div class="delivery-info-icon"><i class="fas fa-truck-loading"></i></div>
            <div class="delivery-info-content">
                <h4>Keep the Customer Updated</h4>
                <p>The status you set here shows up live on the customer's order tracking page, in the same Pending &rarr; Confirmed &rarr; Processing &rarr; Shipped &rarr; Completed order.</p>
            </div>
        </div>
    </div>
</div>
<?php endif; ?>

<?php include 'includes/footer.php'; ?>
