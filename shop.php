<?php
$pageTitle = 'Shop';
$activeNav = 'shop';
require_once __DIR__ . '/includes/header.php';

$validCategories = ['Fresh', 'Value-Added', 'Farm Inputs'];
$category = $_GET['category'] ?? '';
$search = trim($_GET['q'] ?? '');
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = 12;
$offset = ($page - 1) * $perPage;

$where = ["p.status = 'Active'"];
$params = [];

if (in_array($category, $validCategories, true)) {
    $where[] = 'p.category = ?';
    $params[] = $category;
}
if ($search !== '') {
    $where[] = 'p.name LIKE ?';
    $params[] = '%' . $search . '%';
}
$whereSql = implode(' AND ', $where);

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM products p WHERE $whereSql");
$countStmt->execute($params);
$totalProducts = (int)$countStmt->fetchColumn();
$totalPages = max(1, (int)ceil($totalProducts / $perPage));

$stmt = $pdo->prepare(
    "SELECT p.product_id, p.name, p.category, p.price, p.unit, p.image, p.is_harvested_today,
            COALESCE(i.stock_qty, 0) AS stock_qty, COALESCE(i.low_stock_threshold, 10) AS low_stock_threshold
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.product_id
     WHERE $whereSql
     ORDER BY p.name ASC
     LIMIT $perPage OFFSET $offset"
);
$stmt->execute($params);
$products = $stmt->fetchAll();

function shop_url(string $category, string $search, int $page): string
{
    return 'shop.php?' . http_build_query(array_filter([
        'category' => $category,
        'q' => $search,
        'page' => $page > 1 ? $page : null,
    ]));
}
?>

<div class="container" style="padding-top: 30px; padding-bottom: 60px;">
    <h2 class="section-title">Shop Our Products</h2>
    <p class="section-subtitle">Fresh produce, value-added goods, and farm inputs &mdash; all from our cooperative.</p>

    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div class="d-flex flex-wrap gap-2">
            <a href="<?php echo shop_url('', $search, 1); ?>" class="category-pill <?php echo $category === '' ? 'active' : ''; ?>">All</a>
            <?php foreach ($validCategories as $cat): ?>
                <a href="<?php echo shop_url($cat, $search, 1); ?>" class="category-pill <?php echo $category === $cat ? 'active' : ''; ?>"><?php echo htmlspecialchars($cat); ?></a>
            <?php endforeach; ?>
        </div>
        <form method="get" class="d-flex gap-2">
            <?php if ($category !== ''): ?><input type="hidden" name="category" value="<?php echo htmlspecialchars($category); ?>"><?php endif; ?>
            <input type="text" name="q" class="form-control" placeholder="Search products..." value="<?php echo htmlspecialchars($search); ?>" style="min-width:220px;">
            <button type="submit" class="btn btn-farm-outline"><i class="fas fa-search"></i></button>
        </form>
    </div>

    <?php if (empty($products)): ?>
        <div class="farm-card text-center py-5">
            <i class="fas fa-seedling fa-2x mb-3" style="color: var(--text-muted);"></i>
            <p class="mb-0">No products found. Try a different search or category.</p>
        </div>
    <?php else: ?>
        <div class="row g-4">
            <?php foreach ($products as $p):
                $status = stock_status((int)$p['stock_qty'], (int)$p['low_stock_threshold']);
            ?>
            <div class="col-6 col-md-4 col-lg-3">
                <div class="product-card">
                    <?php if ($p['is_harvested_today']): ?>
                        <span class="harvested-badge"><i class="fas fa-seedling"></i> Today</span>
                    <?php endif; ?>
                    <a href="product.php?id=<?php echo (int)$p['product_id']; ?>" class="text-decoration-none text-reset">
                        <div class="product-img-wrap">
                            <img src="<?php echo htmlspecialchars($p['image'] ?: 'assets/img/products/placeholder.jpg'); ?>" alt="<?php echo htmlspecialchars($p['name']); ?>" onerror="this.onerror=null;this.src='assets/img/placeholder.svg'">
                        </div>
                        <div class="product-body">
                            <div class="product-cat"><?php echo htmlspecialchars($p['category']); ?></div>
                            <div class="product-name"><?php echo htmlspecialchars($p['name']); ?></div>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="product-price"><?php echo peso($p['price']); ?></span>
                                <span class="product-unit">/ <?php echo htmlspecialchars($p['unit']); ?></span>
                            </div>
                            <span class="stock-badge <?php echo stock_status_class($status); ?>"><?php echo $status; ?></span>
                        </div>
                    </a>
                </div>
            </div>
            <?php endforeach; ?>
        </div>

        <?php if ($totalPages > 1): ?>
        <nav class="mt-4">
            <ul class="pagination justify-content-center">
                <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                    <li class="page-item <?php echo $i === $page ? 'active' : ''; ?>">
                        <a class="page-link" href="<?php echo shop_url($category, $search, $i); ?>"><?php echo $i; ?></a>
                    </li>
                <?php endfor; ?>
            </ul>
        </nav>
        <?php endif; ?>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
