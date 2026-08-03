<?php
$pageTitle = 'Customers';
$pageSubtitle = 'View and manage your customer database and purchase history.';
$activePage = 'customers';
$headerActions = '<button class="btn btn-outline"><i class="fas fa-file-export"></i> Export CSV</button>';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/includes/functions.php';
include 'includes/header.php';

$search = trim($_GET['q'] ?? '');
$where = "WHERE c.role = 'customer'";
$params = [];
if ($search !== '') {
    $where .= " AND (CONCAT(c.first_name, ' ', c.last_name) LIKE ? OR c.email LIKE ?)";
    $params = ['%' . $search . '%', '%' . $search . '%'];
}

$stmt = $pdo->prepare(
    "SELECT c.customer_id, c.first_name, c.last_name, c.email, c.contact_number,
            (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.customer_id AND o.status != 'Cancelled') AS total_orders,
            (SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.customer_id = c.customer_id AND o.status != 'Cancelled') AS total_spent,
            (SELECT o.delivery_address FROM orders o WHERE o.customer_id = c.customer_id AND o.delivery_address IS NOT NULL ORDER BY o.order_date DESC LIMIT 1) AS last_address
     FROM customers c
     $where
     ORDER BY total_spent DESC"
);
$stmt->execute($params);
$customers = $stmt->fetchAll();
?>

<div class="card">
    <div class="card-header">
        <form method="get" class="header-search" style="width: 350px;" data-real>
            <i class="fas fa-search"></i>
            <input type="text" name="q" placeholder="Search customers by name or email..." class="form-control" value="<?php echo htmlspecialchars($search); ?>">
        </form>
    </div>
    
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Customer Name <i class="fas fa-sort"></i></th>
                    <th>Email Address <i class="fas fa-sort"></i></th>
                    <th>Location <i class="fas fa-sort"></i></th>
                    <th>Total Orders <i class="fas fa-sort"></i></th>
                    <th>Total Spent <i class="fas fa-sort"></i></th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($customers as $customer):
                    $fullName = $customer['first_name'] . ' ' . $customer['last_name'];
                ?>
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 35px; height: 35px; background: #1B3C26; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">
                                <?php echo strtoupper(substr($customer['first_name'], 0, 1)); ?>
                            </div>
                            <span style="font-weight: 600;"><?php echo htmlspecialchars($fullName); ?></span>
                        </div>
                    </td>
                    <td><?php echo htmlspecialchars($customer['email']); ?></td>
                    <td style="font-size:12px; color:var(--text-muted); max-width:180px;"><?php echo htmlspecialchars($customer['last_address'] ? mb_strimwidth($customer['last_address'], 0, 40, '...') : '—'); ?></td>
                    <td style="font-weight: 600;"><?php echo (int)$customer['total_orders']; ?></td>
                    <td style="font-weight: 700; color: var(--primary-green);"><?php echo admin_peso($customer['total_spent']); ?></td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <a href="mailto:<?php echo htmlspecialchars($customer['email']); ?>" class="btn btn-icon btn-outline"><i class="far fa-envelope"></i></a>
                            <a href="orders.php?q=<?php echo urlencode($fullName); ?>" class="btn btn-icon btn-outline" title="View Orders"><i class="far fa-eye"></i></a>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if (empty($customers)): ?>
                <tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 30px;">No customers yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
    
    <div class="card-footer" style="margin-top: 30px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; color: var(--text-muted);">Showing <?php echo count($customers); ?> customers</span>
        <div class="pagination" style="display: flex; gap: 5px;">
            <button class="btn btn-icon btn-outline"><i class="fas fa-chevron-left"></i></button>
            <button class="btn btn-icon btn-primary">1</button>
            <button class="btn btn-icon btn-outline">2</button>
            <button class="btn btn-icon btn-outline">3</button>
            <button class="btn btn-icon btn-outline"><i class="fas fa-chevron-right"></i></button>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
