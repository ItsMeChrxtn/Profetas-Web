</main>

<footer class="site-footer">
    <div class="container">
        <div class="row g-4">
            <div class="col-lg-4">
                <h5><i class="fas fa-leaf me-2"></i>Profetas Integrated Farm</h5>
                <p class="small mb-1">Tres Cruces, Tanza, Cavite</p>
                <p class="small">Premium Quality, Naturally Grown mushrooms, mokusaku, mangoes, and farm inputs from our cooperative to your table.</p>
            </div>
            <div class="col-lg-2 col-md-4">
                <h5>Shop</h5>
                <p><a href="shop.php?category=Fresh">Fresh Produce</a></p>
                <p><a href="shop.php?category=Value-Added">Value-Added</a></p>
                <p><a href="shop.php?category=Farm+Inputs">Farm Inputs</a></p>
                <p><a href="wholesale.php">Wholesale Inquiry</a></p>
            </div>
            <div class="col-lg-2 col-md-4">
                <h5>Company</h5>
                <p><a href="education.php">Learn</a></p>
                <p><a href="farm-visit.php">Visit the Farm</a></p>
                <p><a href="track-order.php">Track Order</a></p>
            </div>
            <div class="col-lg-4 col-md-4">
                <h5>Connect With Us</h5>
                <p><a href="<?php echo htmlspecialchars($facebookUrl); ?>" target="_blank" rel="noopener"><i class="fab fa-facebook me-2"></i>Facebook Page</a></p>
                <p><a href="<?php echo htmlspecialchars($shopeeUrl); ?>" target="_blank" rel="noopener"><i class="fas fa-shopping-bag me-2"></i>Shopee Store</a></p>
            </div>
        </div>
        <div class="footer-bottom">
            &copy; <?php echo date('Y'); ?> Profetas Integrated Farm &mdash; Undergraduate Capstone Project
        </div>
    </div>
</footer>

<!-- Live Chat Widget -->
<button class="chat-widget-btn" onclick="toggleChatPanel()" title="Chat with us">
    <i class="fas fa-comment-dots"></i>
    <span class="chat-status-dot <?php echo $chatStatus === 'online' ? 'online' : 'offline'; ?>"></span>
</button>
<div class="chat-panel" id="chatPanel">
    <div class="chat-panel-header">
        <span><i class="fas fa-comment-dots me-2"></i>Farm Support</span>
        <button class="btn btn-sm text-white" onclick="toggleChatPanel()"><i class="fas fa-times"></i></button>
    </div>
    <div class="chat-panel-body">
        <?php if ($chatStatus === 'online'): ?>
            <p class="mb-2"><span class="stock-badge stock-in"><i class="fas fa-circle" style="font-size:8px;"></i> Online</span></p>
            <p>Our team is online right now. Message us on our Facebook Page and we'll respond right away!</p>
            <a href="<?php echo htmlspecialchars($facebookUrl); ?>" target="_blank" rel="noopener" class="btn btn-farm-primary btn-sm w-100 mt-2">Chat on Facebook</a>
        <?php else: ?>
            <p class="mb-2"><span class="stock-badge stock-out"><i class="fas fa-circle" style="font-size:8px;"></i> Offline</span></p>
            <p>We're offline right now. Leave us a message on our Facebook Page and we'll get back to you as soon as we're online.</p>
            <a href="<?php echo htmlspecialchars($facebookUrl); ?>" target="_blank" rel="noopener" class="btn btn-farm-outline btn-sm w-100 mt-2">Message us on Facebook</a>
        <?php endif; ?>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="assets/js/script.js"></script>
<?php if (!empty($_SESSION['flash'])): $flash = $_SESSION['flash']; unset($_SESSION['flash']); ?>
<script>
document.addEventListener('DOMContentLoaded', () => {
    Swal.fire({
        icon: <?php echo json_encode($flash['type']); ?>,
        title: <?php echo json_encode($flash['message']); ?>,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true,
    });
});
</script>
<?php endif; ?>
</body>
</html>
