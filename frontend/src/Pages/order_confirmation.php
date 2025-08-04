
<?php
session_start();
require_once 'public/config/connect.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

// Get order ID from URL
$order_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Fetch order details
$order = [];
$order_items = [];

if ($order_id > 0) {
    try {
        // Get order info
        $stmt = $conn->prepare("
            SELECT * FROM orders 
            WHERE id = ? AND user_id = ?
        ");
        $stmt->bind_param("ii", $order_id, $_SESSION['user_id']);
        $stmt->execute();
        $order = $stmt->get_result()->fetch_assoc();
        
        // Get order items
        $items_stmt = $conn->prepare("
            SELECT oi.*, p.name, p.description 
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        ");
        $items_stmt->bind_param("i", $order_id);
        $items_stmt->execute();
        $order_items = $items_stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    } catch (Exception $e) {
        // Handle error
        $error = "Error fetching order details: " . $e->getMessage();
    }
}

// If order not found, redirect to orders page
if (empty($order)) {
    header("Location: orders.php");
    exit();
}
$store_name = '';
if ($order['delivery_option'] == 'takeaway') :
    $stmt_stores_info = $conn->prepare("SELECT id, name FROM stores WHERE id =?");
    $store_id = $order['takeaway_store_id'];
    $stmt_stores_info->bind_param("i", $store_id);
    $stmt_stores_info->execute();
    $result_stores_info = $stmt_stores_info->get_result();

    if ($result_stores_info->num_rows > 0) {
        $stores_info_array = $result_stores_info->fetch_assoc(); 
        $store_name = $stores_info_array['name'];
    }

    $result_stores_info->free();
    $stmt_stores_info->close();
endif;
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZOOM BITES - Order Confirmation</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #2e8b57;
            --primary-light: #3cb371;
            --secondary: #ff6b6b;
            --dark: #333;
            --light: #f9f9f9;
            --gray: #e0e0e0;
            --text: #555;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Poppins', sans-serif;
        }

        body {
            background-color: var(--light);
            color: var(--dark);
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .confirmation-header {
            text-align: center;
            margin-bottom: 40px;
        }

        .confirmation-header h1 {
            font-size: 28px;
            color: var(--primary);
            margin-bottom: 10px;
        }

        .confirmation-icon {
            font-size: 80px;
            color: var(--primary);
            margin-bottom: 20px;
        }

        .confirmation-message {
            font-size: 18px;
            margin-bottom: 30px;
        }

        .order-details {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            margin-bottom: 30px;
        }

        .order-details h2 {
            color: var(--primary);
            margin-bottom: 20px;
            border-bottom: 2px solid var(--gray);
            padding-bottom: 10px;
        }

        .detail-row {
            display: flex;
            margin-bottom: 15px;
        }

        .detail-label {
            font-weight: 600;
            width: 200px;
        }

        .order-items {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }

        .order-item {
            display: flex;
            justify-content: space-between;
            padding: 15px 0;
            border-bottom: 1px solid var(--gray);
        }

        .order-item:last-child {
            border-bottom: none;
        }

        .order-summary {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid var(--gray);
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        .summary-total {
            font-weight: 700;
            font-size: 18px;
        }

        .btn-continue {
            display: inline-block;
            padding: 15px 30px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 600;
            margin-top: 30px;
            cursor: pointer;
            transition: background 0.3s;
            text-decoration: none;
            text-align: center;
        }

        .btn-continue:hover {
            background: var(--primary-light);
        }

        @media (max-width: 768px) {
            .detail-row {
                flex-direction: column;
            }
            
            .detail-label {
                width: 100%;
                margin-bottom: 5px;
            }
        }
    </style>
</head>
<body>
    <?php include 'public/config/header.php'; ?>

    <div class="container">
        <div class="confirmation-header">
            <div class="confirmation-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h1>Order Confirmed!</h1>
            <div class="confirmation-message">
                Thank you for your order #<?= $order['id'] ?>. We've received it and will process it shortly.
            </div>
        </div>

        <div class="order-details">
            <h2>Order Details</h2>
            
            <div class="detail-row">
                <div class="detail-label">Order Number:</div>
                <div>#<?= $order['id'] ?></div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Date:</div>
                <div><?= date('F j, Y', strtotime($order['created_at'])) ?></div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Payment Method:</div>
                <div>
                    <?= 
                        $order['payment_method'] === 'razorpay' ? 'Credit/Debit Card' : 
                        ($order['payment_method'] === 'cod' ? 'Cash on Delivery' : $order['payment_method'])
                    ?>
                </div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Payment Status:</div>
                <div>
                    <?= 
                        $order['payment_method'] === 'cod' ? 'Pending (Cash on Delivery)' : 
                        ($order['payment_id'] ? 'Paid' : 'Pending')
                    ?>
                </div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Order Status:</div>
                <div><?= ucfirst($order['status']) ?></div>
            </div>
            <?php if($order['delivery_option']=='takeaway' && !empty($store_name)):?>
            <div class="detail-row">
                <div class="detail-label">Takeaway Information :</div>
                <div><?= $store_name;?></div>
            </div>
            <?php endif;?>
        </div>

        <div class="order-items">
            <h2>Order Items</h2>
            
            <?php foreach ($order_items as $item): ?>
            <div class="order-item">
                <div>
                    <div style="font-weight: 600;"><?= htmlspecialchars($item['name']) ?></div>
                    <div style="font-size: 14px; color: var(--text);"><?= htmlspecialchars($item['description']) ?></div>
                </div>
                <div>
                    <div>Qty: <?= $item['quantity'] ?></div>
                    <div>₹<?= number_format($item['price'] * $item['quantity'], 2) ?></div>
                </div>
            </div>
            <?php endforeach; ?>
            
            <div class="order-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>₹<?= number_format($order['subtotal'], 2) ?></span>
                </div>
                <div class="summary-row">
                    <span>Tax (9%):</span>
                    <span>₹<?= number_format($order['tax'], 2) ?></span>
                </div>
                <div class="summary-row">
                    <span>Shipping:</span>
                    <span>Free</span>
                </div>
                <div class="summary-row summary-total">
                    <span>Total:</span>
                    <span>₹<?= number_format($order['amount'], 2) ?></span>
                </div>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="index.php" class="btn-continue">CONTINUE SHOPPING</a>
        </div>
		
		
    </div>

    <?php include 'public/config/footer.php'; ?>
</body>
</html>