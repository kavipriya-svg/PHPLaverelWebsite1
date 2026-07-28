import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";
import { FileText, Package } from "lucide-react";

interface OrderThanksSettings {
  heroHeadline: string;
  heroSubLabel: string;
  heroImageUrl: string;
  whatsNextHeading: string;
  step1Title: string;
  step1Description: string;
  step2Title: string;
  step2Description: string;
  step3Title: string;
  step3Description: string;
  actionsHeading: string;
}

const defaultThanksSettings: OrderThanksSettings = {
  heroHeadline: "Biological Protocol: Synchronization Complete",
  heroSubLabel: "PROTOCOL SYNCHRONIZED // TRANSACTION SUCCESSFUL",
  heroImageUrl: "",
  whatsNextHeading: "What's Next?",
  step1Title: "Preparation for Shipment",
  step1Description:
    "Your order is being queued for cold-chain fulfillment. Biological integrity is maintained through -18°C stable transport.",
  step2Title: "Logistics Initialization",
  step2Description:
    "You will receive a notification via SMS/Email once the subject dossier has been dispatched to our premium courier partner.",
  step3Title: "Biological Payload Received",
  step3Description:
    "Your order arrives. For COD, payment is collected at delivery. Track progress anytime using your order identifier.",
  actionsHeading: "PRIMARY ACTIONS",
};

const GST_PERCENTAGE = 8;

interface OrderItem {
  id: string;
  title: string;
  sku: string;
  price: string;
  quantity: number;
  imageUrl: string;
}

interface Order {
  id: string;
  orderNumber: string;
  subtotal: string;
  discount: string;
  tax: string;
  shippingCost: string;
  total: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  items: OrderItem[];
}

function generateInvoiceHTML(order: Order): string {
  const itemsHTML = order.items.map((item, index) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.title}<br><span style="color: #6b7280; font-size: 12px;">SKU: ${item.sku}</span></td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${CURRENCY_SYMBOL}${parseFloat(item.price).toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${CURRENCY_SYMBOL}${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${order.orderNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.5; }
        .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
        .company-info h1 { font-size: 28px; color: #00160c; margin-bottom: 5px; }
        .invoice-details { text-align: right; }
        .invoice-details h2 { font-size: 24px; color: #1f2937; margin-bottom: 10px; }
        .invoice-details p { color: #6b7280; font-size: 14px; }
        .addresses { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .address-block { width: 45%; }
        .address-block h3 { font-size: 14px; color: #6b7280; text-transform: uppercase; margin-bottom: 10px; }
        .address-block p { font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        thead { background-color: #f3f4f6; }
        th { padding: 12px; text-align: left; font-weight: 600; font-size: 14px; color: #374151; }
        th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: right; }
        th:nth-child(3) { text-align: center; }
        .summary { display: flex; justify-content: flex-end; }
        .summary-table { width: 300px; }
        .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .summary-row.total { border-top: 2px solid #1f2937; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
        .gst-note { background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; color: #166534; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .invoice { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <div class="company-info">
            <h1>19 DOGS</h1>
            <p style="color: #6b7280; font-size: 14px;">Biological Wellness for the Modern Canine</p>
          </div>
          <div class="invoice-details">
            <h2>TAX INVOICE</h2>
            <p><strong>Invoice No:</strong> ${order.orderNumber}</p>
            <p><strong>Date:</strong> ${orderDate}</p>
            <p><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
          </div>
        </div>
        <div class="addresses">
          <div class="address-block">
            <h3>Bill To / Ship To</h3>
            <p><strong>${order.shippingAddress.name}</strong></p>
            <p>${order.shippingAddress.line1}</p>
            ${order.shippingAddress.line2 ? `<p>${order.shippingAddress.line2}</p>` : ''}
            <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
            <p>${order.shippingAddress.country}</p>
          </div>
          <div class="address-block">
            <h3>Payment Information</h3>
            <p><strong>Method:</strong> ${order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod === "razorpay" ? "Razorpay" : "Card Payment"}</p>
            <p><strong>Payment Status:</strong> ${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Item Description</th>
              <th style="width: 80px; text-align: center;">Qty</th>
              <th style="width: 120px; text-align: right;">Unit Price</th>
              <th style="width: 120px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
        <div class="gst-note">
          <strong>GST Note:</strong> GST @ ${GST_PERCENTAGE}% is included in the total amount as per Government of India regulations.
        </div>
        <div class="summary">
          <div class="summary-table">
            <div class="summary-row"><span>Subtotal</span><span>${CURRENCY_SYMBOL}${parseFloat(order.subtotal).toFixed(2)}</span></div>
            ${parseFloat(order.discount) > 0 ? `<div class="summary-row" style="color: #16a34a;"><span>Discount</span><span>-${CURRENCY_SYMBOL}${parseFloat(order.discount).toFixed(2)}</span></div>` : ''}
            <div class="summary-row"><span>Shipping</span><span>${parseFloat(order.shippingCost) === 0 ? 'Free' : `${CURRENCY_SYMBOL}${parseFloat(order.shippingCost).toFixed(2)}`}</span></div>
            <div class="summary-row"><span>GST (${GST_PERCENTAGE}%)</span><span>${CURRENCY_SYMBOL}${parseFloat(order.tax).toFixed(2)}</span></div>
            <div class="summary-row total"><span>Total</span><span>${CURRENCY_SYMBOL}${parseFloat(order.total).toFixed(2)}</span></div>
          </div>
        </div>
        <div class="footer">
          <p>Thank you for your order with 19 DOGS!</p>
          <p style="margin-top: 5px;">This is a computer-generated invoice and does not require a signature.</p>
        </div>
        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="background-color: #00160c; color: white; padding: 12px 24px; border: none; font-size: 16px; cursor: pointer; margin-right: 10px;">Print Invoice</button>
          <button onclick="window.close()" style="background-color: #6b7280; color: white; padding: 12px 24px; border: none; font-size: 16px; cursor: pointer;">Close</button>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "pending": return "PENDING LOGISTICS INITIALIZATION";
    case "confirmed": return "PROTOCOL CONFIRMED";
    case "processing": return "PROCESSING — COLD CHAIN ACTIVE";
    case "shipped": return "DISPATCHED — IN TRANSIT";
    case "delivered": return "DELIVERED — BIOLOGICAL PAYLOAD RECEIVED";
    case "cancelled": return "PROTOCOL CANCELLED";
    default: return status.toUpperCase();
  }
}

function getPaymentLabel(method: string): string {
  switch (method) {
    case "cod": return "Cash on Delivery";
    case "razorpay": return "Razorpay";
    case "stripe": return "Card Payment";
    default: return method;
  }
}

export default function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  const { data, isLoading, error } = useQuery<{ order: Order }>({
    queryKey: ["/api/orders/track", orderNumber],
    enabled: !!orderNumber,
  });

  const { data: thanksData } = useQuery<{ settings: OrderThanksSettings }>({
    queryKey: ["/api/settings/order-thanks"],
  });

  const ts = { ...defaultThanksSettings, ...(thanksData?.settings ?? {}) };

  const order = data?.order;

  const handleExportInvoice = () => {
    if (!order) return;
    const invoiceHTML = generateInvoiceHTML(order);
    const invoiceWindow = window.open('', '_blank');
    if (invoiceWindow) {
      invoiceWindow.document.write(invoiceHTML);
      invoiceWindow.document.close();
    }
  };

  const orderDate = order
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{
          background: "#f9faf6",
          backgroundImage:
            "linear-gradient(to right, rgba(113,121,115,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(113,121,115,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <nav className="sticky top-0 z-50 border-b border-[#c1c8c2] bg-[#f9faf6]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 lg:px-16 py-3 flex justify-between items-center">
            <a href="/" className="text-2xl font-black tracking-tighter text-[#00160c]">19 DOGS</a>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-2 border-[#00160c] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#00160c]/50 font-mono">Synchronizing Protocol Data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{
          background: "#f9faf6",
          backgroundImage:
            "linear-gradient(to right, rgba(113,121,115,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(113,121,115,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <nav className="sticky top-0 z-50 border-b border-[#c1c8c2] bg-[#f9faf6]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 lg:px-16 py-3 flex justify-between items-center">
            <a href="/" className="text-2xl font-black tracking-tighter text-[#00160c]">19 DOGS</a>
          </div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <Package className="h-14 w-14 text-[#00160c]/30" />
          <p className="text-xl font-black uppercase tracking-tight text-[#00160c]">Protocol Not Found</p>
          <p className="text-[11px] tracking-[0.15em] uppercase text-[#00160c]/40">We couldn't locate that dossier. Verify the identifier and retry.</p>
          <div className="flex gap-4">
            <a href="/" className="bg-[#00160c] text-white px-8 py-3 text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-[#012d1d] transition-colors" data-testid="link-continue-shopping">
              Return to Catalog
            </a>
            <a href="/track-order" className="border border-[#00160c] text-[#00160c] px-8 py-3 text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-[#00160c]/5 transition-colors">
              Track Order
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col text-[#1a1c1a]"
      style={{
        background: "#f9faf6",
        backgroundImage:
          "linear-gradient(to right, rgba(113,121,115,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(113,121,115,0.05) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#c1c8c2] bg-[#f9faf6]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 py-3 flex justify-between items-center">
          <a href="/" className="text-2xl font-black tracking-tighter text-[#00160c]" data-testid="link-header-logo">
            19 DOGS
          </a>
          <div className="hidden md:flex gap-8">
            <a href="/shop" className="text-[#414844] hover:text-[#00160c] transition-colors text-sm font-semibold">PROTOCOLS</a>
            <a href="/shop" className="text-[#414844] hover:text-[#00160c] transition-colors text-sm font-semibold">VITALITY</a>
            <a href="/about" className="text-[#414844] hover:text-[#00160c] transition-colors text-sm font-semibold">SCIENCE</a>
          </div>
          <a
            href="/account/orders"
            className="text-[10px] tracking-[0.15em] uppercase font-bold text-[#00160c] border border-[#00160c] px-6 py-2 hover:bg-[#00160c] hover:text-white transition-all"
            data-testid="link-my-orders"
          >
            MY ORDERS
          </a>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-16 py-16">

        {/* Hero Section */}
        <section className="grid grid-cols-12 gap-6 relative mb-20">
          <div className="col-span-12 md:col-span-7 z-10">
            <div
              className="bg-[#00160c] p-10 md:p-12 text-white relative"
              style={{ boxShadow: "40px 40px 0 0 rgba(1,45,29,0.05)" }}
            >
              <div className="font-mono text-[10px] tracking-[0.1em] text-[#a5d0b8] mb-4 uppercase">
                TRANS_ID: {order.orderNumber}
              </div>
              <h1 className="text-4xl md:text-6xl font-black leading-none mb-6 tracking-tighter" data-testid="text-order-success">
                {ts.heroHeadline}
              </h1>
              <div className="flex items-center gap-3 py-4 border-y border-white/10 mt-8">
                <svg viewBox="0 0 24 24" fill="#ffb695" className="w-5 h-5 flex-shrink-0">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#a5d0b8]">
                  {ts.heroSubLabel}
                </p>
              </div>
            </div>
          </div>
          {/* Hero image — admin override OR first cart item */}
          {(ts.heroImageUrl || order.items[0]?.imageUrl) && (
            <div className="col-span-12 md:col-span-6 md:absolute md:right-0 md:-top-12 md:h-[420px] w-full md:w-7/12 -mt-6 md:mt-0">
              <img
                src={ts.heroImageUrl || order.items[0].imageUrl}
                alt={ts.heroImageUrl ? "Hero image" : order.items[0].title}
                className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-700 cursor-crosshair"
                loading="lazy"
              />
            </div>
          )}
        </section>

        {/* Order Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-[#c1c8c2] pt-8 mb-20">
          {/* Identifier / Status */}
          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#717973] font-bold mb-2">IDENTIFIER</h3>
              <p className="font-mono text-sm font-bold text-[#00160c]" data-testid="text-order-number">
                #{order.orderNumber}
              </p>
            </div>
            <div>
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#717973] font-bold mb-2">TEMPORAL LOG</h3>
              <p className="font-mono text-sm text-[#1a1c1a]">{orderDate}</p>
            </div>
            <div>
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#717973] font-bold mb-2">CURRENT STATUS</h3>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e8e8e5] border border-[#c1c8c2]" data-testid="badge-order-status">
                <div className="w-2 h-2 rounded-full bg-[#944923] animate-pulse flex-shrink-0" />
                <p className="font-mono text-[10px] font-bold text-[#1a1c1a]">{getStatusLabel(order.status)}</p>
              </div>
            </div>
          </div>

          {/* Shipping / Payment */}
          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#717973] font-bold mb-2">SHIPPING COORDINATES</h3>
              <div className="text-sm text-[#414844] leading-relaxed space-y-0.5">
                <p className="font-bold text-[#00160c]">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
              </div>
            </div>
            <div>
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#717973] font-bold mb-2">FINANCIAL SYNCHRONIZATION</h3>
              <p className="font-mono text-sm text-[#1a1c1a]">Method: {getPaymentLabel(order.paymentMethod)}</p>
              <p className="font-mono text-[10px] text-[#944923] mt-1 uppercase tracking-widest">
                (Status: {order.paymentStatus})
              </p>
            </div>
          </div>

          {/* Financial Ledger */}
          <div className="bg-[#f3f4f0] p-8 border-l-2 border-[#012d1d] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5">
              <svg viewBox="0 0 24 24" fill="#00160c" className="w-16 h-16">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </div>
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#00160c] font-bold mb-6">FINANCIAL LEDGER</h3>
            <div className="space-y-3 font-mono text-sm border-b border-[#c1c8c2] pb-4 mb-4">
              <div className="flex justify-between">
                <span className="text-[#414844]">SUBTOTAL</span>
                <span>{formatCurrency(parseFloat(order.subtotal))}</span>
              </div>
              {parseFloat(order.discount) > 0 && (
                <div className="flex justify-between text-[#944923]">
                  <span>DISCOUNT</span>
                  <span>-{formatCurrency(parseFloat(order.discount))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#414844]">LOGISTICS</span>
                <span>{parseFloat(order.shippingCost) === 0 ? "FREE" : formatCurrency(parseFloat(order.shippingCost))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#414844]">GST ({GST_PERCENTAGE}%)</span>
                <span>{formatCurrency(parseFloat(order.tax))}</span>
              </div>
            </div>
            <div className="flex justify-between font-mono text-lg font-bold text-[#00160c]">
              <span>TOTAL</span>
              <span data-testid="text-order-total">{formatCurrency(parseFloat(order.total))}</span>
            </div>
          </div>
        </div>

        {/* Order Items Dossier */}
        <section className="mb-20">
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#00160c] mb-8 border-b border-[#c1c8c2] pb-4">
            Order Items Dossier
          </h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-white p-6 border-l-4 border-[#944923]"
                style={{ boxShadow: "40px 40px 0 0 rgba(1,45,29,0.05)" }}
                data-testid={`order-item-${item.id}`}
              >
                <div className="w-24 h-24 bg-[#e2e3e0] flex-shrink-0 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover grayscale"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-[#717973]/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 border border-black/5" />
                </div>
                <div className="flex-grow">
                  <div className="font-mono text-[10px] text-[#717973] mb-1">SKU: {item.sku || "19D-ITEM"}</div>
                  <h4 className="text-base font-black text-[#00160c] leading-tight">{item.title}</h4>
                  <p className="text-sm text-[#414844] mt-1 opacity-70">
                    Biological nutrition optimized for metabolic synchronization.
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-[10px] text-[#717973] mb-1 uppercase">Unit × Quantity</div>
                  <div className="font-mono text-sm font-bold text-[#00160c]">
                    {formatCurrency(parseFloat(item.price))} × {item.quantity}
                  </div>
                  <div className="font-mono text-xs text-[#944923] mt-1">
                    = {formatCurrency(parseFloat(item.price) * item.quantity)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What's Next */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-20">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-[#00160c] mb-8">{ts.whatsNextHeading}</h2>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-8 h-8 rounded-full bg-[#012d1d] text-white flex items-center justify-center font-mono text-xs flex-shrink-0">
                  01
                </div>
                <div>
                  <h4 className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#00160c] mb-1">
                    {ts.step1Title}
                  </h4>
                  <p className="text-sm text-[#414844] leading-relaxed">{ts.step1Description}</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-8 h-8 rounded-full border border-[#717973] text-[#717973] flex items-center justify-center font-mono text-xs flex-shrink-0">
                  02
                </div>
                <div>
                  <h4 className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#717973] mb-1">
                    {ts.step2Title}
                  </h4>
                  <p className="text-sm text-[#414844] opacity-60 leading-relaxed">{ts.step2Description}</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-8 h-8 rounded-full border border-[#c1c8c2] text-[#c1c8c2] flex items-center justify-center font-mono text-xs flex-shrink-0">
                  03
                </div>
                <div>
                  <h4 className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#c1c8c2] mb-1">
                    {ts.step3Title}
                  </h4>
                  <p className="text-sm text-[#414844] opacity-40 leading-relaxed">{ts.step3Description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Actions Panel */}
          <div className="bg-[#012d1d] p-10 text-white flex flex-col gap-5">
            <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#a5d0b8]">{ts.actionsHeading}</h3>
            <Link
              href="/track-order"
              className="block w-full bg-white text-[#00160c] font-mono text-[10px] tracking-[0.2em] uppercase py-4 text-center hover:bg-[#ffdbcc] transition-colors"
              data-testid="button-track-order"
            >
              TRACK YOUR ORDER
            </Link>
            <button
              onClick={handleExportInvoice}
              className="w-full border border-white/20 text-white font-mono text-[10px] tracking-[0.2em] uppercase py-4 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              data-testid="button-download-invoice"
            >
              <FileText className="h-3.5 w-3.5" />
              DOWNLOAD INVOICE
            </button>
            <Link
              href="/account/orders"
              className="block w-full border border-white/10 text-white/70 font-mono text-[10px] tracking-[0.2em] uppercase py-4 text-center hover:bg-white/10 transition-colors"
              data-testid="button-view-orders"
            >
              VIEW ALL ORDERS
            </Link>
            <a
              href="/"
              className="text-center font-mono text-[10px] text-[#a5d0b8] underline underline-offset-8 mt-2 hover:text-white transition-colors block"
              data-testid="link-continue-shopping"
            >
              CONTINUE SHOPPING
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#00160c] mt-16">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 lg:px-16 py-8 border-t border-[#c1c8c2]/20 max-w-7xl mx-auto w-full gap-6">
          <div className="text-2xl font-black tracking-tighter text-white">19 DOGS</div>
          <div className="flex flex-wrap justify-center gap-8">
            <a href="/pages/terms" className="text-[10px] tracking-[0.15em] uppercase text-white/50 hover:text-white transition-colors">FDA Compliance</a>
            <a href="/about" className="text-[10px] tracking-[0.15em] uppercase text-white/50 hover:text-white transition-colors">Clinical Data</a>
            <a href="/pages/privacy" className="text-[10px] tracking-[0.15em] uppercase text-white/50 hover:text-white transition-colors">Privacy</a>
            <a href="/pages/terms" className="text-[10px] tracking-[0.15em] uppercase text-white/50 hover:text-white transition-colors">Ethics</a>
          </div>
          <p className="text-[9px] text-white/30 tracking-[0.2em] uppercase text-center md:text-right">
            &copy; 2024 19 DOGS BIOLOGICAL SYSTEMS. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}
