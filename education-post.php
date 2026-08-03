<?php
$pageTitle = 'Learn';
$activeNav = 'education';
require_once __DIR__ . '/includes/header.php';

$postId = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare('SELECT * FROM education_posts WHERE post_id = ?');
$stmt->execute([$postId]);
$post = $stmt->fetch();

if (!$post) {
    http_response_code(404);
    echo '<div class="container py-5 text-center"><h3>Post not found.</h3><a href="education.php" class="btn btn-farm-primary mt-3">Back to Learn</a></div>';
    require_once __DIR__ . '/includes/footer.php';
    exit;
}

$pageTitle = $post['title'];
?>

<div class="container" style="max-width: 780px; padding-top: 30px; padding-bottom: 60px;">
    <nav class="small mb-3"><a href="education.php">Learn</a> / <?php echo htmlspecialchars($post['category']); ?></nav>

    <div class="product-cat mb-2"><?php echo htmlspecialchars($post['category']); ?></div>
    <h1 class="mb-2" style="font-weight:800;"><?php echo htmlspecialchars($post['title']); ?></h1>
    <p class="text-muted small mb-4"><?php echo date('F d, Y', strtotime($post['created_at'])); ?></p>

    <?php if ($post['image']): ?>
        <img src="<?php echo htmlspecialchars($post['image']); ?>" alt="" class="w-100 mb-4" style="border-radius: var(--radius-md); max-height: 400px; object-fit: cover;" onerror="this.style.display='none'">
    <?php endif; ?>

    <div style="line-height: 1.8; white-space: pre-line;"><?php echo nl2br(htmlspecialchars($post['content'])); ?></div>

    <a href="education.php" class="btn btn-farm-outline mt-4"><i class="fas fa-arrow-left me-2"></i>Back to Learn</a>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
