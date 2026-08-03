<?php
$pageTitle = 'Payments';
$pageSubtitle = 'Manage payment methods, transactions, and payouts.';
$activePage = 'payments';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/includes/functions.php';
include 'includes/header.php';

$verifyMessage = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['payment_id'], $_POST['action'])) {
    $paymentId = (int)$_POST['payment_id'];
    $action = $_POST['action'];
    $adminNote = trim($_POST['admin_note'] ?? '');

    if (in_array($action, ['verify', 'reject'], true)) {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('SELECT order_id FROM payments WHERE payment_id = ?');
        $stmt->execute([$paymentId]);
        $orderId = $stmt->fetchColumn();

        if ($orderId) {
            if ($action === 'verify') {
                $pdo->prepare('UPDATE payments SET status = "Verified", verified_at = NOW(), admin_note = ? WHERE payment_id = ?')
                    ->execute([$adminNote ?: null, $paymentId]);
                $pdo->prepare('UPDATE orders SET payment_status = "Paid", status = IF(status = "Pending", "Confirmed", status) WHERE order_id = ?')
                    ->execute([$orderId]);
                $verifyMessage = 'Payment verified and order confirmed.';
            } else {
                $pdo->prepare('UPDATE payments SET status = "Rejected", admin_note = ? WHERE payment_id = ?')
                    ->execute([$adminNote ?: null, $paymentId]);
                $pdo->prepare('UPDATE orders SET payment_status = "Rejected" WHERE order_id = ?')
                    ->execute([$orderId]);
                $verifyMessage = 'Payment marked as rejected.';
            }
        }
        $pdo->commit();
    }
}

$pendingPayments = $pdo->query(
    "SELECT p.*, o.total_amount, CONCAT(c.first_name, ' ', c.last_name) AS customer_name
     FROM payments p
     JOIN orders o ON o.order_id = p.order_id
     JOIN customers c ON c.customer_id = o.customer_id
     WHERE p.status = 'Pending'
     ORDER BY p.created_at ASC"
)->fetchAll();

$allPayments = $pdo->query(
    "SELECT p.*, CONCAT(c.first_name, ' ', c.last_name) AS customer_name
     FROM payments p
     JOIN orders o ON o.order_id = p.order_id
     JOIN customers c ON c.customer_id = o.customer_id
     ORDER BY p.created_at DESC
     LIMIT 50"
)->fetchAll();
?>

<?php if ($verifyMessage): ?>
<script>document.addEventListener('DOMContentLoaded', () => adminAlert('success', <?php echo json_encode($verifyMessage); ?>));</script>
<?php endif; ?>

<div class="card" style="margin-bottom: 30px;">
    <div class="card-header">
        <h3 class="card-title"><i class="fas fa-wallet"></i> Pending GCash Verifications</h3>
        <span class="status-pill status-pending"><?php echo count($pendingPayments); ?> awaiting review</span>
    </div>

    <?php if (empty($pendingPayments)): ?>
        <p style="color: var(--text-muted); padding: 10px 0;">No payments waiting for verification.</p>
    <?php else: ?>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Reference #</th>
                    <th>Receipt</th>
                    <th>Amount</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($pendingPayments as $p): ?>
                <tr>
                    <td style="font-weight:600;"><a href="delivery-booking.php?order_id=<?php echo $p['order_id']; ?>">#<?php echo str_pad($p['order_id'], 6, '0', STR_PAD_LEFT); ?></a></td>
                    <td><?php echo htmlspecialchars($p['customer_name']); ?></td>
                    <td><?php echo htmlspecialchars($p['reference_number'] ?: '—'); ?></td>
                    <td>
                        <?php if ($p['receipt_image']): ?>
                            <a href="../<?php echo htmlspecialchars($p['receipt_image']); ?>" target="_blank">View</a>
                        <?php else: ?>
                            <span style="color: var(--text-muted);">No receipt</span>
                        <?php endif; ?>
                    </td>
                    <td style="font-weight:700;"><?php echo admin_peso($p['amount']); ?></td>
                    <td>
                        <div style="display:flex; gap:5px;">
                            <form method="post" onsubmit="return adminConfirm(this, 'Verify this payment?', {icon: 'question', confirmButtonText: 'Yes, verify'});" data-real>
                                <input type="hidden" name="payment_id" value="<?php echo $p['payment_id']; ?>">
                                <input type="hidden" name="action" value="verify">
                                <button type="submit" class="btn btn-icon btn-outline" title="Verify" style="color:#166534;"><i class="fas fa-check"></i></button>
                            </form>
                            <form method="post" onsubmit="return adminConfirm(this, 'Reject this payment?', {confirmButtonText: 'Yes, reject'});" data-real>
                                <input type="hidden" name="payment_id" value="<?php echo $p['payment_id']; ?>">
                                <input type="hidden" name="action" value="reject">
                                <button type="submit" class="btn btn-icon btn-outline text-danger" title="Reject"><i class="fas fa-times"></i></button>
                            </form>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>
</div>

<div class="dashboard-row" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
    <div class="card">
        <div class="card-header">
            <h3 class="card-title" style="font-size: 16px;">Payment Methods</h3>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin-top: -15px; margin-bottom: 20px;">Manage how you receive payments.</p>
        
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 15px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-wallet" style="color: #007bff;"></i>
                    <span style="font-weight: 600; font-size: 14px;">GCash</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="status-pill status-active" style="font-size: 10px; padding: 4px 8px;">Active</span>
                    <i class="fas fa-chevron-right" style="font-size: 12px; color: var(--text-muted);"></i>
                </div>
            </div>
            <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 15px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-credit-card" style="color: #eb001b;"></i>
                    <span style="font-weight: 600; font-size: 14px;">Credit Card</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="status-pill status-active" style="font-size: 10px; padding: 4px 8px;">Active</span>
                    <i class="fas fa-chevron-right" style="font-size: 12px; color: var(--text-muted);"></i>
                </div>
            </div>
            <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 15px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-university" style="color: #166534;"></i>
                    <span style="font-weight: 600; font-size: 14px;">Bank Transfer</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="status-pill status-active" style="font-size: 10px; padding: 4px 8px;">Active</span>
                    <i class="fas fa-chevron-right" style="font-size: 12px; color: var(--text-muted);"></i>
                </div>
            </div>
        </div>
        <button class="btn btn-outline" style="width: 100%; margin-top: 20px; font-size: 13px;">Manage Payment Methods <i class="fas fa-chevron-right"></i></button>
    </div>

    <div class="card">
        <div class="card-header">
            <h3 class="card-title" style="font-size: 16px;">Payout Overview</h3>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin-top: -15px; margin-bottom: 20px;">Summary of your payouts and balances.</p>
        
        <div style="background: #F8FAF9; border-radius: 15px; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <span style="font-size: 12px; color: var(--text-muted);">Available Balance <i class="far fa-question-circle"></i></span>
                <h2 style="font-size: 28px; font-weight: 800; color: var(--primary-green); margin-top: 5px;">₱0.00</h2>
            </div>
            <i class="fas fa-wallet" style="font-size: 32px; color: var(--primary-green); opacity: 0.2;"></i>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 20px; padding: 0 10px;">
            <div>
                <span style="font-size: 11px; color: var(--text-muted);">Pending Payout</span>
                <p style="font-weight: 700; color: #F59E0B; font-size: 14px;">₱0.00</p>
            </div>
            <div style="text-align: right;">
                <span style="font-size: 11px; color: var(--text-muted);">Last Payout</span>
                <p style="font-weight: 700; color: #166534; font-size: 14px;">None</p>
            </div>
        </div>
        <button class="btn btn-outline" style="width: 100%; margin-top: 20px; font-size: 13px;">View Payout History <i class="fas fa-chevron-right"></i></button>
    </div>

    <div class="card">
        <div class="card-header">
            <h3 class="card-title" style="font-size: 16px;">Payout Actions</h3>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin-top: -15px; margin-bottom: 20px;">Request a payout to your preferred method.</p>
        
        <form id="payoutForm">
            <div class="form-group">
                <label style="font-size: 12px;">Payout Method</label>
                <select class="form-control" required style="font-size: 13px;">
                    <option>Bank Transfer (BDO) •••• 1234</option>
                    <option>GCash (09xx xxx 1234)</option>
                </select>
            </div>
            <div class="form-group">
                <label style="font-size: 12px;">Payout Amount</label>
                <div style="position: relative;">
                    <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 13px;">₱</span>
                    <input type="number" class="form-control" placeholder="0.00" style="padding-left: 25px; font-size: 13px;" required>
                </div>
                <p style="font-size: 10px; color: var(--text-muted); margin-top: 5px;">Minimum payout is ₱1,000.00</p>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; font-size: 14px;">Request Payout <i class="fas fa-paper-plane" style="margin-left: 5px;"></i></button>
        </form>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <h3 class="card-title"><i class="fas fa-history"></i> Transaction History</h3>
        <div style="display: flex; gap: 15px;">
            <div class="header-search" style="width: 300px;">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Search transactions..." class="form-control">
            </div>
            <button class="btn btn-outline"><i class="fas fa-filter"></i> Filters</button>
        </div>
    </div>
    
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Transaction ID</th>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Method</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($allPayments as $trx): ?>
                <tr>
                    <td style="font-size: 12px; font-weight: 600;">TRX-<?php echo str_pad($trx['payment_id'], 5, '0', STR_PAD_LEFT); ?></td>
                    <td style="font-size: 12px;"><?php echo date('M d, Y g:i A', strtotime($trx['created_at'])); ?></td>
                    <td><span class="status-pill status-active" style="font-size: 11px;">Payment</span></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
                            <i class="fas fa-wallet"></i> <?php echo htmlspecialchars($trx['method']); ?>
                        </div>
                    </td>
                    <td style="font-size: 12px; color: var(--text-muted);">Order #<?php echo str_pad($trx['order_id'], 6, '0', STR_PAD_LEFT); ?> &mdash; <?php echo htmlspecialchars($trx['customer_name']); ?></td>
                    <td style="font-weight: 700; color: #166534;"><?php echo admin_peso($trx['amount']); ?></td>
                    <td><span class="status-pill <?php echo $trx['status'] === 'Verified' ? 'status-completed' : ($trx['status'] === 'Rejected' ? 'status-pending' : 'status-processing'); ?>" style="font-size: 11px;"><?php echo htmlspecialchars($trx['status']); ?></span></td>
                    <td><a href="delivery-booking.php?order_id=<?php echo $trx['order_id']; ?>" class="btn btn-icon btn-outline"><i class="far fa-eye"></i></a></td>
                </tr>
                <?php endforeach; ?>
                <?php if (empty($allPayments)): ?>
                <tr><td colspan="8" style="text-align:center; color: var(--text-muted); padding: 30px;">No transactions yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
    
    <div class="card-footer" style="margin-top: 30px; display: flex; justify-content: center; align-items: center;">
        <div class="pagination" style="display: flex; gap: 5px;">
            <button class="btn btn-icon btn-outline"><i class="fas fa-chevron-left"></i></button>
            <button class="btn btn-icon btn-primary">1</button>
            <button class="btn btn-icon btn-outline">2</button>
            <button class="btn btn-icon btn-outline">3</button>
            <span style="padding: 0 10px; display: flex; align-items: center;">...</span>
            <button class="btn btn-icon btn-outline">25</button>
            <button class="btn btn-icon btn-outline"><i class="fas fa-chevron-right"></i></button>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
