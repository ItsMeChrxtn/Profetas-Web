<?php
$pageTitle = 'Farm Visits';
$pageSubtitle = 'Review and confirm scheduled farm visit requests.';
$activePage = 'farm-visits';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/includes/functions.php';
include 'includes/header.php';

$validStatuses = ['Pending', 'Confirmed', 'Cancelled'];
$formMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['visit_id'], $_POST['status'])) {
    $visitId = (int)$_POST['visit_id'];
    if (in_array($_POST['status'], $validStatuses, true)) {
        $pdo->prepare('UPDATE farm_visits SET status = ? WHERE visit_id = ?')->execute([$_POST['status'], $visitId]);
        $formMessage = 'Visit status updated to ' . $_POST['status'] . '.';
    }
}

$visits = $pdo->query('SELECT * FROM farm_visits ORDER BY visit_date ASC, visit_time ASC')->fetchAll();
?>

<?php if ($formMessage): ?>
<script>document.addEventListener('DOMContentLoaded', () => adminAlert('success', <?php echo json_encode($formMessage); ?>));</script>
<?php endif; ?>

<div class="card">
    <div class="card-header">
        <h3 class="card-title"><i class="fas fa-tractor"></i> Farm Visit Requests</h3>
    </div>

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Visit Date</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Visitors</th>
                    <th>Notes</th>
                    <th>Status</th>
                    <th>Update</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($visits as $visit): ?>
                <tr>
                    <td style="font-weight:600;"><?php echo date('M d, Y', strtotime($visit['visit_date'])); ?> <span style="color:var(--text-muted); font-weight:400;"><?php echo date('g:i A', strtotime($visit['visit_time'])); ?></span></td>
                    <td><?php echo htmlspecialchars($visit['name']); ?></td>
                    <td><?php echo htmlspecialchars($visit['contact_number']); ?></td>
                    <td><?php echo (int)$visit['number_of_visitors']; ?></td>
                    <td style="max-width:200px; font-size:12px; color:var(--text-muted);"><?php echo htmlspecialchars($visit['notes'] ?: '—'); ?></td>
                    <td><span class="status-pill <?php echo $visit['status'] === 'Confirmed' ? 'status-completed' : ($visit['status'] === 'Cancelled' ? 'status-pending' : 'status-processing'); ?>"><?php echo $visit['status']; ?></span></td>
                    <td>
                        <form method="post" data-real style="display:flex; gap:5px;">
                            <input type="hidden" name="visit_id" value="<?php echo $visit['visit_id']; ?>">
                            <select name="status" class="form-control" style="width:130px; font-size:12px;" onchange="this.form.requestSubmit()">
                                <?php foreach ($validStatuses as $s): ?>
                                    <option value="<?php echo $s; ?>" <?php echo $visit['status'] === $s ? 'selected' : ''; ?>><?php echo $s; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if (empty($visits)): ?>
                <tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding: 30px;">No farm visit requests yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
