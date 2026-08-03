<?php
$pageTitle = 'Learn';
$activeNav = 'education';
require_once __DIR__ . '/includes/header.php';

$validCategories = ['Tutorial', 'Tip', 'Recipe'];
$category = $_GET['category'] ?? '';

$where = '';
$params = [];
if (in_array($category, $validCategories, true)) {
    $where = 'WHERE category = ?';
    $params[] = $category;
}

$stmt = $pdo->prepare("SELECT * FROM education_posts $where ORDER BY created_at DESC");
$stmt->execute($params);
$posts = $stmt->fetchAll();
?>

<div class="container" style="padding-top: 30px; padding-bottom: 60px;">
    <h2 class="section-title">Learn With Profetas Farm</h2>
    <p class="section-subtitle">Tutorials, tips, and recipes from our farm to your kitchen and garden.</p>

    <div class="d-flex flex-wrap gap-2 mb-4">
        <a href="education.php" class="category-pill <?php echo $category === '' ? 'active' : ''; ?>">All</a>
        <?php foreach ($validCategories as $cat): ?>
            <a href="education.php?category=<?php echo urlencode($cat); ?>" class="category-pill <?php echo $category === $cat ? 'active' : ''; ?>"><?php echo $cat; ?>s</a>
        <?php endforeach; ?>
    </div>

    <?php if (empty($posts)): ?>
        <div class="farm-card text-center py-5">
            <i class="fas fa-book-open fa-2x mb-3" style="color: var(--text-muted);"></i>
            <p class="mb-0">No posts yet. Check back soon!</p>
        </div>
    <?php else: ?>
        <div class="row g-4">
            <?php foreach ($posts as $post): ?>
            <div class="col-md-4">
                <div class="product-card h-100">
                    <a href="education-post.php?id=<?php echo (int)$post['post_id']; ?>" class="text-decoration-none text-reset">
                        <div class="product-img-wrap">
                            <img src="<?php echo htmlspecialchars($post['image'] ?: 'assets/img/education/placeholder.jpg'); ?>" alt="<?php echo htmlspecialchars($post['title']); ?>" onerror="this.onerror=null;this.src='assets/img/placeholder.svg'">
                        </div>
                        <div class="product-body">
                            <div class="product-cat"><?php echo htmlspecialchars($post['category']); ?></div>
                            <div class="product-name"><?php echo htmlspecialchars($post['title']); ?></div>
                            <p class="small text-muted mb-0"><?php echo htmlspecialchars(mb_strimwidth(strip_tags($post['content']), 0, 90, '...')); ?></p>
                        </div>
                    </a>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
