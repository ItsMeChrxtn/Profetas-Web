<?php
$pageTitle = 'Loyalty & Vouchers';
require_once __DIR__ . '/includes/header.php';
require_login();

$customerId = current_customer_id();
sync_loyalty_vouchers($pdo, $customerId);

$spend = customer_cumulative_spend($pdo, $customerId);

$voucherStmt = $pdo->prepare('SELECT * FROM loyalty_vouchers WHERE customer_id = ? ORDER BY threshold_amount ASC');
$voucherStmt->execute([$customerId]);
$vouchers = $voucherStmt->fetchAll();
$vouchersByThreshold = [];
foreach ($vouchers as $v) {
    $vouchersByThreshold[(int)$v['threshold_amount']] = $v;
}

$maxThreshold = max(LOYALTY_THRESHOLDS);
$progressPct = min(100, ($spend / $maxThreshold) * 100);

$nextThreshold = null;
foreach (LOYALTY_THRESHOLDS as $t) {
    if ($spend < $t) { $nextThreshold = $t; break; }
}
?>

<div class="container" style="max-width: 900px; padding-top: 30px; padding-bottom: 60px;">
    <h2 class="section-title">Loyalty & Vouchers</h2>
    <p class="section-subtitle">Earn vouchers automatically as you shop with us.</p>

    <div class="farm-card mb-4">
        <div class="d-flex justify-content-between align-items-end mb-2">
            <div>
                <div class="small text-muted">Your Cumulative Spend</div>
                <div class="fs-3 fw-bold" style="color: var(--primary-green);"><?php echo peso($spend); ?></div>
            </div>
            <?php if ($nextThreshold): ?>
                <div class="text-end small text-muted"><?php echo peso($nextThreshold - $spend); ?> more to unlock <?php echo peso($nextThreshold); ?> voucher</div>
            <?php else: ?>
                <div class="text-end small fw-bold" style="color: var(--accent-amber);">All voucher tiers unlocked! <i class="fas fa-trophy"></i></div>
            <?php endif; ?>
        </div>
        <div class="loyalty-progress">
            <div class="loyalty-progress-bar" style="width: <?php echo $progressPct; ?>%;"></div>
        </div>
    </div>

    <div class="row g-3">
        <?php foreach (LOYALTY_THRESHOLDS as $threshold):
            $unlocked = isset($vouchersByThreshold[$threshold]);
            $voucher = $vouchersByThreshold[$threshold] ?? null;
        ?>
        <div class="col-md-4">
            <div class="voucher-card <?php echo $unlocked ? 'unlocked' : ''; ?>">
                <i class="fas <?php echo $unlocked ? 'fa-gift' : 'fa-lock'; ?> fa-2x mb-2" style="color: <?php echo $unlocked ? 'var(--accent-amber)' : 'var(--text-muted)'; ?>;"></i>
                <div class="fw-bold">₱<?php echo number_format($threshold); ?> Voucher</div>
                <?php if ($unlocked): ?>
                    <div class="small text-muted mt-1">Code</div>
                    <div class="fw-bold" style="letter-spacing: 1px; color: var(--primary-green);"><?php echo htmlspecialchars($voucher['code']); ?></div>
                    <span class="stock-badge <?php echo $voucher['status'] === 'Available' ? 'stock-in' : 'stock-out'; ?> mt-2 d-inline-block"><?php echo $voucher['status']; ?></span>
                <?php else: ?>
                    <div class="small text-muted mt-1">Spend ₱<?php echo number_format($threshold); ?> total to unlock</div>
                <?php endif; ?>
            </div>
        </div>
        <?php endforeach; ?>
    </div>

    <div class="alert alert-light border mt-4 small">
        <i class="fas fa-info-circle me-1"></i> Present your voucher code to our team when picking up or receiving your order to redeem it.
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
