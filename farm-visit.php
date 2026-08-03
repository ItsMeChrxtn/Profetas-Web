<?php
$pageTitle = 'Visit the Farm';
$activeNav = 'farmvisit';
require_once __DIR__ . '/includes/header.php';

$errors = [];
$submitted = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $contactNumber = trim($_POST['contact_number'] ?? '');
    $visitDate = $_POST['visit_date'] ?? '';
    $visitTime = $_POST['visit_time'] ?? '';
    $numberOfVisitors = max(1, (int)($_POST['number_of_visitors'] ?? 1));
    $notes = trim($_POST['notes'] ?? '');

    if ($name === '' || $contactNumber === '' || $visitDate === '' || $visitTime === '') {
        $errors[] = 'Please fill out all required fields.';
    } elseif ($visitDate < date('Y-m-d')) {
        $errors[] = 'Visit date cannot be in the past.';
    }

    if (empty($errors)) {
        $stmt = $pdo->prepare(
            'INSERT INTO farm_visits (customer_id, name, contact_number, visit_date, visit_time, number_of_visitors, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([current_customer_id(), $name, $contactNumber, $visitDate, $visitTime, $numberOfVisitors, $notes ?: null]);
        $submitted = true;
    }
}
?>

<div class="container" style="max-width: 720px; padding-top: 30px; padding-bottom: 60px;">
    <h2 class="section-title">Schedule a Farm Visit</h2>
    <p class="section-subtitle">Come see how we grow our mushrooms, mangoes, and more at Profetas Integrated Farm, Tres Cruces, Tanza, Cavite.</p>

    <?php if ($submitted): ?>
        <div class="farm-card text-center py-5">
            <i class="fas fa-tractor fa-2x mb-3" style="color: var(--primary-green);"></i>
            <h4 class="fw-bold">Visit Request Sent!</h4>
            <p class="text-muted">We'll contact you to confirm your schedule.</p>
            <a href="index.php" class="btn btn-farm-primary mt-2">Back to Home</a>
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
                    <label class="form-label">Full Name</label>
                    <input type="text" name="name" class="form-control" value="<?php echo htmlspecialchars($_POST['name'] ?? current_customer_name()); ?>" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Contact Number</label>
                    <input type="text" name="contact_number" class="form-control" placeholder="09xx xxx xxxx" value="<?php echo htmlspecialchars($_POST['contact_number'] ?? ''); ?>" required>
                </div>
                <div class="row g-3">
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Visit Date</label>
                        <input type="date" name="visit_date" class="form-control" min="<?php echo date('Y-m-d'); ?>" value="<?php echo htmlspecialchars($_POST['visit_date'] ?? ''); ?>" required>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Visit Time</label>
                        <input type="time" name="visit_time" class="form-control" value="<?php echo htmlspecialchars($_POST['visit_time'] ?? ''); ?>" required>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Number of Visitors</label>
                        <input type="number" name="number_of_visitors" class="form-control" min="1" value="<?php echo htmlspecialchars($_POST['number_of_visitors'] ?? '1'); ?>" required>
                    </div>
                </div>
                <div class="mb-4">
                    <label class="form-label">Notes (optional)</label>
                    <textarea name="notes" class="form-control" rows="3" placeholder="Anything we should know? (e.g. school group, accessibility needs)"><?php echo htmlspecialchars($_POST['notes'] ?? ''); ?></textarea>
                </div>
                <button type="submit" class="btn btn-farm-primary w-100">Request Visit</button>
            </form>
        </div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
