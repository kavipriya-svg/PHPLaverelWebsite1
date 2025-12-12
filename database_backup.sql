--
-- PostgreSQL database dump
--

\restrict uxUy2r9S3phq7KHh5JKfMX1TwAvtEX6Dhi4ig4Yfav3DtThW6brf8U12zGifws4

-- Dumped from database version 16.11 (b740647)
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.addresses (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    type character varying DEFAULT 'shipping'::character varying,
    is_default boolean DEFAULT false,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    company character varying,
    address1 character varying NOT NULL,
    address2 character varying,
    city character varying NOT NULL,
    state character varying,
    postal_code character varying NOT NULL,
    country character varying NOT NULL,
    phone character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    gst_number character varying
);


ALTER TABLE public.addresses OWNER TO neondb_owner;

--
-- Name: banners; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.banners (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    type character varying NOT NULL,
    title character varying,
    subtitle character varying,
    media_url character varying,
    video_url character varying,
    media_type character varying DEFAULT 'image'::character varying,
    autoplay boolean DEFAULT true,
    cta_text character varying,
    cta_link character varying,
    "position" integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    target_block_id character varying,
    relative_placement character varying DEFAULT 'below'::character varying,
    display_width integer DEFAULT 100,
    alignment character varying DEFAULT 'center'::character varying
);


ALTER TABLE public.banners OWNER TO neondb_owner;

--
-- Name: brands; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.brands (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    logo_url character varying,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.brands OWNER TO neondb_owner;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cart_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    session_id character varying,
    product_id character varying NOT NULL,
    variant_id character varying,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    combo_offer_id character varying
);


ALTER TABLE public.cart_items OWNER TO neondb_owner;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    parent_id character varying,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    description text,
    image_url character varying,
    "position" integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    meta_title character varying,
    meta_description text,
    meta_keywords character varying,
    icon_url character varying,
    banner_url character varying
);


ALTER TABLE public.categories OWNER TO neondb_owner;

--
-- Name: combo_offers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.combo_offers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    description text,
    image_url character varying,
    product_ids text[] NOT NULL,
    original_price numeric(10,2) NOT NULL,
    combo_price numeric(10,2) NOT NULL,
    discount_percentage numeric(5,2),
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    is_active boolean DEFAULT true,
    "position" integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    media_urls text[]
);


ALTER TABLE public.combo_offers OWNER TO neondb_owner;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.coupons (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    code character varying NOT NULL,
    type character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    min_cart_total numeric(10,2),
    max_uses integer,
    used_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    product_id character varying,
    description text,
    min_quantity integer
);


ALTER TABLE public.coupons OWNER TO neondb_owner;

--
-- Name: gift_registries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.gift_registries (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    share_code character varying NOT NULL,
    title character varying NOT NULL,
    event_type character varying NOT NULL,
    event_date timestamp without time zone,
    description text,
    cover_image character varying,
    registrant_name character varying,
    partner_name character varying,
    shipping_address_id character varying,
    is_public boolean DEFAULT true,
    show_purchased boolean DEFAULT false,
    allow_messages boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.gift_registries OWNER TO neondb_owner;

--
-- Name: gift_registry_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.gift_registry_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    registry_id character varying NOT NULL,
    product_id character varying NOT NULL,
    variant_id character varying,
    quantity_desired integer DEFAULT 1,
    quantity_purchased integer DEFAULT 0,
    priority character varying DEFAULT 'normal'::character varying,
    note text,
    is_purchased boolean DEFAULT false,
    purchased_by character varying,
    purchased_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.gift_registry_items OWNER TO neondb_owner;

--
-- Name: home_blocks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.home_blocks (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    type character varying NOT NULL,
    title character varying,
    payload jsonb,
    "position" integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.home_blocks OWNER TO neondb_owner;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.order_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    product_id character varying NOT NULL,
    variant_id character varying,
    title character varying NOT NULL,
    sku character varying,
    price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    image_url character varying,
    created_at timestamp without time zone DEFAULT now(),
    gst_rate numeric(5,2) DEFAULT '18'::numeric
);


ALTER TABLE public.order_items OWNER TO neondb_owner;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_number character varying NOT NULL,
    user_id character varying,
    guest_email character varying,
    subtotal numeric(10,2) NOT NULL,
    discount numeric(10,2) DEFAULT '0'::numeric,
    tax numeric(10,2) DEFAULT '0'::numeric,
    shipping_cost numeric(10,2) DEFAULT '0'::numeric,
    total numeric(10,2) NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    payment_method character varying,
    payment_status character varying DEFAULT 'pending'::character varying,
    shipping_address jsonb,
    billing_address jsonb,
    tracking_number character varying,
    tracking_status character varying,
    tracking_updates jsonb,
    coupon_code character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    razorpay_order_id character varying,
    razorpay_payment_id character varying
);


ALTER TABLE public.orders OWNER TO neondb_owner;

--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.otp_codes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    code character varying(8) NOT NULL,
    purpose character varying NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    verified boolean DEFAULT false,
    attempts integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.otp_codes OWNER TO neondb_owner;

--
-- Name: product_images; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_images (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    url character varying NOT NULL,
    alt_text character varying,
    is_primary boolean DEFAULT false,
    "position" integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    media_type character varying DEFAULT 'image'::character varying
);


ALTER TABLE public.product_images OWNER TO neondb_owner;

--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_variants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    option_name character varying NOT NULL,
    option_value character varying NOT NULL,
    sku character varying,
    price numeric(10,2),
    stock integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    sale_price numeric(10,2)
);


ALTER TABLE public.product_variants OWNER TO neondb_owner;

--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    sku character varying NOT NULL,
    title character varying NOT NULL,
    slug character varying NOT NULL,
    brand_id character varying,
    category_id character varying,
    short_desc text,
    long_desc text,
    price numeric(10,2) NOT NULL,
    sale_price numeric(10,2),
    sale_price_start timestamp without time zone,
    sale_price_end timestamp without time zone,
    stock integer DEFAULT 0,
    weight numeric(8,2),
    dimensions character varying,
    is_featured boolean DEFAULT false,
    is_trending boolean DEFAULT false,
    is_active boolean DEFAULT true,
    average_rating numeric(2,1) DEFAULT '0'::numeric,
    review_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    meta_title character varying,
    meta_description text,
    meta_keywords character varying,
    low_stock_threshold integer DEFAULT 10,
    allow_backorder boolean DEFAULT false,
    restock_date timestamp without time zone,
    warehouse_location character varying,
    expected_delivery_days integer DEFAULT 5,
    is_new_arrival boolean DEFAULT false,
    is_on_sale boolean DEFAULT false,
    gst_rate numeric(5,2) DEFAULT '18'::numeric,
    free_shipping boolean DEFAULT true,
    shipping_text character varying DEFAULT 'Free Shipping'::character varying,
    return_days integer DEFAULT 30,
    return_text character varying DEFAULT 'Easy Returns'::character varying,
    secure_checkout boolean DEFAULT true,
    secure_checkout_text character varying DEFAULT 'Secure Checkout'::character varying,
    banner_url character varying,
    banner_title character varying,
    banner_subtitle character varying,
    banner_cta_text character varying,
    banner_cta_link character varying,
    coupon_box_bg_color character varying DEFAULT '#f0fdf4'::character varying
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: quick_pages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.quick_pages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying NOT NULL,
    slug character varying NOT NULL,
    content text,
    excerpt text,
    status character varying DEFAULT 'draft'::character varying NOT NULL,
    show_in_footer boolean DEFAULT true,
    footer_section character varying DEFAULT 'quick_links'::character varying,
    "position" integer DEFAULT 0,
    meta_title character varying,
    meta_description text,
    meta_keywords character varying,
    published_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.quick_pages OWNER TO neondb_owner;

--
-- Name: review_votes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.review_votes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    review_id character varying NOT NULL,
    user_id character varying,
    session_id character varying,
    is_helpful boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.review_votes OWNER TO neondb_owner;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.reviews (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    user_id character varying,
    order_id character varying,
    rating integer NOT NULL,
    title character varying,
    content text,
    is_verified_purchase boolean DEFAULT false,
    is_approved boolean DEFAULT false,
    helpful_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.reviews OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.settings (
    key character varying NOT NULL,
    value text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.settings OWNER TO neondb_owner;

--
-- Name: shared_wishlists; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shared_wishlists (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    share_code character varying NOT NULL,
    title character varying DEFAULT 'My Wishlist'::character varying,
    description text,
    is_public boolean DEFAULT true,
    allow_anonymous boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.shared_wishlists OWNER TO neondb_owner;

--
-- Name: stock_notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    variant_id character varying,
    email character varying NOT NULL,
    user_id character varying,
    is_notified boolean DEFAULT false,
    notified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_notifications OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    phone character varying,
    role character varying DEFAULT 'customer'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    password_hash character varying
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: verified_razorpay_payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.verified_razorpay_payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    razorpay_order_id character varying NOT NULL,
    razorpay_payment_id character varying NOT NULL,
    user_id character varying,
    guest_session_id character varying,
    amount numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'INR'::character varying,
    status character varying DEFAULT 'verified'::character varying NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.verified_razorpay_payments OWNER TO neondb_owner;

--
-- Name: wishlist_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.wishlist_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    product_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.wishlist_items OWNER TO neondb_owner;

--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.addresses (id, user_id, type, is_default, first_name, last_name, company, address1, address2, city, state, postal_code, country, phone, created_at, updated_at, gst_number) FROM stdin;
68f752c7-6b6e-44e7-b749-6dbbf0e8245c	50515928	shipping	t	Kavipriya	Adding Smiles	\N	Dr Ranga Road, Mylapore	23/40	Chenani	Tamil Nadu	600004	India	9941443009	2025-12-04 17:12:16.298868	2025-12-04 17:12:16.298868	22AAAAA0000A1Z5
b00b166f-3158-4e9c-9942-10a1051e70ec	9cc29ade-2d85-4e3f-99ea-ac94c496746b	shipping	t	Prasanna	V	Adding Smiles Pvt Ltd	Dr Ranga Road, Mylapore	Mylapore 	Chenani	Tamil Nadu	600004	India	9941443009	2025-12-10 18:39:13.085265	2025-12-10 18:39:13.085265	33AACCZ1221D1ZZ
8ac8484b-d09d-46d5-bb74-a4d0d31686ce	9cc29ade-2d85-4e3f-99ea-ac94c496746b	billing	f	Prasanna	V	19Pets Private Limted	6/11, Vidhyodhya Main Road	T Nagar	Chennai	Tamil Nadu	600017	India	9941443009	2025-12-10 18:41:26.3847	2025-12-10 18:41:26.3847	33AACCZ1221D1ZZ
\.


--
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.banners (id, type, title, subtitle, media_url, video_url, media_type, autoplay, cta_text, cta_link, "position", is_active, created_at, updated_at, target_block_id, relative_placement, display_width, alignment) FROM stdin;
8424d1b8-c51c-4c46-97c8-a4c44a11b288	promotional	Free Shipping	On orders over $50	https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop	\N	image	t	\N	\N	1	t	2025-12-01 14:46:06.277198	2025-12-01 14:46:06.277198	\N	below	100	center
a3b7248b-e208-4122-bb79-e0c965eed651	promotional	24/7 Support	We're always here to help	https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop	\N	image	t	\N	\N	2	t	2025-12-01 14:46:06.313008	2025-12-01 14:46:06.313008	\N	below	100	center
deb10a4a-6109-4cc1-9751-9ed673654afd	hero			/objects/uploads/c23f6e77-a6e5-4bd6-806e-ac26ace49c44		image	t			0	t	2025-12-02 05:04:03.015666	2025-12-02 05:04:03.015666	\N	below	100	center
30dfb111-2b38-41ba-bfd0-be955aeb12c7	hero			/objects/uploads/727b3cec-a990-41a5-86e2-0a914e402bab		image	t			0	t	2025-12-02 05:33:05.44676	2025-12-02 05:49:44.377	\N	below	100	center
bfeb0b1b-5c9b-4cf9-98d1-f4541666e2bf	hero			/objects/uploads/702457bf-586f-4754-9ffa-f9dd383ae2cd		image	t			0	t	2025-12-02 05:33:45.012581	2025-12-02 05:50:55.994	\N	below	100	center
743e3b79-b147-49e1-8874-381628f8a45f	section			/objects/uploads/256a9c1d-7524-432a-b25d-065e030d390b		image	t			0	t	2025-12-02 06:41:06.599862	2025-12-02 06:41:06.599862	07b4f3ea-2535-4412-9326-1b3d8d343ecc	above	50	left
9ee320b7-3407-407b-8d97-03cda1032508	section			/objects/uploads/781a0f16-2e6f-49bf-b86f-d7a2b901cbd9		image	t			0	t	2025-12-02 07:01:59.822312	2025-12-02 07:01:59.822312	07b4f3ea-2535-4412-9326-1b3d8d343ecc	above	50	right
8d5867c6-d0a4-450b-951e-bf91c1d7656a	section			/objects/uploads/4bac4a09-8fbc-46c8-8d99-effe7b7e1750		image	t			0	t	2025-12-02 07:38:52.084692	2025-12-02 07:38:52.084692	6c2f23f8-d343-4b72-ba81-cde3848c14d2	above	100	center
ae111c93-edd7-4efc-87c7-728259eee411	product			/objects/uploads/91f9e9a5-eab1-4db2-8384-06e50e18fb83		image	t			0	t	2025-12-05 18:06:18.810751	2025-12-05 18:06:18.810751	\N	below	100	center
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.brands (id, name, slug, logo_url, description, is_active, created_at, updated_at) FROM stdin;
dd8533e0-a721-4e73-95c7-438443269bc9	TechPro	techpro		Premium technology products	t	2025-12-01 14:46:02.003952	2025-12-01 14:46:02.003952
a852426c-18f3-4ee8-b168-007bc0521f65	StyleMax	stylemax		Fashion-forward clothing	t	2025-12-01 14:46:02.042706	2025-12-01 14:46:02.042706
f66a6d42-70d9-4c06-bf90-dce5d38e6d25	HomeEssentials	homeessentials		Quality home products	t	2025-12-01 14:46:02.079425	2025-12-01 14:46:02.079425
62aa4dba-5ffa-462c-ab07-9819e9410fec	SportElite	sportelite		Professional sports gear	t	2025-12-01 14:46:02.12	2025-12-01 14:46:02.12
28fb7c4e-2065-400e-b9fc-c4ef0ea9bb65	GlowUp	glowup		Beauty and skincare	t	2025-12-01 14:46:02.155352	2025-12-01 14:46:02.155352
ac0d759b-e35f-4ade-b950-4ed896b39aec	UrbanWear	urbanwear		Street fashion	t	2025-12-01 14:46:02.193549	2025-12-01 14:46:02.193549
28f74601-d793-4967-952d-f733c16edad3	NatureFit	naturefit		Natural wellness products	t	2025-12-01 14:46:02.229172	2025-12-01 14:46:02.229172
0cb7cf87-b568-4b12-aa70-7eae88464598	AudioMax	audiomax		Premium audio equipment	t	2025-12-01 14:46:02.263902	2025-12-01 14:46:02.263902
41385d82-330e-4b72-a1ce-9b559ef1659f	19Dogs	19dogs			t	2025-12-01 19:23:14.864133	2025-12-01 19:23:14.864133
4e27299b-7044-43aa-a966-d743720d973c	TestBrandQCwWvB	testbrandqcwwvb			t	2025-12-01 19:41:01.125297	2025-12-01 19:41:01.125297
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.cart_items (id, user_id, session_id, product_id, variant_id, quantity, created_at, updated_at, combo_offer_id) FROM stdin;
d341f980-5db2-45be-bca3-5862ef8715ce	\N	75702601-a9b5-4c20-aaf2-d7a652bc0d8e	5fc079c3-4dd0-4202-84d8-846656ff73bb	\N	1	2025-12-01 14:19:36.489178	2025-12-01 14:19:36.489178	\N
a6fdbcad-6b8b-4805-833c-53251cf0e970	\N	0e26b04b-f41b-4ad4-b123-eabc74678317	2b8528aa-d215-44ab-a211-f94479827c8b	\N	1	2025-12-01 14:25:48.090275	2025-12-01 14:25:48.090275	\N
da3fe0f7-fedb-433d-a3f3-20ec6bff500e	\N	1e429b8a-c2c3-42a9-838f-bc853067f56a	97d05848-800e-4a13-8b24-4b6e0c4a16ac	\N	1	2025-12-01 14:34:29.808587	2025-12-01 14:34:29.808587	\N
07c368a2-095b-4f03-adb2-e42e9d5cef18	\N	90528c42-1dcf-470a-b6ba-8ee5b7e1a0ea	bf924280-0c1c-429c-ac8b-05e5a868d67c	\N	1	2025-12-01 14:43:41.377824	2025-12-01 14:43:41.377824	\N
ab2cd5d1-1f93-4c6b-a656-574fdb919d42	\N	49613d96-d4e2-49c7-94f4-9b44a1505b27	4df34427-905b-4cf3-af63-2df176183e31	\N	1	2025-12-01 14:47:01.650836	2025-12-01 14:47:01.650836	\N
76d9f513-65d3-4eef-b49e-ba6f3750814e	\N	65af186d-3176-4bf9-a932-58e01932519c	4df34427-905b-4cf3-af63-2df176183e31	\N	1	2025-12-01 14:49:49.310965	2025-12-01 14:49:49.310965	\N
dd1cb2fd-6fa3-4c2b-b52c-fc777aad68de	\N	22e4c911-f7c5-434b-9f17-d33ad78cbfbd	bfeb8751-3aab-49a3-a645-9e10d8a2af58	\N	1	2025-12-01 15:44:43.068833	2025-12-01 15:44:43.068833	\N
d14d7d9b-0eb5-4261-9bef-6d2aba2a9769	\N	df08a800-d10a-4b0f-b9cd-86bf9ee517b5	ec91db70-9bae-4aed-8add-e76751649b97	\N	1	2025-12-10 19:20:02.25831	2025-12-10 19:20:02.25831	c680802f-dcd9-44b8-a857-8c920aafd297
8fdd6d0f-171b-47fc-a15b-722950ed38ca	\N	df08a800-d10a-4b0f-b9cd-86bf9ee517b5	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	\N	1	2025-12-10 19:20:02.386838	2025-12-10 19:20:02.386838	c680802f-dcd9-44b8-a857-8c920aafd297
517ca229-0e69-40b4-99b0-bb8574f5977a	\N	df08a800-d10a-4b0f-b9cd-86bf9ee517b5	cc1d996a-beb3-43b3-b7f2-c30df9d6ab81	\N	1	2025-12-10 19:20:02.547452	2025-12-10 19:20:02.547452	c680802f-dcd9-44b8-a857-8c920aafd297
781fd336-bd8b-4ca1-971c-fcd3f32df4cc	\N	bfba074e-c64b-408c-bbc4-857eb8ba1e80	ec91db70-9bae-4aed-8add-e76751649b97	\N	1	2025-12-10 19:24:11.61735	2025-12-10 19:24:11.61735	c680802f-dcd9-44b8-a857-8c920aafd297
55b68da2-72b4-4c27-97b8-341fb273d819	\N	bfba074e-c64b-408c-bbc4-857eb8ba1e80	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	\N	1	2025-12-10 19:24:11.794948	2025-12-10 19:24:11.794948	c680802f-dcd9-44b8-a857-8c920aafd297
ecb8fa02-f42b-4268-baf4-f4ba325e7fad	50515928	\N	ec91db70-9bae-4aed-8add-e76751649b97	\N	3	2025-12-02 08:40:00.631909	2025-12-02 08:40:44.395	\N
f6b600b2-a002-403c-b468-b71ffad3c5aa	\N	2cb53daa-7cfd-4763-a39b-d052d9773e62	ec91db70-9bae-4aed-8add-e76751649b97	\N	1	2025-12-04 05:01:42.867699	2025-12-04 05:01:42.867699	\N
5f88ee27-c5ff-46a1-b02f-acbae0989b44	50515928	\N	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	\N	1	2025-12-06 04:22:48.563638	2025-12-06 04:22:48.563638	\N
bfacaeac-b1bf-4fb3-85ab-a91a164b7b59	\N	bfba074e-c64b-408c-bbc4-857eb8ba1e80	cc1d996a-beb3-43b3-b7f2-c30df9d6ab81	\N	1	2025-12-10 19:24:11.912608	2025-12-10 19:24:11.912608	c680802f-dcd9-44b8-a857-8c920aafd297
56b970f0-f885-4262-a3f4-50aed0bbb8fb	admin_combo_test	\N	ec91db70-9bae-4aed-8add-e76751649b97	\N	1	2025-12-11 03:07:30.337135	2025-12-11 03:07:30.337135	c680802f-dcd9-44b8-a857-8c920aafd297
63e0cee5-68eb-4c4a-bcae-1913133e87ae	admin_combo_test	\N	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	\N	1	2025-12-11 03:07:30.824458	2025-12-11 03:07:30.824458	c680802f-dcd9-44b8-a857-8c920aafd297
5761fe5f-2f7a-4353-99ec-4d6de5902708	\N	b27f046d-b4c3-4f06-b16c-8f29a3cf3727	ec91db70-9bae-4aed-8add-e76751649b97	\N	1	2025-12-10 18:52:16.441967	2025-12-10 18:52:16.441967	c680802f-dcd9-44b8-a857-8c920aafd297
5610a8fc-a423-467a-a087-09ff5890db6e	\N	b27f046d-b4c3-4f06-b16c-8f29a3cf3727	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	\N	1	2025-12-10 18:52:16.534367	2025-12-10 18:52:16.534367	c680802f-dcd9-44b8-a857-8c920aafd297
eed115c7-b270-47d9-9bf8-7631e16f5661	\N	b27f046d-b4c3-4f06-b16c-8f29a3cf3727	cc1d996a-beb3-43b3-b7f2-c30df9d6ab81	\N	1	2025-12-10 18:52:16.676517	2025-12-10 18:52:16.676517	c680802f-dcd9-44b8-a857-8c920aafd297
06ea6275-30c6-4a76-be33-2bf26432fa6e	\N	3056d691-2025-43d0-87ff-3e63fcb64152	ec91db70-9bae-4aed-8add-e76751649b97	\N	2	2025-12-10 18:55:24.82585	2025-12-10 18:55:25.455	c680802f-dcd9-44b8-a857-8c920aafd297
0fcb790e-e8ca-4871-9360-55ae81b67fb9	\N	3056d691-2025-43d0-87ff-3e63fcb64152	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	\N	2	2025-12-10 18:55:24.937747	2025-12-10 18:55:25.555	c680802f-dcd9-44b8-a857-8c920aafd297
c37a13b0-d330-4b06-9a59-417f90ee092a	\N	3056d691-2025-43d0-87ff-3e63fcb64152	cc1d996a-beb3-43b3-b7f2-c30df9d6ab81	\N	2	2025-12-10 18:55:25.068991	2025-12-10 18:55:25.68	c680802f-dcd9-44b8-a857-8c920aafd297
464d8195-0d14-4403-9330-d8d75bd6dee8	admin_combo_test	\N	cc1d996a-beb3-43b3-b7f2-c30df9d6ab81	\N	1	2025-12-11 03:07:31.268403	2025-12-11 03:07:31.268403	c680802f-dcd9-44b8-a857-8c920aafd297
86f74b89-6bed-47c7-a609-599e5b7c83c5	\N	893f6dd5-804f-4ebb-91db-ebb3876865a4	ec91db70-9bae-4aed-8add-e76751649b97	36e74621-7a20-48f7-acfb-d64435aa45fb	1	2025-12-11 03:21:28.482872	2025-12-11 03:21:28.482872	\N
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.categories (id, parent_id, name, slug, description, image_url, "position", is_active, created_at, updated_at, meta_title, meta_description, meta_keywords, icon_url, banner_url) FROM stdin;
90bfbd9f-a163-4612-88d5-79dc1e782591	\N	Clothing	clothing		\N	5	t	2025-12-01 14:46:01.893493	2025-12-01 17:56:42.546	\N	\N	\N	\N	\N
da0255ba-931f-4b1e-9448-ddf8eacfa85c	\N	Food	food		\N	1	t	2025-12-01 14:46:00.707722	2025-12-04 06:41:48.885	\N	\N	\N	\N	\N
b45c2758-6b51-4599-90dc-435281853757	da0255ba-931f-4b1e-9448-ddf8eacfa85c	Wild Treats	wild-treats		\N	1	t	2025-12-01 14:46:00.751644	2025-12-04 06:42:43.693	\N	\N	\N	/objects/uploads/e936d883-2890-4e8f-b50c-0d662f304775	/objects/uploads/d52f04ef-0f67-4d79-968a-26368659a32c
e37f529a-ab30-4edc-b9ad-fd4bb70096ee	b45c2758-6b51-4599-90dc-435281853757	Chicken	chicken		\N	1	t	2025-12-01 14:46:00.788086	2025-12-04 06:43:03.597	\N	\N	\N	/objects/uploads/aef351fe-4800-4d69-87b0-1c29ab1b4ac1	/objects/uploads/13c569eb-a59d-421b-8c2c-032d880d8e79
d8511783-cc1c-409d-b4fb-99a4bc71aad7	da0255ba-931f-4b1e-9448-ddf8eacfa85c	Full Meals	full-meals	Notebooks and ultrabooks	\N	2	t	2025-12-01 14:46:00.898879	2025-12-04 06:43:43.198	\N	\N	\N	\N	\N
f467933a-ecf5-449d-a339-1f059e7e0291	b45c2758-6b51-4599-90dc-435281853757	Duck	duck		\N	2	t	2025-12-01 14:46:00.825245	2025-12-04 06:44:04.816	\N	\N	\N	\N	\N
d797ef4b-9710-444c-9d15-f948d937a4a0	b45c2758-6b51-4599-90dc-435281853757	Turkey	turkey		\N	3	t	2025-12-01 14:46:00.862323	2025-12-04 06:44:19.79	\N	\N	\N	\N	\N
9055837d-dd5c-4d13-8fe2-5f051c761ecc	\N	Full Meal	full-meal		\N	2	f	2025-12-01 14:46:01.117954	2025-12-04 07:18:40.224	\N	\N	\N	\N	\N
16a11e8c-bb0d-42eb-88b9-ed210b893bac	da0255ba-931f-4b1e-9448-ddf8eacfa85c	Broth & Ice-Cream	broth-ice-cream	Headphones, speakers, and more	\N	3	t	2025-12-01 14:46:01.007703	2025-12-04 07:20:06.726	\N	\N	\N	\N	\N
4ff2a490-8f8e-49f3-a286-734a13306fc4	9055837d-dd5c-4d13-8fe2-5f051c761ecc	Men's Clothing	mens-clothing	\N	\N	1	f	2025-12-01 14:46:01.153866	2025-12-04 07:20:13.906	\N	\N	\N	\N	\N
845a5a8c-3948-4c3d-9f31-35380edb8704	9055837d-dd5c-4d13-8fe2-5f051c761ecc	Women's Clothing	womens-clothing	\N	\N	2	f	2025-12-01 14:46:01.301213	2025-12-04 07:20:22.562	\N	\N	\N	\N	\N
b9b84ec2-d47b-4b18-8212-d78543a63f9a	\N	Test Category 94lS - Edited	valid-test-slug-oj4e		\N	0	f	2025-12-04 06:50:24.345164	2025-12-04 07:17:26.368	\N	\N	\N	\N	\N
e0ac1ddf-6253-4878-bcd0-dc6ff4d814d9	9055837d-dd5c-4d13-8fe2-5f051c761ecc	Footwear	footwear	\N	\N	3	f	2025-12-01 14:46:01.408968	2025-12-04 07:20:29.947	\N	\N	\N	\N	\N
b8dbf5a2-f01a-42ac-ab1c-f298737b3c6e	\N	Broth	broth		\N	3	f	2025-12-01 14:46:01.51933	2025-12-04 07:20:35.358	\N	\N	\N	\N	\N
3fc5dead-8289-4aca-8088-21e0cc191d8a	b8dbf5a2-f01a-42ac-ab1c-f298737b3c6e	Furniture	furniture	\N	\N	1	f	2025-12-01 14:46:01.556332	2025-12-04 07:20:40.624	\N	\N	\N	\N	\N
b457473e-3e8b-4ac5-878a-443c80e80c2a	b8dbf5a2-f01a-42ac-ab1c-f298737b3c6e	Kitchen	kitchen	\N	\N	2	f	2025-12-01 14:46:01.665494	2025-12-04 07:20:45.637	\N	\N	\N	\N	\N
29dabfc1-de57-4afc-ac80-2f4b2ed193df	\N	Ice Cream	ice-cream		\N	4	f	2025-12-01 14:46:01.781153	2025-12-04 07:20:50.182	\N	\N	\N	\N	\N
828e1a95-57a8-4cbb-b882-fcbbb075d3f7	29dabfc1-de57-4afc-ac80-2f4b2ed193df	Fitness	fitness	\N	\N	1	f	2025-12-01 14:46:01.818289	2025-12-04 07:20:54.192	\N	\N	\N	\N	\N
ffb9e1a5-e75c-4418-b390-204552c70781	29dabfc1-de57-4afc-ac80-2f4b2ed193df	Camping	camping	\N	\N	2	f	2025-12-01 14:46:01.854852	2025-12-04 07:20:56.714	\N	\N	\N	\N	\N
be3bae5e-7af5-419a-a0af-6ea0794f584b	d8511783-cc1c-409d-b4fb-99a4bc71aad7	Gaming Laptops	gaming-laptops	\N	\N	1	t	2025-12-01 14:46:00.935445	2025-12-01 14:46:00.935445	\N	\N	\N	\N	\N
86e2c144-0b19-4140-b8e7-bbaa66e0ab48	d8511783-cc1c-409d-b4fb-99a4bc71aad7	Business Laptops	business-laptops	\N	\N	2	t	2025-12-01 14:46:00.971369	2025-12-01 14:46:00.971369	\N	\N	\N	\N	\N
59f54753-dad3-418f-a02b-31947fbd7503	16a11e8c-bb0d-42eb-88b9-ed210b893bac	Headphones	headphones	\N	\N	1	t	2025-12-01 14:46:01.043052	2025-12-01 14:46:01.043052	\N	\N	\N	\N	\N
d39f6b28-3260-4e15-b3e3-2578ec7f93e0	16a11e8c-bb0d-42eb-88b9-ed210b893bac	Speakers	speakers	\N	\N	2	t	2025-12-01 14:46:01.080317	2025-12-01 14:46:01.080317	\N	\N	\N	\N	\N
4814ae62-a209-4671-80fc-125709666132	4ff2a490-8f8e-49f3-a286-734a13306fc4	Shirts	mens-shirts	\N	\N	1	t	2025-12-01 14:46:01.19032	2025-12-01 14:46:01.19032	\N	\N	\N	\N	\N
c4ba257a-d51c-4b4e-8c98-794fe141f543	4ff2a490-8f8e-49f3-a286-734a13306fc4	Pants	mens-pants	\N	\N	2	t	2025-12-01 14:46:01.226813	2025-12-01 14:46:01.226813	\N	\N	\N	\N	\N
e09c3b97-86bf-4614-860d-8755bda16b6c	4ff2a490-8f8e-49f3-a286-734a13306fc4	Jackets	mens-jackets	\N	\N	3	t	2025-12-01 14:46:01.262895	2025-12-01 14:46:01.262895	\N	\N	\N	\N	\N
62d20a0c-9847-41ff-91c4-a0cb4aa81e9f	845a5a8c-3948-4c3d-9f31-35380edb8704	Dresses	womens-dresses	\N	\N	1	t	2025-12-01 14:46:01.335865	2025-12-01 14:46:01.335865	\N	\N	\N	\N	\N
9070c4b2-e652-4046-9de4-1d6fdcfe7bf7	845a5a8c-3948-4c3d-9f31-35380edb8704	Tops	womens-tops	\N	\N	2	t	2025-12-01 14:46:01.372603	2025-12-01 14:46:01.372603	\N	\N	\N	\N	\N
c43762c6-bb13-4f51-b705-0fc9eb539aa2	e0ac1ddf-6253-4878-bcd0-dc6ff4d814d9	Sneakers	sneakers	\N	\N	1	t	2025-12-01 14:46:01.445237	2025-12-01 14:46:01.445237	\N	\N	\N	\N	\N
68caa7bc-87e6-4d06-b0cc-e01a55a6c608	e0ac1ddf-6253-4878-bcd0-dc6ff4d814d9	Formal Shoes	formal-shoes	\N	\N	2	t	2025-12-01 14:46:01.482647	2025-12-01 14:46:01.482647	\N	\N	\N	\N	\N
a67ba3ef-79fe-44fe-be74-753f62f9f565	3fc5dead-8289-4aca-8088-21e0cc191d8a	Living Room	living-room-furniture	\N	\N	1	t	2025-12-01 14:46:01.592273	2025-12-01 14:46:01.592273	\N	\N	\N	\N	\N
fa40c504-007e-435b-a656-f1ff9e544b2b	3fc5dead-8289-4aca-8088-21e0cc191d8a	Bedroom	bedroom-furniture	\N	\N	2	t	2025-12-01 14:46:01.629102	2025-12-01 14:46:01.629102	\N	\N	\N	\N	\N
7d5f882e-5846-4b6f-aa8a-fa26b531b851	b457473e-3e8b-4ac5-878a-443c80e80c2a	Cookware	cookware	\N	\N	1	t	2025-12-01 14:46:01.701381	2025-12-01 14:46:01.701381	\N	\N	\N	\N	\N
69e37496-9dde-490d-881a-c7b75dd1cb18	b457473e-3e8b-4ac5-878a-443c80e80c2a	Appliances	kitchen-appliances	\N	\N	2	t	2025-12-01 14:46:01.743028	2025-12-01 14:46:01.743028	\N	\N	\N	\N	\N
62c70233-75f6-4747-a5fe-1383ccce5d93	90bfbd9f-a163-4612-88d5-79dc1e782591	Skincare	skincare	\N	\N	1	t	2025-12-01 14:46:01.930013	2025-12-01 14:46:01.930013	\N	\N	\N	\N	\N
cfe37f50-923e-4494-8ec3-bc202cd6ee9e	90bfbd9f-a163-4612-88d5-79dc1e782591	Makeup	makeup	\N	\N	2	t	2025-12-01 14:46:01.965636	2025-12-01 14:46:01.965636	\N	\N	\N	\N	\N
\.


--
-- Data for Name: combo_offers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.combo_offers (id, name, slug, description, image_url, product_ids, original_price, combo_price, discount_percentage, start_date, end_date, is_active, "position", created_at, updated_at, media_urls) FROM stdin;
c680802f-dcd9-44b8-a857-8c920aafd297	Chicken Treat Combo Offer 	chicken-treat-combo-offer	\N	/objects/uploads/7b64be0a-392d-40c1-8c22-dca42c2859ba	{ec91db70-9bae-4aed-8add-e76751649b97,1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d,cc1d996a-beb3-43b3-b7f2-c30df9d6ab81}	779.99	702.00	10.00	2025-12-09 00:00:00	2025-12-31 00:00:00	t	1	2025-12-09 05:47:53.504818	2025-12-09 09:44:05.707	{/objects/uploads/8fdcd214-3683-486b-9114-e0e24e700005,/objects/uploads/4eba7f10-2c49-4d5d-a0a0-057ab35cf512,/objects/uploads/6bbc45ca-6c78-42c5-b63e-7a8ecc263091,video::/objects/uploads/bf0efc98-1da5-460b-832c-4ba9f2203af7}
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.coupons (id, code, type, amount, min_cart_total, max_uses, used_count, is_active, expires_at, created_at, updated_at, product_id, description, min_quantity) FROM stdin;
d56b3469-daf0-4efa-9ae4-5b138763a63d	WELCOME10	percentage	10.00	\N	1000	0	t	2026-03-01 14:46:05.963	2025-12-01 14:46:05.982021	2025-12-01 14:46:05.982021	\N	\N	\N
3f827f52-969d-4bd1-b3f8-58f9f837ad32	SAVE20	percentage	20.00	\N	500	0	t	2026-03-01 14:46:06.002	2025-12-01 14:46:06.020865	2025-12-01 14:46:06.020865	\N	\N	\N
ca117070-f3eb-4e60-8386-c0d0b9e98f34	FLAT25	fixed	25.00	\N	200	0	t	2026-03-01 14:46:06.038	2025-12-01 14:46:06.05633	2025-12-01 14:46:06.05633	\N	\N	\N
c9039a36-3129-42fc-a91d-5a0a21bc5f9c	SUMMER30	percentage	30.00	\N	\N	0	t	2026-03-01 14:46:06.073	2025-12-01 14:46:06.092351	2025-12-01 14:46:06.092351	\N	\N	\N
68646b1e-c0d7-4c47-9865-b72ffd5eb42b	FREESHIP	fixed	10.00	\N	\N	0	t	2026-03-01 14:46:06.11	2025-12-01 14:46:06.128604	2025-12-01 14:46:06.128604	\N	\N	\N
b9b65d6b-7ddc-4bdd-8c7d-11c45b7b2e4e	1J25CNA9	percentage	15.00	\N	\N	0	t	\N	2025-12-01 19:52:27.463826	2025-12-01 19:52:27.463826	4df34427-905b-4cf3-af63-2df176183e31	\N	5
893a2af2-90cd-4a2d-8ecd-9ef8a7e1d4f8	N3GB6GV8	percentage	20.00	\N	\N	0	t	\N	2025-12-01 20:00:33.928005	2025-12-01 20:00:33.928005	4df34427-905b-4cf3-af63-2df176183e31	\N	5
8b58142f-8536-4333-833c-bd0c112ba44d	P1KUXRE8	percentage	15.00	\N	\N	0	t	\N	2025-12-01 20:19:48.157258	2025-12-01 20:19:48.157258	\N	\N	\N
c267fd66-9e22-403f-a368-a66538c59dfb	MSMTT2IO	percentage	25.00	\N	\N	0	t	\N	2025-12-01 20:25:09.907012	2025-12-01 20:25:09.907012	\N	\N	\N
fbefb116-d339-4ccc-a1a6-cee52e4af296	SAVEIN25	percentage	25.00	300.00	101	0	t	2025-12-31 00:00:00	2025-12-02 03:42:18.280153	2025-12-02 03:42:18.280153	\N	\N	\N
5235403d-6e4c-474c-a993-73a843944ab2	SAVEIN15	percentage	15.00	3000.00	101	0	t	2025-12-31 00:00:00	2025-12-02 03:43:31.213211	2025-12-02 03:43:31.213211	\N	\N	10
dd33113b-6ddf-4494-8f90-938072a15da7	TESTCART10	percentage	10.00	\N	\N	0	t	\N	2025-12-04 05:01:25.911974	2025-12-04 05:01:25.911974	\N	Test 10% discount	\N
5134cb8f-32f3-4555-9c69-9c7d33319e66	325JLWUI	percentage	25.00	300.00	\N	0	t	2025-12-31 00:00:00	2025-12-05 18:22:46.541662	2025-12-05 18:22:46.541662	ec91db70-9bae-4aed-8add-e76751649b97	\N	\N
\.


--
-- Data for Name: gift_registries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.gift_registries (id, user_id, share_code, title, event_type, event_date, description, cover_image, registrant_name, partner_name, shipping_address_id, is_public, show_purchased, allow_messages, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: gift_registry_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.gift_registry_items (id, registry_id, product_id, variant_id, quantity_desired, quantity_purchased, priority, note, is_purchased, purchased_by, purchased_at, created_at) FROM stdin;
\.


--
-- Data for Name: home_blocks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.home_blocks (id, type, title, payload, "position", is_active, created_at, updated_at) FROM stdin;
6c2f23f8-d343-4b72-ba81-cde3848c14d2	trending_products	Trending Now	\N	3	t	2025-12-01 14:46:06.424049	2025-12-01 14:46:06.424049
edbaae9c-6492-4184-8e2a-d11835fcc09b	promotional_banner	Special Offers	\N	4	t	2025-12-01 14:46:06.461193	2025-12-01 14:46:06.461193
bbc58424-e5cc-4111-ae35-a3c3befb3e16	new_arrivals	New Arrivals	\N	5	t	2025-12-01 14:46:06.497256	2025-12-01 14:46:06.497256
660277f3-1974-4a9a-9fc0-d73e410fd491	category_grid	Shop by Category	{}	1	t	2025-12-01 14:46:06.387228	2025-12-07 18:44:11.471
c0381ee4-aabd-4248-bc76-d02c2d83f085	featured_products	Featured Products	{}	2	t	2025-12-07 18:44:37.276582	2025-12-07 18:44:37.276582
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.order_items (id, order_id, product_id, variant_id, title, sku, price, quantity, image_url, created_at, gst_rate) FROM stdin;
9c1dcda1-05e6-4b93-81df-d3fe1145a480	ab83e071-e412-4c4b-b2bd-191e2c6b86c4	ec91db70-9bae-4aed-8add-e76751649b97	\N	Chicken Jerky - 60 Grams Pack	19DOGSC101	250.00	1	/objects/uploads/e72b7c6c-4e3a-4694-9b44-97e3c2b83fb0	2025-12-02 07:57:08.199082	18.00
b7785f6e-037c-4d6b-8113-3168af309e56	0e90f4e1-90e6-499d-97d9-c4a6e2a98a64	ec91db70-9bae-4aed-8add-e76751649b97	\N	Chicken Jerky - 60 Grams Pack	19DOGSC101	250.00	1	/objects/uploads/e72b7c6c-4e3a-4694-9b44-97e3c2b83fb0	2025-12-02 08:00:21.090841	18.00
6ba97c5f-3a72-492a-95e1-cb5751ee22b2	3b66f921-1ba1-40ed-a1b7-6fa291076778	ec91db70-9bae-4aed-8add-e76751649b97	\N	Chicken Jerky - 60 Grams Pack	19DOGSC101	250.00	3	/objects/uploads/e72b7c6c-4e3a-4694-9b44-97e3c2b83fb0	2025-12-02 08:24:06.073196	18.00
d2cf645e-fb9c-42ea-bfa1-8e0cd14e6ea4	d7418077-8d7b-40f7-9e90-e27a64071c76	ec91db70-9bae-4aed-8add-e76751649b97	\N	Chicken Jerky - 60 Grams Pack	19DOGSC101	250.00	1	/objects/uploads/e72b7c6c-4e3a-4694-9b44-97e3c2b83fb0	2025-12-02 08:30:42.051541	18.00
7fa9ae02-f70f-41ab-b53f-7743e93eb92e	642fda24-c46e-4788-ac5b-ba397c358d6c	ec91db70-9bae-4aed-8add-e76751649b97	\N	Chicken Jerky - 60 Grams Pack	19DOGSC101	250.00	1	/objects/uploads/e72b7c6c-4e3a-4694-9b44-97e3c2b83fb0	2025-12-02 08:32:17.157696	18.00
ab455d08-079c-4c30-a60b-447fb4080f70	8028bc89-7bd6-485b-ac14-8f87946ab66c	ec91db70-9bae-4aed-8add-e76751649b97	b996a4d9-a14b-464d-8ae2-27be787c1220	Chicken Jerky - 60 Grams Pack	19DOGSC101	250.00	1	/objects/uploads/e72b7c6c-4e3a-4694-9b44-97e3c2b83fb0	2025-12-02 08:39:05.828319	18.00
5287af6e-c9f7-4170-a432-2d7a49b64b28	f499be20-1aac-4151-9ea4-ac3eda42defc	ec91db70-9bae-4aed-8add-e76751649b97	\N	Chicken Jerky - 60 Grams Pack	19DOGSC101	250.00	1	/objects/uploads/e72b7c6c-4e3a-4694-9b44-97e3c2b83fb0	2025-12-04 06:16:11.091512	18.00
bd4a3738-8be6-446f-8beb-0df5c3e30ed8	f5885ff1-9570-41ca-a441-9e01daaca952	ec91db70-9bae-4aed-8add-e76751649b97	\N	Chicken Jerky - 60 Grams Pack	19DOGSC101	250.00	1	/objects/uploads/e72b7c6c-4e3a-4694-9b44-97e3c2b83fb0	2025-12-10 19:31:03.439596	18.00
4b51c791-5dc6-4d8a-978c-2b2f17c70768	f5885ff1-9570-41ca-a441-9e01daaca952	cc1d996a-beb3-43b3-b7f2-c30df9d6ab81	\N	Women's Silk Blouse	SKU-00048	129.99	1	https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=800&fit=crop	2025-12-10 19:31:03.439596	18.00
5b440265-dccc-4174-9197-356014283dd2	f5885ff1-9570-41ca-a441-9e01daaca952	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	\N	Chicken Body - 100 Grams	19DOGSC102	400.00	1	/objects/uploads/1e1ff6c4-e11b-4cde-aebd-73ff1922c698	2025-12-10 19:31:03.439596	18.00
db175d1a-8ba2-40b1-b5ae-b3e0a973fdf5	f5885ff1-9570-41ca-a441-9e01daaca952	ec91db70-9bae-4aed-8add-e76751649b97	\N	Chicken Jerky - 60 Grams Pack	19DOGSC101	250.00	1	/objects/uploads/e72b7c6c-4e3a-4694-9b44-97e3c2b83fb0	2025-12-10 19:31:03.439596	18.00
9cc689ac-9641-4d0f-9653-20bdfeaa44d8	48c5257f-4cac-409d-917d-7283795d4aba	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	\N	Chicken Body - 100 Grams	19DOGSC102	400.00	1	/objects/uploads/1e1ff6c4-e11b-4cde-aebd-73ff1922c698	2025-12-11 07:24:07.060107	5.00
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.orders (id, order_number, user_id, guest_email, subtotal, discount, tax, shipping_cost, total, status, payment_method, payment_status, shipping_address, billing_address, tracking_number, tracking_status, tracking_updates, coupon_code, notes, created_at, updated_at, razorpay_order_id, razorpay_payment_id) FROM stdin;
5f3b831d-0ee3-4ba9-9225-b8106a0b3a67	ORD-1764659152077-E9SP	50515928	\N	NaN	0.00	NaN	9.99	NaN	pending	cod	pending	\N	\N	\N	\N	\N	\N	\N	2025-12-02 07:05:52.096445	2025-12-02 07:05:52.096445	\N	\N
ab83e071-e412-4c4b-b2bd-191e2c6b86c4	ORD-1764662225615-H6K6	\N	testqxmi1n@example.com	250.00	0.00	20.00	99.00	369.00	pending	cod	pending	{"city": "Mumbai", "name": "Test User", "line1": "123 Test Street", "line2": "", "state": "Maharashtra", "country": "GB", "postalCode": "400001"}	{"city": "Mumbai", "name": "Test User", "line1": "123 Test Street", "line2": "", "state": "Maharashtra", "country": "GB", "postalCode": "400001"}	\N	\N	\N	\N	\N	2025-12-02 07:57:08.122634	2025-12-02 07:57:08.122634	\N	\N
0e90f4e1-90e6-499d-97d9-c4a6e2a98a64	ORD-1764662420908-32LB	\N	testuser-vphib@example.com	250.00	0.00	20.00	99.00	369.00	pending	cod	pending	{"city": "Delhi", "name": "Test Customer", "line1": "456 Test Avenue", "line2": "", "state": "Delhi", "country": "US", "postalCode": "1100019876543210"}	{"city": "Delhi", "name": "Test Customer", "line1": "456 Test Avenue", "line2": "", "state": "Delhi", "country": "US", "postalCode": "1100019876543210"}	\N	\N	\N	\N	\N	2025-12-02 08:00:21.048787	2025-12-02 08:00:21.048787	\N	\N
3b66f921-1ba1-40ed-a1b7-6fa291076778	ORD-1764663846022-U1WQ	50515928	\N	750.00	0.00	60.00	0.00	810.00	pending	cod	pending	{"city": "Chenani", "name": "Kavipriya Adding Smiles", "line1": "Dr Ranga Road, Mylapore", "line2": "23/40", "state": "Tamil Nadu", "country": "US", "postalCode": "600017"}	{"city": "Chenani", "name": "Kavipriya Adding Smiles", "line1": "Dr Ranga Road, Mylapore", "line2": "23/40", "state": "Tamil Nadu", "country": "US", "postalCode": "600017"}	\N	\N	\N	\N	\N	2025-12-02 08:24:06.022401	2025-12-02 08:24:06.022401	\N	\N
d7418077-8d7b-40f7-9e90-e27a64071c76	ORD-1764664239486-8HQL	\N	ordertest06k2v6@example.com	250.00	0.00	20.00	99.00	369.00	pending	cod	pending	{"city": "Bangalore", "name": "Order Test", "line1": "789 Test Road", "line2": "", "state": "Karnataka", "country": "US", "postalCode": "560001"}	{"city": "Bangalore", "name": "Order Test", "line1": "789 Test Road", "line2": "", "state": "Karnataka", "country": "US", "postalCode": "560001"}	\N	\N	\N	\N	\N	2025-12-02 08:30:41.980133	2025-12-02 08:30:41.980133	\N	\N
642fda24-c46e-4788-ac5b-ba397c358d6c	ORD-1764664337113-PDSM	50515928	\N	250.00	0.00	20.00	99.00	369.00	pending	cod	pending	{"city": "Chenani", "name": "Kavipriya Adding Smiles", "line1": "Dr Ranga Road, Mylapore", "line2": "23/40", "state": "Tamil Nadu", "country": "US", "postalCode": "600017"}	{"city": "Chenani", "name": "Kavipriya Adding Smiles", "line1": "Dr Ranga Road, Mylapore", "line2": "23/40", "state": "Tamil Nadu", "country": "US", "postalCode": "600017"}	\N	\N	\N	\N	\N	2025-12-02 08:32:17.117885	2025-12-02 08:32:17.117885	\N	\N
8028bc89-7bd6-485b-ac14-8f87946ab66c	ORD-1764664745655-V0YO	\N	gsttestd5ve8z@example.com	250.00	0.00	20.00	99.00	369.00	pending	cod	pending	{"city": "Chennai", "name": "GST Test", "line1": "100 Test Lane", "line2": "", "state": "Tamil Nadu", "country": "US", "postalCode": "6000019876543210"}	{"city": "Chennai", "name": "GST Test", "line1": "100 Test Lane", "line2": "", "state": "Tamil Nadu", "country": "US", "postalCode": "6000019876543210"}	\N	\N	\N	\N	\N	2025-12-02 08:39:05.782597	2025-12-02 08:39:05.782597	\N	\N
f499be20-1aac-4151-9ea4-ac3eda42defc	ORD-1764828970867-FWJ5	\N	test@example.com	250.00	0.00	20.00	99.00	369.00	pending	cod	pending	{"city": "Mumbai", "name": "Test Customer", "line1": "123 Test Street", "line2": "", "phone": "9876543210", "state": "Maharashtra", "country": "US", "postalCode": "400001"}	{"city": "Mumbai", "name": "Test Customer", "line1": "123 Test Street", "line2": "", "phone": "9876543210", "state": "Maharashtra", "country": "US", "postalCode": "400001"}	\N	\N	\N	\N	\N	2025-12-04 06:16:11.046844	2025-12-04 06:16:11.046844	\N	\N
f5885ff1-9570-41ca-a441-9e01daaca952	ORD-1765395063370-HL3G	9cc29ade-2d85-4e3f-99ea-ac94c496746b	\N	1029.99	0.00	82.40	0.00	1034.40	pending	cod	pending	{"city": "Chenani", "name": "Prasanna V", "line1": "Dr Ranga Road, Mylapore", "line2": "Mylapore ", "phone": "9941443009", "state": "Tamil Nadu", "country": "India", "gstNumber": "33AACCZ1221D1ZZ", "postalCode": "600004"}	{"city": "Chennai", "name": "Prasanna V", "line1": "6/11, Vidhyodhya Main Road", "line2": "T Nagar", "phone": "9941443009", "state": "Tamil Nadu", "country": "India", "gstNumber": "33AACCZ1221D1ZZ", "postalCode": "600017"}	\N	\N	\N	\N	\N	2025-12-10 19:31:03.389509	2025-12-10 19:31:03.389509	\N	\N
48c5257f-4cac-409d-917d-7283795d4aba	ORD-1765437846991-AFEU	9cc29ade-2d85-4e3f-99ea-ac94c496746b	\N	400.00	0.00	0.00	99.00	499.00	pending	cod	pending	{"city": "Chenani", "name": "Prasanna V", "line1": "Dr Ranga Road, Mylapore", "line2": "Mylapore ", "phone": "9941443009", "state": "Tamil Nadu", "country": "India", "gstNumber": "33AACCZ1221D1ZZ", "postalCode": "600004"}	{"city": "Chenani", "name": "Prasanna V", "line1": "Dr Ranga Road, Mylapore", "line2": "Mylapore ", "phone": "9941443009", "state": "Tamil Nadu", "country": "India", "gstNumber": "33AACCZ1221D1ZZ", "postalCode": "600004"}	\N	\N	\N	\N	\N	2025-12-11 07:24:07.011423	2025-12-11 07:24:07.011423	\N	\N
\.


--
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.otp_codes (id, email, phone, code, purpose, expires_at, verified, attempts, created_at) FROM stdin;
ddbd64e5-9373-455b-a577-c00a0374183c	test_umrpro@test.com	\N	318679	forgot_password	2025-12-10 16:06:06.425	t	0	2025-12-10 16:01:06.484682
\.


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_images (id, product_id, url, alt_text, is_primary, "position", created_at, media_type) FROM stdin;
0344fbdd-0c5d-4325-9856-1fab658f9243	ec91db70-9bae-4aed-8add-e76751649b97	/objects/uploads/e72b7c6c-4e3a-4694-9b44-97e3c2b83fb0	1	t	0	2025-12-06 13:46:00.304945	image
64bd7e68-2b55-4807-9902-d3a9a1179190	ec91db70-9bae-4aed-8add-e76751649b97	/objects/uploads/aa82a296-5c1a-4d25-af0d-d093ffc5a687	3	f	1	2025-12-06 13:46:00.349455	image
7bfa09dc-5100-42e9-933c-9d7282fa918a	ec91db70-9bae-4aed-8add-e76751649b97	/objects/uploads/8535a7cf-29a9-414f-b30e-bbf43b3919ca	4	f	2	2025-12-06 13:46:00.387931	image
45657c1d-46ab-4e9d-86a0-18a952a91127	ec91db70-9bae-4aed-8add-e76751649b97	/objects/uploads/dda74ea0-0d2c-4bf3-8fc4-2167cabfc704	5	f	3	2025-12-06 13:46:00.426495	image
9157ed0c-0403-4591-ba2d-a275e1bfb007	ec91db70-9bae-4aed-8add-e76751649b97	/objects/uploads/22a2e5ff-aa24-4f63-995b-1d7226350025	6	f	4	2025-12-06 13:46:00.463949	image
158be1d0-11fa-4656-a460-fbbcc282f532	ec91db70-9bae-4aed-8add-e76751649b97	/objects/uploads/c5a27afd-befe-4299-a216-825e650355e2	7	f	5	2025-12-06 13:46:00.502313	image
0cf0026d-5c07-4967-b18c-6f243ba09d30	ec91db70-9bae-4aed-8add-e76751649b97	/objects/uploads/4e98f135-1cf7-49e8-aba4-bbc8c43a65ac	9	f	6	2025-12-06 13:46:00.540456	image
686916fd-955f-4264-8557-7431fa5850c2	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	/objects/uploads/1e1ff6c4-e11b-4cde-aebd-73ff1922c698	1	t	0	2025-12-11 06:31:05.914498	image
107580b3-195d-49db-b624-297d3800a4b0	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	/objects/uploads/e33d3edf-2923-47e1-8e12-43dde7a40c88	2	f	1	2025-12-11 06:31:05.960029	image
8d523559-269c-4301-91ad-7c99de7aa276	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	/objects/uploads/45c98284-3f2d-4dd6-b931-ecd6c3a4821b	3	f	2	2025-12-11 06:31:06.000335	image
8ff01b13-c6d3-477d-a789-a31edec5dd12	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	/objects/uploads/9a3c1d99-d237-4a42-a911-eb98d9e79634	4	f	3	2025-12-11 06:31:06.039108	image
4db1452b-f04c-49e1-8e30-76e0855e988f	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	/objects/uploads/24a51c3f-595a-4961-860e-504e0ab290ea	5	f	4	2025-12-11 06:31:06.079035	image
c6d1b8f2-531d-40bc-81ce-6073e43502d1	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	/objects/uploads/e64ec5ba-d9d6-4620-b19f-d6e6f1e071f9	6	f	5	2025-12-11 06:31:06.117744	image
771563bf-6506-4fcb-a92b-7f7b1c2ec326	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	/objects/uploads/1c5940c5-c3ac-4f7d-9920-9c57be41b704	7	f	6	2025-12-11 06:31:06.156444	image
9afbb17c-d9c3-4624-b577-fd55792da60e	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	/objects/uploads/8a1e02a8-cac7-4d63-89ff-6ab0dbf65607	8	f	7	2025-12-11 06:31:06.195351	image
a10e5c2e-ef56-4f3f-a737-f8b9a2875edf	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	/objects/uploads/6411b266-b7fb-49cc-b68e-b009aaa75c16	9	f	8	2025-12-11 06:31:06.234272	image
55d91f87-f09c-468a-82c3-30aa32bb6839	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	/objects/uploads/e8d9ec52-c291-4f76-b05d-9bed4119c239	Add a heading (1)	f	9	2025-12-11 06:31:06.273226	video
c6e836ef-e6e3-47c1-9b97-7b2ae7ead11c	09797865-ea04-4d35-8f03-7ccf628b1b5a	https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop	Pro Max Smartphone	f	0	2025-12-01 14:46:02.372233	image
9bde2d5c-145d-4249-82d9-888646661309	0edeea8b-8e0a-4988-a5be-9bcfd74bed5c	https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop	Ultra HD Wireless Earbuds	f	0	2025-12-01 14:46:02.45707	image
53453308-933a-42b7-b5fc-cdfd2a129651	de8ef7e3-28a3-4eac-88bc-f43afe20270a	https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop	Gaming Laptop Elite	f	0	2025-12-01 14:46:02.531674	image
b1801a23-7444-4d31-92aa-327a89ab9826	1eb12ce6-0653-4701-b339-c475204a99c9	https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop	Business Ultrabook Pro	f	0	2025-12-01 14:46:02.602967	image
cc1f53ce-ebdc-4ac7-9ca8-ed09d63a4fcb	608ac208-01e9-4336-aa90-6fc93eb5f1e2	https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop	Smart Speaker Home Hub	f	0	2025-12-01 14:46:02.675152	image
def6255d-6c3b-4047-9be6-c9b5bb9807f8	f5df94b4-9870-4bac-a472-ed25c9ffc1c2	https://images.unsplash.com/photo-1560243563-062bfc001d68?w=800&h=800&fit=crop	Noise Cancelling Headphones	f	0	2025-12-01 14:46:02.747913	image
a46fdf87-4c38-49d2-8fd6-efed7a658a9a	fecbc0ad-2343-43fe-87fe-3a778457bdb7	https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop	Men's Premium Oxford Shirt	f	0	2025-12-01 14:46:02.821638	image
009cf03d-228f-4129-8c1c-6769344de23f	708ac653-6603-4599-a1b2-ae5a40ddfa19	https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=800&fit=crop	Classic Denim Jacket	f	0	2025-12-01 14:46:02.892992	image
0cfc6b70-d81b-4b81-bd72-cfb1b71b474c	a89dcfe9-3e56-4d41-ba94-835947039e02	https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop	Slim Fit Chinos	f	0	2025-12-01 14:46:02.965021	image
07822972-c9ed-4701-8ef6-2672f1d7ef8b	169e1d43-ba06-4cdf-a9f3-4c85fee90a9e	https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop	Women's Floral Maxi Dress	f	0	2025-12-01 14:46:03.045291	image
cee11bff-5d4f-49dc-bc9b-9e08dd7ca5c8	a530ee6f-bacf-4d63-a110-61a04ddc3d3c	https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop	Casual Blouse Top	f	0	2025-12-01 14:46:03.117384	image
4397d094-b7eb-4d60-b70b-c940f43359f0	ea4e9121-da22-47b3-a3fe-75bab504d8c3	https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop	Running Sneakers Pro	f	0	2025-12-01 14:46:03.189628	image
8907b7f4-3c31-4b35-9ce9-40f5e7c2b577	cfe40cc1-b074-4e2f-b1f9-ad5dafefe8e6	https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop	Classic Leather Oxfords	f	0	2025-12-01 14:46:03.262041	image
cfc96e02-773a-41bc-8c7b-3f643b6fea13	dc7ef7fc-12e0-43d0-92ab-f8179331cbbf	https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop	Modern Sectional Sofa	f	0	2025-12-01 14:46:03.333336	image
01608f19-6aa3-4bfa-98be-26d5ea9cc9d9	92ab6037-7398-4a56-a635-28fd2bddf4c0	https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop	King Size Platform Bed	f	0	2025-12-01 14:46:03.405586	image
d4acea45-ef3b-4ec0-a70a-2b13a2cac366	5c79d76a-4ac1-4cc6-ade6-1c67867f6e81	https://images.unsplash.com/photo-1560243563-062bfc001d68?w=800&h=800&fit=crop	Premium Cookware Set	f	0	2025-12-01 14:46:03.47719	image
a580853e-2a02-4347-8b4a-f8defc5d3959	359b07c7-a99e-4e91-a2c7-cbf6db966734	https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop	Smart Air Fryer	f	0	2025-12-01 14:46:03.556092	image
4282cf35-6af5-4e18-9393-dbf98dcf1eba	6dc5fb9e-3ac7-46c4-8899-699b44f75501	https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=800&fit=crop	Adjustable Dumbbells Set	f	0	2025-12-01 14:46:03.628698	image
526a2592-740f-41ca-978c-8e9705d80fe2	f9728b20-1b96-40ff-a1aa-98ed5c34739c	https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop	Camping Tent 4-Person	f	0	2025-12-01 14:46:03.700858	image
7e3a0147-ded9-4af1-88c4-b8c8aecebb19	e24fc547-33bf-4388-89f4-241678462252	https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop	Hydrating Face Serum	f	0	2025-12-01 14:46:03.7747	image
d78d07bf-cd84-4737-abcd-13bc557d6c27	8b5df609-dfe3-4684-ba67-48ffed4afb71	https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop	Full Coverage Foundation	f	0	2025-12-01 14:46:03.846959	image
377a1320-ce5d-48a6-ba0f-97257a30d465	c4ce1b8c-0c50-40c9-b3c8-2197a0701966	https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop	iPhone 15 Pro Case	f	0	2025-12-01 14:46:03.921241	image
e6c0d1dc-69e9-47c3-ae62-a9087063a676	f1343dc5-5d48-430e-9f33-e8ff7e1645c1	https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop	Android Fast Charger	f	0	2025-12-01 14:46:03.993006	image
1aa063df-91bb-4d6a-aea1-86b5d4e5d9e2	f22e4f16-d675-4396-9e4c-e707086ab3e2	https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop	Bluetooth Portable Speaker	f	0	2025-12-01 14:46:04.06491	image
157b2a6c-f899-410a-956a-df96a0dd5f6f	ab47685e-8447-4556-9200-71c093f539b8	https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop	Over-Ear Studio Headphones	f	0	2025-12-01 14:46:04.137867	image
b552a7d5-a50f-41df-8a6a-f9cbe07ad125	b421d2ef-ef5f-4a90-8b64-17e0adc747d6	https://images.unsplash.com/photo-1560243563-062bfc001d68?w=800&h=800&fit=crop	Men's Performance Polo	f	0	2025-12-01 14:46:04.209517	image
0fb2bb6b-449e-4683-a21a-e5b3379ef26f	b00fad75-3f31-4e90-a371-2869d95c8cd0	https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop	Winter Down Jacket	f	0	2025-12-01 14:46:04.281849	image
387c0c8c-1611-4e66-bba8-a1c4aafca4cc	68e5d6d8-9888-4fa5-92ed-102fbccfae1c	https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=800&fit=crop	Yoga Mat Premium	f	0	2025-12-01 14:46:04.354346	image
c2fad033-94d4-4af7-a298-0a3d7692ccad	2ba95941-2acc-4901-913f-286b11292134	https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop	Sleeping Bag Extreme	f	0	2025-12-01 14:46:04.426037	image
dd13f663-6079-4810-b4f4-8ce82cf3e75e	6f5826ab-736d-43f7-a2a6-8c407d4aa44a	https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop	Anti-Aging Night Cream	f	0	2025-12-01 14:46:04.498716	image
add7a461-85d1-4a31-8e87-17a9b46ea52d	14901bef-78cd-468c-ba64-5d4d5780cb6f	https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop	Eyeshadow Palette Pro	f	0	2025-12-01 14:46:04.570216	image
ba9bc27e-025a-44a7-956b-6ca0329c7dbd	8e191b0c-2adf-4bc7-ba67-f7dd02d3efca	https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop	Wireless Gaming Mouse	f	0	2025-12-01 14:46:04.642864	image
e9d3242a-c675-4e9a-a037-2832a4d221f9	9ed20c7b-bcbd-4091-acf3-68c4b09db63a	https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop	Mechanical Keyboard RGB	f	0	2025-12-01 14:46:04.714677	image
b6b37585-b68f-4bc1-a1a0-236199deda53	faf5e751-7418-49ae-a408-7b9eaaa36985	https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop	Women's Casual Sneakers	f	0	2025-12-01 14:46:04.788003	image
4c2a0e07-8e1a-435f-b966-295fd2a63dd8	dd5eeb33-0fa1-4b85-90d9-ef98177c3109	https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop	Men's Leather Belt	f	0	2025-12-01 14:46:04.861066	image
44f1844d-5d3f-4cb7-9bc5-68a9628b3ee0	1d090c6d-b61d-4434-99a5-4cc350e1b106	https://images.unsplash.com/photo-1560243563-062bfc001d68?w=800&h=800&fit=crop	Coffee Maker Deluxe	f	0	2025-12-01 14:46:04.93258	image
1a5d277a-bd48-4a4d-b2e0-68aebaa1744a	d897c553-cb07-4cb8-8a17-c8a03df01832	https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop	Non-Stick Pan Set	f	0	2025-12-01 14:46:05.005879	image
a2e54489-5990-4074-b6ae-7990532c95bc	41103785-feb1-4f68-9c01-4c88fceac29c	https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=800&fit=crop	Memory Foam Mattress	f	0	2025-12-01 14:46:05.080657	image
6caf5fc1-8200-4d5e-8d9c-19ccffacf2f1	f7a10ac2-7840-432e-b520-98f9a9689bea	https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop	Recliner Armchair	f	0	2025-12-01 14:46:05.153223	image
05467cea-7317-460b-bc89-f23998f80d95	4e88901c-950a-4bd9-9749-d89333c23074	https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop	Resistance Bands Set	f	0	2025-12-01 14:46:05.225572	image
b66497be-6261-4b8b-94c7-1692217225b1	b4f14f29-09be-4ab9-8024-31961a380c37	https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop	Hiking Backpack 50L	f	0	2025-12-01 14:46:05.296662	image
68f1bcc4-546b-4174-8be1-db82229c78e4	5ffd98c6-5b28-4819-b5b5-fc7f7b22e479	https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop	Vitamin C Brightening Serum	f	0	2025-12-01 14:46:05.368407	image
d4857da4-a9e0-4bf8-a91d-0fb8ec5cb256	27ebff27-b2d8-493c-91d4-766133ea38ca	https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop	Lipstick Collection Set	f	0	2025-12-01 14:46:05.440941	image
c45ff49c-6e30-42f9-b4b4-f0b26262f10f	bfeb8751-3aab-49a3-a645-9e10d8a2af58	https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop	USB-C Hub Multiport	f	0	2025-12-01 14:46:05.512102	image
40431bf6-d300-4098-9871-48de2caeed6a	c18d7117-6c00-4505-9346-1d0d760f1112	https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop	Laptop Stand Ergonomic	f	0	2025-12-01 14:46:05.583051	image
a2f6cae4-2d56-4fc1-b07d-0d56ec419677	03004fd8-ce56-4f82-99ff-aa4b2d0632ba	https://images.unsplash.com/photo-1560243563-062bfc001d68?w=800&h=800&fit=crop	True Wireless Earbuds Sport	f	0	2025-12-01 14:46:05.658048	image
6ad754e5-7da6-47a0-991d-30ff60c6dee6	32ec1041-f378-428c-b0be-336d20bba776	https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop	Floor Standing Speakers	f	0	2025-12-01 14:46:05.728979	image
a4d5e154-92a8-437f-b65e-f8ba3dd8b115	cc1d996a-beb3-43b3-b7f2-c30df9d6ab81	https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=800&fit=crop	Women's Silk Blouse	f	0	2025-12-01 14:46:05.799898	image
4b26abcf-48fb-4684-9099-06d3c8ff9d99	a3e4bd02-3493-47a1-91b2-cf9cba9df620	https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop	Evening Cocktail Dress	f	0	2025-12-01 14:46:05.872292	image
24d90351-3eff-41d9-bbba-b7e86862166c	4df34427-905b-4cf3-af63-2df176183e31	https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop	Men's Casual Sneakers	f	0	2025-12-01 14:46:05.945637	image
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_variants (id, product_id, option_name, option_value, sku, price, stock, created_at, sale_price) FROM stdin;
36e74621-7a20-48f7-acfb-d64435aa45fb	ec91db70-9bae-4aed-8add-e76751649b97	weight	60 G	\N	\N	100	2025-12-06 13:46:00.617932	\N
df81da89-329d-43dc-a019-37b1ba790d00	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	weight	100G	\N	450.00	30	2025-12-11 06:31:06.351373	400.00
3912f1d5-0eae-4f11-9c78-2034b4fe21b8	1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	weight	200	19DOGSC102-2	800.00	27	2025-12-11 06:31:06.391677	680.00
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.products (id, sku, title, slug, brand_id, category_id, short_desc, long_desc, price, sale_price, sale_price_start, sale_price_end, stock, weight, dimensions, is_featured, is_trending, is_active, average_rating, review_count, created_at, updated_at, meta_title, meta_description, meta_keywords, low_stock_threshold, allow_backorder, restock_date, warehouse_location, expected_delivery_days, is_new_arrival, is_on_sale, gst_rate, free_shipping, shipping_text, return_days, return_text, secure_checkout, secure_checkout_text, banner_url, banner_title, banner_subtitle, banner_cta_text, banner_cta_link, coupon_box_bg_color) FROM stdin;
1fd5f425-a921-4eb4-ad10-4fbbb70f5b8d	19DOGSC102	Chicken Body - 100 Grams	chicken-body-100-grams	41385d82-330e-4b72-a1ce-9b559ef1659f	e37f529a-ab30-4edc-b9ad-fd4bb70096ee	Dehydrated Chicken Meat \nReal meat of 240 grams converted into 60 grams of dehydrated meat.	<p>Product Description:\t\t</p><p>Treat your pet with a full chicken body and let them relish the complete nutritious goodness.</p><p>- Loaded with essential minerals</p><p>- High protein &amp; Low fat</p><p>- Rich in Multi-nutrients and amino acids</p><p>- Free from Grain, Gluten &amp; Preservatives</p><p>- No artificial coloring and flavoring</p><p>- No synthetic vitamins and minerals</p><p><strong>Benefits:</strong></p><p>- Strong bones &amp; Joints</p><p>- Good for regular chewing to enhance oral health</p><p>- Aids in growth and builds muscle</p><p>- Builds strong immunity</p><p><strong>Storage:</strong></p><p>-Store in a cool and dry place or in the refrigerator.</p><p>-Reseal the pack after use.</p><p>-Best before 6 months from the date of manufacture.</p><p><strong>Feeding Instructions:</strong></p><p>Feed up to 10-15 grams daily per 10kg bodyweight.</p>	450.00	400.00	\N	\N	57	0.10	10x20x5	t	f	t	0.0	0	2025-12-05 19:43:38.024527	2025-12-11 06:31:05.812	\N	\N	\N	\N	f	\N	\N	3	t	f	5.00	t	Free Shipping  above Rs 2500	4	Easy Returns	t	Secure Checkout	/objects/uploads/61d6097f-77bf-4093-abe7-cde2f9f1658c	\N	\N	\N	\N	#e0f2fe
3e8f8b80-70c5-4024-b5a1-e471f602366f	SKU-zft7aX	Test Product zft7aX	test-product-zft7ax		da0255ba-931f-4b1e-9448-ddf8eacfa85c			49.99	0.00	\N	\N	10	0.00	10x10x10	f	f	f	0.0	0	2025-12-01 20:43:11.141873	2025-12-02 03:56:42.483	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
ec91db70-9bae-4aed-8add-e76751649b97	19DOGSC101	Chicken Jerky - 60 Grams Pack	chicken-jerky-60-grams-pack	41385d82-330e-4b72-a1ce-9b559ef1659f	e37f529a-ab30-4edc-b9ad-fd4bb70096ee	Dehydrated 100% Human Grade Chicken Jerky\nReal meat of 240 grams converted into 60 grams of dehydrated meat.	Our protein-rich chicken jerky serves as the perfect nourishment for your dog and works great as a treat as well as a meal.\n100% natural fresh from farm Human Grade Chicken Brest\nFree from Grain, Preservative & Gluten\nHigh in protein to improve muscle strength\nRich in amino acids to help improve skin and fur quality\nLow calorie protein snack with high protein\nNo artificial coloring and flavoring\n\nBenefits:\t\n\nBuilds strong immunity\nImproves digestion\nAids in growth and builds muscle\n\nStorage:\n\nStore in a cool and dry place or in the refrigerator.\nReseal the pack after use.\nBest before 6 months from the date of manufacture.\n\nFeeding Instructions:\n\nSmall Dogs\t: 2-3 piece per day\nMedium Dogs\t: 3-4 pieces per day\nLarge Dogs\t: 4-5 pieces per day	300.00	250.00	2025-12-06 19:15:00	2025-12-31 19:15:00	100	0.06	10x20x5	t	t	t	0.0	0	2025-12-02 03:56:25.935332	2025-12-06 13:46:00.199	\N	\N	\N	\N	f	\N	\N	2	t	t	\N	t	Free Shipping  above Rs 2500	4	Easy Returns	t	Secure Checkout	/objects/uploads/3471d8ca-8553-4717-9a00-5d8d771f17db	Limited Time Offer	Buy Now	\N	\N	#f0fdf4
f1343dc5-5d48-430e-9f33-e8ff7e1645c1	SKU-00023	Android Fast Charger	android-fast-charger	dd8533e0-a721-4e73-95c7-438443269bc9	e37f529a-ab30-4edc-b9ad-fd4bb70096ee	High-quality android fast charger for everyday use.	Experience the excellence of our Android Fast Charger. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	24.99	\N	\N	\N	99	\N	\N	f	f	f	4.2	193	2025-12-01 14:46:03.95729	2025-12-01 19:03:34.078	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
8b5df609-dfe3-4684-ba67-48ffed4afb71	SKU-00021	Full Coverage Foundation	full-coverage-foundation	28fb7c4e-2065-400e-b9fc-c4ef0ea9bb65	cfe37f50-923e-4494-8ec3-bc202cd6ee9e	High-quality full coverage foundation for everyday use.	Experience the excellence of our Full Coverage Foundation. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	39.99	\N	\N	\N	64	\N	\N	f	f	t	3.9	26	2025-12-01 14:46:03.811057	2025-12-01 14:46:03.811057	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
c4ce1b8c-0c50-40c9-b3c8-2197a0701966	SKU-00022	iPhone 15 Pro Case	iphone-15-pro-case	dd8533e0-a721-4e73-95c7-438443269bc9	d797ef4b-9710-444c-9d15-f948d937a4a0	High-quality iphone 15 pro case for everyday use.	Experience the excellence of our iPhone 15 Pro Case. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	29.99	\N	\N	\N	44	\N	\N	f	f	t	4.3	173	2025-12-01 14:46:03.884262	2025-12-01 14:46:03.884262	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
f22e4f16-d675-4396-9e4c-e707086ab3e2	SKU-00024	Bluetooth Portable Speaker	bluetooth-portable-speaker	0cb7cf87-b568-4b12-aa70-7eae88464598	d39f6b28-3260-4e15-b3e3-2578ec7f93e0	High-quality bluetooth portable speaker for everyday use.	Experience the excellence of our Bluetooth Portable Speaker. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	79.99	\N	\N	\N	61	\N	\N	f	t	t	4.9	58	2025-12-01 14:46:04.029145	2025-12-01 14:46:04.029145	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
ab47685e-8447-4556-9200-71c093f539b8	SKU-00025	Over-Ear Studio Headphones	over-ear-studio-headphones	0cb7cf87-b568-4b12-aa70-7eae88464598	59f54753-dad3-418f-a02b-31947fbd7503	High-quality over-ear studio headphones for everyday use.	Experience the excellence of our Over-Ear Studio Headphones. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	249.99	\N	\N	\N	65	\N	\N	f	f	t	4.5	87	2025-12-01 14:46:04.10108	2025-12-01 14:46:04.10108	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
09797865-ea04-4d35-8f03-7ccf628b1b5a	SKU-00001	Pro Max Smartphone	pro-max-smartphone	dd8533e0-a721-4e73-95c7-438443269bc9	b45c2758-6b51-4599-90dc-435281853757	High-quality pro max smartphone for everyday use.	Experience the excellence of our Pro Max Smartphone. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	999.99	\N	\N	\N	30	\N	\N	t	t	t	4.6	23	2025-12-01 14:46:02.301125	2025-12-01 14:46:02.301125	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
0edeea8b-8e0a-4988-a5be-9bcfd74bed5c	SKU-00002	Ultra HD Wireless Earbuds	ultra-hd-wireless-earbuds	0cb7cf87-b568-4b12-aa70-7eae88464598	59f54753-dad3-418f-a02b-31947fbd7503	High-quality ultra hd wireless earbuds for everyday use.	Experience the excellence of our Ultra HD Wireless Earbuds. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	149.99	\N	\N	\N	22	\N	\N	t	f	t	3.7	112	2025-12-01 14:46:02.420919	2025-12-01 14:46:02.420919	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
de8ef7e3-28a3-4eac-88bc-f43afe20270a	SKU-00003	Gaming Laptop Elite	gaming-laptop-elite	dd8533e0-a721-4e73-95c7-438443269bc9	be3bae5e-7af5-419a-a0af-6ea0794f584b	High-quality gaming laptop elite for everyday use.	Experience the excellence of our Gaming Laptop Elite. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	1499.99	\N	\N	\N	88	\N	\N	f	t	t	3.9	109	2025-12-01 14:46:02.495007	2025-12-01 14:46:02.495007	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
1eb12ce6-0653-4701-b339-c475204a99c9	SKU-00004	Business Ultrabook Pro	business-ultrabook-pro	dd8533e0-a721-4e73-95c7-438443269bc9	86e2c144-0b19-4140-b8e7-bbaa66e0ab48	High-quality business ultrabook pro for everyday use.	Experience the excellence of our Business Ultrabook Pro. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	1299.99	\N	\N	\N	73	\N	\N	f	f	t	4.1	198	2025-12-01 14:46:02.567904	2025-12-01 14:46:02.567904	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
608ac208-01e9-4336-aa90-6fc93eb5f1e2	SKU-00005	Smart Speaker Home Hub	smart-speaker-home-hub	0cb7cf87-b568-4b12-aa70-7eae88464598	d39f6b28-3260-4e15-b3e3-2578ec7f93e0	High-quality smart speaker home hub for everyday use.	Experience the excellence of our Smart Speaker Home Hub. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	129.99	\N	\N	\N	105	\N	\N	t	f	t	3.8	2	2025-12-01 14:46:02.638202	2025-12-01 14:46:02.638202	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
f5df94b4-9870-4bac-a472-ed25c9ffc1c2	SKU-00006	Noise Cancelling Headphones	noise-cancelling-headphones	0cb7cf87-b568-4b12-aa70-7eae88464598	59f54753-dad3-418f-a02b-31947fbd7503	High-quality noise cancelling headphones for everyday use.	Experience the excellence of our Noise Cancelling Headphones. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	299.99	\N	\N	\N	28	\N	\N	f	f	t	3.7	74	2025-12-01 14:46:02.711785	2025-12-01 14:46:02.711785	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
fecbc0ad-2343-43fe-87fe-3a778457bdb7	SKU-00007	Men's Premium Oxford Shirt	men-s-premium-oxford-shirt	a852426c-18f3-4ee8-b168-007bc0521f65	4814ae62-a209-4671-80fc-125709666132	High-quality men's premium oxford shirt for everyday use.	Experience the excellence of our Men's Premium Oxford Shirt. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	89.99	\N	\N	\N	38	\N	\N	t	f	t	4.5	186	2025-12-01 14:46:02.784328	2025-12-01 14:46:02.784328	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
708ac653-6603-4599-a1b2-ae5a40ddfa19	SKU-00008	Classic Denim Jacket	classic-denim-jacket	ac0d759b-e35f-4ade-b950-4ed896b39aec	e09c3b97-86bf-4614-860d-8755bda16b6c	High-quality classic denim jacket for everyday use.	Experience the excellence of our Classic Denim Jacket. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	149.99	\N	\N	\N	58	\N	\N	f	t	t	4.9	158	2025-12-01 14:46:02.857108	2025-12-01 14:46:02.857108	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
a89dcfe9-3e56-4d41-ba94-835947039e02	SKU-00009	Slim Fit Chinos	slim-fit-chinos	a852426c-18f3-4ee8-b168-007bc0521f65	c4ba257a-d51c-4b4e-8c98-794fe141f543	High-quality slim fit chinos for everyday use.	Experience the excellence of our Slim Fit Chinos. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	69.99	\N	\N	\N	11	\N	\N	f	f	t	3.8	108	2025-12-01 14:46:02.928832	2025-12-01 14:46:02.928832	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
169e1d43-ba06-4cdf-a9f3-4c85fee90a9e	SKU-00010	Women's Floral Maxi Dress	women-s-floral-maxi-dress	a852426c-18f3-4ee8-b168-007bc0521f65	62d20a0c-9847-41ff-91c4-a0cb4aa81e9f	High-quality women's floral maxi dress for everyday use.	Experience the excellence of our Women's Floral Maxi Dress. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	129.99	\N	\N	\N	54	\N	\N	t	f	t	4.4	44	2025-12-01 14:46:03.002393	2025-12-01 14:46:03.002393	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
a530ee6f-bacf-4d63-a110-61a04ddc3d3c	SKU-00011	Casual Blouse Top	casual-blouse-top	a852426c-18f3-4ee8-b168-007bc0521f65	9070c4b2-e652-4046-9de4-1d6fdcfe7bf7	High-quality casual blouse top for everyday use.	Experience the excellence of our Casual Blouse Top. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	49.99	\N	\N	\N	60	\N	\N	f	f	t	3.7	94	2025-12-01 14:46:03.081383	2025-12-01 14:46:03.081383	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
ea4e9121-da22-47b3-a3fe-75bab504d8c3	SKU-00012	Running Sneakers Pro	running-sneakers-pro	62aa4dba-5ffa-462c-ab07-9819e9410fec	c43762c6-bb13-4f51-b705-0fc9eb539aa2	High-quality running sneakers pro for everyday use.	Experience the excellence of our Running Sneakers Pro. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	129.99	\N	\N	\N	108	\N	\N	f	t	t	4.5	164	2025-12-01 14:46:03.153356	2025-12-01 14:46:03.153356	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
cfe40cc1-b074-4e2f-b1f9-ad5dafefe8e6	SKU-00013	Classic Leather Oxfords	classic-leather-oxfords	a852426c-18f3-4ee8-b168-007bc0521f65	68caa7bc-87e6-4d06-b0cc-e01a55a6c608	High-quality classic leather oxfords for everyday use.	Experience the excellence of our Classic Leather Oxfords. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	189.99	\N	\N	\N	59	\N	\N	f	f	t	4.2	131	2025-12-01 14:46:03.226015	2025-12-01 14:46:03.226015	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
dc7ef7fc-12e0-43d0-92ab-f8179331cbbf	SKU-00014	Modern Sectional Sofa	modern-sectional-sofa	f66a6d42-70d9-4c06-bf90-dce5d38e6d25	a67ba3ef-79fe-44fe-be74-753f62f9f565	High-quality modern sectional sofa for everyday use.	Experience the excellence of our Modern Sectional Sofa. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	1299.99	\N	\N	\N	105	\N	\N	t	f	t	3.8	65	2025-12-01 14:46:03.297614	2025-12-01 14:46:03.297614	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
92ab6037-7398-4a56-a635-28fd2bddf4c0	SKU-00015	King Size Platform Bed	king-size-platform-bed	f66a6d42-70d9-4c06-bf90-dce5d38e6d25	fa40c504-007e-435b-a656-f1ff9e544b2b	High-quality king size platform bed for everyday use.	Experience the excellence of our King Size Platform Bed. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	899.99	\N	\N	\N	11	\N	\N	f	f	t	4.6	68	2025-12-01 14:46:03.369445	2025-12-01 14:46:03.369445	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
5c79d76a-4ac1-4cc6-ade6-1c67867f6e81	SKU-00016	Premium Cookware Set	premium-cookware-set	f66a6d42-70d9-4c06-bf90-dce5d38e6d25	7d5f882e-5846-4b6f-aa8a-fa26b531b851	High-quality premium cookware set for everyday use.	Experience the excellence of our Premium Cookware Set. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	299.99	\N	\N	\N	48	\N	\N	f	t	t	4.1	124	2025-12-01 14:46:03.441761	2025-12-01 14:46:03.441761	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
359b07c7-a99e-4e91-a2c7-cbf6db966734	SKU-00017	Smart Air Fryer	smart-air-fryer	f66a6d42-70d9-4c06-bf90-dce5d38e6d25	69e37496-9dde-490d-881a-c7b75dd1cb18	High-quality smart air fryer for everyday use.	Experience the excellence of our Smart Air Fryer. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	149.99	\N	\N	\N	74	\N	\N	f	f	t	4.8	162	2025-12-01 14:46:03.515251	2025-12-01 14:46:03.515251	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
6dc5fb9e-3ac7-46c4-8899-699b44f75501	SKU-00018	Adjustable Dumbbells Set	adjustable-dumbbells-set	62aa4dba-5ffa-462c-ab07-9819e9410fec	828e1a95-57a8-4cbb-b882-fcbbb075d3f7	High-quality adjustable dumbbells set for everyday use.	Experience the excellence of our Adjustable Dumbbells Set. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	249.99	\N	\N	\N	12	\N	\N	t	f	t	5.0	112	2025-12-01 14:46:03.592885	2025-12-01 14:46:03.592885	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
f9728b20-1b96-40ff-a1aa-98ed5c34739c	SKU-00019	Camping Tent 4-Person	camping-tent-4-person	62aa4dba-5ffa-462c-ab07-9819e9410fec	ffb9e1a5-e75c-4418-b390-204552c70781	High-quality camping tent 4-person for everyday use.	Experience the excellence of our Camping Tent 4-Person. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	199.99	\N	\N	\N	54	\N	\N	f	f	t	4.4	188	2025-12-01 14:46:03.664845	2025-12-01 14:46:03.664845	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
e24fc547-33bf-4388-89f4-241678462252	SKU-00020	Hydrating Face Serum	hydrating-face-serum	28fb7c4e-2065-400e-b9fc-c4ef0ea9bb65	62c70233-75f6-4747-a5fe-1383ccce5d93	High-quality hydrating face serum for everyday use.	Experience the excellence of our Hydrating Face Serum. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	59.99	\N	\N	\N	56	\N	\N	t	f	t	4.9	87	2025-12-01 14:46:03.73803	2025-12-01 14:46:03.73803	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
b421d2ef-ef5f-4a90-8b64-17e0adc747d6	SKU-00026	Men's Performance Polo	men-s-performance-polo	62aa4dba-5ffa-462c-ab07-9819e9410fec	4814ae62-a209-4671-80fc-125709666132	High-quality men's performance polo for everyday use.	Experience the excellence of our Men's Performance Polo. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	59.99	\N	\N	\N	15	\N	\N	f	f	t	3.6	156	2025-12-01 14:46:04.173401	2025-12-01 14:46:04.173401	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
b00fad75-3f31-4e90-a371-2869d95c8cd0	SKU-00027	Winter Down Jacket	winter-down-jacket	ac0d759b-e35f-4ade-b950-4ed896b39aec	e09c3b97-86bf-4614-860d-8755bda16b6c	High-quality winter down jacket for everyday use.	Experience the excellence of our Winter Down Jacket. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	249.99	\N	\N	\N	68	\N	\N	f	f	t	3.5	5	2025-12-01 14:46:04.246115	2025-12-01 14:46:04.246115	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
68e5d6d8-9888-4fa5-92ed-102fbccfae1c	SKU-00028	Yoga Mat Premium	yoga-mat-premium	28f74601-d793-4967-952d-f733c16edad3	828e1a95-57a8-4cbb-b882-fcbbb075d3f7	High-quality yoga mat premium for everyday use.	Experience the excellence of our Yoga Mat Premium. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	49.99	\N	\N	\N	80	\N	\N	f	f	t	4.9	71	2025-12-01 14:46:04.318196	2025-12-01 14:46:04.318196	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
2ba95941-2acc-4901-913f-286b11292134	SKU-00029	Sleeping Bag Extreme	sleeping-bag-extreme	62aa4dba-5ffa-462c-ab07-9819e9410fec	ffb9e1a5-e75c-4418-b390-204552c70781	High-quality sleeping bag extreme for everyday use.	Experience the excellence of our Sleeping Bag Extreme. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	129.99	\N	\N	\N	17	\N	\N	f	f	t	4.9	95	2025-12-01 14:46:04.390166	2025-12-01 14:46:04.390166	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
6f5826ab-736d-43f7-a2a6-8c407d4aa44a	SKU-00030	Anti-Aging Night Cream	anti-aging-night-cream	28fb7c4e-2065-400e-b9fc-c4ef0ea9bb65	62c70233-75f6-4747-a5fe-1383ccce5d93	High-quality anti-aging night cream for everyday use.	Experience the excellence of our Anti-Aging Night Cream. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	89.99	\N	\N	\N	55	\N	\N	f	f	t	3.8	156	2025-12-01 14:46:04.462323	2025-12-01 14:46:04.462323	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
14901bef-78cd-468c-ba64-5d4d5780cb6f	SKU-00031	Eyeshadow Palette Pro	eyeshadow-palette-pro	28fb7c4e-2065-400e-b9fc-c4ef0ea9bb65	cfe37f50-923e-4494-8ec3-bc202cd6ee9e	High-quality eyeshadow palette pro for everyday use.	Experience the excellence of our Eyeshadow Palette Pro. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	49.99	\N	\N	\N	90	\N	\N	f	f	t	4.2	150	2025-12-01 14:46:04.534114	2025-12-01 14:46:04.534114	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
8e191b0c-2adf-4bc7-ba67-f7dd02d3efca	SKU-00032	Wireless Gaming Mouse	wireless-gaming-mouse	dd8533e0-a721-4e73-95c7-438443269bc9	be3bae5e-7af5-419a-a0af-6ea0794f584b	High-quality wireless gaming mouse for everyday use.	Experience the excellence of our Wireless Gaming Mouse. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	79.99	\N	\N	\N	69	\N	\N	f	f	t	4.3	34	2025-12-01 14:46:04.606774	2025-12-01 14:46:04.606774	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
9ed20c7b-bcbd-4091-acf3-68c4b09db63a	SKU-00033	Mechanical Keyboard RGB	mechanical-keyboard-rgb	dd8533e0-a721-4e73-95c7-438443269bc9	be3bae5e-7af5-419a-a0af-6ea0794f584b	High-quality mechanical keyboard rgb for everyday use.	Experience the excellence of our Mechanical Keyboard RGB. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	149.99	\N	\N	\N	59	\N	\N	t	f	t	5.0	129	2025-12-01 14:46:04.678766	2025-12-01 14:46:04.678766	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
faf5e751-7418-49ae-a408-7b9eaaa36985	SKU-00034	Women's Casual Sneakers	women-s-casual-sneakers	a852426c-18f3-4ee8-b168-007bc0521f65	c43762c6-bb13-4f51-b705-0fc9eb539aa2	High-quality women's casual sneakers for everyday use.	Experience the excellence of our Women's Casual Sneakers. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	89.99	\N	\N	\N	64	\N	\N	f	f	t	4.5	12	2025-12-01 14:46:04.751612	2025-12-01 14:46:04.751612	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
dd5eeb33-0fa1-4b85-90d9-ef98177c3109	SKU-00035	Men's Leather Belt	men-s-leather-belt	a852426c-18f3-4ee8-b168-007bc0521f65	c4ba257a-d51c-4b4e-8c98-794fe141f543	High-quality men's leather belt for everyday use.	Experience the excellence of our Men's Leather Belt. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	45.99	\N	\N	\N	35	\N	\N	f	f	t	4.1	70	2025-12-01 14:46:04.82464	2025-12-01 14:46:04.82464	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
1d090c6d-b61d-4434-99a5-4cc350e1b106	SKU-00036	Coffee Maker Deluxe	coffee-maker-deluxe	f66a6d42-70d9-4c06-bf90-dce5d38e6d25	69e37496-9dde-490d-881a-c7b75dd1cb18	High-quality coffee maker deluxe for everyday use.	Experience the excellence of our Coffee Maker Deluxe. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	199.99	\N	\N	\N	43	\N	\N	f	t	t	4.9	192	2025-12-01 14:46:04.896125	2025-12-01 14:46:04.896125	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
d897c553-cb07-4cb8-8a17-c8a03df01832	SKU-00037	Non-Stick Pan Set	non-stick-pan-set	f66a6d42-70d9-4c06-bf90-dce5d38e6d25	7d5f882e-5846-4b6f-aa8a-fa26b531b851	High-quality non-stick pan set for everyday use.	Experience the excellence of our Non-Stick Pan Set. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	89.99	\N	\N	\N	100	\N	\N	f	f	t	3.9	156	2025-12-01 14:46:04.968271	2025-12-01 14:46:04.968271	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
41103785-feb1-4f68-9c01-4c88fceac29c	SKU-00038	Memory Foam Mattress	memory-foam-mattress	f66a6d42-70d9-4c06-bf90-dce5d38e6d25	fa40c504-007e-435b-a656-f1ff9e544b2b	High-quality memory foam mattress for everyday use.	Experience the excellence of our Memory Foam Mattress. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	799.99	\N	\N	\N	108	\N	\N	t	f	t	4.7	31	2025-12-01 14:46:05.044668	2025-12-01 14:46:05.044668	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
f7a10ac2-7840-432e-b520-98f9a9689bea	SKU-00039	Recliner Armchair	recliner-armchair	f66a6d42-70d9-4c06-bf90-dce5d38e6d25	a67ba3ef-79fe-44fe-be74-753f62f9f565	High-quality recliner armchair for everyday use.	Experience the excellence of our Recliner Armchair. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	599.99	\N	\N	\N	94	\N	\N	f	f	t	3.9	16	2025-12-01 14:46:05.117316	2025-12-01 14:46:05.117316	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
4e88901c-950a-4bd9-9749-d89333c23074	SKU-00040	Resistance Bands Set	resistance-bands-set	28f74601-d793-4967-952d-f733c16edad3	828e1a95-57a8-4cbb-b882-fcbbb075d3f7	High-quality resistance bands set for everyday use.	Experience the excellence of our Resistance Bands Set. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	29.99	\N	\N	\N	13	\N	\N	f	f	t	4.5	137	2025-12-01 14:46:05.189908	2025-12-01 14:46:05.189908	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
b4f14f29-09be-4ab9-8024-31961a380c37	SKU-00041	Hiking Backpack 50L	hiking-backpack-50l	62aa4dba-5ffa-462c-ab07-9819e9410fec	ffb9e1a5-e75c-4418-b390-204552c70781	High-quality hiking backpack 50l for everyday use.	Experience the excellence of our Hiking Backpack 50L. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	149.99	\N	\N	\N	51	\N	\N	f	t	t	4.5	72	2025-12-01 14:46:05.26107	2025-12-01 14:46:05.26107	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
5ffd98c6-5b28-4819-b5b5-fc7f7b22e479	SKU-00042	Vitamin C Brightening Serum	vitamin-c-brightening-serum	28fb7c4e-2065-400e-b9fc-c4ef0ea9bb65	62c70233-75f6-4747-a5fe-1383ccce5d93	High-quality vitamin c brightening serum for everyday use.	Experience the excellence of our Vitamin C Brightening Serum. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	44.99	\N	\N	\N	38	\N	\N	f	f	t	3.8	38	2025-12-01 14:46:05.332019	2025-12-01 14:46:05.332019	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
27ebff27-b2d8-493c-91d4-766133ea38ca	SKU-00043	Lipstick Collection Set	lipstick-collection-set	28fb7c4e-2065-400e-b9fc-c4ef0ea9bb65	cfe37f50-923e-4494-8ec3-bc202cd6ee9e	High-quality lipstick collection set for everyday use.	Experience the excellence of our Lipstick Collection Set. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	69.99	\N	\N	\N	43	\N	\N	f	f	t	4.2	57	2025-12-01 14:46:05.404617	2025-12-01 14:46:05.404617	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
bfeb8751-3aab-49a3-a645-9e10d8a2af58	SKU-00044	USB-C Hub Multiport	usb-c-hub-multiport	dd8533e0-a721-4e73-95c7-438443269bc9	86e2c144-0b19-4140-b8e7-bbaa66e0ab48	High-quality usb-c hub multiport for everyday use.	Experience the excellence of our USB-C Hub Multiport. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	49.99	\N	\N	\N	61	\N	\N	f	f	t	4.6	138	2025-12-01 14:46:05.477173	2025-12-01 14:46:05.477173	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
c18d7117-6c00-4505-9346-1d0d760f1112	SKU-00045	Laptop Stand Ergonomic	laptop-stand-ergonomic	dd8533e0-a721-4e73-95c7-438443269bc9	86e2c144-0b19-4140-b8e7-bbaa66e0ab48	High-quality laptop stand ergonomic for everyday use.	Experience the excellence of our Laptop Stand Ergonomic. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	39.99	\N	\N	\N	56	\N	\N	f	f	t	4.6	84	2025-12-01 14:46:05.548113	2025-12-01 14:46:05.548113	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
03004fd8-ce56-4f82-99ff-aa4b2d0632ba	SKU-00046	True Wireless Earbuds Sport	true-wireless-earbuds-sport	0cb7cf87-b568-4b12-aa70-7eae88464598	59f54753-dad3-418f-a02b-31947fbd7503	High-quality true wireless earbuds sport for everyday use.	Experience the excellence of our True Wireless Earbuds Sport. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	99.99	\N	\N	\N	91	\N	\N	t	f	t	3.6	73	2025-12-01 14:46:05.6221	2025-12-01 14:46:05.6221	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
32ec1041-f378-428c-b0be-336d20bba776	SKU-00047	Floor Standing Speakers	floor-standing-speakers	0cb7cf87-b568-4b12-aa70-7eae88464598	d39f6b28-3260-4e15-b3e3-2578ec7f93e0	High-quality floor standing speakers for everyday use.	Experience the excellence of our Floor Standing Speakers. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	599.99	\N	\N	\N	55	\N	\N	f	f	t	3.8	94	2025-12-01 14:46:05.692931	2025-12-01 14:46:05.692931	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
cc1d996a-beb3-43b3-b7f2-c30df9d6ab81	SKU-00048	Women's Silk Blouse	women-s-silk-blouse	a852426c-18f3-4ee8-b168-007bc0521f65	9070c4b2-e652-4046-9de4-1d6fdcfe7bf7	High-quality women's silk blouse for everyday use.	Experience the excellence of our Women's Silk Blouse. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	129.99	\N	\N	\N	13	\N	\N	f	f	t	4.0	86	2025-12-01 14:46:05.765231	2025-12-01 14:46:05.765231	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
a3e4bd02-3493-47a1-91b2-cf9cba9df620	SKU-00049	Evening Cocktail Dress	evening-cocktail-dress	a852426c-18f3-4ee8-b168-007bc0521f65	62d20a0c-9847-41ff-91c4-a0cb4aa81e9f	High-quality evening cocktail dress for everyday use.	Experience the excellence of our Evening Cocktail Dress. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	199.99	\N	\N	\N	15	\N	\N	f	t	t	4.5	77	2025-12-01 14:46:05.835981	2025-12-01 14:46:05.835981	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
4df34427-905b-4cf3-af63-2df176183e31	SKU-00050	Men's Casual Sneakers	men-s-casual-sneakers	ac0d759b-e35f-4ade-b950-4ed896b39aec	c43762c6-bb13-4f51-b705-0fc9eb539aa2	High-quality men's casual sneakers for everyday use.	Experience the excellence of our Men's Casual Sneakers. This premium product combines innovative design with exceptional functionality. Perfect for those who demand the best quality and performance. Made with premium materials and backed by our satisfaction guarantee.	99.99	\N	\N	\N	30	\N	\N	f	f	t	4.3	73	2025-12-01 14:46:05.909878	2025-12-01 14:46:05.909878	\N	\N	\N	10	f	\N	\N	5	f	f	18.00	t	Free Shipping	30	Easy Returns	t	Secure Checkout	\N	\N	\N	\N	\N	#f0fdf4
\.


--
-- Data for Name: quick_pages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.quick_pages (id, title, slug, content, excerpt, status, show_in_footer, footer_section, "position", meta_title, meta_description, meta_keywords, published_at, created_at, updated_at) FROM stdin;
f59d636b-0956-43df-b8d8-7f19636db562	Test Privacy Policy 7cjK5J	privacy-test-rhxhtv			draft	t	quick_links	0	Test Privacy Policy 7cjK5J			\N	2025-12-10 06:08:12.684576	2025-12-10 06:08:12.684576
\.


--
-- Data for Name: review_votes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.review_votes (id, review_id, user_id, session_id, is_helpful, created_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reviews (id, product_id, user_id, order_id, rating, title, content, is_verified_purchase, is_approved, helpful_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
UftAksfQf_qk01ofUojp8C76UcaZsK0Z	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-17T06:24:55.606Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "admin_combo_test"}, "dbUser": {"id": "admin_combo_test", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "User", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Admin", "updatedAt": "2025-12-09T05:35:28.255Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "isAdminAuth": true}}}	2025-12-17 06:24:56
cGxhq6nZg0t2lT2mL8raa7X3pW2IOL_y	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-17T18:39:48.806Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "92d8c535-f154-4938-92bc-d40725e548f7"}, "dbUser": {"id": "92d8c535-f154-4938-92bc-d40725e548f7", "role": "customer", "email": "photo_test_hy0xwx@test.com", "phone": "", "lastName": "Tester", "createdAt": "2025-12-10T18:38:53.200Z", "firstName": "Photo", "updatedAt": "2025-12-10T18:39:20.342Z", "passwordHash": "$2b$12$l5V620BW1g/IX3b/IkxFJ.YOOOK/1/t3XVa42eY3PNmOAbQf7x.IO", "profileImageUrl": "/objects/uploads/214f48b6-ada6-4452-a626-8615331ee6cf"}}}}	2025-12-17 18:39:49
tuGpJlPwD1CwLtJAp84qNexVX6MMJ2ss	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-13T19:12:39.928Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765051906, "iat": 1765048306, "iss": "https://test-mock-oidc.replit.app/", "jti": "a855fc79097e707a0bda865b2c71e312", "sub": "main-admin", "email": "admin@19dogs.com", "auth_time": 1765048306, "last_name": "Admin", "first_name": "Store"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-06T19:11:46.618Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "expires_at": 1765051906, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MDQ4MzA2LCJleHAiOjE3NjUwNTE5MDYsInN1YiI6Im1haW4tYWRtaW4iLCJlbWFpbCI6ImFkbWluQDE5ZG9ncy5jb20iLCJmaXJzdF9uYW1lIjoiU3RvcmUiLCJsYXN0X25hbWUiOiJBZG1pbiJ9.qCI8rsOBjBfI5eHTzGfZaKOxo_LR2sWTSYLNxUA8EKxp0N1nD-9-vLOdfg0d0kv9_JKhWm-j5dvkyblGRz5KM83Tq9erisN3UcbmGDMLNlMKHPKQmkAllToqMNgWYawumAAL9qDG3TmiPlcEDdr8f2B5H2fp066RmApElia8RYb3LrHho59YU2LcDNuqBs0VreU-BEp0eWFOsr2rQECdeHgnYqeegKUXXwnYU384MJFNZhr3vhyGQx35SxWaoAg5Mltosh-6sEHp6oS_d4KOWx7_uMwadfobGaG90ChdtfeX57jMJWCkA0jaZCwq_2Co1RngIV5NGYvzKiJ3VXil0A", "refresh_token": "eyJzdWIiOiJtYWluLWFkbWluIiwiZW1haWwiOiJhZG1pbkAxOWRvZ3MuY29tIiwiZmlyc3RfbmFtZSI6IlN0b3JlIiwibGFzdF9uYW1lIjoiQWRtaW4ifQ"}}}	2025-12-13 19:12:40
PncDVJq7KYCXjwOOISn2tHXbSx_wJQ3K	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-17T15:59:09.038Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "00d89e0e-47b4-49d1-a0d3-0c812b07aa7b"}, "dbUser": {"id": "00d89e0e-47b4-49d1-a0d3-0c812b07aa7b", "role": "customer", "email": "test_umrpro@test.com", "phone": null, "lastName": "User", "createdAt": "2025-12-10T15:58:54.160Z", "firstName": "Test", "updatedAt": "2025-12-10T15:58:54.160Z", "passwordHash": "$2b$12$V0IZQo3/Mx.gQD9LM5qTT.KfndMK2FoG4cGWZ4vOyv5FA5uHTSRcy", "profileImageUrl": null}}}}	2025-12-17 15:59:10
CAZY8dVsJBAvWdLWuvBmTeuSyFzHFb5J	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-11T15:28:36.047Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "test-mock-oidc.replit.app": {"code_verifier": "6EzXCIT1qCgx-gNirobw7vHKg4GvwPmmlMYe13cakds"}}	2025-12-13 03:59:42
RL2Kr6OZyJ-6AkkSCjobHIeOTTnTdHww	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-17T06:08:41.587Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604799999}, "passport": {"user": {"claims": {"sub": "admin_combo_test"}, "dbUser": {"id": "admin_combo_test", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "User", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Admin", "updatedAt": "2025-12-09T05:35:28.255Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "isAdminAuth": true}}}	2025-12-17 06:08:42
UpQZGHcVZ99lNRviMsb8Y-rxPRtjiCdg	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-17T06:04:50.117Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "admin_combo_test"}, "dbUser": {"id": "admin_combo_test", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "User", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Admin", "updatedAt": "2025-12-09T05:35:28.255Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "isAdminAuth": true}}}	2025-12-17 06:04:51
6gaJr3pL5tIBfKFXvCmzgdgNR5dLS8SX	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-19T02:57:53.878Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604799993}, "passport": {"user": {"claims": {"sub": "9cc29ade-2d85-4e3f-99ea-ac94c496746b", "email": "prasanna@addingsmiles.com", "last_name": "V", "first_name": "Prasanna"}, "dbUser": {"id": "9cc29ade-2d85-4e3f-99ea-ac94c496746b", "role": "customer", "email": "prasanna@addingsmiles.com", "phone": "9941443009", "lastName": "V", "createdAt": "2025-12-10T18:08:05.859Z", "firstName": "Prasanna", "updatedAt": "2025-12-10T18:34:39.877Z", "passwordHash": "$2b$12$/fxNlKK4Xd6HWYgD2h7In.1CaAnGSkk5UCdW.yqbB7UU3ED5fgTFG", "profileImageUrl": "/objects/uploads/90219048-7e88-4802-b90f-dc6a28805e35"}}}}	2025-12-19 02:57:54
DEYMgH5SPPOoJ4kbDFIQSbplk6Z8eMV8	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-17T16:05:26.893Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "d6a44156-b8ce-43b0-9793-6e3b9675769b"}, "dbUser": {"id": "d6a44156-b8ce-43b0-9793-6e3b9675769b", "role": "customer", "email": "test_signup_vmtyz6@test.com", "phone": null, "lastName": "User", "createdAt": "2025-12-10T16:05:12.629Z", "firstName": "Test", "updatedAt": "2025-12-10T16:05:12.629Z", "passwordHash": "$2b$12$Pv5aT32UV5B4/.tm2JkW4.fnlhuLNYKzkw/FR5YUeXcZYjYhXxwve", "profileImageUrl": null}}}}	2025-12-17 16:05:27
RkF2Jp5x6uotvfmq3uGYRMs0VT61ZuPu	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-17T18:17:48.283Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604799999}, "passport": {"user": {"claims": {"sub": "c87c1863-77ac-4d07-8d25-479bca795644"}, "dbUser": {"id": "c87c1863-77ac-4d07-8d25-479bca795644", "role": "customer", "email": "profile_test_kryczp@test.com", "phone": "+91 98765 43210", "lastName": "Tester", "createdAt": "2025-12-10T18:17:17.846Z", "firstName": "Profile", "updatedAt": "2025-12-10T18:17:40.829Z", "passwordHash": "$2b$12$5KYnNKIncxEYOoUmGPqxqupnto1JSBbxJGTrVmAseNOPTU3JgHrX2", "profileImageUrl": null}}}}	2025-12-17 18:17:49
EtrQYOEu71x_SDIxc_jy33OIQW2nQzZg	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-17T15:26:04.243Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "admin_combo_test"}, "dbUser": {"id": "admin_combo_test", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "User", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Admin", "updatedAt": "2025-12-09T05:35:28.255Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "isAdminAuth": true}}}	2025-12-17 15:26:05
rGfH7gL7PqIktaqra9wTmNkgvtI0ZLrv	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-17T06:28:27.138Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604799999}, "passport": {"user": {"claims": {"sub": "admin_combo_test"}, "dbUser": {"id": "admin_combo_test", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "User", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Admin", "updatedAt": "2025-12-09T05:35:28.255Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "isAdminAuth": true}}}	2025-12-17 06:28:28
Lu9UYrlPmWfsceoGGfMqHTs_g4KM2quq	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-12T19:11:43.760Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1764965487, "iat": 1764961887, "iss": "https://test-mock-oidc.replit.app/", "jti": "f87cc08f87f8a8a51cf5029a2f29f437", "sub": "8xMeaY", "email": "8xMeaY@example.com", "auth_time": 1764961887, "last_name": "Doe", "first_name": "John"}, "dbUser": {"id": "8xMeaY", "role": "customer", "email": "8xMeaY@example.com", "phone": null, "lastName": "Doe", "createdAt": "2025-12-05T19:11:27.772Z", "firstName": "John", "updatedAt": "2025-12-05T19:11:27.772Z", "profileImageUrl": null}, "expires_at": 1764965487, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY0OTYxODg3LCJleHAiOjE3NjQ5NjU0ODcsInN1YiI6Ijh4TWVhWSIsImVtYWlsIjoiOHhNZWFZQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IkpvaG4iLCJsYXN0X25hbWUiOiJEb2UifQ.ZDAqQ60HLn1FGYWql5ycl4LU7_slMMP5IwGsR8puNZDE9O_AgU9zbLPkW4-CYZyfZxbgEkJ-3Vbs9aRicxmue1YjjiICkNuSSG8K4jtulTPrcykspvSCHvRxKKV1wDZkhaXLrCa3GmSpStvTe3o0_O5jvsqAd6aijREJIHgaqD1hrdUeukEtmovOiOgHQQkWJ90b-54HcZPdUF1uz1Z0QlLHnjrVH2ZCULZV0NFiabFJhSx44NXLzdSfSnzx3oxH-XK1VeTAmOMP8ZLgdX0V4PIx__n8iZm6QqvYUCMEMuiUrENZGiSR5JPZWRaUof_BMqfOVyyrT6thOmMfvBDYKg", "refresh_token": "eyJzdWIiOiI4eE1lYVkiLCJlbWFpbCI6Ijh4TWVhWUBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJKb2huIiwibGFzdF9uYW1lIjoiRG9lIn0"}}}	2025-12-12 19:11:44
hQGI8tvZRK4jEHiqdNdABam5xmVYfazt	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-15T15:13:55.591Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765210326, "iat": 1765206726, "iss": "https://test-mock-oidc.replit.app/", "jti": "af0d8d87277965bc48836be262d16af6", "sub": "admin_test_combo3", "email": "admin@19dogs.com", "auth_time": 1765206726, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "admin_test_combo3", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "User", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Admin", "updatedAt": "2025-12-08T15:12:06.778Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "expires_at": 1765210326, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MjA2NzI2LCJleHAiOjE3NjUyMTAzMjYsInN1YiI6ImFkbWluX3Rlc3RfY29tYm8zIiwiZW1haWwiOiJhZG1pbkAxOWRvZ3MuY29tIiwiZmlyc3RfbmFtZSI6IkFkbWluIiwibGFzdF9uYW1lIjoiVXNlciJ9.TR6tce9Rk2vsV6-_FZ-M_at0Zj0ujiaJeyVRNnruO3VWHzgMwYMpImK7wlzmRfW8aG37ltvOLjxHmNmIGYLQB-hUfJ_Oa9efHCl3g-ItyoxZWXeuQz_mdi_OGEyHH6meA6TJxaCHayl3MwY6rPxebcQ8q4ABGjKSzVHpv8AvyEWJ7ZP1Z2NwTYThLQDQ2SBq5k-GFTR3ehgQx4YT3yFq_ip8haRKOpbRFr5hUwTMOEJxDlQ3M69C5X3NTVQaefwyQJl82B7ss5dcvgEc7KtT9xLNpbe_IImGwnHSQO72dTPT-4yPnv9RdU_jWCn5S7H_1RuAjlKeki0aemytWSu_Hw", "refresh_token": "eyJzdWIiOiJhZG1pbl90ZXN0X2NvbWJvMyIsImVtYWlsIjoiYWRtaW5AMTlkb2dzLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIifQ"}}}	2025-12-15 15:13:56
eS50LdlR6FovC_80C6Wa6L8xwoL15KKl	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-15T07:04:57.988Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "main-admin"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-07T19:09:51.836Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "isAdminAuth": true}}}	2025-12-15 07:04:58
PCuAxgVMbRtLBO6qhpY3WW2uVoVaeRLZ	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-15T07:52:00.889Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "main-admin"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-07T19:09:51.836Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "isAdminAuth": true}}}	2025-12-15 07:52:01
9Z4hG9aH-Ej8cZit5vkUWfEnr2yBesgc	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-15T07:44:57.279Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604799999}, "passport": {"user": {"claims": {"sub": "main-admin"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-07T19:09:51.836Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "isAdminAuth": true}}}	2025-12-15 07:44:58
RXwi6oMmch61MTQog2Hc8JavoeARB2mA	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-13T14:00:10.569Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604799996}, "passport": {"user": {"claims": {"sub": "main-admin"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-06T13:24:25.215Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}}}}	2025-12-13 14:00:11
Ly4NC9VAL9vUanGKT4HPUxQz7wKlHllC	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-17T18:14:52.680Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "4be663b9-9631-464b-aef3-2abbfc297391"}, "dbUser": {"id": "4be663b9-9631-464b-aef3-2abbfc297391", "role": "customer", "email": "profile_test_x2lphr@test.com", "phone": null, "lastName": "Tester", "createdAt": "2025-12-10T18:14:40.818Z", "firstName": "Profile", "updatedAt": "2025-12-10T18:14:40.818Z", "passwordHash": "$2b$12$mG3P5SvwBFNTTGjoSksemOKchUYZtWK1l0v1WMARpLTT.AihPWKy2", "profileImageUrl": null}}}}	2025-12-17 18:14:53
wkezkLhaNcqfVDcfAlWfMSJd2nOKMwHZ	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-13T04:28:10.564Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1764998879, "iat": 1764995279, "iss": "https://test-mock-oidc.replit.app/", "jti": "067f896be0fae73151459b35723b84b9", "sub": "admin-test-123", "email": "admin@example.com", "auth_time": 1764995279, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "admin-test-123", "role": "admin", "email": "admin@example.com", "phone": null, "lastName": "User", "createdAt": "2025-12-04T06:49:05.721Z", "firstName": "Admin", "updatedAt": "2025-12-06T04:27:59.799Z", "profileImageUrl": null}, "expires_at": 1764998879, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY0OTk1Mjc5LCJleHAiOjE3NjQ5OTg4NzksInN1YiI6ImFkbWluLXRlc3QtMTIzIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIifQ.RC8lxe1dtdRkozVeqaUjSBpFs82mHYWLU-aGer444c3hNywGwoSW-bIVc6LkEezgLV057EQMGydb296rIf4R7TvpxeGX3fNIaLeecfOJKlZYhp1jPI1HSMzjqeiRjdhYkI8vmkUfTzea5XcijsA544UZYEb7uQUkpREnKaaa32GU_pzq92tM5sApE14HEXO_3BMOpoygn42alEvJA2vk9RswLcIs1D97oSbiTG96stncEzUmntTVALPnUcGRCnSLotlbH0h0NEUfKX__03ARzNn_bBDLAzpk1x1EG0rBJfk2ZEtJdfUyGL4VR7BpTKBI1SilIf3HpeHCaU5ovr8VoA", "refresh_token": "eyJzdWIiOiJhZG1pbi10ZXN0LTEyMyIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIn0"}}}	2025-12-13 04:28:11
1HbmXKQB5UD8IckZFUXTWCSiKrIZdo3Z	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-15T07:57:51.050Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "main-admin"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-07T19:09:51.836Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "isAdminAuth": true}}}	2025-12-15 07:57:52
52_0JkE9s1P6bjOUKihe6b_RAjZGxkra	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-15T08:24:45.012Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "main-admin"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-07T19:09:51.836Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "isAdminAuth": true}}}	2025-12-15 08:24:46
AebofhxvQq6q20rs-MuHXRecNGuVb0Kk	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-15T07:09:19.438Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "main-admin"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-07T19:09:51.836Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "isAdminAuth": true}}}	2025-12-15 07:09:20
MJMxq2j-JPx78vBrHeHVfvRH3ALj1TQL	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-14T18:59:14.704Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604799999}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765137546, "iat": 1765133946, "iss": "https://test-mock-oidc.replit.app/", "jti": "0438c7cd35e7cf0d2d057aeb4af85133", "sub": "main-admin", "email": "admin@19dogs.com", "auth_time": 1765133945, "last_name": "Admin", "first_name": "Store"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-07T18:59:06.241Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "expires_at": 1765137546, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MTMzOTQ2LCJleHAiOjE3NjUxMzc1NDYsInN1YiI6Im1haW4tYWRtaW4iLCJlbWFpbCI6ImFkbWluQDE5ZG9ncy5jb20iLCJmaXJzdF9uYW1lIjoiU3RvcmUiLCJsYXN0X25hbWUiOiJBZG1pbiJ9.Is_ipKIrROORJIl9NgKvIh3afoK06kJJaVCzunEzbNUaLQurgdFyW6d7NOXvL3B-LwzRf3IUnndWJJrpPiUK-95vXKLxQaw-0yqpDsa6rEtkm_v-Urgyx7yO0In1UG9jCeT3wzLXKbwWTzA9Z1cVwA49sLtSogol_cOI9buxw_4LII3iUt8dVyUggju1bDcV5ADxTsGeNFQVBPWVTYOs00KVKVyuTHX-aHyGJLxVHkLcgVr4ZJyJ16W3r7rg2qk31Mu3dvuswJ3_GqO2UJpZsJD-gykrx6PdlCkewaTe_B7_NUwooHQZ115KoB5ydA0XKz8M9aikl5MLqVZ8cniNRA", "refresh_token": "eyJzdWIiOiJtYWluLWFkbWluIiwiZW1haWwiOiJhZG1pbkAxOWRvZ3MuY29tIiwiZmlyc3RfbmFtZSI6IlN0b3JlIiwibGFzdF9uYW1lIjoiQWRtaW4ifQ"}}}	2025-12-14 18:59:15
ZTirTwTFLASCmYNlzsoMdZ1kGO4UDts2	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-14T18:57:40.837Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765137430, "iat": 1765133830, "iss": "https://test-mock-oidc.replit.app/", "jti": "3389824fb1b2f7ed6c246045d2c711b5", "sub": "main-admin", "email": "admin@19dogs.com", "auth_time": 1765133830, "last_name": "Admin", "first_name": "Store"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-07T18:57:10.911Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "expires_at": 1765137430, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MTMzODMwLCJleHAiOjE3NjUxMzc0MzAsInN1YiI6Im1haW4tYWRtaW4iLCJlbWFpbCI6ImFkbWluQDE5ZG9ncy5jb20iLCJmaXJzdF9uYW1lIjoiU3RvcmUiLCJsYXN0X25hbWUiOiJBZG1pbiJ9.gPSZefsT8k1wQeEyIg2eO5aShYQjiuCN_HwBa2mkp_qyPdT5k7L2jC9-d_nUykMdzpEEcHKdJrrNQ19poPpn8uBSyeSjFC6o-6za9G0awSx7NjBuMku_kyvRMBrAEpFW-A_VTsT3d36D0nvVs0mRuhiiQreGXAWUvgHgQFioq2kuFvL4QZRaRCyoQ773L9iC6RkoFzKVezvjTs-nhGmT_a4saW-jU1VX9XIB7hdB4itL7pyTbc-TdavusvRouWVqUcAO2XFPFPoRB9TiBPej2Rx-25pg8Nq_7QftIOih5KKp28EYQsh9KHvxbSdKo76D8s9cHuboKn_avrm0tFVW2A", "refresh_token": "eyJzdWIiOiJtYWluLWFkbWluIiwiZW1haWwiOiJhZG1pbkAxOWRvZ3MuY29tIiwiZmlyc3RfbmFtZSI6IlN0b3JlIiwibGFzdF9uYW1lIjoiQWRtaW4ifQ"}}}	2025-12-14 18:57:41
ST9aLVYy9aznhQx2FZIYf30t3cv7IfBs	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-15T08:27:22.209Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "main-admin"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-07T19:09:51.836Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "isAdminAuth": true}}}	2025-12-15 08:27:23
azOJtZlGtQlgqfsfCC8eR2zHXM3vjQUN	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-15T07:47:47.094Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "main-admin"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-07T19:09:51.836Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "isAdminAuth": true}}}	2025-12-15 07:47:48
AoK_Qpw-f1rM2-gCdDI_esRxsVIJJexL	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-17T16:10:25.190Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604799999}, "passport": {"user": {"claims": {"sub": "9865b1f0-ac30-468f-97dc-bb0101828b4b"}, "dbUser": {"id": "9865b1f0-ac30-468f-97dc-bb0101828b4b", "role": "customer", "email": "testuser_fx2euu@test.com", "phone": null, "lastName": "User", "createdAt": "2025-12-10T16:08:42.492Z", "firstName": "Test", "updatedAt": "2025-12-10T16:09:43.130Z", "passwordHash": "$2b$12$RJ3RzJ.1P6f0txhSmUP2we3IU/8SGGDZIomtVD7GU4plmXYNYVsda", "profileImageUrl": null}}}}	2025-12-17 16:10:26
tuQAszh4ypOgpFKQNP2M-kvQDiiTjPtl	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-15T15:25:53.732Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765211122, "iat": 1765207522, "iss": "https://test-mock-oidc.replit.app/", "jti": "c9bf271cd9dd7eac9a2a19dce21937d5", "sub": "admin_combo_upload", "email": "admin@19dogs.com", "auth_time": 1765207522, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "admin_combo_upload", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "User", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Admin", "updatedAt": "2025-12-08T15:25:22.239Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "expires_at": 1765211122, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MjA3NTIyLCJleHAiOjE3NjUyMTExMjIsInN1YiI6ImFkbWluX2NvbWJvX3VwbG9hZCIsImVtYWlsIjoiYWRtaW5AMTlkb2dzLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIifQ.s2jDk8ZiSxb8rKg4VKENR_gqvK2BlU6ZmqEDrLnbNyFuuoOTdRtXYfMCVEedfxOB5Oyfqobx8Ru9CIh0So4O0wjz3ek1FbpalC_Rt--f48tHHs-ikjSC24ic4TVsykr1thZ2trtjqHTVKOqcMNBvP7E6WOJICv46Tq5Asp47WV0Ew_V2IF4BccmcTwCS-XkjfT6cv4-jp2lGtarhFes0IeJTj7HoBfWbFwxmrJf6PLSRtD9Nat7OcAbayzuIbs1aFm5Y9TBrQrCfdP6GHWZrVqZl79EtGmVkYPSE1UilJVbuzW88iQ-034lnoseMMFImqp9YXWwR7Gex097Tu0BXDA", "refresh_token": "eyJzdWIiOiJhZG1pbl9jb21ib191cGxvYWQiLCJlbWFpbCI6ImFkbWluQDE5ZG9ncy5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIn0"}}}	2025-12-15 15:25:54
wbffIcnTshg-foC_DUwf4AeqnbgofX_S	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-15T17:33:08.083Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765218767, "iat": 1765215167, "iss": "https://test-mock-oidc.replit.app/", "jti": "cbed24a19e429c2f0476027138ea5e3c", "sub": "admin_test_combo", "email": "admin@19dogs.com", "roles": ["admin"], "auth_time": 1765215167, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "admin_test_combo", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "User", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Admin", "updatedAt": "2025-12-08T17:32:47.425Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "expires_at": 1765218767, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MjE1MTY3LCJleHAiOjE3NjUyMTg3NjcsInN1YiI6ImFkbWluX3Rlc3RfY29tYm8iLCJlbWFpbCI6ImFkbWluQDE5ZG9ncy5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIiwicm9sZXMiOlsiYWRtaW4iXX0.vhYmPuhExGs1TmNwZm5rQ1eXow-c0w0ldiW2ln0lSjAyE5PUGZUw_QTkN2TTryismblAkW2vSx3AtNjaMhieFhs9m6FhZNZ03_F20aown8L3kY8e5_XxgI8QZPc5rN_ET-6l_h1vHVEszOU2Q05ttiClBXcLJ52R3CzinKDQmpiIGhwRaNMovz0RwOJEhpk0LiDB2JJCh9uhdaCuJ3xRLU0uo0_3BYZvOHq1Q1mlWO8LLjb06eIc_txA47IAhyDs0WxHfKap-pgmYAS7ZN_itV4WBTgtQJD6hXWn83MnWnTtXhivtHmO3QYzOlnF1GyQLU32DkEBrjnxj_ww_VeGqQ", "refresh_token": "eyJzdWIiOiJhZG1pbl90ZXN0X2NvbWJvIiwiZW1haWwiOiJhZG1pbkAxOWRvZ3MuY29tIiwiZmlyc3RfbmFtZSI6IkFkbWluIiwibGFzdF9uYW1lIjoiVXNlciIsInJvbGVzIjpbImFkbWluIl19"}}}	2025-12-15 17:33:09
HsccIFlnZ6YORYTrwDcbHkxUM5DVDuaY	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-13T19:06:37.796Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765051533, "iat": 1765047933, "iss": "https://test-mock-oidc.replit.app/", "jti": "ff6388b4d7919039d8feba1c419f078c", "sub": "main-admin", "email": "admin@19dogs.com", "auth_time": 1765047933, "last_name": "Admin", "first_name": "Store"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-06T19:05:33.215Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "expires_at": 1765051533, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MDQ3OTMzLCJleHAiOjE3NjUwNTE1MzMsInN1YiI6Im1haW4tYWRtaW4iLCJlbWFpbCI6ImFkbWluQDE5ZG9ncy5jb20iLCJmaXJzdF9uYW1lIjoiU3RvcmUiLCJsYXN0X25hbWUiOiJBZG1pbiJ9.nR9Qpl5hxsN89jaxH_kfVfPu4uogangzQSAas-AHDELNkAQ2_lvr--mEdgfDfpdZmEpFS_G_qHdc3PNmnnPh6J2ANZ6KWI47AiFU-w_S-1xEop24-H-YdmG0kSrkN3TP3DfTNtCI0_EpVDqzBQvXhTpr5XursqnElOcpcXQqYt-XULF5aWnAWIq5tnGyAnTulDNkAzPlKeHqTSch22ecaPovswnMqPiYG1Geg2kbz-2C4pOQWNs8Ip1PzdLZfAwdxpX0oKsS3u8jcAKlgTiOhe7Y-ueMkd52g6p0zCygw7gNs89DFl8Da08HNGSuqBu-w8VMGa6ROFHil7P-UrL1Bg", "refresh_token": "eyJzdWIiOiJtYWluLWFkbWluIiwiZW1haWwiOiJhZG1pbkAxOWRvZ3MuY29tIiwiZmlyc3RfbmFtZSI6IlN0b3JlIiwibGFzdF9uYW1lIjoiQWRtaW4ifQ"}}}	2025-12-13 19:06:38
n1O8tjDw_JbH-okPV4YlGebvHUV00cNP	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-13T04:43:11.924Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1764999747, "iat": 1764996147, "iss": "https://test-mock-oidc.replit.app/", "jti": "41b4fcea655e6afb2cf4d34c9b7706b2", "sub": "admin-brand-test", "email": "admin@example.com", "auth_time": 1764996147, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "admin-brand-test", "role": "admin", "email": "admin@example.com", "phone": null, "lastName": "User", "createdAt": "2025-12-04T06:49:05.721Z", "firstName": "Admin", "updatedAt": "2025-12-06T04:42:27.903Z", "profileImageUrl": null}, "expires_at": 1764999747, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY0OTk2MTQ3LCJleHAiOjE3NjQ5OTk3NDcsInN1YiI6ImFkbWluLWJyYW5kLXRlc3QiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IkFkbWluIiwibGFzdF9uYW1lIjoiVXNlciJ9.LiSnYt7pfAeuykC3uOcZf28Dr63FKRasWPglvzoRMg0kirG-qZHayXcSE4YHSSZxDGroe8ebz1dOMV_mbAcBL2k9_ZwjhsbD57LaA2EL9uwn8pzNcwk3imNqQ--WmX7RLYXTII6c7hK80OU9hWP-to_JfG_IIfOTBYuO3iEgHoMHhF1iNFTcgvo-X3bHBI4jdmW7aNvZnutv4pVLEaJf0YiaqGcydwZE1dn-kkX_EoxbO_n786mRtfAC0GigzvzU4Edmr_9nJapGRecR9lgcjyymDNqUOk5SNSySys0dSpLTGKxAPO_ZX6dz7bJjoJrdgkFZpqnRRwpaFyXdvxx-5Q", "refresh_token": "eyJzdWIiOiJhZG1pbi1icmFuZC10ZXN0IiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIifQ"}}}	2025-12-13 04:43:12
11sUl0OI4GFQtghgwKKgLhW18vPexSsm	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-13T04:50:39.319Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765000193, "iat": 1764996593, "iss": "https://test-mock-oidc.replit.app/", "jti": "9c1a8f898f4cd4c3f17bd80f8b84d102", "sub": "admin-edit-test", "email": "admin@example.com", "auth_time": 1764996593, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "admin-edit-test", "role": "admin", "email": "admin@example.com", "phone": null, "lastName": "User", "createdAt": "2025-12-04T06:49:05.721Z", "firstName": "Admin", "updatedAt": "2025-12-06T04:49:53.337Z", "profileImageUrl": null}, "expires_at": 1765000193, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY0OTk2NTkzLCJleHAiOjE3NjUwMDAxOTMsInN1YiI6ImFkbWluLWVkaXQtdGVzdCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIn0.KLqHJWIqL0rxvVuiJJF1l-BMTWSEFKSfXzx7UW1CqcBLDviFqD-QWZf1M9yq_ZBu1O3C2L51L3ttEyA9I0ylJTdwymzN9Ikyolr2F1QmNVqjL_5hB853TN1jd7SjaltoFLXFs6xhxdbfTDZvQp7lyXfJAfdAUavsCgZVRLnJabkDhqCBAbmC1rkrc6OkQ5R71dneFRZ24AtJzt-o09OmZsEL_OzzngTnzkNqibe57YYb2g-SmRNuFgIsPWYdzZF_p70wni479rXvy9v-ZtTb0HjzRm-wzB1L7S5cbgGPNK8jojh29ttKO5GHnltzBxvrTV5-yw5fvrYPzYor4EpYmA", "refresh_token": "eyJzdWIiOiJhZG1pbi1lZGl0LXRlc3QiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IkFkbWluIiwibGFzdF9uYW1lIjoiVXNlciJ9"}}}	2025-12-13 04:50:40
UIXeNRWw91mMm03OiDPCWshUfopMUjSS	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-14T18:55:39.398Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765137264, "iat": 1765133664, "iss": "https://test-mock-oidc.replit.app/", "jti": "e5cdce164aee96b709eaf803536b3d82", "sub": "main-admin", "email": "admin@19dogs.com", "auth_time": 1765133663, "last_name": "Admin", "first_name": "Store"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-07T18:54:24.082Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "expires_at": 1765137264, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MTMzNjY0LCJleHAiOjE3NjUxMzcyNjQsInN1YiI6Im1haW4tYWRtaW4iLCJlbWFpbCI6ImFkbWluQDE5ZG9ncy5jb20iLCJmaXJzdF9uYW1lIjoiU3RvcmUiLCJsYXN0X25hbWUiOiJBZG1pbiJ9.ukgE0uwJThe4uL6bf98X9qcoQZa78UX3AVHEa18n0No_zmTHpWYV5MWew7fQtEWTv2pH5g7TngukBWeaDrKze6Oz8Vi60XxRRvRmJFyQs9F_PN5tu9mrX6HNi2AjlLuRHqrlYm6ggZkb--bjId09ZHsjS7-yRr57kwqzYuMejLKOo90_aKTZbD3t2Lz1pOsJ49dl7Q3vY5ovG0zOfTaOjewaxIgX9MM-dmIklsYkSeN_6x50SaHZIP4V1OkOxG74of6n0X6lz1uRmuIM0XRdUBoKHIZAqsWwoPy5uYhkqrZ93f8sA-q7IKhU-RIAyUr3a9h9Xs_g25N9Fnj8hQtE6Q", "refresh_token": "eyJzdWIiOiJtYWluLWFkbWluIiwiZW1haWwiOiJhZG1pbkAxOWRvZ3MuY29tIiwiZmlyc3RfbmFtZSI6IlN0b3JlIiwibGFzdF9uYW1lIjoiQWRtaW4ifQ"}}}	2025-12-14 18:55:40
IDPjMBbbohYMzqsQsU9t35qLtTkq89KH	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-13T19:15:32.867Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765052082, "iat": 1765048482, "iss": "https://test-mock-oidc.replit.app/", "jti": "f0f8306423d0b4aa85fe96004670e854", "sub": "main-admin", "email": "admin@19dogs.com", "auth_time": 1765048482, "last_name": "Admin", "first_name": "Store"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-06T19:14:42.394Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "expires_at": 1765052082, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MDQ4NDgyLCJleHAiOjE3NjUwNTIwODIsInN1YiI6Im1haW4tYWRtaW4iLCJlbWFpbCI6ImFkbWluQDE5ZG9ncy5jb20iLCJmaXJzdF9uYW1lIjoiU3RvcmUiLCJsYXN0X25hbWUiOiJBZG1pbiJ9.KU29LYnbhpvIlLlwZrfVXggGvx-rUrgRI0bODF7MjeeueZCbJijw8cN1iYqy4iVmNDoR1ZUE6cos0TwKtlv5AywSC7MqoXspRyF9JziXafq6l38h6vcFWkb9VpDw6FPHhyDwv7gkt5r33uO8hX7uu1ZKp4dGli3p40VYLajFD_UAo08OAD6nmqM6XIDZ2yqShrXzYzwln36wvjjKFY4dNtXVLzzsJb1gmHmpn0giCDtX7wOoTy-2YH-KHvon_h7ZHLFdgPF65VEJzx1OgkBhpzHd9KTVL707BNl9ifv-drNT3QECAlinqYwnZ5n39LVAo8NQeuSsCzY9Y1_XtyjCVg", "refresh_token": "eyJzdWIiOiJtYWluLWFkbWluIiwiZW1haWwiOiJhZG1pbkAxOWRvZ3MuY29tIiwiZmlyc3RfbmFtZSI6IlN0b3JlIiwibGFzdF9uYW1lIjoiQWRtaW4ifQ"}}}	2025-12-13 19:15:33
VqFwk5oDAOLFhmaMHOGpK4ZUBpAQHtl1	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-13T04:31:21.412Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1764999048, "iat": 1764995448, "iss": "https://test-mock-oidc.replit.app/", "jti": "8d82aae542f42f408adbd17540be78b2", "sub": "admin-test-123", "email": "admin@example.com", "auth_time": 1764995448, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "admin-test-123", "role": "admin", "email": "admin@example.com", "phone": null, "lastName": "User", "createdAt": "2025-12-04T06:49:05.721Z", "firstName": "Admin", "updatedAt": "2025-12-06T04:30:48.353Z", "profileImageUrl": null}, "expires_at": 1764999048, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY0OTk1NDQ4LCJleHAiOjE3NjQ5OTkwNDgsInN1YiI6ImFkbWluLXRlc3QtMTIzIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIifQ.eqMYWSkCXG6PxoKLn23Ahteioa6hxRE0BWtwDwoEGlyJMjIO3ovdQfFEgOkUCCxVIObEKjAEqSxC1greu5SvwdsBNbFMerMMZXKGdrRF2ri5VpmlyQXKsw_0deGPMipcO41z_yie3KQaS0ViBOQlK5BEzeayziCE_mxeXRj96gMbCeGi8QZEXoCd7tc97LeYA1iGIOmDuvaQHSKwiM97DRqDDyQ_zfTH7oJDZMSIELsf_uRjMU8qQUBh_LyI6WMovACpvU5z5IphfuztB6VTkXE0RKiI2G_Lz6tYsxHrnuda_aXWas0W89cISGmsEUh6cfyYjijrKRD-4CmH8x2YPw", "refresh_token": "eyJzdWIiOiJhZG1pbi10ZXN0LTEyMyIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIn0"}}}	2025-12-13 04:31:22
kjmKjCCvORsxdQI9EOykUcDxeEngReB9	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-13T19:44:10.301Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765053791, "iat": 1765050191, "iss": "https://test-mock-oidc.replit.app/", "jti": "85da9281fd91c6913c4970667471ad78", "sub": "main-admin", "email": "admin@19dogs.com", "auth_time": 1765050191, "last_name": "Admin", "first_name": "Store"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-06T19:43:12.001Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "expires_at": 1765053791, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MDUwMTkxLCJleHAiOjE3NjUwNTM3OTEsInN1YiI6Im1haW4tYWRtaW4iLCJlbWFpbCI6ImFkbWluQDE5ZG9ncy5jb20iLCJmaXJzdF9uYW1lIjoiU3RvcmUiLCJsYXN0X25hbWUiOiJBZG1pbiJ9.ru18F3DvADuXuDxyXXX6xpsj5OqOlRNidHRI9DnYBRSVnlBM0xKkFaQ5uYMQakRy4jqAULnW2vPN8Kgo-aNLwUh1zBPcKhcWIwqMy9GtJq4R9AoaZz4T_9kGpJF7XxpmTX9KjJzOVesWoSNgMPxjwKRfHuk4jebZBZj2jtF5PfYOxJWy9gS37C6qu6CMDC17fZanY7cN4YYsdoQINMCEK8lSNkySrZZamkTU3IXnllGWzHS9FA32pesUA5any9wdCfkOTHK3HMaCEHxsQkxDJ_EEZzzpKID1YXPctgaVu0UwOSh-6pOySscCfGcyyLRzLfhS-tmDuoyYOgjDCsO-Tw", "refresh_token": "eyJzdWIiOiJtYWluLWFkbWluIiwiZW1haWwiOiJhZG1pbkAxOWRvZ3MuY29tIiwiZmlyc3RfbmFtZSI6IlN0b3JlIiwibGFzdF9uYW1lIjoiQWRtaW4ifQ"}}}	2025-12-13 19:44:11
sGuZ7-vJIyokVTL3O27qkplVmHhOjJst	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-15T15:08:11.727Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765210010, "iat": 1765206410, "iss": "https://test-mock-oidc.replit.app/", "jti": "ba0a8e639c4a71630034c28bf8a36f5f", "sub": "admin_test_combo", "email": "admin@19dogs.com", "roles": ["admin"], "auth_time": 1765206410, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "admin_test_combo", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "User", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Admin", "updatedAt": "2025-12-08T15:06:50.431Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "expires_at": 1765210010, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MjA2NDEwLCJleHAiOjE3NjUyMTAwMTAsInN1YiI6ImFkbWluX3Rlc3RfY29tYm8iLCJlbWFpbCI6ImFkbWluQDE5ZG9ncy5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIiwicm9sZXMiOlsiYWRtaW4iXX0.yTBBPlZtlbANdCK36CYz3-XxoTxxhSLQIJdm5uGBbzIRXzrOWuvCDjObV3sLKnN5xAnJKzmEsw4eCdOzhEFmwusmrbczn7z0anE-dhRYgx1WGfJCAK3BhwlxJmrqmx0tp6GXwAszCmLIo3SeoklchXBe2jCpRp3pMVymFVgsN8VxYIXVPw9nBflhJh-PW0LWsTDqCrCH7sdl5ReOHv5x2sPDuVsEgbALoTffVxRoaCFloDFM18xBNBKLHGPYNgB9guVG6WEsmr6wTo1SkqBmsr-Te98yvOc-fBc3DUp3OQ5EqWUZLE-x88OCBQE3e64aCLVx48MYPe2UfgvuLSPUxw", "refresh_token": "eyJzdWIiOiJhZG1pbl90ZXN0X2NvbWJvIiwiZW1haWwiOiJhZG1pbkAxOWRvZ3MuY29tIiwiZmlyc3RfbmFtZSI6IkFkbWluIiwibGFzdF9uYW1lIjoiVXNlciIsInJvbGVzIjpbImFkbWluIl19"}}}	2025-12-15 15:08:12
T3zkgD-y8TcxeUsAcNwVvtQkdRVFWrnm	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-16T05:36:27.167Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765262128, "iat": 1765258528, "iss": "https://test-mock-oidc.replit.app/", "jti": "05f0fd4954de844fba7f035cf4320396", "sub": "admin_combo_test", "email": "admin@19dogs.com", "roles": ["admin"], "auth_time": 1765258528, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "admin_combo_test", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "User", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Admin", "updatedAt": "2025-12-09T05:35:28.255Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "expires_at": 1765262128, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MjU4NTI4LCJleHAiOjE3NjUyNjIxMjgsInN1YiI6ImFkbWluX2NvbWJvX3Rlc3QiLCJlbWFpbCI6ImFkbWluQDE5ZG9ncy5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIiwicm9sZXMiOlsiYWRtaW4iXX0.Vv-rnUZ_8dDjLF91AVsoemRQeEqNtWheMrTfQ_60RTiHy0H8MKXBlC6rPu25xHJ3xwNL1UT8n0w2Pee7X5IkyT1N5cmAxz4V6xms6F7rNXtCPjsVREcNla5VZm6Yv_n8azILnp_JzKzR0Wfj0k1I5UlRBQMJbF9Gu9IaW6k1R6vA_wjHeXLvRLnARFTwqrNLVI2J-3Veo-uFST65J8ebsKdLEEtNcS3aHizY4YNkKeCnQyoH5JnvO87TU4YKI95aWgGST5ouwUNuA3kggKuiOiS-jcHS-7kSgdxSE6iXLDy5EfOxYdns1OdvdGgPllQ4ezTy1sC0tD0jEQd6tMBm4g", "refresh_token": "eyJzdWIiOiJhZG1pbl9jb21ib190ZXN0IiwiZW1haWwiOiJhZG1pbkAxOWRvZ3MuY29tIiwiZmlyc3RfbmFtZSI6IkFkbWluIiwibGFzdF9uYW1lIjoiVXNlciIsInJvbGVzIjpbImFkbWluIl19"}}}	2025-12-16 05:36:28
xXnidVQoNMJpWNLDulwnn00LDLGPAWkM	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-15T15:20:45.785Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765210830, "iat": 1765207230, "iss": "https://test-mock-oidc.replit.app/", "jti": "d2181a481ba4eeb9972a9e5b1d373ee6", "sub": "admin_upload_test", "email": "admin@19dogs.com", "roles": ["admin"], "auth_time": 1765207230, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "admin_upload_test", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "User", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Admin", "updatedAt": "2025-12-08T15:20:30.877Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "expires_at": 1765210830, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MjA3MjMwLCJleHAiOjE3NjUyMTA4MzAsInN1YiI6ImFkbWluX3VwbG9hZF90ZXN0IiwiZW1haWwiOiJhZG1pbkAxOWRvZ3MuY29tIiwiZmlyc3RfbmFtZSI6IkFkbWluIiwibGFzdF9uYW1lIjoiVXNlciIsInJvbGVzIjpbImFkbWluIl19.RpzwFhBZ5J4LAR1D1WBcClu7S2C0gbIuJyjh5OwR_CqXk0Jokk2iuVNNX4dYNWMlRDN144XxQDL0bZQR6maiJwmbd5X017MqD7gjk3oGuMdziTt8b4Q729GRGEXCua5trnlpy5Fh2a6lD-C4ujDvFFfkAel1UYSoSkmxDcrh6-PQcTZLBrNvETAUnnxZ0yBRppHIkPFMnb74FJwjS4ce-ltNxLfqEZMvqJ2k6A1egvqAyOvcgAFbJKdtfHM-FRf8v1TifYb-Z-KZdD61nn7RAxsLbGVFJ9oJP4KqVRFdvdSskdW8GKViRUv-ptPwOESUtD-26NSKhDuAytpkWorlOA", "refresh_token": "eyJzdWIiOiJhZG1pbl91cGxvYWRfdGVzdCIsImVtYWlsIjoiYWRtaW5AMTlkb2dzLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIiLCJyb2xlcyI6WyJhZG1pbiJdfQ"}}}	2025-12-15 15:20:46
3n9dkSkvQ_qzYW8QRP_MsFW76kkJJEmr	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-13T05:49:24.445Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765003749, "iat": 1765000149, "iss": "https://test-mock-oidc.replit.app/", "jti": "e5e418169df8c7b8c4932e06473847d0", "sub": "admin_test_vHGR", "email": "admin_test@example.com", "auth_time": 1765000149, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "admin_test_vHGR", "role": "customer", "email": "admin_test@example.com", "phone": null, "lastName": "User", "createdAt": "2025-12-06T05:49:09.277Z", "firstName": "Admin", "updatedAt": "2025-12-06T05:49:09.277Z", "profileImageUrl": null}, "expires_at": 1765003749, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MDAwMTQ5LCJleHAiOjE3NjUwMDM3NDksInN1YiI6ImFkbWluX3Rlc3RfdkhHUiIsImVtYWlsIjoiYWRtaW5fdGVzdEBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIifQ.nQkLsasO5ziqsGD0F9oaAUlpU7ZvQTLQSdNLRbDKvNXRyDO136TXMzgZFCoBZ1vA22WRQAeHWrwegm1AIJbilHEFgfbYbgMXxaUOrhy3-pPB0uM22lGkpkkEHVF-_94RH9JSVvzlp9j1aZeYp-lxdTVPIlbDhYJ1GN_TxbqSa19ZszaRHWM2MeiKdvpKBrMg18CtYCK9QkXPv5Lol6yfyHxNH470Y08DXFCFVeP7SsUIYq-kawJK4xSTs-l60wZs0e4lHV-LnpfhTNejc4BzXYRXoM1Q1S9ouQpX1IBqKVS-NDlQ2dlrqv_A0hSa5WWUm1q7mFuJ2NGvUDeGdH6lSg", "refresh_token": "eyJzdWIiOiJhZG1pbl90ZXN0X3ZIR1IiLCJlbWFpbCI6ImFkbWluX3Rlc3RAZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIn0"}}}	2025-12-13 05:49:25
22WKda2o1YG2fnTBpJ1_OhtwvTz6nPeM	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-13T04:03:20.894Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1764997251, "iat": 1764993651, "iss": "https://test-mock-oidc.replit.app/", "jti": "fad2bded9c2551c833a7e5c111ff4d16", "sub": "1p7Bsd", "email": "1p7Bsd@example.com", "auth_time": 1764993651, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "1p7Bsd", "role": "admin", "email": "1p7Bsd@example.com", "phone": null, "lastName": "User", "createdAt": "2025-12-06T04:00:51.578Z", "firstName": "Admin", "updatedAt": "2025-12-06T04:00:51.578Z", "profileImageUrl": null}, "expires_at": 1764997251, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY0OTkzNjUxLCJleHAiOjE3NjQ5OTcyNTEsInN1YiI6IjFwN0JzZCIsImVtYWlsIjoiMXA3QnNkQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IkFkbWluIiwibGFzdF9uYW1lIjoiVXNlciJ9.iUqNUAvZqYOlGnmSHIxlvBSHoBQEccNKk9eUklFGAmzetP1PutjHsvou4pIFqpRNLlbdgDnXmvCubjS_E4stHs8mrHrdDunaAx5jJI10HA7zdltpOtm1FqEmOwsE-GDps4rAZx1q6TrHhCiiIIG-3Ga__MJj9B-MAKJ4uo-sWW5Ox9e9THSqi_6hLE-UJcQbKgkDK6H1OA_VU1x0j59ccPR2RZV6gvJlT8ajHBZOM30OnB-w0tO4l_TmjXlM3op6gQQoF-2_Wy7Y4q0D-WmDNgFDAePDnLMm8GG2Zk03jFs-LClbrMJHEiKP_xHBYsEpzSjJYWifVTx4fJw_s7RWKg", "refresh_token": "eyJzdWIiOiIxcDdCc2QiLCJlbWFpbCI6IjFwN0JzZEBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIifQ"}}}	2025-12-13 04:03:21
cUFYGNFoSvmNBbcaNQ6ElwetgynawM1n	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-13T05:11:12.947Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765001337, "iat": 1764997737, "iss": "https://test-mock-oidc.replit.app/", "jti": "8cc612cf1f8b6deb149d22d1e688b017", "sub": "admin-features-test", "email": "admin@example.com", "auth_time": 1764997737, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "admin-features-test", "role": "admin", "email": "admin@example.com", "phone": null, "lastName": "User", "createdAt": "2025-12-04T06:49:05.721Z", "firstName": "Admin", "updatedAt": "2025-12-06T05:08:57.925Z", "profileImageUrl": null}, "expires_at": 1765001337, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY0OTk3NzM3LCJleHAiOjE3NjUwMDEzMzcsInN1YiI6ImFkbWluLWZlYXR1cmVzLXRlc3QiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IkFkbWluIiwibGFzdF9uYW1lIjoiVXNlciJ9.fXE5M37d2Jkgb92fogA2yO1CbUBzf8xU3aCga05vyXZCYraN6IXKNZglEEde6RpciGPV0L5Rqi3waA148QIi7fd55ypP5OuT9WukS5iaOAtwkqKXiNh_Ij3d-Zl-_AyZijKKFl7s-Hs8eQB5rGJ2yn11Jav92ZyJ-a4SscBIA4wyzulf990bFWmwiGwgtKiqt26pVZ8Hy2uTG8ioI1lbXyyM7s26IijMOCGEzlt0X0vAibhBA379lRYjjFwmT9QPyyye1cp5XXXNZWherp-mMFxsv1vx1kU2uGu7md0i9QIwhkqoBZbkD5f-zi-bEMsfn8yF3yFKoUGGd6m-rKsYFw", "refresh_token": "eyJzdWIiOiJhZG1pbi1mZWF0dXJlcy10ZXN0IiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIifQ"}}}	2025-12-13 05:11:13
7vJDaDOlddHPkKWqET6Fg-_ApEwLWmjj	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-15T15:31:37.709Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765211483, "iat": 1765207883, "iss": "https://test-mock-oidc.replit.app/", "jti": "77a87e92cba7c3c922484cab93be7c33", "sub": "admin_product_select", "email": "admin@19dogs.com", "roles": ["admin"], "auth_time": 1765207883, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "admin_product_select", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "User", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Admin", "updatedAt": "2025-12-08T15:31:24.055Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "expires_at": 1765211483, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MjA3ODgzLCJleHAiOjE3NjUyMTE0ODMsInN1YiI6ImFkbWluX3Byb2R1Y3Rfc2VsZWN0IiwiZW1haWwiOiJhZG1pbkAxOWRvZ3MuY29tIiwiZmlyc3RfbmFtZSI6IkFkbWluIiwibGFzdF9uYW1lIjoiVXNlciIsInJvbGVzIjpbImFkbWluIl19.VuPkpYbFUk4E0uqFZ-J8k6aU_NJCP3t03pYoJsa4EpFsDkPjZoFULtiA-yIRPqUtPaA-pxpd42bmxTdsW8kmdU_z4ebdPv1Riy-tZn2BdIyi1Frwxe8Zu51UTFLVzS890eQT4kZLNQrxbi1GQ9GKZDCskSNUa3D44fmxT14vdWBFSG_v1OreKtv2yJO19MSHG6U3wAWIAET6Q9kRaoqaLMAJdpjtFb21kfOrFI43Y_eDApq-tGD0HnYW7f97815ZbAjvvpkGQ_59cjzaHkX9Gb2J6sSbapEfuTf4XAMtRy2beeoRviU-NN9IQj9EDNIS8N8xqYWTwEK-i9u5l43JrQ", "refresh_token": "eyJzdWIiOiJhZG1pbl9wcm9kdWN0X3NlbGVjdCIsImVtYWlsIjoiYWRtaW5AMTlkb2dzLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIiLCJyb2xlcyI6WyJhZG1pbiJdfQ"}}}	2025-12-15 15:31:38
i_HHmQZ78fo0Cq-oRo3rExLcT6d1qyt5	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-14T19:10:02.118Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765138191, "iat": 1765134591, "iss": "https://test-mock-oidc.replit.app/", "jti": "ac1f35cf5e4d1f901f5a9f44fb75c77c", "sub": "main-admin", "email": "admin@19dogs.com", "auth_time": 1765134591, "last_name": "Admin", "first_name": "Store"}, "dbUser": {"id": "main-admin", "role": "admin", "email": "admin@19dogs.com", "phone": null, "lastName": "Admin", "createdAt": "2025-12-06T13:24:25.215Z", "firstName": "Store", "updatedAt": "2025-12-07T19:09:51.836Z", "passwordHash": "$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi", "profileImageUrl": null}, "expires_at": 1765138191, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY1MTM0NTkxLCJleHAiOjE3NjUxMzgxOTEsInN1YiI6Im1haW4tYWRtaW4iLCJlbWFpbCI6ImFkbWluQDE5ZG9ncy5jb20iLCJmaXJzdF9uYW1lIjoiU3RvcmUiLCJsYXN0X25hbWUiOiJBZG1pbiJ9.prC2B50o0x-s9khsd4T9kFvOpN-g5x8E0qyKJ0UaKY5Y1O2EIz-PgS5RKUcr77m4DaHuNICx0aTVoabm5KCY1tO07r6Z9vCoSt5GiAR9Xo5DFTSG3Unr-4KbrEhWMxm1vY9fDf4BwYMYkkaD36bF21zjRo7ZxPDYN777qemMDDOpzTxj8OVIPKXaao_MBsjPnY6Xv2jZrEcYlpIevIStEtAACta92DBouApP3w-1Fi_p9m1hwSn5paTLVY61GMzDJ_galezHa2ifDRBCL18iM79sJgC3YYctniBrMuHzIbbKfPFcrxumRpM-r3hnTU0BKjMbFETgKG4g2Z5HixpYHg", "refresh_token": "eyJzdWIiOiJtYWluLWFkbWluIiwiZW1haWwiOiJhZG1pbkAxOWRvZ3MuY29tIiwiZmlyc3RfbmFtZSI6IlN0b3JlIiwibGFzdF9uYW1lIjoiQWRtaW4ifQ"}}}	2025-12-14 19:10:03
HMuDBm0_wB8O_Mh1ckYTtpfodtLNJP3n	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-13T04:46:47.727Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1764999996, "iat": 1764996396, "iss": "https://test-mock-oidc.replit.app/", "jti": "c7f82aafa111a88cdf5b6f1ad32f8d15", "sub": "admin-products-list-test", "email": "admin@example.com", "auth_time": 1764996396, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "admin-products-list-test", "role": "admin", "email": "admin@example.com", "phone": null, "lastName": "User", "createdAt": "2025-12-04T06:49:05.721Z", "firstName": "Admin", "updatedAt": "2025-12-06T04:46:37.094Z", "profileImageUrl": null}, "expires_at": 1764999996, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY0OTk2Mzk2LCJleHAiOjE3NjQ5OTk5OTYsInN1YiI6ImFkbWluLXByb2R1Y3RzLWxpc3QtdGVzdCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJmaXJzdF9uYW1lIjoiQWRtaW4iLCJsYXN0X25hbWUiOiJVc2VyIn0.xAsh0IQvx_pS4lSFpWUA4cEmw9Mz7L0yqZ1CYSx6K10z6Hd9kdiB8OPyShDnmWLtcADGgsqJczLpFmPdOlD3MpddWleZzJm21NBBn0uU5T21dAqlpYvtYrYscRhpie3njlsfneFeDoYLRuRUu2ZkLv-A_iYqw5yvus-hA3xyvB7yFCAwAw-pk67qjy3NWYXuTpj9YTRNyu6TuSOGvQ-ALWrg6U9jbbV8Vdc-Ul6dZd7uQIrVM1v54N7sRKRf2_hqVCuUFs7XT-b_H-Qs3PzNE2S1HY_8wsErPYUK3yRmNMraVw3hhGlWsfk6MgAyp0DEecGNQqh5jtcruGl9DwEasQ", "refresh_token": "eyJzdWIiOiJhZG1pbi1wcm9kdWN0cy1saXN0LXRlc3QiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IkFkbWluIiwibGFzdF9uYW1lIjoiVXNlciJ9"}}}	2025-12-13 04:46:48
JSA0R8ixPed_moejft0ynwT-VwOgN7CV	{"cookie": {"path": "/", "secure": true, "expires": "2025-12-13T05:45:05.715Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "6c59fe6d-15c5-47b7-94ea-2fb1bfbbe259", "exp": 1765003329, "iat": 1764999729, "iss": "https://test-mock-oidc.replit.app/", "jti": "ea1134fc1795f48ab9ed8d4611fcb068", "sub": "LSCmjD", "email": "admin-LSCmjD@example.com", "auth_time": 1764999728, "last_name": "User", "first_name": "Admin"}, "dbUser": {"id": "LSCmjD", "role": "admin", "email": "admin-LSCmjD@example.com", "phone": null, "lastName": "User", "createdAt": "2025-12-06T05:42:09.230Z", "firstName": "Admin", "updatedAt": "2025-12-06T05:42:09.230Z", "profileImageUrl": null}, "expires_at": 1765003329, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzY0OTk5NzI5LCJleHAiOjE3NjUwMDMzMjksInN1YiI6IkxTQ21qRCIsImVtYWlsIjoiYWRtaW4tTFNDbWpEQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IkFkbWluIiwibGFzdF9uYW1lIjoiVXNlciJ9.hZROGhY76a4tb-4GN3wFo96OmoDji9GTbc-ArekCFYLiAMgbBRrenQNpJGRUlfUnTMF6bPpeSn5psqjCHPaPUdfYSv5q5KPD3gx7_J-AllpoOhV-stHdBeZ1Acw3QpvL6pkWTCafInyy1tW3C46TcSRAidI2kbnzybGtf-vAZJUSRfcd-K1Uq6VWPmK_BHlqlMsfCJeIPiKbF1Kqe1-hP6d4XKW1JUVt8a_mfN56O2dGrAOJ9sm-7MAzEX9kruSe1ef1VIQrxIkKzArLmFCZT8c1I0jq5DUz9lB9dWJcZppDhyQIS-ikWRadAF22H2QcBuKlCEEt1vheuu_YE-Jaaw", "refresh_token": "eyJzdWIiOiJMU0NtakQiLCJlbWFpbCI6ImFkbWluLUxTQ21qREBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIifQ"}}}	2025-12-13 05:45:06
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.settings (key, value, updated_at) FROM stdin;
home_category_section	{"title":"Shop by Category","subtitle":"","isVisible":true,"position":0,"categories":[{"id":"item_1764844347193_6zxyy8m","categoryId":"da0255ba-931f-4b1e-9448-ddf8eacfa85c","customLabel":"Food","imageUrl":"/objects/uploads/e8dc058e-b78b-487c-9311-4b849365f190","position":0,"isVisible":true,"displayWidth":"100","alignment":"center"},{"id":"item_1764844517882_2x625bq","categoryId":"90bfbd9f-a163-4612-88d5-79dc1e782591","customLabel":"Clothing","imageUrl":"/objects/uploads/5116676a-15ef-460c-951a-7a9294e1c128","position":1,"isVisible":true,"displayWidth":"50","alignment":"center"},{"id":"item_1764844544591_n96ph3p","categoryId":"90bfbd9f-a163-4612-88d5-79dc1e782591","customLabel":"Clothing","imageUrl":"/objects/uploads/f3645d64-9f3a-4057-9198-ebd91494dd18","position":2,"isVisible":true,"displayWidth":"50","alignment":"right"}]}	2025-12-04 10:36:05.443
invoice_template	{"sellerName":"19Pets Private Limited","sellerAddress":"6/11 Vidhyodhaya Main Road, T Nagar","sellerCity":"Chennai","sellerState":"Tamil Nadu","sellerPostalCode":"600017","sellerCountry":"India","sellerPhone":"9941443009","sellerEmail":"accounts@19dogs.com","gstNumber":"22AAAAA0000A1Z5","gstPercentage":5,"gstRates":[0,5,12,18,28],"buyerLabelName":"Enter Your GST Number","buyerLabelAddress":"Address","buyerLabelPhone":"Phone","buyerLabelEmail":"Email","showDiscountLine":true,"showTaxBreakdown":true,"showShippingCost":true,"showPaymentMethod":true,"showSKU":true,"logoUrl":"/objects/uploads/58247d53-77ea-4ae9-bc92-fdaa8bf3943a","footerNote":"Thank you for your business!","termsAndConditions":"- Rates are subject to applicable GST/IGST/CGST/SGST. Any future tax changes will be borne by the buyer.\\n- For Online Payment: The Payment is due prior to the invoice generation.\\n- For COD: The total invoice amount must be paid in full at the time of delivery to the delivery agent.\\n- Delivery & Risk: Responsibility for goods transfers to the buyer once dispatched. Transit damage/shortage must be reported within Delivery & Risk hours.\\n- Returns allowed only for manufacturing defects or incorrect supply and must be requested within 2 days. Goods must be unused and in original condition.\\n- Orders cannot be cancelled once processed or dispatched. Pre-dispatch cancellations (if allowed) will be refunded within 7 working days.\\n- Seller’s liability is limited to the invoice value of goods supplied. No consequential or indirect damages covered.\\n- All disputes are subject to the [Your City/State] jurisdiction."}	2025-12-04 06:36:48.426
communication_settings	{"msg91":{"authKey":"482365A09LqwSUD69399267P1","senderId":"19Dogs"},"email":{"enabled":true,"templateId":"","fromEmail":"sales@19dogs.com","fromName":"19Dogs","domain":"","orderConfirmation":true,"orderStatusUpdate":true,"shippingUpdate":true,"lowStockAlert":true,"restockNotification":true,"welcomeEmail":true,"passwordReset":true},"sms":{"enabled":true,"templateId":"693994acaf853645683d2986","orderConfirmation":true,"orderStatusUpdate":true,"shippingUpdate":true,"deliveryOtp":true},"whatsapp":{"enabled":true,"integratedNumber":"","templateName":"","orderConfirmation":true,"orderStatusUpdate":true,"shippingUpdate":true,"promotionalMessages":false},"otp":{"enabled":true,"templateId":"","otpLength":6,"otpExpiry":5,"emailFallback":true}}	2025-12-10 15:41:54.709
blog_section	{"title":"“Why Dogs Change Our Lives: The Heart Behind 19Dogs”","subtitle":"In a world that moves faster every day, dogs remind us to slow down, breathe, and appreciate the simple joys of life. At 19Dogs, everything we do is inspired by the remarkable connection between humans and their canine companions. Whether you’re looking for guidance, community, or simply a place to celebrate your love for dogs, we believe every wag, bark, and nose-boop has a story worth sharing.","isVisible":true,"position":0,"posts":[{"id":"22fa3f4d-f052-4396-b46f-57688b113369","title":"“Why Dogs Change Our Lives: The Heart Behind 19Dogs”","slug":"why-dogs-change-our-lives-the-heart-behind-19dogs","excerpt":"In a world that moves faster every day, dogs remind us to slow down, breathe, and appreciate the simple joys of life. At 19Dogs, everything we do is inspired by the remarkable connection between humans and their canine companions. Whether you’re looking for guidance, community, or simply a place to celebrate your love for dogs, we believe every wag, bark, and nose-boop has a story worth sharing.","content":"The Magic of Dogs\\n\\nDogs have a unique way of bringing out the best in us. They’re loyal without question, joyful without restraint, and loving without condition. Science continues to prove what dog owners already know: dogs enhance our lives emotionally, mentally, and even physically. They reduce stress, encourage exercise, and strengthen our sense of belonging.\\n\\nAt 19Dogs, we aim to amplify that magic by creating content, resources, and experiences that support both dogs and the humans who love them.\\n\\nOur Mission at 19Dogs\\n\\n19Dogs was founded on a simple belief: every dog deserves a life filled with love, understanding, play, and purpose.\\nEverything we do—whether it’s sharing training tips, highlighting rescue stories, reviewing products, or offering community events—is guided by that mission.\\n\\nHere’s what sets 19Dogs apart:\\n1. A Community Built on Compassion\\n\\nWe’re more than an online platform—we’re a pack.\\nDog owners, trainers, rescuers, first-time pet parents, and lifelong enthusiasts all come together here to learn, share, and support one another.\\n\\n2. Real Advice from Real Dog People\\n\\nFrom behavioral insights to nutrition breakdowns, we aim to provide trustworthy, accessible, no-judgment guidance. Whether your dog is anxious, energetic, aging, or a brand-new puppy, we’re here to help you navigate every stage.\\n\\n3. Celebrating Every Dog’s Story\\n\\nNo two dogs are the same—and that’s what makes them extraordinary. We feature community stories, rescue journeys, senior-dog spotlights, and more. Because every dog deserves to be seen.\\n\\nWhy We Chose the Name “19Dogs”\\n\\nThe number 19 symbolizes new beginnings, companionship, and the bond between beings who choose each other. For us, it represents the belief that every dog who enters your life changes it in at least 19 beautiful ways—or more.\\n\\n19Dogs isn’t just a name.\\nIt’s a reminder of the impact dogs have on us every day.\\n\\nLooking Ahead\\n\\nOur vision for 19Dogs is big:\\nMore resources. More stories. More community. More wagging tails.\\n\\nWhether you’re here to learn, laugh, adopt, train, or simply enjoy cute dog moments, we’re happy to have you as part of the pack.\\n\\nJoin Us on the Journey\\n\\nFollow our blog, subscribe to updates, or join us on social media.\\nAt 19Dogs, every day is a dog day—and we can’t wait to share it with you.","imageUrl":"/objects/uploads/7973aceb-ca0c-494e-8f95-ff946818b180","author":"19Dogs","readTime":"5 min read","publishedAt":"2025-12-04","position":0,"isVisible":true}]}	2025-12-04 09:36:28.265076
branding_settings	{"logoUrl":"/objects/uploads/3b83cd31-2019-4f2d-80d9-d591c355057b","storeName":"19Dogs","showStoreName":false,"faviconUrl":"/objects/uploads/78504241-61b1-4dee-a325-8a4d3271b03d","topBarText":"Free Delivery for Order Above Rs 2500","showTopBar":true}	2025-12-04 09:41:12.693
special_offers_settings	{"bannerUrl":"/objects/uploads/e623b625-054a-4f04-81e1-49f17eb462fb","bannerTitle":"Amazing Sale","bannerSubtitle":"Up to 50% off on all items","bannerCtaText":"Shop Now","bannerCtaLink":"/special-offers","showBanner":true,"sectionImageUrl":"/objects/uploads/1a1fff90-74d7-4966-a6ed-b92c7f5b47e6","sectionTitle":"Hot Deals","sectionDescription":"Limited time offers on your favorite products","showSectionImage":true,"sectionImageTargetRow":1,"sectionImagePlacement":"before","sectionImageWidth":"100","sectionImageAlignment":"left"}	2025-12-08 10:00:35.76
combo_offers_settings	{"bannerUrl":"/objects/uploads/3f3a451b-1526-452d-bcb2-c043dcf9d4f9","bannerTitle":"Bundle & Save Big!","bannerSubtitle":"Get exclusive combo deals","bannerCtaText":"View Combos","bannerCtaLink":"/combo-offers","showBanner":true,"sectionImageUrl":"/objects/uploads/62b59d2a-06c5-4972-94ca-dab285f0f2b4","sectionTitle":"Bundle & Save Big!","sectionDescription":"Get exclusive combo deals","showSectionImage":true,"sectionImageTargetRow":1,"sectionImagePlacement":"after","sectionImageWidth":"100","sectionImageAlignment":"left"}	2025-12-09 10:12:53.757
site_name	ShopMax	2025-12-04 05:34:05.603
site_tagline	Your One-Stop Shop	2025-12-04 05:34:05.641
contact_email	support@shopmax.com	2025-12-04 05:34:05.678
contact_phone	+1 (555) 123-4567	2025-12-04 05:34:05.715
address	123 Commerce Street, New York, NY 10001	2025-12-04 05:34:05.752
currency	INR	2025-12-04 05:34:05.789
tax_rate	5	2025-12-04 05:34:05.826
free_shipping_threshold	3000	2025-12-04 05:34:05.864
shipping_cost	9.99	2025-12-04 05:34:05.901
stripe_enabled	true	2025-12-04 05:34:05.938
cod_enabled	true	2025-12-04 05:34:05.975
store_name	19Dogs	2025-12-04 05:34:06.012
store_email	sales@19dogs.com	2025-12-04 05:34:06.049
store_phone	9941443009	2025-12-04 05:34:06.086
shipping_rate	100	2025-12-04 05:34:06.123
enable_free_shipping	true	2025-12-04 05:34:06.16
footer_settings	{"storeName":"ShopHub","storeDescription":"19 DOGS has the best, natural and human-grade dog food that is perfectly safe and healthy for your dogs.\\n","logoUrl":"/objects/uploads/2dbb932b-9b87-41d5-a3f1-2f001615e68a","showStoreName":false,"socialLinks":{"facebook":"https://www.facebook.com/19DogsOffical/","twitter":"","instagram":"https://www.instagram.com/19_dogs","youtube":"https://www.youtube.com/@19Dogs"},"contactInfo":{"phone":"+919941443009","email":"admin@19dogs.com","address":"No: 6/11, Vidhyodhaya Main Road,\\nT Nagar, Chennai - 600017.\\nTamil Nadu, India"},"quickLinks":[{"label":"About Us","url":"/about"},{"label":"Contact Us","url":"/contact"},{"label":"FAQ","url":"/faq"},{"label":"Track Order","url":"/track-order"},{"label":"Shipping Info","url":"/shipping"},{"label":"Returns & Exchanges","url":"/returns"}],"legalLinks":[{"label":"Privacy Policy","url":"/privacy"},{"label":"Terms of Service","url":"/terms"}],"newsletterEnabled":true,"newsletterTitle":"Newsletter","newsletterDescription":"Subscribe for exclusive deals, new arrivals, and more.","copyrightText":"All rights reserved.","showSocialLinks":true,"showContactInfo":true,"showQuickLinks":true,"showNewsletter":true}	2025-12-07 19:05:15.082
\.


--
-- Data for Name: shared_wishlists; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shared_wishlists (id, user_id, share_code, title, description, is_public, allow_anonymous, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: stock_notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_notifications (id, product_id, variant_id, email, user_id, is_notified, notified_at, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, phone, role, created_at, updated_at, password_hash) FROM stdin;
fYjCiP	fYjCiP@example.com	John	Doe	\N	\N	customer	2025-12-04 15:25:39.959095	2025-12-04 15:25:39.959095	\N
o_OT0Z	o_OT0Z@example.com	John	Doe	\N	\N	customer	2025-12-04 15:50:06.607899	2025-12-04 15:50:06.607899	\N
BLjxPh	testuserL2GiwV@example.com	Test	User	\N	\N	customer	2025-12-04 16:26:25.076957	2025-12-04 16:26:25.076957	\N
C3AAWH	C3AAWH@example.com	John	Doe	\N	\N	admin	2025-12-01 19:18:13.844153	2025-12-01 19:18:13.844153	\N
gu85ZC	gu85ZC@example.com	Admin	User	\N	\N	admin	2025-12-01 19:39:01.214538	2025-12-01 19:39:01.214538	\N
eGQh2l	eGQh2l@example.com	John	Doe	\N	\N	admin	2025-12-01 19:50:03.068904	2025-12-01 19:50:03.068904	\N
pVjAbG	pVjAbG@example.com	John	Doe	\N	\N	admin	2025-12-01 19:57:58.727252	2025-12-01 19:57:58.727252	\N
DzrLN2	testuserY-mzCT@example.com	Test	User	\N	\N	customer	2025-12-04 16:31:18.357817	2025-12-04 16:31:18.357817	\N
8xMeaY	8xMeaY@example.com	John	Doe	\N	\N	customer	2025-12-05 19:11:27.772129	2025-12-05 19:11:27.772129	\N
1p7Bsd	1p7Bsd@example.com	Admin	User	\N	\N	admin	2025-12-06 04:00:51.578413	2025-12-06 04:00:51.578413	\N
admin_combo_test	admin@19dogs.com	Admin	User	\N	\N	admin	2025-12-06 13:24:25.215245	2025-12-09 05:35:28.255	$2b$12$ojv.z7G6S9vabUBK6qCPBufdt.FIYVHjDolgvEx3aApWkVDAZshbi
50515928	kavipriya@addingsmiles.com	Kavipriya	Adding Smiles	\N	\N	admin	2025-12-01 16:16:22.360268	2025-12-06 04:45:34.579	\N
C_YAR4	C_YAR4@example.com	Admin	User	\N	\N	admin	2025-12-02 04:14:29.08878	2025-12-02 04:14:29.08878	\N
admin-test-banner	admin-banner@example.com	Admin	Tester	\N	\N	admin	2025-12-02 04:40:40.528717	2025-12-02 04:40:40.528717	\N
admin-banner-upload-test	admin-upload@example.com	Admin	Upload	\N	\N	admin	2025-12-02 04:49:31.92992	2025-12-02 04:49:31.92992	\N
test-admin-user	admin@test.com	Test	Admin	\N	\N	admin	2025-12-01 20:18:11.892331	2025-12-01 20:18:37.222	\N
KDfHor	KDfHor@example.com	John	Doe	\N	\N	admin	2025-12-02 07:12:02.321404	2025-12-02 07:12:02.321404	\N
admin-features-test	admin@example.com	Admin	User	\N	\N	admin	2025-12-04 06:49:05.721366	2025-12-06 05:08:57.925	\N
7e5153ca-cf6a-40eb-af15-fc663c474e0f	admintestF12kFj@example.com	Admin	User	\N	\N	admin	2025-12-04 05:29:06.726142	2025-12-04 05:29:06.726142	\N
admintestwAZY6tLj	admintestMzs_TV7g@example.com	Admin	User	\N	\N	admin	2025-12-04 05:30:53.540423	2025-12-04 05:30:53.540423	\N
bce9dbe2-0d83-4ee9-836e-07801971600f	adminmh73Oh@test.com	Admin	User	\N	\N	admin	2025-12-04 05:43:33.490773	2025-12-04 05:43:33.490773	\N
admin-invoice-logo-gCUBmO	admin-logo-Uur9vH@test.com	\N	\N	\N	\N	admin	2025-12-04 05:45:57.805312	2025-12-04 05:45:57.805312	\N
admin-invoice-logo-5jeMQv	admin-logo-0HibfL@test.com	Admin	User	\N	\N	admin	2025-12-04 05:48:11.505819	2025-12-04 05:48:11.505819	\N
LSCmjD	admin-LSCmjD@example.com	Admin	User	\N	\N	admin	2025-12-06 05:42:09.230046	2025-12-06 05:42:09.230046	\N
admin_test_vHGR	admin_test@example.com	Admin	User	\N	\N	customer	2025-12-06 05:49:09.277472	2025-12-06 05:49:09.277472	\N
259ef441-7edf-45cb-a2b2-a7253d0a82c5	test-hx0p0v@example.com	Test	User	\N	\N	customer	2025-12-06 06:46:23.49209	2025-12-06 06:46:23.49209	$2b$12$ZAjLBGb2HYuEhBpZ2juHW.8tN9UHimJ745I/0O1yc70DSpgzYtXGi
admin-fix-test-3mnSGZ	admin-fix@example.com	Admin	Tester	\N	\N	admin	2025-12-04 07:15:29.481579	2025-12-04 07:15:48.509	\N
admin-branding-test-NuJu2B	admin-branding@example.com	Admin	Branding	\N	\N	admin	2025-12-04 07:33:41.526207	2025-12-04 07:33:41.526207	\N
admin-store-name-test-sTpcJ5	admin-storename@example.com	Admin	Test	\N	\N	admin	2025-12-04 07:41:45.924766	2025-12-04 07:42:06.814	\N
admin-logo-upload-nf9epp	admin-logo@example.com	Admin	Logo	\N	\N	admin	2025-12-04 07:46:14.831982	2025-12-04 07:46:31.956	\N
00d89e0e-47b4-49d1-a0d3-0c812b07aa7b	test_umrpro@test.com	Test	User	\N	\N	customer	2025-12-10 15:58:54.160727	2025-12-10 15:58:54.160727	$2b$12$V0IZQo3/Mx.gQD9LM5qTT.KfndMK2FoG4cGWZ4vOyv5FA5uHTSRcy
NPXxYG	NPXxYG@example.com	John	Doe	\N	\N	customer	2025-12-04 10:02:03.52292	2025-12-04 10:02:03.52292	\N
yTC7H9	yTC7H9@example.com	John	Doe	\N	\N	customer	2025-12-04 10:18:26.048225	2025-12-04 10:18:26.048225	\N
647f990b-125e-496b-9cf3-6c5a1363e82d	test-5vhlru@example.com	Test	User	\N	\N	customer	2025-12-06 06:48:41.156747	2025-12-06 06:48:41.156747	$2b$12$VT6bJ0SYbPwdet8EMA08geZpBzHjTBgmrm3RGqIiM/gbARSPe4Np.
d6a44156-b8ce-43b0-9793-6e3b9675769b	test_signup_vmtyz6@test.com	Test	User	\N	\N	customer	2025-12-10 16:05:12.62971	2025-12-10 16:05:12.62971	$2b$12$Pv5aT32UV5B4/.tm2JkW4.fnlhuLNYKzkw/FR5YUeXcZYjYhXxwve
9865b1f0-ac30-468f-97dc-bb0101828b4b	testuser_fx2euu@test.com	Test	User	\N	\N	customer	2025-12-10 16:08:42.492502	2025-12-10 16:09:43.13	$2b$12$RJ3RzJ.1P6f0txhSmUP2we3IU/8SGGDZIomtVD7GU4plmXYNYVsda
4be663b9-9631-464b-aef3-2abbfc297391	profile_test_x2lphr@test.com	Profile	Tester	\N	\N	customer	2025-12-10 18:14:40.818053	2025-12-10 18:14:40.818053	$2b$12$mG3P5SvwBFNTTGjoSksemOKchUYZtWK1l0v1WMARpLTT.AihPWKy2
c87c1863-77ac-4d07-8d25-479bca795644	profile_test_kryczp@test.com	Profile	Tester	\N	+91 98765 43210	customer	2025-12-10 18:17:17.846718	2025-12-10 18:17:40.829	$2b$12$5KYnNKIncxEYOoUmGPqxqupnto1JSBbxJGTrVmAseNOPTU3JgHrX2
92d8c535-f154-4938-92bc-d40725e548f7	photo_test_hy0xwx@test.com	Photo	Tester	/objects/uploads/214f48b6-ada6-4452-a626-8615331ee6cf		customer	2025-12-10 18:38:53.200997	2025-12-10 18:39:20.342	$2b$12$l5V620BW1g/IX3b/IkxFJ.YOOOK/1/t3XVa42eY3PNmOAbQf7x.IO
9cc29ade-2d85-4e3f-99ea-ac94c496746b	prasanna@addingsmiles.com	Prasanna	V	/objects/uploads/90219048-7e88-4802-b90f-dc6a28805e35	9941443009	customer	2025-12-10 18:08:05.859485	2025-12-10 18:34:39.877	$2b$12$/fxNlKK4Xd6HWYgD2h7In.1CaAnGSkk5UCdW.yqbB7UU3ED5fgTFG
\.


--
-- Data for Name: verified_razorpay_payments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.verified_razorpay_payments (id, razorpay_order_id, razorpay_payment_id, user_id, guest_session_id, amount, currency, status, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: wishlist_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.wishlist_items (id, user_id, product_id, created_at) FROM stdin;
\.


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: brands brands_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_slug_unique UNIQUE (slug);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_unique UNIQUE (slug);


--
-- Name: combo_offers combo_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.combo_offers
    ADD CONSTRAINT combo_offers_pkey PRIMARY KEY (id);


--
-- Name: combo_offers combo_offers_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.combo_offers
    ADD CONSTRAINT combo_offers_slug_unique UNIQUE (slug);


--
-- Name: coupons coupons_code_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_unique UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: gift_registries gift_registries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.gift_registries
    ADD CONSTRAINT gift_registries_pkey PRIMARY KEY (id);


--
-- Name: gift_registries gift_registries_share_code_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.gift_registries
    ADD CONSTRAINT gift_registries_share_code_unique UNIQUE (share_code);


--
-- Name: gift_registry_items gift_registry_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.gift_registry_items
    ADD CONSTRAINT gift_registry_items_pkey PRIMARY KEY (id);


--
-- Name: home_blocks home_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.home_blocks
    ADD CONSTRAINT home_blocks_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_unique UNIQUE (sku);


--
-- Name: products products_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_unique UNIQUE (slug);


--
-- Name: quick_pages quick_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quick_pages
    ADD CONSTRAINT quick_pages_pkey PRIMARY KEY (id);


--
-- Name: quick_pages quick_pages_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quick_pages
    ADD CONSTRAINT quick_pages_slug_unique UNIQUE (slug);


--
-- Name: review_votes review_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.review_votes
    ADD CONSTRAINT review_votes_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: shared_wishlists shared_wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shared_wishlists
    ADD CONSTRAINT shared_wishlists_pkey PRIMARY KEY (id);


--
-- Name: shared_wishlists shared_wishlists_share_code_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shared_wishlists
    ADD CONSTRAINT shared_wishlists_share_code_unique UNIQUE (share_code);


--
-- Name: stock_notifications stock_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_notifications
    ADD CONSTRAINT stock_notifications_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verified_razorpay_payments verified_razorpay_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.verified_razorpay_payments
    ADD CONSTRAINT verified_razorpay_payments_pkey PRIMARY KEY (id);


--
-- Name: wishlist_items wishlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict uxUy2r9S3phq7KHh5JKfMX1TwAvtEX6Dhi4ig4Yfav3DtThW6brf8U12zGifws4

