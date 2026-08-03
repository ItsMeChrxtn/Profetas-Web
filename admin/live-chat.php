<?php
$pageTitle = 'Live Chat';
$pageSubtitle = 'Control the online/offline status shown on the customer site\'s chat widget.';
$activePage = 'live-chat';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/includes/functions.php';
include 'includes/header.php';

$formMessage = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['chat_status'])) {
    $status = $_POST['chat_status'] === 'online' ? 'online' : 'offline';
    $pdo->prepare('UPDATE site_settings SET setting_value = ? WHERE setting_key = "chat_status"')->execute([$status]);
    $formMessage = 'Chat status switched to ' . ucfirst($status) . '.';
}

$stmt = $pdo->prepare('SELECT setting_value FROM site_settings WHERE setting_key = "chat_status"');
$stmt->execute();
$chatStatus = $stmt->fetchColumn() ?: 'offline';
?>

<?php if ($formMessage): ?>
<script>document.addEventListener('DOMContentLoaded', () => adminAlert('success', <?php echo json_encode($formMessage); ?>));</script>
<?php endif; ?>

<div class="card" style="max-width: 500px;">
    <div class="card-header">
        <h3 class="card-title"><i class="fas fa-comment-dots"></i> Live Chat Status</h3>
    </div>
    <p style="color: var(--text-muted); font-size: 14px; margin-top: -10px;">
        This controls the status dot on the chat bubble customers see on every page of the customer site.
    </p>

    <div style="display:flex; align-items:center; gap: 15px; padding: 20px; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-top: 10px;">
        <span style="width: 16px; height: 16px; border-radius: 50%; background: <?php echo $chatStatus === 'online' ? '#22C55E' : '#9CA3AF'; ?>;"></span>
        <div style="flex:1;">
            <div style="font-weight: 700;">Currently: <?php echo $chatStatus === 'online' ? 'Online' : 'Offline'; ?></div>
            <div style="font-size: 12px; color: var(--text-muted);">
                <?php echo $chatStatus === 'online' ? 'Customers see the chat bubble as active.' : 'Customers see the chat bubble as offline.'; ?>
            </div>
        </div>
    </div>

    <form method="post" data-real style="margin-top: 20px;">
        <input type="hidden" name="chat_status" value="<?php echo $chatStatus === 'online' ? 'offline' : 'online'; ?>">
        <button type="submit" class="btn <?php echo $chatStatus === 'online' ? 'btn-outline' : 'btn-primary'; ?>" style="width:100%;">
            <i class="fas fa-power-off"></i> Switch to <?php echo $chatStatus === 'online' ? 'Offline' : 'Online'; ?>
        </button>
    </form>
</div>

<?php include 'includes/footer.php'; ?>
