-- =============================================================
-- 19 DOGS — Full Production DB Migration
-- Run against: postgresql://postgres:19Dogs@127.0.0.1:5432/dogs_new
-- Safe to run multiple times (all statements use IF NOT EXISTS / DO NOTHING)
-- =============================================================

-- ── sessions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  sid varchar PRIMARY KEY,
  sess jsonb NOT NULL,
  expire timestamp NOT NULL
);

-- ── brands ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  name varchar NOT NULL,
  slug varchar NOT NULL UNIQUE,
  logo_url varchar,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ── categories — add newer columns ───────────────────────────
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_url varchar;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS banner_url varchar;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_in_hub boolean DEFAULT false;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_title varchar;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_keywords varchar;

-- ── products — add newer columns ─────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id varchar;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS allow_backorder boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS restock_date timestamp;
ALTER TABLE products ADD COLUMN IF NOT EXISTS warehouse_location varchar;
ALTER TABLE products ADD COLUMN IF NOT EXISTS expected_delivery_days integer DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS free_shipping boolean DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_text varchar DEFAULT 'Free Shipping';
ALTER TABLE products ADD COLUMN IF NOT EXISTS return_days integer DEFAULT 30;
ALTER TABLE products ADD COLUMN IF NOT EXISTS return_text varchar DEFAULT 'Easy Returns';
ALTER TABLE products ADD COLUMN IF NOT EXISTS secure_checkout boolean DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS secure_checkout_text varchar DEFAULT 'Secure Checkout';
ALTER TABLE products ADD COLUMN IF NOT EXISTS banner_url varchar;
ALTER TABLE products ADD COLUMN IF NOT EXISTS banner_title varchar;
ALTER TABLE products ADD COLUMN IF NOT EXISTS banner_subtitle varchar;
ALTER TABLE products ADD COLUMN IF NOT EXISTS banner_cta_text varchar;
ALTER TABLE products ADD COLUMN IF NOT EXISTS banner_cta_link varchar;
ALTER TABLE products ADD COLUMN IF NOT EXISTS coupon_box_bg_color varchar DEFAULT '#f0fdf4';
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate decimal(5,2) DEFAULT 18;
ALTER TABLE products ADD COLUMN IF NOT EXISTS benefits text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS feeding_guidelines text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_instructions text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS nutrition_data jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title varchar;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_keywords varchar;
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_rating decimal(2,1) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price_start timestamp;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price_end timestamp;

-- ── product_images — add newer columns ───────────────────────
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS media_type varchar DEFAULT 'image';
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS alt_text varchar;

-- ── product_variants — add newer columns ─────────────────────
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS sale_price decimal(10,2);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS sku varchar;

-- ── cart_items — add newer columns ───────────────────────────
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id varchar;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS combo_offer_id varchar;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS delivery_date varchar;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS session_id varchar;

-- ── orders — add newer columns ───────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id varchar;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id varchar;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number varchar;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_status varchar;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_updates jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code varchar;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type varchar DEFAULT 'online';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pos_payment_type varchar;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pos_customer_name varchar;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pos_customer_phone varchar;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email varchar;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;

-- ── order_items — add newer columns ──────────────────────────
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id varchar;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sku varchar;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image_url varchar;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS gst_rate decimal(5,2) DEFAULT 18;

-- ── coupons — add newer columns ───────────────────────────────
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_quantity integer;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS product_id varchar;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

-- ── banners — add newer columns ───────────────────────────────
ALTER TABLE banners ADD COLUMN IF NOT EXISTS video_url varchar;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS media_type varchar DEFAULT 'image';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS autoplay boolean DEFAULT true;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS target_block_id varchar;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS relative_placement varchar DEFAULT 'below';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS display_width integer DEFAULT 100;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS alignment varchar DEFAULT 'center';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

-- ── addresses — add newer columns ────────────────────────────
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS gst_number varchar;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS company varchar;

-- ── otp_codes (new table) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_codes (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  email varchar NOT NULL,
  phone varchar,
  code varchar(8) NOT NULL,
  purpose varchar NOT NULL,
  expires_at timestamp NOT NULL,
  verified boolean DEFAULT false,
  attempts integer DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- ── subscription_category_discounts (new table) ───────────────
CREATE TABLE IF NOT EXISTS subscription_category_discounts (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  customer_id varchar NOT NULL,
  category_id varchar NOT NULL,
  discount_type varchar NOT NULL,
  discount_value decimal(10,2) NOT NULL,
  sale_discount_type varchar,
  sale_discount_value decimal(10,2),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ── subscription_delivery_tiers (new table) ───────────────────
CREATE TABLE IF NOT EXISTS subscription_delivery_tiers (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  label varchar NOT NULL,
  up_to_weight_kg decimal(10,2) NOT NULL,
  chennai_fee decimal(10,2) NOT NULL,
  pan_india_fee decimal(10,2) NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ── reviews (new table) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  product_id varchar NOT NULL,
  user_id varchar,
  order_id varchar,
  rating integer NOT NULL,
  title varchar,
  content text,
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ── review_votes (new table) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS review_votes (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  review_id varchar NOT NULL,
  user_id varchar,
  session_id varchar,
  is_helpful boolean NOT NULL,
  created_at timestamp DEFAULT now()
);

-- ── verified_razorpay_payments (new table) ────────────────────
CREATE TABLE IF NOT EXISTS verified_razorpay_payments (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  razorpay_order_id varchar NOT NULL,
  razorpay_payment_id varchar NOT NULL,
  user_id varchar,
  guest_session_id varchar,
  amount decimal(10,2) NOT NULL,
  currency varchar DEFAULT 'INR',
  status varchar DEFAULT 'verified' NOT NULL,
  expires_at timestamp NOT NULL,
  created_at timestamp DEFAULT now()
);

-- ── shared_wishlists (new table) ──────────────────────────────
CREATE TABLE IF NOT EXISTS shared_wishlists (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  user_id varchar NOT NULL,
  share_code varchar NOT NULL UNIQUE,
  title varchar DEFAULT 'My Wishlist',
  description text,
  is_public boolean DEFAULT true,
  allow_anonymous boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ── gift_registries (new table) ───────────────────────────────
CREATE TABLE IF NOT EXISTS gift_registries (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  user_id varchar NOT NULL,
  share_code varchar NOT NULL UNIQUE,
  title varchar NOT NULL,
  event_type varchar NOT NULL,
  event_date timestamp,
  description text,
  cover_image varchar,
  registrant_name varchar,
  partner_name varchar,
  shipping_address_id varchar,
  is_public boolean DEFAULT true,
  show_purchased boolean DEFAULT false,
  allow_messages boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ── gift_registry_items (new table) ──────────────────────────
CREATE TABLE IF NOT EXISTS gift_registry_items (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  registry_id varchar NOT NULL,
  product_id varchar NOT NULL,
  variant_id varchar,
  quantity_desired integer DEFAULT 1,
  quantity_purchased integer DEFAULT 0,
  priority varchar DEFAULT 'normal',
  note text,
  is_purchased boolean DEFAULT false,
  purchased_by varchar,
  purchased_at timestamp,
  created_at timestamp DEFAULT now()
);

-- ── stock_notifications (new table) ──────────────────────────
CREATE TABLE IF NOT EXISTS stock_notifications (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  product_id varchar NOT NULL,
  variant_id varchar,
  email varchar NOT NULL,
  user_id varchar,
  is_notified boolean DEFAULT false,
  notified_at timestamp,
  created_at timestamp DEFAULT now()
);

-- ── Verify key tables ─────────────────────────────────────────
SELECT 'users' as tbl, count(*) FROM users
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'categories', count(*) FROM categories
UNION ALL SELECT 'cart_items', count(*) FROM cart_items
UNION ALL SELECT 'orders', count(*) FROM orders;
