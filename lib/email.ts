// lib/email.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  items: { name: string; size: string; quantity: number; price: number }[];
  total: number;
  shippingAddress: string;
  shippingFee?: number;
  isParkPickup?: boolean;
  deliveryEstimate?: string;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-family: 'Inter', sans-serif;">
          ${item.name} (${item.size})
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          ₦${(item.price * item.quantity).toLocaleString()}
        </td>
      </tr>
    `
    )
    .join("");

  const shippingFee = data.shippingFee || 0;
  const subtotal = data.total - shippingFee;

  const deliveryHtml = data.isParkPickup
    ? `
      <div style="background:#fef3c7; padding:16px; border-radius:4px; margin-bottom:24px; border-left:4px solid #f59e0b;">
        <p style="margin:0 0 8px; font-weight:600; color:#92400e;">🚌 Bus Park Delivery</p>
        <p style="margin:0 0 4px; font-size:14px; color:#92400e;">
          Your order will be shipped to the nearest bus park in your city.
        </p>
        <p style="margin:0 0 4px; font-size:14px; color:#92400e;">
          <strong>Logistics fee:</strong> ₦${shippingFee.toLocaleString()} (included in total)
        </p>
        <p style="margin:0; font-size:13px; color:#a16207;">
          Pickup fee from the bus park is negotiated directly with the bus driver.
          Contact us on WhatsApp if you need help.
        </p>
      </div>
    `
    : shippingFee > 0
    ? `
      <div style="background:#f0fdf4; padding:16px; border-radius:4px; margin-bottom:24px; border-left:4px solid #22c55e;">
        <p style="margin:0 0 4px; font-weight:600; color:#166534;">📦 Lagos Delivery</p>
        <p style="margin:0 0 4px; font-size:14px; color:#166534;">
          <strong>Delivery fee:</strong> ₦${shippingFee.toLocaleString()}
        </p>
        <p style="margin:0; font-size:13px; color:#15803d;">
          ${data.deliveryEstimate || "Estimated delivery: 1–3 business days"}
        </p>
      </div>
    `
    : `
      <div style="background:#f0fdf4; padding:16px; border-radius:4px; margin-bottom:24px; border-left:4px solid #22c55e;">
        <p style="margin:0 0 4px; font-weight:600; color:#166534;">🎉 Free Shipping!</p>
        <p style="margin:0; font-size:13px; color:#15803d;">
          ${data.deliveryEstimate || "Estimated delivery: 1–3 business days"}
        </p>
      </div>
    `;

  const mailOptions = {
    from: `"Jey Scent" <${process.env.GMAIL_USER}>`,
    to: data.customerEmail,
    subject: `Order Confirmed — #${data.orderId.slice(-8).toUpperCase()}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0; padding:0; background:#faf9f6; font-family:'Inter',sans-serif;">
        <div style="max-width:600px; margin:0 auto; background:#fff;">
          <div style="background:#000; padding:40px; text-align:center;">
            <h1 style="color:#fff; font-family:'Playfair Display',Georgia,serif; font-size:28px; margin:0; letter-spacing:3px;">
              JEY SCENT
            </h1>
          </div>
          
          <div style="padding:40px;">
            <h2 style="font-family:'Playfair Display',Georgia,serif; font-size:24px; margin-bottom:8px;">
              Thank you, ${data.customerName} 🤍
            </h2>
            <p style="color:#6b6b6b; line-height:1.6; margin-bottom:24px;">
              Your order has been confirmed and is being prepared with love.
            </p>
            
            <div style="background:#faf9f6; padding:16px; border-radius:4px; margin-bottom:24px;">
              <p style="margin:0; font-size:14px; color:#6b6b6b;">Order Number</p>
              <p style="margin:4px 0 0; font-size:18px; font-weight:600; letter-spacing:1px;">
                #${data.orderId.slice(-8).toUpperCase()}
              </p>
            </div>

            <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
              <thead>
                <tr style="border-bottom:2px solid #000;">
                  <th style="padding:12px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Item</th>
                  <th style="padding:12px; text-align:center; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Qty</th>
                  <th style="padding:12px; text-align:right; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:8px 12px; color:#6b6b6b; font-size:14px;">Subtotal</td>
                  <td style="padding:8px 12px; text-align:right; font-size:14px;">₦${subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:8px 12px; color:#6b6b6b; font-size:14px;">
                    Delivery ${data.isParkPickup ? "(Bus Park Logistics)" : ""}
                  </td>
                  <td style="padding:8px 12px; text-align:right; font-size:14px;">
                    ${shippingFee > 0 ? `₦${shippingFee.toLocaleString()}` : "Free"}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:16px 12px; font-weight:600; font-size:16px; border-top:2px solid #000;">Total</td>
                  <td style="padding:16px 12px; text-align:right; font-weight:600; font-size:16px; border-top:2px solid #000;">
                    ₦${data.total.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>

            ${deliveryHtml}

            <div style="margin-bottom:24px;">
              <p style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#6b6b6b; margin-bottom:4px;">
                Shipping To
              </p>
              <p style="margin:0; line-height:1.6;">${data.shippingAddress}</p>
            </div>

            <div style="text-align:center; margin-top:32px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard" 
                 style="display:inline-block; background:#000; color:#fff; padding:14px 40px; text-decoration:none; font-size:13px; text-transform:uppercase; letter-spacing:2px;">
                Track Your Order
              </a>
            </div>
          </div>

          <div style="background:#faf9f6; padding:30px; text-align:center;">
            <p style="font-family:'Playfair Display',Georgia,serif; font-size:16px; margin-bottom:8px;">
              With love & intention 🤍
            </p>
            <p style="color:#6b6b6b; font-size:12px; margin:0;">
              © 2026 Jey Scent. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendAdminNotification(data: OrderEmailData) {
  const mailOptions = {
    from: `"Jey Scent System" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER!,
    subject: `🛒 New Order — #${data.orderId.slice(-8).toUpperCase()} — ₦${data.total.toLocaleString()}`,
    html: `
      <div style="font-family:'Inter',sans-serif; padding:20px;">
        <h2>New Order Received!</h2>
        <p><strong>Customer:</strong> ${data.customerName} (${data.customerEmail})</p>
        <p><strong>Order ID:</strong> #${data.orderId.slice(-8).toUpperCase()}</p>
        <p><strong>Total:</strong> ₦${data.total.toLocaleString()}</p>
        <p><strong>Shipping:</strong> ${data.shippingAddress}</p>
        <h3>Items:</h3>
        <ul>
          ${data.items.map((i) => `<li>${i.name} (${i.size}) x${i.quantity} — ₦${(i.price * i.quantity).toLocaleString()}</li>`).join("")}
        </ul>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/orders" style="display:inline-block; background:#000; color:#fff; padding:12px 24px; text-decoration:none; margin-top:16px;">
          View in Dashboard
        </a>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendWelcomeEmail(data: {
  name: string;
  email: string;
  password: string;
}) {
  const mailOptions = {
    from: `"Jey Scent" <${process.env.GMAIL_USER}>`,
    to: data.email,
    subject: "Welcome to Jey Scent 🤍 — Your Account Details",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0; padding:0; background:#faf9f6; font-family:'Inter',sans-serif;">
        <div style="max-width:600px; margin:0 auto; background:#fff;">
          <div style="background:#000; padding:40px; text-align:center;">
            <h1 style="color:#fff; font-family:'Playfair Display',Georgia,serif; font-size:28px; margin:0; letter-spacing:3px;">
              JEY SCENT
            </h1>
          </div>
          
          <div style="padding:40px;">
            <h2 style="font-family:'Playfair Display',Georgia,serif; font-size:24px; margin-bottom:8px;">
              Welcome, ${data.name}! 🤍
            </h2>
            <p style="color:#6b6b6b; line-height:1.6; margin-bottom:24px;">
              Thank you for your purchase! We've created an account for you so you can track your orders and enjoy a seamless shopping experience.
            </p>
            
            <div style="background:#faf9f6; padding:24px; border-radius:4px; margin-bottom:24px;">
              <p style="margin:0 0 12px; font-size:14px; color:#6b6b6b;">Your Login Details</p>
              <p style="margin:0 0 8px;">
                <strong>Email:</strong> ${data.email}
              </p>
              <p style="margin:0;">
                <strong>Temporary Password:</strong> 
                <code style="background:#e8e8e8; padding:2px 8px; border-radius:3px; font-size:16px; letter-spacing:1px;">
                  ${data.password}
                </code>
              </p>
            </div>

            <p style="color:#6b6b6b; line-height:1.6; margin-bottom:24px; font-size:14px;">
              We recommend changing your password after your first login for security.
            </p>

            <div style="text-align:center; margin-top:32px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/auth/login" 
                 style="display:inline-block; background:#000; color:#fff; padding:14px 40px; text-decoration:none; font-size:13px; text-transform:uppercase; letter-spacing:2px;">
                Sign In to Your Account
              </a>
            </div>
          </div>

          <div style="background:#faf9f6; padding:30px; text-align:center;">
            <p style="font-family:'Playfair Display',Georgia,serif; font-size:16px; margin-bottom:8px;">
              With love & intention 🤍
            </p>
            <p style="color:#6b6b6b; font-size:12px; margin:0;">
              © 2026 Jey Scent. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(data: {
  name: string;
  email: string;
  tempPassword: string;
}) {
  const mailOptions = {
    from: `"Jey Scent" <${process.env.GMAIL_USER}>`,
    to: data.email,
    subject: "Password Reset — Jey Scent",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0; padding:0; background:#faf9f6; font-family:'Inter',sans-serif;">
        <div style="max-width:600px; margin:0 auto; background:#fff;">
          <div style="background:#000; padding:40px; text-align:center;">
            <h1 style="color:#fff; font-family:'Playfair Display',Georgia,serif; font-size:28px; margin:0; letter-spacing:3px;">
              JEY SCENT
            </h1>
          </div>
          
          <div style="padding:40px;">
            <h2 style="font-family:'Playfair Display',Georgia,serif; font-size:22px; margin-bottom:8px;">
              Password Reset
            </h2>
            <p style="color:#6b6b6b; line-height:1.6; margin-bottom:24px;">
              Hi ${data.name}, we received a request to reset your password. Here's your temporary password:
            </p>
            
            <div style="background:#faf9f6; padding:24px; text-align:center; margin-bottom:24px;">
              <p style="margin:0 0 8px; font-size:12px; color:#6b6b6b; text-transform:uppercase; letter-spacing:2px;">
                Temporary Password
              </p>
              <p style="margin:0; font-size:24px; font-weight:bold; letter-spacing:2px; font-family:monospace;">
                ${data.tempPassword}
              </p>
            </div>

            <p style="color:#6b6b6b; line-height:1.6; margin-bottom:24px; font-size:14px;">
              Please sign in with this temporary password and change it immediately from your account settings for security.
            </p>

            <div style="text-align:center; margin-top:32px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/auth/login" 
                 style="display:inline-block; background:#000; color:#fff; padding:14px 40px; text-decoration:none; font-size:13px; text-transform:uppercase; letter-spacing:2px;">
                Sign In Now
              </a>
            </div>

            <p style="color:#999; font-size:12px; margin-top:24px; line-height:1.6;">
              If you didn't request this reset, please ignore this email. Your password will remain unchanged unless you use the temporary password above.
            </p>
          </div>

          <div style="background:#faf9f6; padding:30px; text-align:center;">
            <p style="color:#6b6b6b; font-size:12px; margin:0;">
              © 2026 Jey Scent. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// FIXED: Uses Gmail transporter (same as all other emails)
// Previously this created its own SMTP transporter with SMTP_HOST/SMTP_USER
// which didn't exist in your .env, so it silently failed
export async function sendPasswordChangedEmail(email: string, name: string) {
  const mailOptions = {
    from: `"Jey Scent" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Your Password Has Been Changed — Jey Scent",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0; padding:0; background:#faf9f6; font-family:'Inter',sans-serif;">
        <div style="max-width:600px; margin:0 auto; background:#fff;">
          <div style="background:#000; padding:40px; text-align:center;">
            <h1 style="color:#fff; font-family:'Playfair Display',Georgia,serif; font-size:28px; margin:0; letter-spacing:3px;">
              JEY SCENT
            </h1>
          </div>
          
          <div style="padding:40px;">
            <h2 style="font-family:'Playfair Display',Georgia,serif; font-size:22px; margin-bottom:8px;">
              Password Changed Successfully
            </h2>
            <p style="color:#6b6b6b; line-height:1.6; margin-bottom:16px;">
              Hi ${name},
            </p>
            <p style="color:#6b6b6b; line-height:1.6; margin-bottom:24px;">
              Your Jey Scent account password was successfully changed on 
              <strong>${new Date().toLocaleDateString("en-NG", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</strong>.
            </p>
            
            <div style="background:#fef3c7; padding:16px; border-radius:4px; margin-bottom:24px; border-left:4px solid #f59e0b;">
              <p style="margin:0; font-size:14px; color:#92400e; line-height:1.6;">
                <strong>⚠️ Didn't make this change?</strong><br>
                If you did not change your password, please contact us immediately at 
                <a href="mailto:${process.env.GMAIL_USER}" style="color:#92400e; font-weight:bold;">${process.env.GMAIL_USER}</a> 
                or reach us on WhatsApp to secure your account.
              </p>
            </div>
            
            <p style="color:#6b6b6b; line-height:1.6; margin-bottom:12px;">
              For your security, we recommend:
            </p>
            <ul style="color:#6b6b6b; font-size:14px; line-height:2;">
              <li>Use a unique password you don't use elsewhere</li>
              <li>Never share your password with anyone</li>
              <li>Log out from shared devices</li>
            </ul>
          </div>

          <div style="background:#faf9f6; padding:30px; text-align:center;">
            <p style="color:#6b6b6b; font-size:12px; margin:0;">
              This is an automated security notification.<br>
              © 2026 Jey Scent. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}