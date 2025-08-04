
<?php
session_start();
require_once 'public/config/connect.php';

// Redirect if not logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

// Pankaj

$stmt_stores = $conn->prepare("SELECT id, name FROM stores WHERE is_active = ?");
$active_value = 'yes'; 
$stmt_stores->bind_param("s", $active_value); 
$stmt_stores->execute();
$result_stores = $stmt_stores->get_result();

if ($result_stores->num_rows > 0) {
    $stores_array = $result_stores->fetch_all(MYSQLI_ASSOC); 
}

$result_stores->free();
$stmt_stores->close();
    //echo "<pre>"; print_r($result_stores); echo "<pre>";
// Pankaj End 

// ---------------buy now code------------------
if (isset($_GET['buy_now'])) {
    $productId = intval($_GET['product_id'] ?? 0);
    $quantity = intval($_GET['quantity'] ?? 1);

    // Add the Buy Now product to cart
    $stmt = $conn->prepare("SELECT id, price FROM products WHERE id = ?");
    $stmt->bind_param("i", $productId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $product = $result->fetch_assoc();
        $stmt = $conn->prepare("INSERT INTO cart (user_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("iiid", $_SESSION['user_id'], $productId, $quantity, $product['price']);
        $stmt->execute();
    }

    header("Location: checkout.php");
    exit();
}
// ----------------end------------------------

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_info'])) {
    // Validate and sanitize input
    //echo "<pre>"; print_r($_POST); echo "</pre>"; die;
    $delivery_option_radio = $conn->real_escape_string(trim($_POST['delivery_option_radio'] ?? ''));
    $takeaway_store_id   = $conn->real_escape_string(trim($_POST['delivery_option'] ?? 0));
    
    $full_name = $conn->real_escape_string(trim($_POST['full_name'] ?? ''));
    $country = $conn->real_escape_string(trim($_POST['country'] ?? ''));
    $address = $conn->real_escape_string(trim($_POST['address'] ?? ''));
    $city = $conn->real_escape_string(trim($_POST['city'] ?? ''));
    $state = $conn->real_escape_string(trim($_POST['state'] ?? ''));
    $postcode = $conn->real_escape_string(trim($_POST['postcode'] ?? ''));
    $phone = $conn->real_escape_string(trim($_POST['phone'] ?? ''));
    

    $different_shipping = isset($_POST['different_shipping']);

    $shipping_full_name = $different_shipping ? $conn->real_escape_string(trim($_POST['shipping_full_name'] ?? '')) : $full_name;
    $shipping_address = $different_shipping ? $conn->real_escape_string(trim($_POST['shipping_address'] ?? '')) : $address;
    $shipping_city = $different_shipping ? $conn->real_escape_string(trim($_POST['shipping_city'] ?? '')) : $city;
    $shipping_state = $different_shipping ? $conn->real_escape_string(trim($_POST['shipping_state'] ?? '')) : $state;
    $shipping_postcode = $different_shipping ? $conn->real_escape_string(trim($_POST['shipping_postcode'] ?? '')) : $postcode;

    // Basic validation
    $errors = [];
    if($delivery_option_radio !='takeaway'){
        if (empty($full_name))
            $errors[] = 'Full name is required';
        if (empty($address))
            $errors[] = 'Address is required';
        if (empty($city))
            $errors[] = 'City is required';
        if (empty($postcode))
            $errors[] = 'Postcode is required';
        if (empty($phone))
            $errors[] = 'Phone is required';
    
        if ($different_shipping) {
            if (empty($shipping_full_name))
                $errors[] = 'Shipping full name is required';
            if (empty($shipping_address))
                $errors[] = 'Shipping address is required';
            if (empty($shipping_city))
                $errors[] = 'Shipping city is required';
            if (empty($shipping_postcode))
                $errors[] = 'Shipping postcode is required';
        }
    }

    if (empty($errors)) {
        try {
            $conn->begin_transaction();

            // Calculate amount from cart items
            $subtotal = 0;
            $totalTax = 0;

            // First get cart items to calculate amounts
            $userId = $_SESSION['user_id'];
            $cartItems = [];
            $query = "SELECT 
                        c.id AS cart_id, 
                        c.quantity, 
                        c.price,
                        p.id AS product_id, 
                        p.name,
                        p.description,
                        p.tax,
                        (SELECT image_path FROM product_images WHERE product_id = p.id LIMIT 1) AS image
                      FROM cart c
                      JOIN products p ON c.product_id = p.id
                      WHERE c.user_id = ?";

            $stmt = $conn->prepare($query);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();

            while ($item = $result->fetch_object()) {
                $cartItems[] = $item;
                $itemSubtotal = $item->price * $item->quantity;
                $subtotal += $itemSubtotal;
                $totalTax += ($itemSubtotal * $item->tax / 100);
            }

            $total_amount = $subtotal + $totalTax;

            // Save to database
            $stmt = $conn->prepare("
                INSERT INTO orders (
                    delivery_option,
                    takeaway_store_id,
                    user_id, 
                    billing_name, billing_country, billing_address, billing_city, 
                    billing_state, billing_postcode, billing_phone,
                    shipping_name, shipping_address, shipping_city, 
                    shipping_state, shipping_postcode,
                    status, amount, subtotal, tax, created_at
                ) VALUES (?,?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new_order', ?, ?, ?, NOW())
            ");

            // Bind parameters including amount, subtotal and tax
            $stmt->bind_param(
                "siissssssssssssddd",
                $delivery_option_radio,
                $takeaway_store_id,
                $_SESSION['user_id'],
                $full_name,
                $country,
                $address,
                $city,
                $state,
                $postcode,
                $phone,
                $shipping_full_name,
                $shipping_address,
                $shipping_city,
                $shipping_state,
                $shipping_postcode,
                $total_amount,
                $subtotal,
                $totalTax
            );
            $stmt->execute();
            $order_id = $stmt->insert_id;

            // Save cart items to order_items
            $cart_stmt = $conn->prepare("
                INSERT INTO order_items (order_id, product_id, quantity, price, tax_rate)
                SELECT ?, p.id, c.quantity, c.price, p.tax 
                FROM cart c
                JOIN products p ON c.product_id = p.id
                WHERE c.user_id = ?
            ");
            $cart_stmt->bind_param("ii", $order_id, $_SESSION['user_id']);
            $cart_stmt->execute();


            // Pankaj
            $store_name = '';
            $stores_info_array = []; // This will hold the found store's details
            
            if ($delivery_option_radio == 'takeaway') {
                $stmt_stores_info = $conn->prepare("SELECT id, name FROM stores WHERE id =?");
                $store_id = $takeaway_store_id;
                $stmt_stores_info->bind_param("i", $store_id);
                $stmt_stores_info->execute();
                $result_stores_info = $stmt_stores_info->get_result();
            
                if ($result_stores_info->num_rows > 0) {
                    $stores_info_array = $result_stores_info->fetch_assoc(); 
                    $store_name = $stores_info_array['name'];
                }
            
                $result_stores_info->free();
                $stmt_stores_info->close();
            }
            
            // Pankaj End 

            // Save to session for review page
            $_SESSION['checkout_data'] = [
                'order_id' => $order_id,
                'delivery_option'=>$delivery_option_radio,
                'store_name'=>!empty($store_name)?htmlspecialchars($store_name):'',
                'takeaway_store_id'=>$takeaway_store_id,
                'different_shipping' => $different_shipping,
                'billing' => [
                    'full_name' => $full_name,
                    'country' => $country,
                    'address' => $address,
                    'city' => $city,
                    'state' => $state,
                    'postcode' => $postcode,
                    'phone' => $phone
                ],
                'shipping' => [
                    'full_name' => $shipping_full_name,
                    'address' => $shipping_address,
                    'city' => $shipping_city,
                    'state' => $shipping_state,
                    'postcode' => $shipping_postcode
                ],
                'amount' => $total_amount,
                'subtotal' => $subtotal,
                'tax' => $totalTax
            ];

            // Store cart items in session for payment section
            $_SESSION['cart_items_for_payment'] = $cartItems;
            $_SESSION['cart_totals_for_payment'] = [
                'subtotal' => $subtotal,
                'totalTax' => $totalTax,
                'total' => $total_amount
            ];

            $conn->commit();

            // Redirect to payment section
            header("Location: checkout.php?section=payment");
            exit();
        } catch (Exception $e) {
            $conn->rollback();
            $_SESSION['checkout_error'] = "Error saving order: " . $e->getMessage();
            header("Location: checkout.php?section=information");
            exit();
        }
    } else {
        $_SESSION['checkout_error'] = implode("<br>", $errors);
        $_SESSION['form_data'] = $_POST;
        header("Location: checkout.php?section=information");
        exit();
    }
}

// Get current section (default to information if no data)
$current_section = isset($_GET['section']) ? $_GET['section'] :
    (isset($_SESSION['checkout_data']) ? 'payment' : 'information');
    
if ($current_section === 'payment' && isset($_SESSION['cart_items_for_payment'])) {
    $cartItems = $_SESSION['cart_items_for_payment'];
    $subtotal = $_SESSION['cart_totals_for_payment']['subtotal'];
    $totalTax = $_SESSION['cart_totals_for_payment']['totalTax'];
    $total = $_SESSION['cart_totals_for_payment']['total'];
} else {
    // Get cart items from database
    $userId = $_SESSION['user_id'];
    $cartItems = [];
    $subtotal = 0;
    $totalTax = 0;

    $query = "SELECT 
                c.id AS cart_id, 
                c.quantity, 
                c.price,
                p.id AS product_id, 
                p.name,
                p.description,
                p.tax,
                (SELECT image_path FROM product_images WHERE product_id = p.id LIMIT 1) AS image
              FROM cart c
              JOIN products p ON c.product_id = p.id
              WHERE c.user_id = ?";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($item = $result->fetch_object()) {
        $cartItems[] = $item;
        $itemSubtotal = $item->price * $item->quantity;
        $subtotal += $itemSubtotal;
        $totalTax += ($itemSubtotal * $item->tax / 100);
    }

    $total = $subtotal + $totalTax;
}

$checkoutData = $_SESSION['checkout_data'] ?? null;
$formData = $_SESSION['form_data'] ?? [];
unset($_SESSION['form_data']);
?>

<!DOCTYPE html>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Veg Products</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="common/common.css">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/noUiSlider/15.5.0/nouislider.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/noUiSlider/15.5.0/nouislider.min.js"></script>
    <!-- Razorpay SDK -->
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <link rel="stylesheet" href="./common/checkout.css">

</head>

<body>
    <?php include 'public/config/header.php'; ?>

    <div class="container">
        <div class="checkout-header">
            <h1>ZOOM BITES</h1>
            <div class="checkout-steps">
                <div class="<?= $current_section === 'information' ? 'active' : '' ?>">INFORMATION</div>
                <div class="<?= $current_section === 'payment' ? 'active' : '' ?>">REVIEW & PAY</div>
            </div>
        </div>

        <?php if (isset($_SESSION['checkout_error'])): ?>
            <div class="error-message">
                <?= $_SESSION['checkout_error'] ?>
                <?php unset($_SESSION['checkout_error']); ?>
            </div>
        <?php endif; ?>

        <!-- Information Section -->
        <div class="checkout-section <?= $current_section === 'information' ? 'active' : '' ?>" id="informationSection">
            <div class="checkout-grid">
                <!-- Pankaj -->
                <div class="checkout-form">
                    <h3 class="section-title text-2xl font-bold text-gray-800 mb-6 text-center">Choose Delivery Option</h3>
                    <form method="POST" id="checkoutForm">
                        <div class="radio-group flex justify-center space-x-4 mb-8">
                            <!-- Takeaway Option -->
                            <input type="radio" id="takeaway" name="delivery_option_radio" value="takeaway" checked data-tab="takeaway-content">
                            <label for="takeaway">Takeaway</label>
            
                            <!-- Home Delivery Option -->
                            <input type="radio" id="home_delivery" name="delivery_option_radio" value="home_delivery" data-tab="home-delivery-content">
                            <label for="home_delivery">Home Delivery</label>
                        </div>
                    
                        <!-- Tab Content Containers -->
                        <div id="takeaway-content" class="tab-content border border-gray-200 p-6 rounded-lg bg-gray-50">
                            <h4 class="text-xl font-semibold text-gray-700 mb-4">Takeaway Details</h4>
                            <div class="mt-4">
                                <label for="pickup-store" class="block text-sm font-medium text-gray-700 mb-1"><strong>Select a Store to Pickup:</strong></label>
                                <select id="pickup-store" name="delivery_option" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2">
                                    <option value="">Choose a store location</option>
                                    <?php
                                    if (!empty($stores_array)) {
                                        foreach ($stores_array as $store) {
                                            echo '<option value="' . htmlspecialchars($store['id']) . '">' . htmlspecialchars($store['name']) . '</option>';
                                        }
                                    } else {
                                        echo '<option value="" disabled>No stores available</option>';
                                    }
                                    ?>
                                </select>
                                <p class="text-sm text-gray-500 mt-4"><i>After placing your order, it will be ready in max one hour, so please pick up in time.</i></p>
                            </div>
                        </div>

                        <div id="home-delivery-content" class="tab-content border border-gray-200 p-6 rounded-lg bg-gray-50 hidden">
                            <div class="checkout-form">
                                <h3 class="section-title">Contact information</h3>
                                <h4>Billing details</h4>
                                <div class="form-group">
                                    <label for="full_name">Full Name *</label>
                                    <input type="text" id="full_name" name="full_name" required value="<?= $formData['full_name'] ?? '' ?>">
                                </div>
                                <div class="form-group">
                                    <label for="country">Country / Region</label>
                                    <select id="country" name="country" required>
                                        <option value="India" selected>India</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="address">House number and street name *</label>
                                    <input type="text" id="address" name="address" required value="<?= $formData['address'] ?? '' ?>">
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="city">Town / City *</label>
                                        <input type="text" id="city" name="city" required value="<?= $formData['city'] ?? '' ?>">
                                    </div>
                                    <div class="form-group">
                                        <label for="state">State</label>
                                        <input type="text" id="state" name="state" value="<?= $formData['state'] ?? '' ?>" required>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="postcode">Postcode / ZIP *</label>
                                    <input type="text" id="postcode" name="postcode" required value="<?= $formData['postcode'] ?? '' ?>">
                                </div>
        
                                <div class="form-group">
                                    <label for="phone">Phone *</label>
                                    <input type="tel" id="phone" name="phone" required value="<?= $formData['phone'] ?? '' ?>">
                                </div>
        
                                <div class="checkbox-group">
                                    <input type="checkbox" id="different_shipping" name="different_shipping" <?= isset($formData['different_shipping']) ? 'checked' : '' ?>>
                                    <label for="different_shipping">Ship to a different address?</label>
                                </div>

                                <div id="shippingFields" style="display: <?= isset($formData['different_shipping']) ? 'block' : 'none' ?>;">
                                    <h4 style="margin-top: 20px;">Shipping details</h4>
        
                                    <div class="form-group">
                                        <label for="shipping_full_name">Full Name *</label>
                                        <input type="text" id="shipping_full_name" name="shipping_full_name" value="<?= $formData['shipping_full_name'] ?? '' ?>">
                                    </div>
        
                                    <div class="form-group">
                                        <label for="shipping_address">Address *</label>
                                        <input type="text" id="shipping_address" name="shipping_address" value="<?= $formData['shipping_address'] ?? '' ?>">
                                    </div>
        
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="shipping_city">Town / City *</label>
                                            <input type="text" id="shipping_city" name="shipping_city" value="<?= $formData['shipping_city'] ?? '' ?>">
                                        </div>
                                        <div class="form-group">
                                            <label for="shipping_state">State</label>
                                            <input type="text" id="shipping_state" name="shipping_state" value="<?= $formData['shipping_state'] ?? '' ?>">
                                        </div>
                                    </div>
        
                                    <div class="form-group">
                                        <label for="shipping_postcode">Postcode / ZIP *</label>
                                        <input type="text" id="shipping_postcode" name="shipping_postcode" value="<?= $formData['shipping_postcode'] ?? '' ?>">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="nav-buttons">
                            <a href="index.php" class="btn btn-nav">BACK TO HOME</a>
                            <button type="submit" name="submit_info" class="btn btn-nav">CONTINUE TO PAYMENT</button>
                        </div>
                    </form>
                </div>
            <!-- Pankaj End-->
                


                <style>
                /* Pankaj Custom styling for radio buttons to make them look like tabs */
                    .radio-group input[type="radio"] {
                        display: none; /* Hide the default radio button */
                    }
            
                    .radio-group label {
                        cursor: pointer;
                        padding: 0.75rem 1.5rem;
                        border-radius: 0.5rem; /* Rounded corners */
                        transition: all 0.2s ease-in-out;
                        font-weight: 500;
                        color: #4a5568; /* Gray-700 */
                        background-color: #e2e8f0; /* Gray-200 */
                        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                        display: inline-block; /* Make labels behave like blocks for padding */
                        text-align: center;
                    }
            
                    .radio-group label:hover {
                        background-color: #cbd5e0; /* Gray-300 */
                    }
            
                    .radio-group input[type="radio"]:checked + label {
                        background-color: #4299e1; /* Blue-500 */
                        color: white;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
                        transform: translateY(-2px); /* Slight lift effect */
                    }
            
                    .radio-group input[type="radio"]:checked + label:hover {
                        background-color: #3182ce; /* Blue-600 */
                    }
                    
                /* Pankaj  End Custom styling for radio buttons to make them look like tabs */
                    .nav-buttons {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        /*max-width: 400px;*/
                        margin: auto;
                        padding: 20px;
                    }

                    @media (min-width: 600px) {
                        .nav-buttons {
                            flex-direction: row;
                            justify-content: space-between;
                        }
                    }

                    .btn-nav {
                        flex: 1;
                        text-align: center;
                        background-color: #007BFF;
                        color: white;
                        padding: 12px 20px;
                        font-size: 16px;
                        border: none;
                        text-decoration: none;
                        border-radius: 5px;
                        cursor: pointer;
                        min-width: 150px;
                        transition: background-color 0.3s ease;
                    }

                    .btn-nav:hover {
                        background-color: #0056b3;
                    }
                </style>

                <div class="order-summary">
                    <h3 class="section-title">Your Order</h3>

                    <?php foreach ($cartItems as $item): ?>
                        <div class="cart-item">
                            <div class="cart-item-container">
                                <?php if (!empty($item->image)): ?>
                                    <img src="admin/<?= htmlspecialchars($item->image) ?>" class="cart-item-image"
                                        alt="<?= htmlspecialchars($item->name) ?>">
                                <?php else: ?>
                                    <div class="cart-item-image-placeholder">
                                        <i class="fas fa-utensils"></i>
                                    </div>
                                <?php endif; ?>
                                <div class="cart-item-details">
                                    <div class="cart-item-name">
                                        <?= htmlspecialchars($item->name) ?>
                                    </div>
                                    <div class="cart-item-desc">
                                        <?= htmlspecialchars($item->description) ?>
                                    </div>
                                    <div class="cart-item-meta">
                                        <span class="cart-item-quantity">Qty:
                                            <?= $item->quantity ?>
                                        </span>
                                        <span class="cart-item-price">₹
                                            <?= number_format($item->price * $item->quantity, 2) ?>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>

                    <!--<div class="coupon-input">-->
                    <!--    <input type="text" placeholder="Coupon code">-->
                    <!--    <button>Apply</button>-->
                    <!--</div>-->

                    <div class="summary-total">
                        <div class="summary-row">
                            <span>Subtotal</span>
                            <span>₹
                                <?= number_format($subtotal, 2) ?>
                            </span>
                        </div>
                        <div class="summary-row">
                            <span>Tax</span>
                            <span>₹
                                <?= number_format($totalTax, 2) ?>
                            </span>
                        </div>
                        <div class="summary-row">
                            <span>Shipping</span>
                            <span>Free shipping</span>
                        </div>
                        <div class="summary-row">
                            <span>TOTAL</span>
                            <span>₹
                                <?= number_format($total, 2) ?>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Review and Payment Section -->
        <div class="checkout-section <?= $current_section === 'payment' ? 'active' : '' ?>" id="paymentSection">
            <?php if ($checkoutData):?>
                <div class="review-section">
                    <h3 class="section-title"><strong>Review Information</strong></h3>
                    <?php if(!empty($checkoutData['delivery_option']) && $checkoutData['delivery_option'] == 'takeaway'):?>
                     <div class="review-item">
                            <h4>Takeaway Information : <?= $checkoutData['store_name'];?></h4>
                            <p>  Your order will be ready in max one hour, so please pick up in time.</p>
                        </div>
                    <?php else:?>
                        <div class="review-item">
                            <h4>Contact Information</h4>
                            <p><?= htmlspecialchars($checkoutData['billing']['phone']) ?></p>
                        </div>
    
                        <div class="review-item">
                            <h4>Billing Address</h4>
                            <p>
                                <?= htmlspecialchars($checkoutData['billing']['full_name']) ?><br>
                                <?= htmlspecialchars($checkoutData['billing']['address']) ?><br>
                                <?= htmlspecialchars($checkoutData['billing']['city']) ?>,
                                <?= htmlspecialchars($checkoutData['billing']['state']) ?>
                                <?= htmlspecialchars($checkoutData['billing']['postcode']) ?><br>
                                <?= htmlspecialchars($checkoutData['billing']['country']) ?>
                            </p>
                        </div>
    
                        <?php if ($checkoutData['shipping']): ?>
                            <div class="review-item">
                                <h4>Shipping Address</h4>
                                <p>
                                    <?= htmlspecialchars($checkoutData['shipping']['full_name']) ?><br>
                                    <?= htmlspecialchars($checkoutData['shipping']['address']) ?><br>
                                    <?= htmlspecialchars($checkoutData['shipping']['city']) ?>,
                                    <?= htmlspecialchars($checkoutData['shipping']['state']) ?>
                                    <?= htmlspecialchars($checkoutData['shipping']['postcode']) ?>
                                </p>
                            </div>
                        <?php endif; ?>
                    <?php endif;?>
                    <div class="nav-buttons">
                        <a href="checkout.php?section=information" class="btn-back">EDIT INFORMATION</a>
                    </div>
                </div>

                <div class="order-summary">
                    <h3 class="section-title">Your Order</h3>

                    <?php foreach ($cartItems as $item): ?>
                        <div class="cart-item">
                            <div class="cart-item-container">
                                <?php if (!empty($item->image)): ?>
                                    <img src="admin/<?= htmlspecialchars($item->image) ?>" class="cart-item-image"
                                        alt="<?= htmlspecialchars($item->name) ?>">
                                <?php else: ?>
                                    <div class="cart-item-image-placeholder">
                                        <i class="fas fa-utensils"></i>
                                    </div>
                                <?php endif; ?>
                                <div class="cart-item-details">
                                    <div class="cart-item-name">
                                        <?= htmlspecialchars($item->name) ?>
                                    </div>
                                    <div class="cart-item-desc">
                                        <?= htmlspecialchars($item->description) ?>
                                    </div>
                                    <div class="cart-item-meta">
                                        <span class="cart-item-quantity">Qty:
                                            <?= $item->quantity ?>
                                        </span>
                                        <span class="cart-item-price">₹
                                            <?= number_format($item->price * $item->quantity, 2) ?>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>

                    <div class="summary-total">
                        <div class="summary-row">
                            <span>Subtotal</span>
                            <span>₹<?= number_format($checkoutData['subtotal'] ?? $subtotal, 2) ?></span>
                        </div>
                        <div class="summary-row">
                            <span>Tax</span>
                            <span>₹<?= number_format($checkoutData['tax'] ?? $totalTax, 2) ?></span>
                        </div>
                        <div class="summary-row">
                            <span>Shipping</span>
                            <span>Free shipping</span>
                        </div>
                        <div class="summary-row">
                            <span>TOTAL</span>
                            <span>₹<?= number_format($checkoutData['amount'] ?? $total, 2) ?></span>
                        </div>
                    </div>

                    <div class="payment-methods">
                        <h3 class="section-title">Payment Method</h3>

                        <div class="payment-method active" id="razorpayMethod">
                            <input type="radio" name="payment_method" value="razorpay" checked>
                            <i class="fab fa-cc-visa payment-icon"></i>
                            <div>
                                <h4>Credit/Debit Card</h4>
                                <p>Pay securely with Razorpay</p>
                            </div>
                        </div>

                        <div class="payment-method" id="codMethod">
                            <input type="radio" name="payment_method" value="cod">
                            <i class="fas fa-money-bill-wave payment-icon"></i>
                            <div>
                                <h4>Cash on Delivery</h4>
                                <p>Pay when you receive your order</p>
                            </div>
                        </div>
                    </div>

                    <button id="placeOrderBtn" class="checkout-btn">PLACE ORDER</button>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <script>
        // Show/hide shipping fields
        document.getElementById('different_shipping').addEventListener('change', function () {
            document.getElementById('shippingFields').style.display = this.checked ? 'block' : 'none';

            // Toggle required attribute on shipping fields
            const shippingInputs = document.querySelectorAll('#shippingFields input');
            shippingInputs.forEach(input => {
                input.required = this.checked;
            });
        });

        // Payment method selection
        document.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', function () {
                document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
                this.classList.add('active');
                this.querySelector('input').checked = true;
            });
        });

        // Razorpay integration
        document.getElementById('placeOrderBtn')?.addEventListener('click', function () {
            const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;

            if (paymentMethod === 'cod') {
                // Cash on delivery
                placeOrder('cod');
            } else {
                // Razorpay payment
                fetch('create_razorpay_order.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: <?= round(($checkoutData['amount'] ?? $total) * 100) ?>, // Razorpay expects amount in paise
                        currency: 'INR'
                    })
                })
                    .then(response => response.json())
                    .then(data => {
                        const options = {
                            key: 'rzp_test_mcwl3oaRQerrOW',
                            amount: data.amount,
                            currency: data.currency,
                            name: 'ZOOM BITES',
                            description: 'Food Order Payment',
                            order_id: data.id,
                            handler: function (response) {
                                placeOrder('razorpay', response.razorpay_payment_id);
                            },
                            prefill: {
                                name: '<?= $checkoutData ? htmlspecialchars($checkoutData["billing"]["full_name"]) : "" ?>',
                                email: 'customer@example.com',
                                contact: '<?= $checkoutData ? htmlspecialchars($checkoutData["billing"]["phone"]) : "" ?>'
                            },
                            theme: {
                                color: '#2e8b57'
                            }
                        };

                        const rzp = new Razorpay(options);
                        rzp.open();
                    });
            }
        });

        function placeOrder(paymentMethod, paymentId = null) {
            fetch('place_order.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_id: <?= $checkoutData['order_id'] ?? 'null' ?>,
                    payment_method: paymentMethod,
                    payment_id: paymentId,
                    amount: <?= $checkoutData['amount'] ?? $total ?>,
                    subtotal: <?= $checkoutData['subtotal'] ?? $subtotal ?>,
                    tax: <?= $checkoutData['tax'] ?? $totalTax ?>,
                    billing: <?= json_encode($checkoutData['billing'] ?? []) ?>,
                    shipping: <?= json_encode($checkoutData['shipping'] ?? []) ?>,
                    cart_items: <?= json_encode($cartItems) ?>
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = 'order_confirmation.php?id=' + data.order_id;
                    } else {
                        alert('Error placing order: ' + data.message);
                    }
                });
        }
    </script>
    <!-- Pankaj -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const radioButtons = document.querySelectorAll('input[name="delivery_option_radio"]');
            const tabContents = document.querySelectorAll('.tab-content');
            const pickupStoreSelect = document.getElementById('pickup-store');
            const homeDeliveryContent = document.getElementById('home-delivery-content');
            // Select all input/select/textarea elements within the homeDeliveryContent form
            const homeDeliveryFormFields = homeDeliveryContent.querySelectorAll(
                'input, select, textarea'
            );
            const billingFields = homeDeliveryContent.querySelectorAll(
                '#full_name, #country, #address_billing, #city_billing, #state_billing, #postcode_billing, #phone'
            );
            const differentShippingCheckbox = document.getElementById('different_shipping_checkbox');
            const shippingFieldsDiv = document.getElementById('shippingFields');
            const shippingFields = shippingFieldsDiv.querySelectorAll(
                '#shipping_full_name, #shipping_address, #shipping_city, #shipping_state, #shipping_postcode'
            );

            // Function to set or remove 'required' attribute for a set of elements
            function setRequired(elements, isRequired) {
                elements.forEach(el => {
                    if (isRequired) {
                        el.setAttribute('required', 'required');
                    } else {
                        el.removeAttribute('required');
                    }
                });
            }

            // Function to show the selected tab content and manage required attributes
            function showTabContent(tabId) {
                tabContents.forEach(content => {
                    if (content.id === tabId) {
                        content.classList.remove('hidden');
                        if (tabId === 'takeaway-content') {
                            setRequired([pickupStoreSelect], true); // Make pickup-store required
                            // Make all home delivery form fields not required
                            setRequired(homeDeliveryFormFields, false);
                        } else if (tabId === 'home-delivery-content') {
                            setRequired([pickupStoreSelect], false); // Make pickup-store not required
                            // Make billing fields required
                            setRequired(billingFields, true);
                            // Shipping fields required state depends on the checkbox
                            if (differentShippingCheckbox.checked) {
                                setRequired(shippingFields, true);
                            } else {
                                setRequired(shippingFields, false);
                            }
                        }
                    } else {
                        content.classList.add('hidden');
                    }
                });
            }

            // Event listener for radio button changes
            radioButtons.forEach(radio => {
                radio.addEventListener('change', function() {
                    if (this.checked) {
                        const targetTabId = this.dataset.tab;
                        showTabContent(targetTabId);
                    }
                });
            });

            // Event listener for the "Ship to a different address?" checkbox
            if (differentShippingCheckbox && shippingFieldsDiv) {
                differentShippingCheckbox.addEventListener('change', function() {
                    if (this.checked) {
                        shippingFieldsDiv.classList.remove('hidden');
                        // Only make shipping fields required if home delivery tab is active
                        if (!homeDeliveryContent.classList.contains('hidden')) {
                            setRequired(shippingFields, true);
                        }
                    } else {
                        shippingFieldsDiv.classList.add('hidden');
                        setRequired(shippingFields, false);
                    }
                });
            }

            // Initial setup on page load
            const initialCheckedRadio = document.querySelector('input[name="delivery_option_radio"]:checked');
            if (initialCheckedRadio) {
                showTabContent(initialCheckedRadio.dataset.tab);
            }
        });
    </script>
    <!-- Pankaj End -->
    <?php include 'public/config/footer.php'; ?>
</body>

</html>

