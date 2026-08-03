<?php 
$pageTitle = 'Reports';
$pageSubtitle = 'Analyze your sales performance and farm productivity.';
$activePage = 'reports';
$headerActions = '<button class="btn btn-outline"><i class="fas fa-calendar"></i> Select Date Range</button> <button class="btn btn-primary"><i class="fas fa-file-pdf"></i> Generate Report</button>';
include 'includes/header.php'; 
?>

<div class="stats-grid">
    <div class="stat-card">
        <span class="stat-label">Total Revenue</span>
        <span class="stat-value">₱0.00</span>
        <div class="stat-trend"><span class="trend-label">No data available</span></div>
    </div>
    <div class="stat-card">
        <span class="stat-label">Average Order Value</span>
        <span class="stat-value">₱0.00</span>
        <div class="stat-trend"><span class="trend-label">No data available</span></div>
    </div>
    <div class="stat-card">
        <span class="stat-label">Total Orders</span>
        <span class="stat-value">0</span>
        <div class="stat-trend"><span class="trend-label">No data available</span></div>
    </div>
    <div class="stat-card">
        <span class="stat-label">Conversion Rate</span>
        <span class="stat-value">0.0%</span>
        <div class="stat-trend"><span class="trend-label">No data available</span></div>
    </div>
    <div class="stat-card">
        <span class="stat-label">Customer Growth</span>
        <span class="stat-value">0</span>
        <div class="stat-trend"><span class="trend-label">No data available</span></div>
    </div>
</div>

<div class="dashboard-row" style="display: grid; grid-template-columns: 2fr 1fr; gap: 30px; margin-bottom: 30px;">
    <div class="card">
        <div class="card-header">
            <h3 class="card-title"><i class="fas fa-chart-area"></i> Revenue Growth</h3>
        </div>
        <div style="height: 350px; display: flex; align-items: center; justify-content: center; background: #f9fafb; border-radius: var(--radius-md);">
            <div style="text-align: center; color: var(--text-muted);">
                <i class="fas fa-chart-line" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                <p>No chart data available for the selected period</p>
            </div>
        </div>
    </div>
    <div class="card">
        <div class="card-header">
            <h3 class="card-title"><i class="fas fa-chart-pie"></i> Sales by Category</h3>
        </div>
        <div style="height: 350px; display: flex; align-items: center; justify-content: center; background: #f9fafb; border-radius: var(--radius-md);">
            <div style="text-align: center; color: var(--text-muted);">
                <i class="fas fa-chart-pie" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                <p>No category data available</p>
            </div>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <h3 class="card-title"><i class="fas fa-table"></i> Top Performing Products</h3>
    </div>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th>Growth</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="5" style="text-align: center; padding: 50px; color: var(--text-muted);">
                        No product data found
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
