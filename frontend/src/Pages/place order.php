<?php
session_start();
require_once 'public/config/connect.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit();
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$order_id = isset($data['order_id']) ? (int)$data['order_id'] : 0;
$payment_method = isset($data['payment_method']) ? $data['payment_method'] : '';
$payment_id = isset($data['payment_id']) ? $data['payment_id'] : null;
$amount = isset($data['amount']) ? (float)$data['amount'] : 0;

// Validate data
if ($order_id <= 0 || empty($payment_method) || $amount <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid order data']);
    exit();
}

try {
    $conn->begin_transaction();

    // Update order with payment details
    $stmt = $conn->prepare("
        UPDATE orders 
        SET 
            payment_method = ?,
            payment_id = ?,
            amount = ?,
            updated_at = NOW()
        WHERE id = ? AND user_id = ?
    ");
    $stmt->bind_param("ssdii", $payment_method, $payment_id, $amount, $order_id, $_SESSION['user_id']);
    $stmt->execute();

    // Clear the user's cart
    $clear_cart = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
    $clear_cart->bind_param("i", $_SESSION['user_id']);
    $clear_cart->execute();

    // Commit the transaction
    $conn->commit();

    // Clear checkout session data
    $checkoutData = $_SESSION['checkout_data'] ?? [];
    unset($_SESSION['checkout_data']);
    unset($_SESSION['form_data']);

    // ========== SEND SMS TO ADMIN ==========
    $admin_mobile = "8192812557";
    $order_date = date("d-m-Y H:i");

    $store_name = $checkoutData['store_name'] ?? null;
    if (!empty($store_name)) {
        // Takeaway
        $sms_message = urlencode("A new order has been placed. Order number: {$order_id}, Date: {$order_date}, Pick-up Location: {$store_name}. BURMESE KITCHEN");
        $template_id = "1707175352444593780";
    } else {
        // Home delivery
        $sms_message = urlencode("A new order has been placed. Order number: {$order_id}, Date: {$order_date}, Delivery scheduled. BURMESE KITCHEN");
        $template_id = "1707175352436841137";
    }

    $sms_url = "http://sms.tddigitalsolution.com/http-tokenkeyapi.php?" .
        "authentic-key=38345348414e54493236313133341743749735" .
        "&senderid=BURMES" .
        "&route=1" .
        "&number={$admin_mobile}" .
        "&message={$sms_message}" .
        "&templateid={$template_id}";

    // Send SMS using cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $sms_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $sms_response = curl_exec($ch);
    curl_close($ch);

    // Optional logging
    file_put_contents("sms-log.txt", "[" . date("Y-m-d H:i:s") . "] Admin SMS sent: {$sms_url} | Response: {$sms_response}\n", FILE_APPEND);

    echo json_encode([
        'success' => true,
        'order_id' => $order_id,
        'message' => 'Order placed successfully'
    ]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        'success' => false,
        'message' => 'Error placing order: ' . $e->getMessage()
    ]);
}
?>
