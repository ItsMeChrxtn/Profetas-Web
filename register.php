<?php
$pageTitle = 'Create an Account';
require_once __DIR__ . '/includes/header.php';

if (is_logged_in()) {
    header('Location: index.php');
    exit;
}

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $firstName = trim($_POST['first_name'] ?? '');
    $lastName = trim($_POST['last_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $contactNumber = trim($_POST['contact_number'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';

    if ($firstName === '' || $lastName === '' || $email === '' || $password === '') {
        $errors[] = 'Please fill out all required fields.';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Please enter a valid email address.';
    }
    if (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters long.';
    }
    if ($password !== $confirmPassword) {
        $errors[] = 'Passwords do not match.';
    }

    if (empty($errors)) {
        $stmt = $pdo->prepare('SELECT customer_id FROM customers WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $errors[] = 'An account with that email already exists. Please log in instead.';
        }
    }

    if (empty($errors)) {
        $stmt = $pdo->prepare(
            "INSERT INTO customers (first_name, last_name, email, password_hash, contact_number, role)
             VALUES (?, ?, ?, ?, ?, 'customer')"
        );
        $stmt->execute([$firstName, $lastName, $email, password_hash($password, PASSWORD_DEFAULT), $contactNumber]);

        $_SESSION['user_id'] = (int)$pdo->lastInsertId();
        $_SESSION['user_name'] = $firstName;
        $_SESSION['user_role'] = 'customer';
        flash('success', 'Welcome to Profetas Farm, ' . $firstName . '!');

        $redirect = $_SESSION['redirect_after_login'] ?? 'index.php';
        unset($_SESSION['redirect_after_login']);
        header('Location: ' . $redirect);
        exit;
    }
}
?>

<div class="container" style="max-width: 520px; padding-top: 40px; padding-bottom: 60px;">
    <div class="farm-card">
        <h2 class="section-title text-center">Create an Account</h2>
        <p class="section-subtitle text-center">Join Profetas Farm to order, track deliveries, and earn loyalty vouchers.</p>

        <?php if (!empty($errors)): ?>
            <div class="alert alert-danger">
                <ul class="mb-0">
                    <?php foreach ($errors as $error): ?>
                        <li><?php echo htmlspecialchars($error); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <form method="post" novalidate>
            <div class="row g-3 mb-3">
                <div class="col-md-6">
                    <label class="form-label">First Name</label>
                    <input type="text" name="first_name" class="form-control" value="<?php echo htmlspecialchars($_POST['first_name'] ?? ''); ?>" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Last Name</label>
                    <input type="text" name="last_name" class="form-control" value="<?php echo htmlspecialchars($_POST['last_name'] ?? ''); ?>" required>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Email Address</label>
                <input type="email" name="email" class="form-control" value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Contact Number</label>
                <input type="text" name="contact_number" class="form-control" placeholder="09xx xxx xxxx" value="<?php echo htmlspecialchars($_POST['contact_number'] ?? ''); ?>">
            </div>
            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <label class="form-label">Password</label>
                    <input type="password" name="password" class="form-control" minlength="8" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Confirm Password</label>
                    <input type="password" name="confirm_password" class="form-control" minlength="8" required>
                </div>
            </div>
            <button type="submit" class="btn btn-farm-primary w-100">Create Account</button>
        </form>

        <p class="text-center mt-3 mb-0 small">Already have an account? <a href="login.php">Log in</a></p>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
