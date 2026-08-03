<?php
$pageTitle = 'Login';
require_once __DIR__ . '/includes/header.php';

if (is_logged_in()) {
    header('Location: index.php');
    exit;
}

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    $stmt = $pdo->prepare('SELECT customer_id, first_name, password_hash, role FROM customers WHERE email = ?');
    $stmt->execute([$email]);
    $customer = $stmt->fetch();

    if ($customer && password_verify($password, $customer['password_hash'])) {
        $_SESSION['user_id'] = (int)$customer['customer_id'];
        $_SESSION['user_name'] = $customer['first_name'];
        $_SESSION['user_role'] = $customer['role'];

        if ($customer['role'] === 'admin') {
            header('Location: admin/dashboard.php');
            exit;
        }

        $redirect = $_SESSION['redirect_after_login'] ?? 'index.php';
        unset($_SESSION['redirect_after_login']);
        header('Location: ' . $redirect);
        exit;
    }

    $errors[] = 'Incorrect email or password.';
}
?>

<div class="container" style="max-width: 460px; padding-top: 60px; padding-bottom: 80px;">
    <div class="farm-card">
        <h2 class="section-title text-center">Welcome Back</h2>
        <p class="section-subtitle text-center">Log in to your Profetas Farm account.</p>

        <?php if (!empty($errors)): ?>
            <div class="alert alert-danger">
                <?php foreach ($errors as $error): ?>
                    <div><?php echo htmlspecialchars($error); ?></div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <form method="post" novalidate>
            <div class="mb-3">
                <label class="form-label">Email Address</label>
                <input type="email" name="email" class="form-control" value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>" required autofocus>
            </div>
            <div class="mb-4">
                <label class="form-label">Password</label>
                <input type="password" name="password" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-farm-primary w-100">Log In</button>
        </form>

        <p class="text-center mt-3 mb-0 small">Don't have an account? <a href="register.php">Sign up</a></p>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
