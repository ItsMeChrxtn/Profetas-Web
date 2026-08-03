<?php
$pageTitle = 'Education Posts';
$pageSubtitle = 'Manage tutorials, tips, and recipes shown on the customer site.';
$activePage = 'education';
$headerActions = '<button class="btn btn-primary" onclick="showAddPostModal()"><i class="fas fa-plus"></i> Add Post</button>';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/includes/functions.php';
include 'includes/header.php';

$categories = ['Tutorial', 'Tip', 'Recipe'];
$formMessage = '';
$formError = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['form_action'] ?? '';

    if ($action === 'delete') {
        $pdo->prepare('DELETE FROM education_posts WHERE post_id = ?')->execute([(int)$_POST['post_id']]);
        $formMessage = 'Post deleted.';
    } elseif ($action === 'save') {
        $postId = (int)($_POST['post_id'] ?? 0);
        $title = trim($_POST['title'] ?? '');
        $category = in_array($_POST['category'] ?? '', $categories, true) ? $_POST['category'] : 'Tip';
        $content = trim($_POST['content'] ?? '');

        if ($title === '' || $content === '') {
            $formError = 'Title and content are required.';
        } else {
            $imagePath = null;
            if (!empty($_FILES['image']['name']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
                $mime = mime_content_type($_FILES['image']['tmp_name']);
                if (isset($allowed[$mime]) && $_FILES['image']['size'] <= 5 * 1024 * 1024) {
                    $filename = 'education_' . uniqid() . '.' . $allowed[$mime];
                    if (move_uploaded_file($_FILES['image']['tmp_name'], __DIR__ . '/../assets/img/education/' . $filename)) {
                        $imagePath = 'assets/img/education/' . $filename;
                    }
                }
            }

            if ($postId > 0) {
                $sql = 'UPDATE education_posts SET title=?, category=?, content=?';
                $params = [$title, $category, $content];
                if ($imagePath) { $sql .= ', image=?'; $params[] = $imagePath; }
                $sql .= ' WHERE post_id=?';
                $params[] = $postId;
                $pdo->prepare($sql)->execute($params);
            } else {
                $pdo->prepare('INSERT INTO education_posts (title, category, content, image) VALUES (?, ?, ?, ?)')
                    ->execute([$title, $category, $content, $imagePath]);
            }
            $formMessage = 'Post saved.';
        }
    }
}

$posts = $pdo->query('SELECT * FROM education_posts ORDER BY created_at DESC')->fetchAll();
?>

<?php if ($formMessage): ?>
<script>document.addEventListener('DOMContentLoaded', () => adminAlert('success', <?php echo json_encode($formMessage); ?>));</script>
<?php endif; ?>
<?php if ($formError): ?>
<script>document.addEventListener('DOMContentLoaded', () => adminAlert('error', <?php echo json_encode($formError); ?>));</script>
<?php endif; ?>

<div class="card">
    <div class="card-header">
        <h3 class="card-title"><i class="fas fa-book-open"></i> Education Posts</h3>
    </div>

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($posts as $post): ?>
                <tr>
                    <td><img src="../<?php echo htmlspecialchars($post['image'] ?: 'assets/img/education/placeholder.jpg'); ?>" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; border: 1px solid var(--border-color);" onerror="this.onerror=null;this.src='../assets/img/placeholder.svg'"></td>
                    <td style="font-weight: 700; color: var(--primary-green);"><?php echo htmlspecialchars($post['title']); ?></td>
                    <td><?php echo htmlspecialchars($post['category']); ?></td>
                    <td><?php echo date('M d, Y', strtotime($post['created_at'])); ?></td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-icon btn-outline" data-post="<?php echo htmlspecialchars(json_encode($post), ENT_QUOTES, 'UTF-8'); ?>" onclick="showEditPostModal(this)"><i class="far fa-edit"></i></button>
                            <form method="post" data-real onsubmit="return adminConfirm(this, 'Delete this post?', {confirmButtonText: 'Yes, delete it'});">
                                <input type="hidden" name="form_action" value="delete">
                                <input type="hidden" name="post_id" value="<?php echo $post['post_id']; ?>">
                                <button type="submit" class="btn btn-icon btn-outline text-danger"><i class="far fa-trash-alt"></i></button>
                            </form>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if (empty($posts)): ?>
                <tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 30px;">No posts yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<script>
const postCategories = <?php echo json_encode($categories); ?>;

function postFormHtml(p) {
    p = p || {};
    return `
        <form id="postForm" method="post" action="education.php" enctype="multipart/form-data" data-real>
            <input type="hidden" name="form_action" value="save">
            <input type="hidden" name="post_id" value="${p.post_id || ''}">
            <div class="form-group">
                <label>Title</label>
                <input type="text" name="title" class="form-control" required value="${p.title ? p.title.replace(/"/g, '&quot;') : ''}">
            </div>
            <div class="form-group">
                <label>Category</label>
                <select name="category" class="form-control">
                    ${postCategories.map(c => `<option value="${c}" ${c === p.category ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Content</label>
                <textarea name="content" class="form-control" rows="6" required>${p.content || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Image ${p.image ? '(leave blank to keep current photo)' : ''}</label>
                <input type="file" name="image" class="form-control" accept="image/png, image/jpeg, image/webp">
            </div>
        </form>
    `;
}

function showAddPostModal() {
    const footer = `
        <button class="btn btn-outline" onclick="document.getElementById('modalOverlay').style.display='none'">Cancel</button>
        <button class="btn btn-primary" onclick="document.getElementById('postForm').requestSubmit()">Save Post</button>
    `;
    showModal('Add Education Post', postFormHtml({}), footer);
}

function showEditPostModal(btn) {
    const p = JSON.parse(btn.dataset.post);
    const footer = `
        <button class="btn btn-outline" onclick="document.getElementById('modalOverlay').style.display='none'">Cancel</button>
        <button class="btn btn-primary" onclick="document.getElementById('postForm').requestSubmit()">Save Post</button>
    `;
    showModal('Edit Education Post', postFormHtml(p), footer);
}
</script>

<?php include 'includes/footer.php'; ?>
