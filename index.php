<?php
$pageTitle = 'Home';
$activeNav = 'home';
require_once __DIR__ . '/includes/header.php';

// "Harvested Today" items
$harvestedToday = $pdo->query(
    "SELECT p.product_id, p.name, p.category, p.price, p.unit, p.image
     FROM products p
     WHERE p.is_harvested_today = 1 AND p.status = 'Active'
     ORDER BY p.updated_at DESC"
)->fetchAll();

// Featured products for the homepage grid
$featured = $pdo->query(
    "SELECT p.product_id, p.name, p.category, p.price, p.unit, p.image, p.is_harvested_today,
            COALESCE(i.stock_qty, 0) AS stock_qty, COALESCE(i.low_stock_threshold, 10) AS low_stock_threshold
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.product_id
     WHERE p.status = 'Active'
     ORDER BY p.created_at DESC
     LIMIT 8"
)->fetchAll();
?>

<div class="container">

    <!-- Hero -->
    <section class="hero-section">
        <div class="hero-media">
            <!-- Replace with an actual farm photo/video in assets/img/hero/ -->
            <img src="assets/img/hero/farm-cover.jpg" alt="Profetas Integrated Farm" onerror="this.style.display='none'">
        </div>
        <div class="hero-content">
            <?php if (!empty($harvestedToday)): ?>
                <div class="harvest-strip mb-3 d-inline-flex">
                    <i class="fas fa-seedling"></i>
                    Harvested Today: <?php echo htmlspecialchars(implode(', ', array_column($harvestedToday, 'name'))); ?>
                </div>
            <?php endif; ?>
            <h1>Premium Quality, Naturally Grown</h1>
            <p>Fresh mushrooms, mangoes, mokusaku, and farm inputs from our cooperative in Tres Cruces, Tanza, Cavite &mdash; straight to your table.</p>
            <div class="d-flex flex-wrap gap-2">
                <a href="shop.php" class="btn btn-farm-amber">Shop Now <i class="fas fa-arrow-right ms-1"></i></a>
                <a href="wholesale.php" class="btn btn-farm-outline" style="background:rgba(255,255,255,0.1); color:#fff; border-color:rgba(255,255,255,0.5);">Wholesale Inquiry</a>
            </div>
            <div class="social-pills">
                <a href="<?php echo htmlspecialchars($facebookUrl); ?>" target="_blank" rel="noopener" class="social-pill"><i class="fab fa-facebook"></i> Facebook Page</a>
                <a href="<?php echo htmlspecialchars($shopeeUrl); ?>" target="_blank" rel="noopener" class="social-pill"><i class="fas fa-shopping-bag"></i> Shopee Store</a>
            </div>
        </div>
    </section>

    <!-- Category quick links -->
    <section class="mt-5">
        <div class="row g-3">
            <div class="col-md-4">
                <a href="shop.php?category=Fresh" class="farm-card d-flex align-items-center gap-3 text-decoration-none">
                    <div class="logo-icon" style="width:50px;height:50px;background:var(--success-bg);color:var(--success-text);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;"><i class="fas fa-leaf"></i></div>
                    <div>
                        <div class="fw-bold text-dark">Fresh Produce</div>
                        <div class="small text-muted">Mushrooms &amp; mangoes</div>
                    </div>
                </a>
            </div>
            <div class="col-md-4">
                <a href="shop.php?category=Value-Added" class="farm-card d-flex align-items-center gap-3 text-decoration-none">
                    <div class="logo-icon" style="width:50px;height:50px;background:var(--warning-bg);color:var(--warning-text);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;"><i class="fas fa-flask"></i></div>
                    <div>
                        <div class="fw-bold text-dark">Value-Added</div>
                        <div class="small text-muted">Mokusaku, jams &amp; more</div>
                    </div>
                </a>
            </div>
            <div class="col-md-4">
                <a href="shop.php?category=Farm+Inputs" class="farm-card d-flex align-items-center gap-3 text-decoration-none">
                    <div class="logo-icon" style="width:50px;height:50px;background:#DBEAFE;color:#1E40AF;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;"><i class="fas fa-seedling"></i></div>
                    <div>
                        <div class="fw-bold text-dark">Farm Inputs</div>
                        <div class="small text-muted">Grow bags &amp; soil mix</div>
                    </div>
                </a>
            </div>
        </div>
    </section>

    <!-- Featured products -->
    <section class="mt-5">
        <h2 class="section-title">Featured Products</h2>
        <p class="section-subtitle">Fresh from the farm, added recently to our catalog.</p>

        <div class="row g-4">
            <?php foreach ($featured as $p):
                $status = stock_status((int)$p['stock_qty'], (int)$p['low_stock_threshold']);
            ?>
            <div class="col-6 col-md-4 col-lg-3">
                <div class="product-card">
                    <?php if ($p['is_harvested_today']): ?>
                        <span class="harvested-badge"><i class="fas fa-seedling"></i> Harvested Today</span>
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

        <div class="text-center mt-4">
            <a href="shop.php" class="btn btn-farm-primary">View Full Catalog <i class="fas fa-arrow-right ms-1"></i></a>
        </div>
    </section>

</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
