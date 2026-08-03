<?php
require_once __DIR__ . '/../../includes/session.php';
require_once __DIR__ . '/auth.php';
require_admin_login();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?> | Profetas Farm Admin</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="admin-container">
        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <div class="logo-icon">
                        <i class="fas fa-leaf"></i>
                    </div>
                    <div class="logo-text">
                        <span class="brand-name">PROFETAS</span>
                        <span class="brand-sub">FARM</span>
                        <span class="portal-tag">ADMIN PORTAL</span>
                    </div>
                </div>
            </div>
            
            <nav class="sidebar-nav">
                <ul>
                    <li class="<?php echo ($activePage == 'dashboard') ? 'active' : ''; ?>">
                        <a href="dashboard.php">
                            <i class="fas fa-th-large"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    <li class="<?php echo ($activePage == 'orders') ? 'active' : ''; ?>">
                        <a href="orders.php">
                            <i class="fas fa-shopping-bag"></i>
                            <span>Orders</span>
                        </a>
                    </li>
                    <li class="<?php echo ($activePage == 'products') ? 'active' : ''; ?>">
                        <a href="products.php">
                            <i class="fas fa-box"></i>
                            <span>Products</span>
                        </a>
                    </li>
                    <li class="<?php echo ($activePage == 'inventory') ? 'active' : ''; ?>">
                        <a href="inventory.php">
                            <i class="fas fa-warehouse"></i>
                            <span>Inventory</span>
                        </a>
                    </li>
                    <li class="<?php echo ($activePage == 'customers') ? 'active' : ''; ?>">
                        <a href="customers.php">
                            <i class="fas fa-users"></i>
                            <span>Customers</span>
                        </a>
                    </li>
                    <li class="<?php echo ($activePage == 'reports') ? 'active' : ''; ?>">
                        <a href="reports.php">
                            <i class="fas fa-chart-bar"></i>
                            <span>Reports</span>
                        </a>
                    </li>
                    <li class="<?php echo ($activePage == 'payments') ? 'active' : ''; ?>">
                        <a href="payments.php">
                            <i class="fas fa-credit-card"></i>
                            <span>Payments</span>
                        </a>
                    </li>
                    <li class="<?php echo ($activePage == 'delivery-booking') ? 'active' : ''; ?>">
                        <a href="delivery-booking.php">
                            <i class="fas fa-truck"></i>
                            <span>Delivery Booking</span>
                        </a>
                    </li>
                    <li class="<?php echo ($activePage == 'wholesale-inquiries') ? 'active' : ''; ?>">
                        <a href="wholesale-inquiries.php">
                            <i class="fas fa-truck-loading"></i>
                            <span>Wholesale Inquiries</span>
                        </a>
                    </li>
                    <li class="<?php echo ($activePage == 'farm-visits') ? 'active' : ''; ?>">
                        <a href="farm-visits.php">
                            <i class="fas fa-tractor"></i>
                            <span>Farm Visits</span>
                        </a>
                    </li>
                    <li class="<?php echo ($activePage == 'education') ? 'active' : ''; ?>">
                        <a href="education.php">
                            <i class="fas fa-book-open"></i>
                            <span>Education Posts</span>
                        </a>
                    </li>
                    <li class="<?php echo ($activePage == 'live-chat') ? 'active' : ''; ?>">
                        <a href="live-chat.php">
                            <i class="fas fa-comment-dots"></i>
                            <span>Live Chat</span>
                        </a>
                    </li>
                    <li class="<?php echo ($activePage == 'settings') ? 'active' : ''; ?>">
                        <a href="settings.php">
                            <i class="fas fa-cog"></i>
                            <span>Settings</span>
                        </a>
                    </li>
                </ul>
            </nav>
            
            <div class="sidebar-footer">
                <a href="logout.php" class="logout-btn">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </a>
                <div class="sidebar-bottom-info">
                    <i class="fas fa-leaf small-leaf"></i>
                    <div class="info-text">
                        <p class="farm-name">Profetas Farm</p>
                        <p class="farm-tag">Premium Quality, Naturally Grown</p>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <header class="top-header">
                <div class="header-left">
                    <button class="mobile-toggle" id="mobileToggle">
                        <i class="fas fa-bars"></i>
                    </button>
                    <div class="breadcrumb">
                        <?php if($activePage != 'dashboard'): ?>
                            <a href="dashboard.php">Dashboard</a>
                            <i class="fas fa-chevron-right"></i>
                            <span class="current"><?php echo $pageTitle; ?></span>
                        <?php endif; ?>
                    </div>
                </div>
                
                <div class="header-right">
                    <div class="header-search">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Search..." id="globalSearch">
                    </div>
                    
                    <div class="notification-wrapper">
                        <button class="icon-btn" id="notificationBtn">
                            <i class="far fa-bell"></i>
                            <span class="badge">0</span>
                        </button>
                        <div class="dropdown-menu" id="notificationDropdown">
                            <div class="dropdown-header">Notifications</div>
                            <div class="dropdown-body">
                                <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">
                                    No new notifications
                                </div>
                            </div>
                            <div class="dropdown-footer"><a href="#">View all</a></div>
                        </div>
                    </div>
                    
                    <div class="user-profile">
                        <div class="profile-info" id="profileDropdownBtn">
                            <div class="avatar">
                                <img src="https://ui-avatars.com/api/?name=<?php echo urlencode(current_admin_name()); ?>&background=1B3C26&color=fff" alt="<?php echo htmlspecialchars(current_admin_name()); ?>">
                            </div>
                            <span class="user-name"><?php echo htmlspecialchars(current_admin_name()); ?></span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="dropdown-menu" id="profileDropdown">
                            <a href="settings.php"><i class="fas fa-user"></i> My Profile</a>
                            <a href="settings.php"><i class="fas fa-cog"></i> Settings</a>
                            <hr>
                            <a href="logout.php" class="text-danger"><i class="fas fa-sign-out-alt"></i> Logout</a>
                        </div>
                    </div>
                </div>
            </header>

            <div class="content-body">
                <div class="page-header-row">
                    <div class="page-title-group">
                        <h1 class="page-title"><?php echo $pageTitle; ?></h1>
                        <p class="page-subtitle"><?php echo $pageSubtitle; ?></p>
                    </div>
                    <?php if(isset($headerActions)): ?>
                        <div class="header-actions">
                            <?php echo $headerActions; ?>
                        </div>
                    <?php endif; ?>
                </div>
