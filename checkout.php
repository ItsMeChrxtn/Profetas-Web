<?php
$pageTitle = 'Checkout';
require_once __DIR__ . '/includes/header.php';
require_login();

$customerId = current_customer_id();

// ---- Load & validate cart (server-side truth, never trust client totals) ----
$cart = $_SESSION['cart'] ?? [];
if (empty($cart)) {
    header('Location: cart.php');
    exit;
}

$ids = array_map('intval', array_keys($cart));
$placeholders = implode(',', array_fill(0, count($ids), '?'));
$stmt = $pdo->prepare(
    "SELECT p.product_id, p.name, p.price, p.unit,
            COALESCE(i.stock_qty, 0) AS stock_qty
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.product_id
     WHERE p.product_id IN ($placeholders) AND p.status = 'Active'"
);
$stmt->execute($ids);

$items = [];
$subtotal = 0;
foreach ($stmt->fetchAll() as $row) {
    $qty = min((int)$cart[$row['product_id']], (int)$row['stock_qty']);
    if ($qty <= 0) continue;
    $lineTotal = $qty * $row['price'];
    $subtotal += $lineTotal;
    $items[] = $row + ['quantity' => $qty, 'line_total' => $lineTotal];
}

if (empty($items)) {
    header('Location: cart.php');
    exit;
}

$deliveryFees = ['Lalamove' => 150.00, 'Self-Pickup' => 0.00];
$gcashNumber = get_setting($pdo, 'gcash_number', '');
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $deliveryMethod = $_POST['delivery_method'] ?? '';
    $referenceNumber = trim($_POST['reference_number'] ?? '');
    $deliveryAddress = trim($_POST['delivery_address'] ?? '');
    $deliveryLandmark = trim($_POST['delivery_landmark'] ?? '');
    $deliveryLat = $_POST['delivery_lat'] ?? '';
    $deliveryLng = $_POST['delivery_lng'] ?? '';
    $pickupDate = $_POST['pickup_date'] ?? '';
    $pickupTime = $_POST['pickup_time'] ?? '';

    if (!array_key_exists($deliveryMethod, $deliveryFees)) {
        $errors[] = 'Please select a valid delivery method.';
    }

    $isPickup = $deliveryMethod === 'Self-Pickup';
    $needsAddress = !$isPickup;
    if ($isPickup) {
        if ($pickupDate === '' || $pickupTime === '') {
            $errors[] = 'Please choose a pickup date and time.';
        } elseif ($pickupDate < date('Y-m-d')) {
            $errors[] = 'Pickup date cannot be in the past.';
        }
    } else {
        if ($deliveryAddress === '' || $deliveryLat === '' || $deliveryLng === '') {
            $errors[] = 'Please provide a delivery address and pin your location on the map.';
        }
    }

    // Receipt upload (optional, but at least one of reference # / receipt is required)
    $receiptPath = null;
    if (!empty($_FILES['receipt_image']['name'])) {
        $file = $_FILES['receipt_image'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors[] = 'Receipt upload failed. Please try again.';
        } else {
            $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
            $mime = mime_content_type($file['tmp_name']);
            if (!isset($allowed[$mime])) {
                $errors[] = 'Receipt must be a JPG, PNG, or WEBP image.';
            } elseif ($file['size'] > 5 * 1024 * 1024) {
                $errors[] = 'Receipt image must be under 5MB.';
            } else {
                $filename = 'receipt_' . uniqid() . '.' . $allowed[$mime];
                $destination = __DIR__ . '/uploads/receipts/' . $filename;
                if (move_uploaded_file($file['tmp_name'], $destination)) {
                    $receiptPath = 'uploads/receipts/' . $filename;
                } else {
                    $errors[] = 'Could not save the uploaded receipt.';
                }
            }
        }
    }

    if ($referenceNumber === '' && $receiptPath === null) {
        $errors[] = 'Please provide your GCash reference number and/or upload a receipt image.';
    }

    if (empty($errors)) {
        try {
            $pdo->beginTransaction();

            // Re-check stock under a row lock to avoid overselling under concurrent checkouts
            foreach ($items as $item) {
                $lockStmt = $pdo->prepare('SELECT stock_qty FROM inventory WHERE product_id = ? FOR UPDATE');
                $lockStmt->execute([$item['product_id']]);
                $liveStock = (int)$lockStmt->fetchColumn();
                if ($liveStock < $item['quantity']) {
                    throw new RuntimeException($item['name'] . ' no longer has enough stock.');
                }
            }

            $deliveryFee = $deliveryFees[$deliveryMethod];
            $total = $subtotal + $deliveryFee;

            $orderStmt = $pdo->prepare(
                'INSERT INTO orders (customer_id, subtotal, delivery_fee, total_amount, status, delivery_method,
                                     delivery_address, delivery_landmark, delivery_lat, delivery_lng,
                                     pickup_date, pickup_time, payment_status)
                 VALUES (?, ?, ?, ?, "Pending", ?, ?, ?, ?, ?, ?, ?, "Pending Verification")'
            );
            $orderStmt->execute([
                $customerId, $subtotal, $deliveryFee, $total, $deliveryMethod,
                $needsAddress ? $deliveryAddress : null,
                $needsAddress ? $deliveryLandmark : null,
                $needsAddress ? $deliveryLat : null,
                $needsAddress ? $deliveryLng : null,
                $isPickup ? $pickupDate : null,
                $isPickup ? $pickupTime : null,
            ]);
            $orderId = (int)$pdo->lastInsertId();

            $itemStmt = $pdo->prepare(
                'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $stockStmt = $pdo->prepare('UPDATE inventory SET stock_qty = stock_qty - ? WHERE product_id = ?');

            foreach ($items as $item) {
                $itemStmt->execute([$orderId, $item['product_id'], $item['name'], $item['price'], $item['quantity'], $item['line_total']]);
                $stockStmt->execute([$item['quantity'], $item['product_id']]);
            }

            $paymentStmt = $pdo->prepare(
                'INSERT INTO payments (order_id, method, reference_number, receipt_image, amount, status)
                 VALUES (?, "GCash", ?, ?, ?, "Pending")'
            );
            $paymentStmt->execute([$orderId, $referenceNumber ?: null, $receiptPath, $total]);

            $pdo->commit();
            cart_clear();
            flash('success', 'Order placed! We will verify your GCash payment shortly.');

            header('Location: track-order.php?order_id=' . $orderId);
            exit;
        } catch (Throwable $e) {
            $pdo->rollBack();
            $errors[] = $e->getMessage() ?: 'Something went wrong placing your order. Please try again.';
        }
    }
}
?>

<div class="container" style="padding-top: 30px; padding-bottom: 60px;">
    <h2 class="section-title">Checkout</h2>

    <?php if (!empty($errors)): ?>
        <div class="alert alert-danger">
            <ul class="mb-0">
                <?php foreach ($errors as $error): ?><li><?php echo htmlspecialchars($error); ?></li><?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>

    <form method="post" enctype="multipart/form-data" id="checkoutForm">
        <div class="row g-4">
            <div class="col-lg-8">

                <!-- Delivery Method -->
                <div class="farm-card mb-4">
                    <h5 class="fw-bold mb-3"><i class="fas fa-truck me-2"></i>Delivery Method</h5>
                    <div class="row g-3">
                        <?php foreach ($deliveryFees as $method => $fee): ?>
                        <div class="col-md-6">
                            <label class="border rounded-3 p-3 d-flex align-items-center gap-2 w-100" style="cursor:pointer; border-color: var(--border-color) !important;">
                                <input type="radio" name="delivery_method" value="<?php echo htmlspecialchars($method); ?>" class="form-check-input mt-0 delivery-method-radio" required <?php echo (($_POST['delivery_method'] ?? '') === $method) ? 'checked' : ''; ?>>
                                <span class="flex-grow-1">
                                    <span class="d-block fw-bold"><?php echo htmlspecialchars($method); ?></span>
                                    <span class="small text-muted"><?php echo $fee > 0 ? peso($fee) . ' fee' : 'No extra fee'; ?></span>
                                </span>
                            </label>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <!-- Pickup schedule (shown only for Self-Pickup) -->
                <div class="farm-card mb-4" id="pickupSection" style="display:none;">
                    <h5 class="fw-bold mb-3"><i class="fas fa-store me-2"></i>Pickup Schedule</h5>
                    <p class="small text-muted">Pick-up at Profetas Integrated Farm, Tres Cruces, Tanza, Cavite.</p>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Pickup Date</label>
                            <input type="date" name="pickup_date" class="form-control" min="<?php echo date('Y-m-d'); ?>" value="<?php echo htmlspecialchars($_POST['pickup_date'] ?? ''); ?>">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Pickup Time</label>
                            <input type="time" name="pickup_time" class="form-control" value="<?php echo htmlspecialchars($_POST['pickup_time'] ?? ''); ?>">
                        </div>
                    </div>
                </div>

                <!-- Delivery address + map (hidden for Self-Pickup) -->
                <div class="farm-card mb-4" id="addressSection" style="display:none;">
                    <h5 class="fw-bold mb-3"><i class="fas fa-map-marker-alt me-2"></i>Delivery Address</h5>
                    <div class="mb-3">
                        <label class="form-label">Full Address</label>
                        <textarea name="delivery_address" id="deliveryAddressInput" class="form-control" rows="2" placeholder="House/Unit No., Street, Barangay, City/Municipality"><?php echo htmlspecialchars($_POST['delivery_address'] ?? ''); ?></textarea>
                        <button type="button" class="btn btn-farm-outline btn-sm mt-2" id="findOnMapBtn"><i class="fas fa-search-location me-1"></i> Find on Map</button>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Landmark (optional)</label>
                        <input type="text" name="delivery_landmark" class="form-control" value="<?php echo htmlspecialchars($_POST['delivery_landmark'] ?? ''); ?>">
                    </div>
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                        <label class="form-label mb-0">Pin Your Exact Location <span class="text-muted fw-normal">(search your address, use your current location, or click the map)</span></label>
                        <button type="button" class="btn btn-farm-outline btn-sm" id="useMyLocationBtn"><i class="fas fa-location-arrow me-1"></i> Use My Current Location</button>
                    </div>
                    <div id="deliveryMap" class="leaflet-pin-map mb-2"></div>
                    <input type="hidden" name="delivery_lat" id="deliveryLat" value="<?php echo htmlspecialchars($_POST['delivery_lat'] ?? ''); ?>">
                    <input type="hidden" name="delivery_lng" id="deliveryLng" value="<?php echo htmlspecialchars($_POST['delivery_lng'] ?? ''); ?>">
                    <div class="small text-muted" id="pinStatus">No location pinned yet.</div>
                </div>

                <!-- GCash Payment -->
                <div class="farm-card">
                    <h5 class="fw-bold mb-3"><i class="fas fa-wallet me-2"></i>GCash Payment</h5>
                    <p class="small text-muted">Send payment to <strong><?php echo htmlspecialchars($gcashNumber); ?></strong>, then provide your reference number and/or upload your receipt below. Our team will verify it manually.</p>
                    <div class="mb-3">
                        <label class="form-label">GCash Reference Number</label>
                        <input type="text" name="reference_number" id="referenceNumberInput" class="form-control" placeholder="e.g. 1234567890123" value="<?php echo htmlspecialchars($_POST['reference_number'] ?? ''); ?>">
                    </div>
                    <div class="mb-2">
                        <label class="form-label">Upload Receipt Screenshot <span class="text-muted fw-normal">(we'll try to read the reference number for you)</span></label>
                        <input type="file" name="receipt_image" id="receiptImageInput" class="form-control" accept="image/png, image/jpeg, image/webp">
                        <div class="small text-muted mt-1" id="receiptScanStatus"></div>
                    </div>
                </div>
            </div>

            <div class="col-lg-4">
                <div class="farm-card">
                    <h5 class="fw-bold mb-3">Order Summary</h5>
                    <?php foreach ($items as $item): ?>
                        <div class="d-flex justify-content-between small mb-2">
                            <span><?php echo htmlspecialchars($item['name']); ?> &times; <?php echo (int)$item['quantity']; ?></span>
                            <span><?php echo peso($item['line_total']); ?></span>
                        </div>
                    <?php endforeach; ?>
                    <hr>
                    <div class="d-flex justify-content-between mb-1">
                        <span class="text-muted">Subtotal</span>
                        <span><?php echo peso($subtotal); ?></span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">Delivery Fee</span>
                        <span id="deliveryFeeDisplay">₱0.00</span>
                    </div>
                    <hr>
                    <div class="d-flex justify-content-between mb-3 fs-5">
                        <span class="fw-bold">Total</span>
                        <span class="fw-bold" style="color: var(--primary-green);" id="totalDisplay"><?php echo peso($subtotal); ?></span>
                    </div>
                    <button type="submit" class="btn btn-farm-primary w-100">Place Order</button>
                </div>
            </div>
        </div>
    </form>
</div>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
<script>
const deliveryFees = <?php echo json_encode($deliveryFees); ?>;
const subtotal = <?php echo (float)$subtotal; ?>;
const pesoFormat = n => '₱' + n.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});

// Declared here (before updateSections is defined/called below) so reading
// `map` inside updateSections doesn't hit the temporal dead zone.
let map = null;
let marker = null;
const farmLat = 14.3585, farmLng = 120.8155;

function updateSections() {
    const selected = document.querySelector('.delivery-method-radio:checked');
    const method = selected ? selected.value : null;
    const isPickup = method === 'Self-Pickup';

    document.getElementById('pickupSection').style.display = isPickup ? 'block' : 'none';
    document.getElementById('addressSection').style.display = (method && !isPickup) ? 'block' : 'none';

    const fee = method ? (deliveryFees[method] || 0) : 0;
    document.getElementById('deliveryFeeDisplay').textContent = pesoFormat(fee);
    document.getElementById('totalDisplay').textContent = pesoFormat(subtotal + fee);

    if (map && !isPickup) { setTimeout(() => map.invalidateSize(), 200); }
}

document.querySelectorAll('.delivery-method-radio').forEach(r => r.addEventListener('change', updateSections));
updateSections();

// Leaflet map centered on Tres Cruces, Tanza, Cavite
function initMap() {
    if (map) return;
    map = L.map('deliveryMap').setView([farmLat, farmLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', function (e) {
        placeMarker(e.latlng.lat, e.latlng.lng);
    });
}

function placeMarker(lat, lng) {
    if (marker) {
        marker.setLatLng([lat, lng]);
    } else {
        marker = L.marker([lat, lng], {draggable: true}).addTo(map);
        marker.on('dragend', function () {
            const pos = marker.getLatLng();
            setPin(pos.lat, pos.lng);
        });
    }
    setPin(lat, lng);
}

function setPin(lat, lng) {
    document.getElementById('deliveryLat').value = lat.toFixed(7);
    document.getElementById('deliveryLng').value = lng.toFixed(7);
    document.getElementById('pinStatus').textContent = 'Pinned: ' + lat.toFixed(5) + ', ' + lng.toFixed(5);
}

window.addEventListener('load', () => {
    initMap();
    <?php if (!empty($_POST['delivery_lat']) && !empty($_POST['delivery_lng'])): ?>
        placeMarker(<?php echo (float)($_POST['delivery_lat']); ?>, <?php echo (float)($_POST['delivery_lng']); ?>);
        map.setView([<?php echo (float)($_POST['delivery_lat']); ?>, <?php echo (float)($_POST['delivery_lng']); ?>], 15);
    <?php endif; ?>
});

// Geocode the typed address via OpenStreetMap Nominatim, then drop the pin
// there automatically — an alternative to manually clicking the map.
document.getElementById('findOnMapBtn').addEventListener('click', () => {
    const btn = document.getElementById('findOnMapBtn');
    const address = document.getElementById('deliveryAddressInput').value.trim();
    if (!address) {
        alert('Please type your address first.');
        return;
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Searching...';

    const query = encodeURIComponent(address + ', Philippines');
    fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=ph&limit=1&q=${query}`)
        .then(res => res.json())
        .then(results => {
            if (!results.length) {
                alert('Could not find that address automatically. Please pin your location on the map instead.');
                return;
            }
            const lat = parseFloat(results[0].lat);
            const lng = parseFloat(results[0].lon);
            if (!map) initMap();
            map.setView([lat, lng], 16);
            placeMarker(lat, lng);
        })
        .catch(() => alert('Could not search that address right now. Please pin your location on the map instead.'))
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        });
});

// Browser Geolocation API - prompts the user for location permission, then
// pins the map at their actual current position.
document.getElementById('useMyLocationBtn').addEventListener('click', () => {
    const btn = document.getElementById('useMyLocationBtn');

    if (!navigator.geolocation) {
        alert('Your browser does not support location detection. Please pin your location on the map instead.');
        return;
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Locating...';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            if (!map) initMap();
            map.setView([lat, lng], 16);
            placeMarker(lat, lng);

            // Best-effort: fill in the address field too, from the coordinates.
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.display_name) {
                        document.getElementById('deliveryAddressInput').value = data.display_name;
                    }
                })
                .catch(() => {})
                .finally(() => {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                });
        },
        (error) => {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            const message = error.code === error.PERMISSION_DENIED
                ? 'Location access was denied. Please allow location access, or pin your location on the map instead.'
                : 'Could not get your location. Please pin it on the map instead.';
            alert(message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
});

// OCR the uploaded receipt screenshot (client-side, via Tesseract.js) and
// auto-fill the reference number if we can find one in the image text.
function extractReferenceNumber(text) {
    const labelMatch = text.match(/reference\s*(no\.?|number)?\s*[:\-]?\s*(\d{6,})/i);
    if (labelMatch) return labelMatch[2];
    const digitSequences = text.match(/\d{6,}/g);
    if (digitSequences && digitSequences.length) {
        return digitSequences.reduce((longest, current) => current.length >= longest.length ? current : longest);
    }
    return null;
}

document.getElementById('receiptImageInput').addEventListener('change', function () {
    const file = this.files[0];
    const status = document.getElementById('receiptScanStatus');
    if (!file || typeof Tesseract === 'undefined') return;

    status.textContent = 'Scanning receipt for reference number...';

    Tesseract.recognize(file, 'eng')
        .then(({ data: { text } }) => {
            const refNumber = extractReferenceNumber(text);
            const refInput = document.getElementById('referenceNumberInput');
            if (refNumber && !refInput.value) {
                refInput.value = refNumber;
                status.textContent = 'Found reference number: ' + refNumber + ' (please double-check it).';
            } else if (refNumber) {
                status.textContent = 'Detected ' + refNumber + ' in the receipt — verify it matches the field above.';
            } else {
                status.textContent = "Couldn't auto-read a reference number — please type it in manually.";
            }
        })
        .catch(() => {
            status.textContent = "Couldn't scan this image automatically — please type the reference number manually.";
        });
});

document.getElementById('checkoutForm').addEventListener('submit', function (e) {
    const selected = document.querySelector('.delivery-method-radio:checked');
    if (selected && selected.value !== 'Self-Pickup') {
        if (!document.getElementById('deliveryLat').value) {
            e.preventDefault();
            alert('Please pin your delivery location on the map.');
        }
    }
});
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
