<?php
$pageTitle = 'Wholesale Inquiries';
$pageSubtitle = 'Review bulk/reseller inquiries from the customer site and send quotations.';
$activePage = 'wholesale-inquiries';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/includes/functions.php';
include 'includes/header.php';

$validStatuses = ['New', 'Quoted', 'Closed'];
$formMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['inquiry_id'])) {
    $inquiryId = (int)$_POST['inquiry_id'];
    $status = in_array($_POST['status'] ?? '', $validStatuses, true) ? $_POST['status'] : 'New';
    $adminResponse = trim($_POST['admin_response'] ?? '');

    $pdo->prepare('UPDATE wholesale_inquiries SET status = ?, admin_response = ? WHERE inquiry_id = ?')
        ->execute([$status, $adminResponse ?: null, $inquiryId]);
    $formMessage = 'Inquiry response saved.';
}

$inquiries = $pdo->query('SELECT * FROM wholesale_inquiries ORDER BY created_at DESC')->fetchAll();
?>

<?php if ($formMessage): ?>
<script>document.addEventListener('DOMContentLoaded', () => adminAlert('success', <?php echo json_encode($formMessage); ?>));</script>
<?php endif; ?>

<div class="card">
    <div class="card-header">
        <h3 class="card-title"><i class="fas fa-truck-loading"></i> Wholesale Inquiries</h3>
        <span class="status-pill status-pending"><?php echo count(array_filter($inquiries, fn($i) => $i['status'] === 'New')); ?> new</span>
    </div>

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Location</th>
                    <th>Requested Items</th>
                    <th>Est. Budget</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($inquiries as $inquiry): ?>
                <tr>
                    <td style="font-size:12px;"><?php echo date('M d, Y', strtotime($inquiry['created_at'])); ?></td>
                    <td style="font-weight:600;"><?php echo htmlspecialchars($inquiry['name']); ?></td>
                    <td><?php echo htmlspecialchars($inquiry['contact_number']); ?></td>
                    <td><?php echo htmlspecialchars($inquiry['location']); ?></td>
                    <td style="max-width:220px; font-size:12px; color:var(--text-muted);"><?php echo htmlspecialchars(mb_strimwidth($inquiry['requested_items'], 0, 80, '...')); ?></td>
                    <td><?php echo $inquiry['estimated_budget'] ? admin_peso($inquiry['estimated_budget']) : '—'; ?></td>
                    <td><span class="status-pill <?php echo $inquiry['status'] === 'New' ? 'status-pending' : ($inquiry['status'] === 'Quoted' ? 'status-processing' : 'status-completed'); ?>"><?php echo $inquiry['status']; ?></span></td>
                    <td>
                        <button class="btn btn-icon btn-outline" data-inquiry="<?php echo htmlspecialchars(json_encode($inquiry), ENT_QUOTES, 'UTF-8'); ?>" onclick="showRespondModal(this)"><i class="far fa-eye"></i></button>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if (empty($inquiries)): ?>
                <tr><td colspan="8" style="text-align:center; color: var(--text-muted); padding: 30px;">No wholesale inquiries yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<script>
function showRespondModal(btn) {
    const inq = JSON.parse(btn.dataset.inquiry);
    const body = `
        <form id="inquiryForm" method="post" data-real>
            <input type="hidden" name="inquiry_id" value="${inq.inquiry_id}">
            <div class="form-group">
                <label>Requested Items</label>
                <textarea class="form-control" rows="3" disabled>${inq.requested_items}</textarea>
            </div>
            <div class="form-group">
                <label>Contact</label>
                <input type="text" class="form-control" disabled value="${inq.name} - ${inq.contact_number} - ${inq.location}">
            </div>
            <div class="form-group">
                <label>Status</label>
                <select name="status" class="form-control">
                    <option value="New" ${inq.status === 'New' ? 'selected' : ''}>New</option>
                    <option value="Quoted" ${inq.status === 'Quoted' ? 'selected' : ''}>Quoted</option>
                    <option value="Closed" ${inq.status === 'Closed' ? 'selected' : ''}>Closed</option>
                </select>
            </div>
            <div class="form-group">
                <label>Quotation / Response Notes</label>
                <textarea name="admin_response" class="form-control" rows="4" placeholder="e.g. Quoted 5 sacks Oyster Mushroom @ P100/kg wholesale rate...">${inq.admin_response || ''}</textarea>
            </div>
        </form>
    `;
    const footer = `
        <button class="btn btn-outline" onclick="document.getElementById('modalOverlay').style.display='none'">Cancel</button>
        <button class="btn btn-primary" onclick="document.getElementById('inquiryForm').requestSubmit()">Save Response</button>
    `;
    showModal('Wholesale Inquiry - ' + inq.name, body, footer);
}
</script>

<?php include 'includes/footer.php'; ?>
