<?php
$pageTitle = 'Products';
$pageSubtitle = 'Manage your farm products, pricing, and categories.';
$activePage = 'products';
$headerActions = '<button class="btn btn-primary" onclick="showAddProductModal()"><i class="fas fa-plus"></i> Add Product</button>';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/includes/functions.php';
include 'includes/header.php';

$categories = ['Fresh', 'Value-Added', 'Farm Inputs'];
$formMessage = '';
$formError = '';

// ---- Handle Add / Edit / Delete (all posted from the modal / row buttons) ----
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['form_action'] ?? '';

    if ($action === 'delete') {
        $productId = (int)$_POST['product_id'];
        try {
            $pdo->prepare('DELETE FROM products WHERE product_id = ?')->execute([$productId]);
            $formMessage = 'Product deleted.';
        } catch (PDOException $e) {
            $formError = 'Could not delete this product - it already has existing orders. Set its status to Inactive instead.';
        }
    } elseif ($action === 'save') {
        $productId = (int)($_POST['product_id'] ?? 0);
        $name = trim($_POST['name'] ?? '');
        $category = $_POST['category'] ?? '';
        $description = trim($_POST['description'] ?? '');
        $price = (float)($_POST['price'] ?? 0);
        $unit = trim($_POST['unit'] ?? 'unit');
        $stockQty = (int)($_POST['stock_qty'] ?? 0);
        $status = ($_POST['status'] ?? 'Active') === 'Inactive' ? 'Inactive' : 'Active';
        $isHarvestedToday = isset($_POST['is_harvested_today']) ? 1 : 0;

        if ($name === '' || !in_array($category, $categories, true) || $price <= 0) {
            $formError = 'Please fill out the product name, category, and a valid price.';
        } else {
            $imagePath = null;
            if (!empty($_FILES['image']['name']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
                $mime = mime_content_type($_FILES['image']['tmp_name']);
                if (isset($allowed[$mime]) && $_FILES['image']['size'] <= 5 * 1024 * 1024) {
                    $filename = 'product_' . uniqid() . '.' . $allowed[$mime];
                    $destination = __DIR__ . '/../assets/img/products/' . $filename;
                    if (move_uploaded_file($_FILES['image']['tmp_name'], $destination)) {
                        $imagePath = 'assets/img/products/' . $filename;
                    }
                }
            }

            if ($productId > 0) {
                $sql = 'UPDATE products SET name=?, category=?, description=?, price=?, unit=?, status=?, is_harvested_today=?';
                $params = [$name, $category, $description, $price, $unit, $status, $isHarvestedToday];
                if ($imagePath) {
                    $sql .= ', image=?';
                    $params[] = $imagePath;
                }
                $sql .= ' WHERE product_id=?';
                $params[] = $productId;
                $pdo->prepare($sql)->execute($params);

                $pdo->prepare('UPDATE inventory SET stock_qty=? WHERE product_id=?')->execute([$stockQty, $productId]);
            } else {
                $stmt = $pdo->prepare(
                    'INSERT INTO products (name, category, description, price, unit, image, is_harvested_today, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
                );
                $stmt->execute([$name, $category, $description, $price, $unit, $imagePath, $isHarvestedToday, $status]);
                $productId = (int)$pdo->lastInsertId();

                $pdo->prepare('INSERT INTO inventory (product_id, stock_qty) VALUES (?, ?)')->execute([$productId, $stockQty]);
            }
            $formMessage = 'Product saved.';
        }
    }
}

$search = trim($_GET['q'] ?? '');
$categoryFilter = $_GET['category'] ?? '';
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = 15;
$offset = ($page - 1) * $perPage;

$where = [];
$params = [];
if ($search !== '') {
    $where[] = 'p.name LIKE ?';
    $params[] = '%' . $search . '%';
}
if (in_array($categoryFilter, $categories, true)) {
    $where[] = 'p.category = ?';
    $params[] = $categoryFilter;
}
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM products p $whereSql");
$countStmt->execute($params);
$totalProducts = (int)$countStmt->fetchColumn();
$totalPages = max(1, (int)ceil($totalProducts / $perPage));

$stmt = $pdo->prepare(
    "SELECT p.*, COALESCE(i.stock_qty, 0) AS stock_qty, COALESCE(i.low_stock_threshold, 10) AS low_stock_threshold
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.product_id
     $whereSql
     ORDER BY p.product_id DESC
     LIMIT $perPage OFFSET $offset"
);
$stmt->execute($params);
$products = $stmt->fetchAll();
?>

<?php if ($formMessage): ?>
<script>document.addEventListener('DOMContentLoaded', () => adminAlert('success', <?php echo json_encode($formMessage); ?>));</script>
<?php endif; ?>
<?php if ($formError): ?>
<script>document.addEventListener('DOMContentLoaded', () => adminAlert('error', <?php echo json_encode($formError); ?>));</script>
<?php endif; ?>

<div class="card">
    <div class="card-header">
        <form method="get" class="header-search" style="width: 350px;" data-real>
            <i class="fas fa-search"></i>
            <input type="text" name="q" placeholder="Search products..." class="form-control" value="<?php echo htmlspecialchars($search); ?>">
        </form>
        <form method="get" style="display: flex; gap: 10px;" data-real>
            <?php if ($search !== ''): ?><input type="hidden" name="q" value="<?php echo htmlspecialchars($search); ?>"><?php endif; ?>
            <select name="category" class="form-control" style="width: 170px;" onchange="this.form.submit()">
                <option value="">All Categories</option>
                <?php foreach ($categories as $cat): ?>
                    <option value="<?php echo $cat; ?>" <?php echo $categoryFilter === $cat ? 'selected' : ''; ?>><?php echo $cat; ?></option>
                <?php endforeach; ?>
            </select>
        </form>
    </div>

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($products as $product):
                    $stockStatus = admin_stock_status((int)$product['stock_qty'], (int)$product['low_stock_threshold']);
                    $stockClass = str_replace(' ', '', strtolower($stockStatus));
                ?>
                <tr>
                    <td><img src="../<?php echo htmlspecialchars($product['image'] ?: 'assets/img/products/placeholder.jpg'); ?>" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; border: 1px solid var(--border-color);" onerror="this.onerror=null;this.src='../assets/img/placeholder.svg'"></td>
                    <td style="font-weight: 700; color: var(--primary-green);"><?php echo htmlspecialchars($product['name']); ?></td>
                    <td><?php echo htmlspecialchars($product['category']); ?></td>
                    <td style="font-weight: 700;"><?php echo admin_peso($product['price']); ?> <span style="font-weight:400;color:var(--text-muted);font-size:11px;">/ <?php echo htmlspecialchars($product['unit']); ?></span></td>
                    <td><span class="status-pill status-<?php echo $stockClass; ?>"><?php echo (int)$product['stock_qty']; ?> - <?php echo $stockStatus; ?></span></td>
                    <td><span class="status-pill status-<?php echo strtolower($product['status']); ?>"><?php echo $product['status']; ?></span></td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-icon btn-outline" data-product="<?php echo htmlspecialchars(json_encode($product), ENT_QUOTES, 'UTF-8'); ?>" onclick="showEditProductModal(this)"><i class="far fa-edit"></i></button>
                            <form method="post" data-real onsubmit="return adminConfirm(this, 'Delete this product? This cannot be undone.', {confirmButtonText: 'Yes, delete it'});">
                                <input type="hidden" name="form_action" value="delete">
                                <input type="hidden" name="product_id" value="<?php echo $product['product_id']; ?>">
                                <button type="submit" class="btn btn-icon btn-outline text-danger"><i class="far fa-trash-alt"></i></button>
                            </form>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if (empty($products)): ?>
                <tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding: 30px;">No products found.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>

    <div class="card-footer" style="margin-top: 30px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; color: var(--text-muted);">Showing <?php echo count($products); ?> of <?php echo $totalProducts; ?> products</span>
        <div class="pagination" style="display: flex; gap: 5px;">
            <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                <a href="?page=<?php echo $i; ?>&q=<?php echo urlencode($search); ?>&category=<?php echo urlencode($categoryFilter); ?>" class="btn btn-icon <?php echo $i === $page ? 'btn-primary' : 'btn-outline'; ?>"><?php echo $i; ?></a>
            <?php endfor; ?>
        </div>
    </div>
</div>

<script>
const productCategories = <?php echo json_encode($categories); ?>;

function categoryOptions(selected) {
    return productCategories.map(c => `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`).join('');
}

function productFormHtml(p) {
    p = p || {};
    return `
        <form id="productForm" method="post" action="products.php" enctype="multipart/form-data" data-real>
            <input type="hidden" name="form_action" value="save">
            <input type="hidden" name="product_id" value="${p.product_id || ''}">
            <div class="form-group">
                <label>Product Name</label>
                <input type="text" name="name" class="form-control" required value="${p.name ? p.name.replace(/"/g, '&quot;') : ''}" placeholder="Enter product name">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                    <label>Category</label>
                    <select name="category" class="form-control" required>
                        <option value="">Select Category</option>
                        ${categoryOptions(p.category)}
                    </select>
                </div>
                <div class="form-group">
                    <label>Price (₱)</label>
                    <input type="number" step="0.01" name="price" class="form-control" required value="${p.price || ''}" placeholder="0.00">
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                    <label>Unit</label>
                    <input type="text" name="unit" class="form-control" value="${p.unit || 'kg'}" placeholder="kg, pack, bottle...">
                </div>
                <div class="form-group">
                    <label>Stock Quantity</label>
                    <input type="number" name="stock_qty" class="form-control" required value="${p.stock_qty ?? 0}" placeholder="0">
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" class="form-control" rows="3">${p.description || ''}</textarea>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                    <label>Status</label>
                    <select name="status" class="form-control">
                        <option value="Active" ${p.status !== 'Inactive' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${p.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="form-group" style="display:flex; align-items:center; gap:8px; margin-top: 28px;">
                    <input type="checkbox" name="is_harvested_today" id="harvestedToday" ${p.is_harvested_today == 1 ? 'checked' : ''}>
                    <label for="harvestedToday" style="margin:0;">Harvested Today</label>
                </div>
            </div>
            <div class="form-group">
                <label>Product Image ${p.image ? '(leave blank to keep current photo)' : ''}</label>
                <input type="file" name="image" class="form-control" accept="image/png, image/jpeg, image/webp">
            </div>
        </form>
    `;
}

function showAddProductModal() {
    const footer = `
        <button class="btn btn-outline" onclick="document.getElementById('modalOverlay').style.display='none'">Cancel</button>
        <button class="btn btn-primary" onclick="document.getElementById('productForm').requestSubmit()">Save Product</button>
    `;
    showModal('Add New Product', productFormHtml({}), footer);
}

function showEditProductModal(btn) {
    const p = JSON.parse(btn.dataset.product);
    const footer = `
        <button class="btn btn-outline" onclick="document.getElementById('modalOverlay').style.display='none'">Cancel</button>
        <button class="btn btn-primary" onclick="document.getElementById('productForm').requestSubmit()">Save Product</button>
    `;
    showModal('Edit Product', productFormHtml(p), footer);
}
</script>

<?php include 'includes/footer.php'; ?>
