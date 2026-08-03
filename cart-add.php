<?php
require_once __DIR__ . '/includes/session.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/functions.php';

header('Content-Type: application/json');

$productId = (int)($_POST['product_id'] ?? 0);
$quantity = max(1, (int)($_POST['quantity'] ?? 1));

$stmt = $pdo->prepare(
    "SELECT p.product_id, COALESCE(i.stock_qty, 0) AS stock_qty
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.product_id
     WHERE p.product_id = ? AND p.status = 'Active'"
);
$stmt->execute([$productId]);
$product = $stmt->fetch();

if (!$product) {
    echo json_encode(['success' => false, 'message' => 'Product not found.']);
    exit;
}

$currentQty = $_SESSION['cart'][$productId] ?? 0;
$newQty = $currentQty + $quantity;

if ($newQty > (int)$product['stock_qty']) {
    echo json_encode(['success' => false, 'message' => 'Not enough stock available.']);
    exit;
}

cart_add($productId, $quantity);

echo json_encode(['success' => true, 'cart_count' => cart_count()]);
