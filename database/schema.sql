-- =====================================================================
-- Profetas Integrated Farm - Database Schema
-- Covers both the admin panel (pre-existing UI, now wired to this DB)
-- and the new customer-facing site.
--
-- Import via phpMyAdmin, or from a terminal:
--   mysql -u root < database/schema.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS profetas_farm
    CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE profetas_farm;

-- ---------------------------------------------------------------------
-- Accounts - one table, one login for both roles. `role` decides whether
-- a row can reach the admin panel; everything else (orders, addresses,
-- vouchers, farm visits) still hangs off customer_id like before.
-- ---------------------------------------------------------------------
CREATE TABLE customers (
    customer_id     INT AUTO_INCREMENT PRIMARY KEY,
    first_name      VARCHAR(50) NOT NULL,
    last_name       VARCHAR(50) NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    contact_number  VARCHAR(20),
    role            ENUM('admin','customer') NOT NULL DEFAULT 'customer',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Saved delivery locations, pinned via Leaflet map at checkout
CREATE TABLE customer_addresses (
    address_id      INT AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT NOT NULL,
    label           VARCHAR(50) DEFAULT 'Home',
    full_address    VARCHAR(255) NOT NULL,
    landmark        VARCHAR(255),
    latitude        DECIMAL(10,7) NOT NULL,
    longitude       DECIMAL(10,7) NOT NULL,
    is_default      TINYINT(1) NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------
CREATE TABLE products (
    product_id          INT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    category            ENUM('Fresh','Value-Added','Farm Inputs') NOT NULL,
    description         TEXT,
    price               DECIMAL(10,2) NOT NULL,
    unit                VARCHAR(20) NOT NULL DEFAULT 'unit',
    image               VARCHAR(255),
    is_harvested_today  TINYINT(1) NOT NULL DEFAULT 0,
    status              ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- One stock row per product. Kept separate from `products` because the
-- existing admin UI already treats Products and Inventory as two
-- distinct screens; status is derived from stock_qty vs threshold.
CREATE TABLE inventory (
    inventory_id        INT AUTO_INCREMENT PRIMARY KEY,
    product_id          INT NOT NULL UNIQUE,
    stock_qty           INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 10,
    last_updated        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------
CREATE TABLE orders (
    order_id         INT AUTO_INCREMENT PRIMARY KEY,
    customer_id      INT NOT NULL,
    order_date       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal         DECIMAL(10,2) NOT NULL,
    delivery_fee     DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount     DECIMAL(10,2) NOT NULL,
    status           ENUM('Pending','Confirmed','Processing','Shipped','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
    delivery_method  ENUM('Lalamove','Self-Pickup') NOT NULL,
    delivery_address VARCHAR(255),
    delivery_landmark VARCHAR(255),
    delivery_lat     DECIMAL(10,7),
    delivery_lng     DECIMAL(10,7),
    pickup_date      DATE,
    pickup_time      TIME,
    tracking_number  VARCHAR(50),
    payment_status   ENUM('Unpaid','Pending Verification','Paid','Rejected') NOT NULL DEFAULT 'Unpaid',
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
) ENGINE=InnoDB;

CREATE TABLE order_items (
    order_item_id  INT AUTO_INCREMENT PRIMARY KEY,
    order_id       INT NOT NULL,
    product_id     INT NOT NULL,
    product_name   VARCHAR(100) NOT NULL,
    unit_price     DECIMAL(10,2) NOT NULL,
    quantity       INT NOT NULL,
    subtotal       DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
) ENGINE=InnoDB;

-- GCash manual verification
CREATE TABLE payments (
    payment_id       INT AUTO_INCREMENT PRIMARY KEY,
    order_id         INT NOT NULL UNIQUE,
    method           VARCHAR(20) NOT NULL DEFAULT 'GCash',
    reference_number VARCHAR(50),
    receipt_image    VARCHAR(255),
    amount           DECIMAL(10,2) NOT NULL,
    status           ENUM('Pending','Verified','Rejected') NOT NULL DEFAULT 'Pending',
    admin_note       VARCHAR(255),
    verified_at      TIMESTAMP NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Wholesale / reseller inquiries (P10,000+ orders)
-- ---------------------------------------------------------------------
CREATE TABLE wholesale_inquiries (
    inquiry_id        INT AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,
    contact_number    VARCHAR(20) NOT NULL,
    location          VARCHAR(255) NOT NULL,
    requested_items   TEXT NOT NULL,
    estimated_budget  DECIMAL(10,2),
    status            ENUM('New','Quoted','Closed') NOT NULL DEFAULT 'New',
    admin_response    TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Farm visit scheduling
-- ---------------------------------------------------------------------
CREATE TABLE farm_visits (
    visit_id           INT AUTO_INCREMENT PRIMARY KEY,
    customer_id        INT NULL,
    name               VARCHAR(100) NOT NULL,
    contact_number     VARCHAR(20) NOT NULL,
    visit_date         DATE NOT NULL,
    visit_time         TIME NOT NULL,
    number_of_visitors INT NOT NULL DEFAULT 1,
    status             ENUM('Pending','Confirmed','Cancelled') NOT NULL DEFAULT 'Pending',
    notes              VARCHAR(255),
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Education section (admin-authored, read-only for customers)
-- ---------------------------------------------------------------------
CREATE TABLE education_posts (
    post_id     INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(150) NOT NULL,
    category    ENUM('Tutorial','Tip','Recipe') NOT NULL,
    content     TEXT NOT NULL,
    image       VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Loyalty vouchers, unlocked at cumulative-spend thresholds
-- ---------------------------------------------------------------------
CREATE TABLE loyalty_vouchers (
    voucher_id       INT AUTO_INCREMENT PRIMARY KEY,
    customer_id      INT NOT NULL,
    threshold_amount DECIMAL(10,2) NOT NULL,
    code             VARCHAR(30) NOT NULL UNIQUE,
    status           ENUM('Available','Redeemed') NOT NULL DEFAULT 'Available',
    issued_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    redeemed_at      TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Misc site settings (live chat online/offline toggle, social links)
-- ---------------------------------------------------------------------
CREATE TABLE site_settings (
    setting_key   VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(255)
) ENGINE=InnoDB;

INSERT INTO site_settings (setting_key, setting_value) VALUES
    ('chat_status', 'offline'),
    ('facebook_url', 'https://facebook.com/profetasfarm'),
    ('shopee_url', 'https://shopee.ph/profetasfarm'),
    ('gcash_number', '0917-123-4567 (Profetas Integrated Farm)');

-- ---------------------------------------------------------------------
-- Sample login accounts, one per role, for local testing only. Both log
-- in through the same form (login.php); role decides where it lands.
-- Plaintext passwords (change/remove before any real deployment):
--   Admin:    admin@profetasfarm.com    / Admin@123
--   Customer: customer@example.com      / Customer@123
-- ---------------------------------------------------------------------
INSERT INTO customers (first_name, last_name, email, password_hash, contact_number, role) VALUES
    ('Farm', 'Administrator', 'admin@profetasfarm.com', '$2y$10$i5HzN0BATtPaW3553D6/5.MRrqMW6DcKgyror4zWvCXOvjeKT4GN2', NULL, 'admin'),
    ('Juan', 'Dela Cruz', 'customer@example.com', '$2y$10$jdEkUS5FVnJNy4d6SRZDX.vMv655a1jt2EbV7Q8huSbywPEWzY3pS', '0917-000-0000', 'customer');

-- ---------------------------------------------------------------------
-- Sample catalog data so the customer site has something to display
-- while building/testing. Safe to edit/delete from admin later.
-- ---------------------------------------------------------------------
INSERT INTO products (name, category, description, price, unit, image, is_harvested_today, status) VALUES
    ('Fresh Oyster Mushroom', 'Fresh', 'Locally grown oyster mushrooms, harvested fresh from our grow houses.', 120.00, 'kg', 'assets/img/products/oyster-mushroom.jpg', 1, 'Active'),
    ('Fresh Shiitake Mushroom', 'Fresh', 'Premium shiitake mushrooms grown on native hardwood logs.', 220.00, 'kg', 'assets/img/products/shiitake-mushroom.jpg', 1, 'Active'),
    ('Carabao Mango', 'Fresh', 'Sweet, ripe carabao mangoes from our own orchard.', 150.00, 'kg', 'assets/img/products/mango.jpg', 0, 'Active'),
    ('Mokusaku (Wood Vinegar)', 'Value-Added', 'Pyroligneous acid distilled from farm biomass, used as an organic soil conditioner and pest deterrent.', 180.00, '500ml bottle', 'assets/img/products/mokusaku.jpg', 0, 'Active'),
    ('Dried Mushroom Chips', 'Value-Added', 'Crispy, oven-dried mushroom chips - a healthy farm snack.', 95.00, 'pack', 'assets/img/products/mushroom-chips.jpg', 0, 'Active'),
    ('Mango Jam', 'Value-Added', 'House-made mango jam from surplus farm mangoes.', 130.00, 'jar', 'assets/img/products/mango-jam.jpg', 0, 'Active'),
    ('Mushroom Grow Bag Kit', 'Farm Inputs', 'Ready-to-fruit mushroom substrate bag for home growing.', 85.00, 'bag', 'assets/img/products/grow-bag.jpg', 0, 'Active'),
    ('Organic Biochar Soil Mix', 'Farm Inputs', 'Biochar-enriched soil amendment produced on-farm.', 60.00, 'kg', 'assets/img/products/biochar.jpg', 0, 'Active');

INSERT INTO inventory (product_id, stock_qty, low_stock_threshold) VALUES
    (1, 45, 10),
    (2, 8,  10),
    (3, 60, 15),
    (4, 30, 5),
    (5, 25, 5),
    (6, 18, 5),
    (7, 0,  5),
    (8, 50, 10);

INSERT INTO education_posts (title, category, content, image) VALUES
    ('How We Grow Our Oyster Mushrooms', 'Tutorial', 'A look into our low-waste substrate process, from spawning to harvest, using rice straw and sawdust sourced within Tanza.', 'assets/img/education/oyster-tutorial.jpg'),
    ('3 Ways to Cook Fresh Shiitake', 'Recipe', 'Simple recipes to bring out the umami of fresh shiitake: garlic butter saute, mushroom sinigang, and grilled skewers.', 'assets/img/education/shiitake-recipes.jpg'),
    ('Using Mokusaku in Your Home Garden', 'Tip', 'Dilution ratios and application tips for using our wood vinegar as a natural pest deterrent and soil conditioner.', 'assets/img/education/mokusaku-tip.jpg');
