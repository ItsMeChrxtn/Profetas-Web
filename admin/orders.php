<?php
$pageTitle = 'Orders';
$pageSubtitle = 'Manage and track all customer orders and deliveries.';
$activePage = 'orders';
$headerActions = '<button class="btn btn-outline"><i class="fas fa-download"></i> Export</button>';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/includes/functions.php';
include 'includes/header.php';

$validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
$search = trim($_GET['q'] ?? '');
$statusFilter = $_GET['status'] ?? '';
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = 15;
$offset = ($page - 1) * $perPage;

$where = [];
$params = [];
if ($search !== '') {
    $where[] = '(o.order_id = ? OR CONCAT(c.first_name, " ", c.last_name) LIKE ?)';
    $params[] = ctype_digit($search) ? (int)$search : 0;
    $params[] = '%' . $search . '%';
}
if (in_array($statusFilter, $validStatuses, true)) {
    $where[] = 'o.status = ?';
    $params[] = $statusFilter;
}
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM orders o JOIN customers c ON c.customer_id = o.customer_id $whereSql");
$countStmt->execute($params);
$totalOrders = (int)$countStmt->fetchColumn();
$totalPages = max(1, (int)ceil($totalOrders / $perPage));

$stmt = $pdo->prepare(
    "SELECT o.order_id, o.order_date, o.total_amount, o.status,
            CONCAT(c.first_name, ' ', c.last_name) AS customer_name
     FROM orders o
     JOIN customers c ON c.customer_id = o.customer_id
     $whereSql
     ORDER BY o.order_date DESC
     LIMIT $perPage OFFSET $offset"
);
$stmt->execute($params);
$orders = $stmt->fetchAll();
?>

<div class="card">
    <div class="card-header">
        <form method="get" class="header-search" style="width: 350px;" data-real>
            <i class="fas fa-search"></i>
            <input type="text" name="q" placeholder="Search orders by ID or customer..." class="form-control" value="<?php echo htmlspecialchars($search); ?>">
        </form>
        <form method="get" style="display: flex; gap: 10px;" data-real>
            <?php if ($search !== ''): ?><input type="hidden" name="q" value="<?php echo htmlspecialchars($search); ?>"><?php endif; ?>
            <select name="status" class="form-control" style="width: 150px;" onchange="this.form.submit()">
                <option value="">All Status</option>
                <?php foreach ($validStatuses as $s): ?>
                    <option value="<?php echo $s; ?>" <?php echo $statusFilter === $s ? 'selected' : ''; ?>><?php echo $s; ?></option>
                <?php endforeach; ?>
            </select>
        </form>
    </div>

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($orders as $order):
                    $statusClass = strtolower($order['status']);
                    $extraStyle = admin_status_style($order['status']);
                ?>
                <tr>
                    <td style="font-weight: 600;">#<?php echo str_pad($order['order_id'], 6, '0', STR_PAD_LEFT); ?></td>
                    <td><?php echo htmlspecialchars($order['customer_name']); ?></td>
                    <td><?php echo date('M d, Y', strtotime($order['order_date'])); ?></td>
                    <td style="font-weight: 700;"><?php echo admin_peso($order['total_amount']); ?></td>
                    <td><span class="status-pill status-<?php echo $statusClass; ?>" style="<?php echo $extraStyle; ?>"><?php echo $order['status']; ?></span></td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <a href="delivery-booking.php?order_id=<?php echo $order['order_id']; ?>" class="btn btn-icon btn-outline"><i class="far fa-eye"></i></a>
                            <a href="delivery-booking.php?order_id=<?php echo $order['order_id']; ?>#statusUpdate" class="btn btn-icon btn-outline"><i class="far fa-edit"></i></a>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if (empty($orders)): ?>
                <tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 30px;">No orders found.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>

    <div class="card-footer" style="margin-top: 30px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; color: var(--text-muted);">Showing <?php echo count($orders); ?> of <?php echo $totalOrders; ?> entries</span>
        <div class="pagination" style="display: flex; gap: 5px;">
            <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                <a href="?page=<?php echo $i; ?>&q=<?php echo urlencode($search); ?>&status=<?php echo urlencode($statusFilter); ?>" class="btn btn-icon <?php echo $i === $page ? 'btn-primary' : 'btn-outline'; ?>"><?php echo $i; ?></a>
            <?php endfor; ?>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
