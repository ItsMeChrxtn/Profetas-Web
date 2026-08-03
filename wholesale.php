<?php
$pageTitle = 'Wholesale Inquiry';
$activeNav = 'wholesale';
require_once __DIR__ . '/includes/header.php';

$errors = [];
$submitted = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $contactNumber = trim($_POST['contact_number'] ?? '');
    $location = trim($_POST['location'] ?? '');
    $requestedItems = trim($_POST['requested_items'] ?? '');
    $estimatedBudget = $_POST['estimated_budget'] !== '' ? (float)$_POST['estimated_budget'] : null;

    if ($name === '' || $contactNumber === '' || $location === '' || $requestedItems === '') {
        $errors[] = 'Please fill out all required fields.';
    }

    if (empty($errors)) {
        $stmt = $pdo->prepare(
            'INSERT INTO wholesale_inquiries (name, contact_number, location, requested_items, estimated_budget)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$name, $contactNumber, $location, $requestedItems, $estimatedBudget]);
        $submitted = true;
    }
}
?>

<div class="container" style="max-width: 720px; padding-top: 30px; padding-bottom: 60px;">
    <h2 class="section-title">Wholesale / Reseller Inquiry</h2>
    <p class="section-subtitle">Planning a bulk order of &#8369;10,000 or more? Tell us what you need and our team will send you a quotation.</p>

    <?php if ($submitted): ?>
        <div class="farm-card text-center py-5">
            <i class="fas fa-check-circle fa-2x mb-3" style="color: var(--success-text);"></i>
            <h4 class="fw-bold">Inquiry Sent!</h4>
            <p class="text-muted">Thank you for your interest. Our team will contact you with a quotation shortly.</p>
            <a href="shop.php" class="btn btn-farm-primary mt-2">Back to Shop</a>
        </div>
    <?php else: ?>
        <div class="farm-card">
            <?php if (!empty($errors)): ?>
                <div class="alert alert-danger">
                    <?php foreach ($errors as $error): ?><div><?php echo htmlspecialchars($error); ?></div><?php endforeach; ?>
                </div>
            <?php endif; ?>

            <form method="post">
                <div class="mb-3">
                    <label class="form-label">Full Name / Business Name</label>
                    <input type="text" name="name" class="form-control" value="<?php echo htmlspecialchars($_POST['name'] ?? current_customer_name()); ?>" required>
                </div>
                <div class="row g-3">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Contact Number</label>
                        <input type="text" name="contact_number" class="form-control" placeholder="09xx xxx xxxx" value="<?php echo htmlspecialchars($_POST['contact_number'] ?? ''); ?>" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Estimated Budget (optional)</label>
                        <input type="number" name="estimated_budget" class="form-control" placeholder="e.g. 15000" value="<?php echo htmlspecialchars($_POST['estimated_budget'] ?? ''); ?>">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Delivery Location</label>
                    <input type="text" name="location" class="form-control" placeholder="City / Municipality, Province" value="<?php echo htmlspecialchars($_POST['location'] ?? ''); ?>" required>
                </div>
                <div class="mb-4">
                    <label class="form-label">Requested Items</label>
                    <textarea name="requested_items" class="form-control" rows="4" placeholder="e.g. 5 sacks Oyster Mushroom, 10 bottles Mokusaku, 3 sacks Carabao Mango" required><?php echo htmlspecialchars($_POST['requested_items'] ?? ''); ?></textarea>
                </div>
                <button type="submit" class="btn btn-farm-primary w-100">Submit Inquiry</button>
            </form>
        </div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
