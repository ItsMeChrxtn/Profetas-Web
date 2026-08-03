<?php 
$pageTitle = 'Settings';
$pageSubtitle = 'Configure your farm profile, notification preferences, and system security.';
$activePage = 'settings';
include 'includes/header.php'; 
?>

<div class="dashboard-row" style="display: grid; grid-template-columns: 280px 1fr; gap: 30px;">
    <div class="card" style="padding: 15px;">
        <div style="display: flex; flex-direction: column; gap: 5px;">
            <a href="#profile" class="btn btn-primary" style="justify-content: flex-start; background: var(--primary-green);"><i class="far fa-user"></i> Profile Settings</a>
            <a href="#notifications" class="btn btn-outline" style="justify-content: flex-start; border: none;"><i class="far fa-bell"></i> Notifications</a>
            <a href="#security" class="btn btn-outline" style="justify-content: flex-start; border: none;"><i class="fas fa-shield-alt"></i> Security</a>
            <a href="#billing" class="btn btn-outline" style="justify-content: flex-start; border: none;"><i class="fas fa-receipt"></i> Billing & Plans</a>
            <hr style="border: none; border-top: 1px solid var(--border-color); margin: 10px 0;">
            <a href="#team" class="btn btn-outline" style="justify-content: flex-start; border: none;"><i class="fas fa-users"></i> Team Management</a>
        </div>
    </div>
    
    <div class="settings-content">
        <div class="card" id="profile">
            <div class="card-header">
                <h3 class="card-title">Profile Settings</h3>
            </div>
            <form>
                <div style="display: flex; align-items: center; gap: 25px; margin-bottom: 30px;">
                    <div style="position: relative;">
                        <img src="https://ui-avatars.com/api/?name=Admin&background=1B3C26&color=fff&size=100" style="width: 100px; height: 100px; border-radius: 50%;">
                        <button type="button" style="position: absolute; bottom: 0; right: 0; width: 32px; height: 32px; border-radius: 50%; background: var(--primary-green); color: white; border: 2px solid white; cursor: pointer;"><i class="fas fa-camera" style="font-size: 12px;"></i></button>
                    </div>
                    <div>
                        <h4 style="font-size: 18px; font-weight: 700;">Farm Administrator</h4>
                        <p style="font-size: 14px; color: var(--text-muted);">Update your photo and personal details.</p>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="form-group">
                        <label>First Name</label>
                        <input type="text" class="form-control" value="Admin" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" class="form-control" value="User" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" class="form-control" value="admin@profetasfarm.com" required>
                </div>
                
                <div class="form-group">
                    <label>Bio / Description</label>
                    <textarea class="form-control" rows="4" placeholder="Tell us about yourself..."></textarea>
                </div>
                
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <button type="button" class="btn btn-outline">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
        
        <div class="card" id="security" style="margin-top: 30px;">
            <div class="card-header">
                <h3 class="card-title">Security</h3>
            </div>
            <form>
                <div class="form-group">
                    <label>Current Password</label>
                    <input type="password" class="form-control" required>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="form-group">
                        <label>New Password</label>
                        <input type="password" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Confirm New Password</label>
                        <input type="password" class="form-control" required>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="btn btn-primary">Update Password</button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php include 'includes/footer.php'; ?>
