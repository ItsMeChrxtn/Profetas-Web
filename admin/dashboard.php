<?php 
$pageTitle = 'Admin Dashboard';
$pageSubtitle = "Welcome back! Here's what's happening with Profetas Farm.";
$activePage = 'dashboard';
include 'includes/header.php'; 
?>

<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-icon-wrapper green">
            <i class="fas fa-leaf"></i>
        </div>
        <span class="stat-label">Total Orders</span>
        <span class="stat-value">0</span>
        <div class="stat-trend">
            <span class="trend-up"><i class="fas fa-arrow-up"></i> 12.5%</span>
            <span class="trend-label">vs last 30 days</span>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon-wrapper amber">
            <i class="fas fa-shopping-bag"></i>
        </div>
        <span class="stat-label">Total Revenue</span>
        <span class="stat-value">₱0</span>
        <div class="stat-trend">
            <span class="trend-up"><i class="fas fa-arrow-up"></i> 15.3%</span>
            <span class="trend-label">vs last 30 days</span>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon-wrapper blue">
            <i class="fas fa-box"></i>
        </div>
        <span class="stat-label">Products</span>
        <span class="stat-value">0</span>
        <div class="stat-trend">
            <span class="trend-up"><i class="fas fa-arrow-up"></i> 5.1%</span>
            <span class="trend-label">vs last 30 days</span>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon-wrapper amber">
            <i class="fas fa-users"></i>
        </div>
        <span class="stat-label">Customers</span>
        <span class="stat-value">0</span>
        <div class="stat-trend">
            <span class="trend-up"><i class="fas fa-arrow-up"></i> 9.8%</span>
            <span class="trend-label">vs last 30 days</span>
        </div>
    </div>
    <div class="stat-card">
        <div class="stat-icon-wrapper green">
            <i class="fas fa-leaf"></i>
        </div>
        <span class="stat-label">Low Stock Items</span>
        <span class="stat-value">0</span>
        <div class="stat-trend">
            <span class="trend-down"><i class="fas fa-arrow-up"></i> 20%</span>
            <span class="trend-label">vs last 30 days</span>
        </div>
    </div>
</div>

<div class="dashboard-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
    <div class="card">
        <div class="card-header">
            <h3 class="card-title"><i class="fas fa-chart-line"></i> Sales Overview</h3>
            <select class="form-control" style="width: auto;">
                <option>Last 30 Days</option>
            </select>
        </div>
        <div class="chart-container" style="height: 300px; display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 20px;">
            <!-- Placeholder for Chart -->
            <img src="https://quickchart.io/chart?c={type:'line',data:{labels:['Apr 25','May 2','May 9','May 16','May 23'],datasets:[{label:'Revenue',data:[25000,45000,30000,45000,35000,45000],fill:true,backgroundColor:'rgba(27,60,38,0.1)',borderColor:'#1B3C26'}]}}" style="width: 100%; height: 100%; object-fit: contain;">
        </div>
    </div>
    
    <div class="card">
        <div class="card-header">
            <h3 class="card-title"><i class="fas fa-list"></i> Recent Orders</h3>
            <a href="orders.php" class="btn btn-outline btn-sm" style="padding: 8px 15px; font-size: 12px;">View All Orders</a>
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
                    <!-- No recent orders -->
                </tbody>
            </table>
        </div>
    </div>
</div>

<div class="dashboard-row" style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px;">
    <div class="card">
        <div class="card-header">
            <h3 class="card-title"><i class="fas fa-box-open"></i> Top Products</h3>
            <a href="products.php" class="btn btn-outline btn-sm" style="padding: 8px 15px; font-size: 12px;">View All Products</a>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Sold</th>
                        <th>Revenue</th>
                        <th>Stock</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- No top products -->
                </tbody>
            </table>
        </div>
    </div>
    
    <div class="card">
        <div class="card-header">
            <h3 class="card-title"><i class="fas fa-warehouse"></i> Inventory Summary</h3>
            <a href="inventory.php" class="btn btn-outline btn-sm" style="padding: 8px 15px; font-size: 12px;">View Inventory</a>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-around; height: 250px;">
            <div style="position: relative; width: 150px; height: 150px;">
                <img src="https://quickchart.io/chart?c={type:'doughnut',data:{labels:['In Stock','Low Stock','Out of Stock'],datasets:[{data:[58,16,12],backgroundColor:['#1B3C26','#F59E0B','#EF4444']}]}}" style="width: 100%; height: 100%;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                    <span style="display: block; font-size: 24px; font-weight: 800;">86</span>
                    <span style="font-size: 10px; color: var(--text-muted);">Total Products</span>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div style="display: flex; align-items: center; gap: 10px; font-size: 13px;">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background: #1B3C26;"></span>
                    <span>In Stock: 58 (67.4%)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; font-size: 13px;">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background: #F59E0B;"></span>
                    <span>Low Stock: 16 (18.6%)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; font-size: 13px;">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background: #EF4444;"></span>
                    <span>Out of Stock: 12 (14.0%)</span>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
