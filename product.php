<?php
$pageTitle = 'Product';
$activeNav = 'shop';
require_once __DIR__ . '/includes/header.php';

$productId = (int)($_GET['id'] ?? 0);

$stmt = $pdo->prepare(
    "SELECT p.product_id, p.name, p.category, p.description, p.price, p.unit, p.image, p.is_harvested_today,
            COALESCE(i.stock_qty, 0) AS stock_qty, COALESCE(i.low_stock_threshold, 10) AS low_stock_threshold
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.product_id
     WHERE p.product_id = ? AND p.status = 'Active'"
);
$stmt->execute([$productId]);
$product = $stmt->fetch();

if (!$product) {
    http_response_code(404);
    echo '<div class="container py-5 text-center"><h3>Product not found.</h3><a href="shop.php" class="btn btn-farm-primary mt-3">Back to Shop</a></div>';
    require_once __DIR__ . '/includes/footer.php';
    exit;
}

$pageTitle = $product['name'];
$status = stock_status((int)$product['stock_qty'], (int)$product['low_stock_threshold']);
$inStock = $status !== 'Out of Stock';

// Related products from the same category
$relatedStmt = $pdo->prepare(
    "SELECT p.product_id, p.name, p.price, p.unit, p.image
     FROM products p
     WHERE p.category = ? AND p.status = 'Active' AND p.product_id != ?
     LIMIT 4"
);
$relatedStmt->execute([$product['category'], $productId]);
$related = $relatedStmt->fetchAll();
?>

<div class="container" style="padding-top: 30px; padding-bottom: 60px;">
    <nav aria-label="breadcrumb" class="small mb-3">
        <a href="shop.php">Shop</a> / <a href="shop.php?category=<?php echo urlencode($product['category']); ?>"><?php echo htmlspecialchars($product['category']); ?></a> / <?php echo htmlspecialchars($product['name']); ?>
    </nav>

    <div class="row g-5">
        <div class="col-md-6">
            <div class="product-img-wrap" style="height:380px; border-radius: var(--radius-md); position:relative;">
                <?php if ($product['is_harvested_today']): ?>
                    <span class="harvested-badge"><i class="fas fa-seedling"></i> Harvested Today</span>
                <?php endif; ?>
                <img src="<?php echo htmlspecialchars($product['image'] ?: 'assets/img/products/placeholder.jpg'); ?>" alt="<?php echo htmlspecialchars($product['name']); ?>" onerror="this.onerror=null;this.src='assets/img/placeholder.svg'">
            </div>
        </div>
        <div class="col-md-6">
            <div class="product-cat mb-1"><?php echo htmlspecialchars($product['category']); ?></div>
            <h1 class="mb-2" style="font-weight:800; color:var(--text-main);"><?php echo htmlspecialchars($product['name']); ?></h1>
            <div class="mb-3">
                <span class="fs-3 fw-800" style="color:var(--primary-green); font-weight:800;"><?php echo peso($product['price']); ?></span>
                <span class="text-muted">/ <?php echo htmlspecialchars($product['unit']); ?></span>
            </div>
            <span class="stock-badge <?php echo stock_status_class($status); ?> mb-3 d-inline-block"><?php echo $status; ?> <?php echo $inStock ? '(' . (int)$product['stock_qty'] . ' available)' : ''; ?></span>

            <p class="text-muted mt-3"><?php echo nl2br(htmlspecialchars($product['description'])); ?></p>

            <?php if ($inStock): ?>
                <div class="d-flex align-items-center gap-3 mt-4">
                    <div class="input-group" style="width:140px;">
                        <button class="btn btn-outline-secondary" type="button" onclick="stepQuantity('qtyInput', -1, <?php echo (int)$product['stock_qty']; ?>)">-</button>
                        <input type="number" id="qtyInput" class="form-control text-center" value="1" min="1" max="<?php echo (int)$product['stock_qty']; ?>">
                        <button class="btn btn-outline-secondary" type="button" onclick="stepQuantity('qtyInput', 1, <?php echo (int)$product['stock_qty']; ?>)">+</button>
                    </div>
                    <button class="btn btn-farm-primary flex-grow-1" onclick="addToCart(<?php echo (int)$product['product_id']; ?>, parseInt(document.getElementById('qtyInput').value || 1), this)">
                        <i class="fas fa-shopping-basket me-2"></i>Add to Cart
                    </button>
                </div>
            <?php else: ?>
                <button class="btn btn-farm-outline mt-4" disabled><i class="fas fa-ban me-2"></i>Out of Stock</button>
            <?php endif; ?>
        </div>
    </div>

    <?php if (!empty($related)): ?>
    <section class="mt-5">
        <h2 class="section-title">More from <?php echo htmlspecialchars($product['category']); ?></h2>
        <div class="row g-4">
            <?php foreach ($related as $r): ?>
            <div class="col-6 col-md-3">
                <div class="product-card">
                    <a href="product.php?id=<?php echo (int)$r['product_id']; ?>" class="text-decoration-none text-reset">
                        <div class="product-img-wrap">
                            <img src="<?php echo htmlspecialchars($r['image'] ?: 'assets/img/products/placeholder.jpg'); ?>" alt="<?php echo htmlspecialchars($r['name']); ?>" onerror="this.onerror=null;this.src='assets/img/placeholder.svg'">
                        </div>
                        <div class="product-body">
                            <div class="product-name"><?php echo htmlspecialchars($r['name']); ?></div>
                            <span class="product-price"><?php echo peso($r['price']); ?></span> <span class="product-unit">/ <?php echo htmlspecialchars($r['unit']); ?></span>
                        </div>
                    </a>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </section>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
