import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || "store@resend.dev";
const STORE_NAME = process.env.STORE_NAME || "Our Store";

interface OrderEmailData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    title: string;
    quantity: number;
    price: string;
  }>;
  subtotal: string;
  tax: string;
  shipping: string;
  discount?: string;
  total: string;
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
}

interface StatusUpdateData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  oldStatus: string;
  newStatus: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

interface LowStockAlertProduct {
  title: string;
  sku: string;
  currentStock: number;
  threshold: number;
}

interface LowStockAlertData {
  adminEmail: string;
  products: LowStockAlertProduct[];
}

function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

function formatStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "Order Placed",
    confirmed: "Order Confirmed",
    processing: "Being Prepared",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };
  return statusMap[status] || status;
}

function getOrderConfirmationHtml(data: OrderEmailData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price)}</td>
    </tr>
  `
    )
    .join("");

  const addressHtml = data.shippingAddress
    ? `
    <div style="margin-top: 24px;">
      <h3 style="margin: 0 0 12px 0; color: #333;">Shipping Address</h3>
      <p style="margin: 0; color: #666; line-height: 1.6;">
        ${data.shippingAddress.name}<br>
        ${data.shippingAddress.line1}<br>
        ${data.shippingAddress.line2 ? data.shippingAddress.line2 + "<br>" : ""}
        ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
        ${data.shippingAddress.country}
      </p>
    </div>
  `
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 24px;">Thank You for Your Order!</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9);">Order #${data.orderNumber}</p>
      </div>
      
      <div style="padding: 32px;">
        <p style="margin: 0 0 24px 0; color: #333; font-size: 16px;">
          Hi ${data.customerName},<br><br>
          We've received your order and it's being processed. Here's a summary of your purchase:
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background: #f9f9f9;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #333;">Item</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #333;">Qty</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; color: #333;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="border-top: 2px solid #eee; padding-top: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #666;">Subtotal:</span>
            <span style="color: #333; font-weight: 500;">${formatCurrency(data.subtotal)}</span>
          </div>
          ${
            data.discount
              ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #22c55e;">Discount:</span>
            <span style="color: #22c55e; font-weight: 500;">-${formatCurrency(data.discount)}</span>
          </div>
          `
              : ""
          }
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #666;">Shipping:</span>
            <span style="color: #333; font-weight: 500;">${data.shipping === "0" ? "Free" : formatCurrency(data.shipping)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #666;">Tax:</span>
            <span style="color: #333; font-weight: 500;">${formatCurrency(data.tax)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #eee;">
            <span style="color: #333; font-weight: 600; font-size: 18px;">Total:</span>
            <span style="color: #333; font-weight: 700; font-size: 18px;">${formatCurrency(data.total)}</span>
          </div>
        </div>
        
        ${addressHtml}
        
        <div style="margin-top: 24px;">
          <h3 style="margin: 0 0 8px 0; color: #333;">Payment Method</h3>
          <p style="margin: 0; color: #666;">${data.paymentMethod === "cod" ? "Cash on Delivery" : "Paid Online"}</p>
        </div>
        
        <div style="margin-top: 32px; padding: 16px; background: #f0f9ff; border-radius: 8px;">
          <p style="margin: 0; color: #0369a1; font-size: 14px;">
            We'll send you another email when your order ships. You can track your order status anytime.
          </p>
        </div>
      </div>
      
      <div style="background: #f9f9f9; padding: 24px; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          Questions? Contact us at support@example.com<br>
          Thank you for shopping with ${STORE_NAME}!
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

function getStatusUpdateHtml(data: StatusUpdateData): string {
  const trackingHtml =
    data.trackingNumber && data.newStatus === "shipped"
      ? `
    <div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border-radius: 8px;">
      <h3 style="margin: 0 0 8px 0; color: #166534;">Tracking Information</h3>
      <p style="margin: 0; color: #166534;">
        Tracking Number: <strong>${data.trackingNumber}</strong>
        ${data.trackingUrl ? `<br><a href="${data.trackingUrl}" style="color: #16a34a;">Track your package</a>` : ""}
      </p>
    </div>
  `
      : "";

  const statusColor =
    data.newStatus === "cancelled" || data.newStatus === "refunded"
      ? "#dc2626"
      : data.newStatus === "delivered"
        ? "#16a34a"
        : "#2563eb";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="background: ${statusColor}; padding: 32px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 24px;">Order Status Update</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9);">Order #${data.orderNumber}</p>
      </div>
      
      <div style="padding: 32px;">
        <p style="margin: 0 0 24px 0; color: #333; font-size: 16px;">
          Hi ${data.customerName},<br><br>
          Your order status has been updated.
        </p>
        
        <div style="display: flex; align-items: center; justify-content: center; gap: 16px; padding: 24px; background: #f9f9f9; border-radius: 8px;">
          <div style="text-align: center;">
            <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;">Previous Status</p>
            <p style="margin: 0; color: #333; font-weight: 500;">${formatStatusLabel(data.oldStatus)}</p>
          </div>
          <div style="color: #999; font-size: 24px;">→</div>
          <div style="text-align: center;">
            <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;">Current Status</p>
            <p style="margin: 0; color: ${statusColor}; font-weight: 600; font-size: 18px;">${formatStatusLabel(data.newStatus)}</p>
          </div>
        </div>
        
        ${trackingHtml}
        
        <div style="margin-top: 32px; text-align: center;">
          <p style="margin: 0; color: #666;">
            You can view your complete order details in your account.
          </p>
        </div>
      </div>
      
      <div style="background: #f9f9f9; padding: 24px; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          Questions? Contact us at support@example.com<br>
          Thank you for shopping with ${STORE_NAME}!
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

function getLowStockAlertHtml(data: LowStockAlertData): string {
  const productsHtml = data.products
    .map(
      (p) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${p.title}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${p.sku}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; color: #dc2626; font-weight: 600;">${p.currentStock}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${p.threshold}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="background: #dc2626; padding: 32px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 24px;">Low Stock Alert</h1>
        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9);">${data.products.length} product(s) need attention</p>
      </div>
      
      <div style="padding: 32px;">
        <p style="margin: 0 0 24px 0; color: #333; font-size: 16px;">
          The following products are running low on stock and may need to be restocked soon:
        </p>
        
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #fef2f2;">
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #991b1b;">Product</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #991b1b;">SKU</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #991b1b;">Stock</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; color: #991b1b;">Threshold</th>
            </tr>
          </thead>
          <tbody>
            ${productsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 24px; text-align: center;">
          <p style="margin: 0; color: #666;">
            Please log in to the admin panel to manage inventory.
          </p>
        </div>
      </div>
      
      <div style="background: #f9f9f9; padding: 24px; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          ${STORE_NAME} Inventory Alert System
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

export const emailService = {
  async sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
    if (!resend) {
      console.log("[Email] Resend not configured, skipping order confirmation email");
      return true;
    }

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: data.customerEmail,
        subject: `Order Confirmation - #${data.orderNumber}`,
        html: getOrderConfirmationHtml(data),
      });
      console.log(`[Email] Order confirmation sent to ${data.customerEmail}`);
      return true;
    } catch (error) {
      console.error("[Email] Failed to send order confirmation:", error);
      return false;
    }
  },

  async sendStatusUpdate(data: StatusUpdateData): Promise<boolean> {
    if (!resend) {
      console.log("[Email] Resend not configured, skipping status update email");
      return true;
    }

    try {
      const subject =
        data.newStatus === "shipped" && data.trackingNumber
          ? `Your Order Has Shipped! - #${data.orderNumber}`
          : `Order Update - #${data.orderNumber}`;

      await resend.emails.send({
        from: FROM_EMAIL,
        to: data.customerEmail,
        subject,
        html: getStatusUpdateHtml(data),
      });
      console.log(`[Email] Status update sent to ${data.customerEmail}`);
      return true;
    } catch (error) {
      console.error("[Email] Failed to send status update:", error);
      return false;
    }
  },

  async sendLowStockAlert(data: LowStockAlertData): Promise<boolean> {
    if (!resend) {
      console.log("[Email] Resend not configured, skipping low stock alert");
      return false;
    }

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: data.adminEmail,
        subject: `Low Stock Alert - ${data.products.length} Product(s) Need Attention`,
        html: getLowStockAlertHtml(data),
      });
      console.log(`[Email] Low stock alert sent to ${data.adminEmail}`);
      return true;
    } catch (error) {
      console.error("[Email] Failed to send low stock alert:", error);
      return false;
    }
  },

  async sendRestockNotification(email: string, data: { productTitle: string; productUrl: string; productImage?: string }): Promise<boolean> {
    if (!resend) {
      console.log("[Email] Resend not configured, skipping restock notification");
      return true;
    }

    try {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="background: #16a34a; padding: 32px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 24px;">Good News! It's Back in Stock!</h1>
      </div>
      
      <div style="padding: 32px;">
        <p style="margin: 0 0 24px 0; color: #333; font-size: 16px;">
          Great news! The item you've been waiting for is now back in stock:
        </p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center;">
          ${data.productImage ? `<img src="${data.productImage}" alt="${data.productTitle}" style="max-width: 200px; height: auto; margin-bottom: 16px; border-radius: 8px;">` : ''}
          <h2 style="margin: 0 0 16px 0; color: #333;">${data.productTitle}</h2>
          <a href="${data.productUrl}" style="display: inline-block; padding: 12px 24px; background: #16a34a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">Shop Now</a>
        </div>
        
        <p style="margin: 24px 0 0 0; color: #666; font-size: 14px; text-align: center;">
          Hurry! Popular items sell out quickly.
        </p>
      </div>
      
      <div style="background: #f9f9f9; padding: 24px; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          Thank you for shopping with ${STORE_NAME}!
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `${data.productTitle} is back in stock!`,
        html,
      });
      console.log(`[Email] Restock notification sent to ${email}`);
      return true;
    } catch (error) {
      console.error("[Email] Failed to send restock notification:", error);
      return false;
    }
  },

  isConfigured(): boolean {
    return resend !== null;
  },
};
