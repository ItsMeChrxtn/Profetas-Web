<?php 
$pageTitle = 'Inventory';
$pageSubtitle = 'Manage and track all inventory items and stock levels.';
$activePage = 'inventory';
include 'includes/header.php'; 
?>

<div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
	    <div class="stat-card" style="flex-direction: row; align-items: center; gap: 20px;">
	        <div style="width: 80px; height: 80px; background: #F0FDF4; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; color: #166534;">
	            <i class="fas fa-leaf"></i>
	        </div>
	        <div>
	            <span class="stat-label">Product A</span>
	            <span class="stat-value" style="margin-bottom: 5px;">0 kg</span>
	            <span class="status-pill status-instock" style="font-size: 10px;">Out of Stock</span>
	            <p style="font-size: 11px; color: var(--text-muted); margin-top: 5px;">Total Stock</p>
	        </div>
	        <div style="margin-left: auto; color: #166534;"><i class="fas fa-chart-line"></i></div>
	    </div>
	    <div class="stat-card" style="flex-direction: row; align-items: center; gap: 20px;">
	        <div style="width: 80px; height: 80px; background: #F0FDF4; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; color: #166534;">
	            <i class="fas fa-leaf"></i>
	        </div>
	        <div>
	            <span class="stat-label">Product B</span>
	            <span class="stat-value" style="margin-bottom: 5px;">0 kg</span>
	            <span class="status-pill status-instock" style="font-size: 10px;">Out of Stock</span>
	            <p style="font-size: 11px; color: var(--text-muted); margin-top: 5px;">Total Stock</p>
	        </div>
	        <div style="margin-left: auto; color: #166534;"><i class="fas fa-chart-line"></i></div>
	    </div>
	    <div class="stat-card" style="flex-direction: row; align-items: center; gap: 20px;">
	        <div style="width: 80px; height: 80px; background: #F0FDF4; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; color: #166534;">
	            <i class="fas fa-leaf"></i>
	        </div>
	        <div>
	            <span class="stat-label">Product C</span>
	            <span class="stat-value" style="margin-bottom: 5px;">0 kg</span>
	            <span class="status-pill status-instock" style="font-size: 10px;">Out of Stock</span>
	            <p style="font-size: 11px; color: var(--text-muted); margin-top: 5px;">Total Stock</p>
	        </div>
	        <div style="margin-left: auto; color: #166534;"><i class="fas fa-chart-line"></i></div>
	    </div>
</div>

<div class="card">
    <div class="card-header">
        <h3 class="card-title"><i class="fas fa-clipboard-list"></i> Inventory List</h3>
        <div style="display: flex; gap: 15px;">
            <div class="header-search" style="width: 300px;">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Search inventory..." class="form-control">
            </div>
            <button class="btn btn-outline"><i class="fas fa-filter"></i> Filter <i class="fas fa-chevron-down"></i></button>
        </div>
    </div>
    
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Product <i class="fas fa-sort"></i></th>
                    <th>Category <i class="fas fa-sort"></i></th>
                    <th>Stock Level <i class="fas fa-sort"></i></th>
                    <th>Status <i class="fas fa-sort"></i></th>
                    <th>Last Updated <i class="fas fa-sort"></i></th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php
	                $inventory = [];
                
                foreach ($inventory as $item):
                    $statusClass = str_replace(' ', '', strtolower($item[3]));
                ?>
                <tr>
                    <td style="display: flex; align-items: center; gap: 12px;">
                        <img src="https://via.placeholder.com/32" style="border-radius: 50%;">
                        <span style="font-weight: 600;"><?php echo $item[0]; ?></span>
                    </td>
                    <td><?php echo $item[1]; ?></td>
                    <td style="font-weight: 700;"><?php echo $item[2]; ?></td>
                    <td>
                        <span style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: <?php echo ($statusClass == 'instock' ? '#166534' : ($statusClass == 'lowstock' ? '#F59E0B' : '#EF4444')); ?>;"></span>
                            <?php echo $item[3]; ?>
                        </span>
                    </td>
                    <td><?php echo $item[4]; ?></td>
                    <td>
                        <button class="btn btn-icon btn-outline"><i class="fas fa-ellipsis-v"></i></button>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    
    <div class="card-footer" style="margin-top: 30px; display: flex; justify-content: space-between; align-items: center;">
	        <span style="font-size: 14px; color: var(--text-muted);">Showing 0 entries</span>
        <div class="pagination" style="display: flex; gap: 5px;">
            <button class="btn btn-icon btn-outline"><i class="fas fa-chevron-left"></i></button>
            <button class="btn btn-icon btn-primary">1</button>
            <button class="btn btn-icon btn-outline"><i class="fas fa-chevron-right"></i></button>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
