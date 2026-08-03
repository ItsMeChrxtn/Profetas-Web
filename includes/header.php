<?php
/**
 * Shared header for every customer-facing page.
 * Expects the including page to optionally set:
 *   $pageTitle  - <title> text (defaults below)
 *   $activeNav  - one of: home, shop, wholesale, farmvisit, education, track
 * Starts the session, opens the DB connection, and loads helper functions
 * so every page that includes this automatically has $pdo and the
 * cart/auth/formatting helpers available.
 */
require_once __DIR__ . '/session.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/functions.php';

$pageTitle = $pageTitle ?? 'Profetas Integrated Farm';
$activeNav = $activeNav ?? '';
$chatStatus = get_setting($pdo, 'chat_status', 'offline');
$facebookUrl = get_setting($pdo, 'facebook_url', '#');
$shopeeUrl = get_setting($pdo, 'shopee_url', '#');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($pageTitle); ?> | Profetas Integrated Farm</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

<nav class="site-navbar">
    <div class="container">
        <div class="d-flex align-items-center justify-content-between">
            <a href="index.php" class="brand-logo">
                <span class="logo-icon"><i class="fas fa-leaf"></i></span>
                <span>PROFETAS FARM</span>
            </a>

            <button class="btn d-lg-none" type="button" data-bs-toggle="collapse" data-bs-target="#siteNavCollapse">
                <i class="fas fa-bars fa-lg"></i>
            </button>

            <div class="collapse navbar-collapse d-lg-flex flex-grow-1 justify-content-between" id="siteNavCollapse">
                <ul class="nav ms-lg-4">
                    <li class="nav-item"><a class="nav-link <?php echo $activeNav === 'home' ? 'active' : ''; ?>" href="index.php">Home</a></li>
                    <li class="nav-item"><a class="nav-link <?php echo $activeNav === 'shop' ? 'active' : ''; ?>" href="shop.php">Shop</a></li>
                    <li class="nav-item"><a class="nav-link <?php echo $activeNav === 'wholesale' ? 'active' : ''; ?>" href="wholesale.php">Wholesale</a></li>
                    <li class="nav-item"><a class="nav-link <?php echo $activeNav === 'education' ? 'active' : ''; ?>" href="education.php">Learn</a></li>
                    <li class="nav-item"><a class="nav-link <?php echo $activeNav === 'farmvisit' ? 'active' : ''; ?>" href="farm-visit.php">Visit the Farm</a></li>
                    <li class="nav-item"><a class="nav-link <?php echo $activeNav === 'track' ? 'active' : ''; ?>" href="track-order.php">Track Order</a></li>
                </ul>

                <div class="d-flex align-items-center gap-3 mt-3 mt-lg-0">
                    <a href="cart.php" class="text-dark position-relative cart-badge-wrap" title="Cart">
                        <i class="fas fa-shopping-basket fa-lg"></i>
                        <span id="cartCountBadge" class="cart-count-badge" style="<?php echo cart_count() > 0 ? '' : 'display:none;'; ?>"><?php echo cart_count(); ?></span>
                    </a>

                    <?php if (is_logged_in()): ?>
                        <div class="dropdown">
                            <a class="btn btn-farm-outline dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                                <i class="fas fa-user-circle"></i> <?php echo htmlspecialchars(current_customer_name()); ?>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="account.php"><i class="fas fa-id-card me-2"></i>My Account</a></li>
                                <li><a class="dropdown-item" href="loyalty.php"><i class="fas fa-award me-2"></i>Loyalty & Vouchers</a></li>
                                <li><a class="dropdown-item" href="track-order.php"><i class="fas fa-truck me-2"></i>My Orders</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="logout.php"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                            </ul>
                        </div>
                    <?php else: ?>
                        <a href="login.php" class="btn btn-farm-outline">Login</a>
                        <a href="register.php" class="btn btn-farm-primary">Sign Up</a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</nav>

<main>
