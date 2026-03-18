

import { MongoClient, ObjectId, ServerApiVersion, Db } from "mongodb";
import nodemailer from "nodemailer";
import { Order, CartItem, Product, Category, PaymentGateway, PaymentMethod, OrderStatus } from "../../types";

// Cache the database connection
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  try {
    // Re-use existing client if available (Connection Pooling)
    if (!cachedClient) {
        console.log("Initializing new MongoDB Client...");
        cachedClient = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            // Fail fast if DB is unreachable (5s) instead of hanging
            serverSelectionTimeoutMS: 5000, 
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            maxIdleTimeMS: 10000 // Close idle connections faster to avoid stale ones in serverless
        });
        await cachedClient.connect();
    }
    
    const db = cachedClient.db("arobazzar");
    cachedDb = db;
    return db;
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    throw err;
  }
}

const COMMON_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Content-Type": "application/json"
};

// --- EMAIL TEMPLATES ---
const LOGO_URL = "https://raw.githubusercontent.com/ethoart/arobazzar-img/main/logoabz.png";

const generateEmailTemplate = (title: string, content: string) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; color: #18181b; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background-color: #000000; padding: 30px; text-align: center; }
            .header img { height: 40px; width: auto; }
            .content { padding: 40px; }
            h1 { font-size: 24px; font-weight: 800; margin-bottom: 20px; color: #000; letter-spacing: -0.5px; }
            p { font-size: 16px; line-height: 1.6; color: #52525b; margin-bottom: 20px; }
            .btn { display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px; }
            .footer { padding: 30px; text-align: center; font-size: 12px; color: #a1a1aa; background-color: #fafafa; border-top: 1px solid #e4e4e7; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
            .table th { text-align: left; padding: 12px; border-bottom: 2px solid #f4f4f5; color: #71717a; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            .table td { padding: 12px; border-bottom: 1px solid #f4f4f5; color: #18181b; }
            .total-row td { border-top: 2px solid #000; font-weight: bold; font-size: 16px; padding-top: 15px; }
            .highlight { color: #000; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                 <img src="${LOGO_URL}" alt="Arobazzar" style="filter: invert(1);" />
            </div>
            <div class="content">
                <h1>${title}</h1>
                ${content}
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Arobazzar Inc. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const generateOrderHtml = (order: Order, isAdmin = false) => {
  const itemsRows = order.items.map((item: CartItem) => `
    <tr>
      <td>
        <div style="font-weight: bold;">${item.name}</div>
        <div style="font-size: 12px; color: #71717a;">
            ${item.selectedSize ? `Size: ${item.selectedSize}` : ''} 
            ${item.selectedColor ? `Color: ${item.selectedColor}` : ''}
        </div>
      </td>
      <td>${item.quantity}</td>
      <td style="text-align: right;">LKR ${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const content = `
      <p>Hi ${isAdmin ? 'Admin' : order.customerName},</p>
      <p>${isAdmin ? `A new order has been placed by <span class="highlight">${order.customerName}</span>.` : `Thank you for your purchase!`}</p>
      <p><strong>Order ID:</strong> #${order.id}<br><strong>Date:</strong> ${order.date}</p>
      
      <table class="table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
          <tr>
             <td colspan="2" style="text-align: right; color: #71717a;">Subtotal</td>
             <td style="text-align: right;">LKR ${(order.subtotal || order.total).toFixed(2)}</td>
          </tr>
          ${order.deliveryCharge ? `
          <tr>
             <td colspan="2" style="text-align: right; color: #71717a;">Delivery</td>
             <td style="text-align: right;">LKR ${order.deliveryCharge.toFixed(2)}</td>
          </tr>` : ''}
          ${order.discountApplied ? `
          <tr>
             <td colspan="2" style="text-align: right; color: #16a34a;">Discount</td>
             <td style="text-align: right; color: #16a34a;">- LKR ${order.discountApplied.toFixed(2)}</td>
          </tr>` : ''}
          <tr class="total-row">
             <td colspan="2" style="text-align: right;">TOTAL</td>
             <td style="text-align: right;">LKR ${order.total.toFixed(2)}</td>
          </tr>
      </table>
      
      ${isAdmin ? `
        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        <p><strong>Customer Email:</strong> ${order.customerEmail}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        <br/>
        <p style="text-align: center;"><a href="https://arobazzar.lk/#aroadmin" class="btn">Process Order</a></p>
      ` : `
        <p style="text-align: center;"><a href="https://arobazzar.lk" class="btn">View Order Details</a></p>
      `}
  `;

  return generateEmailTemplate(isAdmin ? 'New Order Received' : 'Order Confirmed', content);
};

const generateStatusHtml = (order: Order) => {
  const content = `
      <p>Hi ${order.customerName},</p>
      <p>The status of your order <strong>#${order.id}</strong> has been updated.</p>
      <div style="background-color: #f4f4f5; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
          <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #71717a; display: block; margin-bottom: 5px;">Current Status</span>
          <span style="font-size: 24px; font-weight: 800; color: #000;">${order.status}</span>
      </div>
      <p>If you have any questions, simply reply to this email.</p>
      <p style="text-align: center;"><a href="https://arobazzar.lk" class="btn">Track Order</a></p>
  `;
  return generateEmailTemplate('Order Update', content);
};

// --- EMAIL SYSTEM CONFIGURATION ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("Skipping Email: SMTP_USER or SMTP_PASS not set in environment variables.");
    return;
  }
  
  try {
    await transporter.sendMail({
      from: `"Arobazzar Store" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};

// --- SITEMAP GENERATOR ---
const generateSitemap = async (db: Db) => {
    try {
        const products = await db.collection('products').find({}).toArray() as unknown as Product[];
        const categories = await db.collection('categories').find({}).toArray() as unknown as Category[];
        const baseUrl = 'https://arobazzar.lk';

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
          <url><loc>${baseUrl}/#shop</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
          <url><loc>${baseUrl}/#trending</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;

        products.forEach(() => {
            // <loc>${baseUrl}/product/${p.id}</loc>
        });

        categories.forEach(() => {
            // <loc>${baseUrl}/category/${c.id}</loc>
        });

        xml += `</urlset>`;
        return xml;
    } catch {
        return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
    }
};

// --- MAIN HANDLER ---

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: COMMON_HEADERS });
  }

  // Handle Sitemap Request
  const urlObj = new URL(req.url);
  if (urlObj.pathname.endsWith('sitemap.xml')) {
      if (!process.env.MONGODB_URI) return new Response("Database Error", { status: 500 });
      try {
        const db = await connectToDatabase();
        const sitemap = await generateSitemap(db as Db);
        return new Response(sitemap, {
            status: 200,
            headers: {
                "Content-Type": "application/xml",
                "Cache-Control": "public, max-age=3600"
            }
        });
      } catch {
        return new Response("Sitemap Error", { status: 500 });
      }
  }

  if (!process.env.MONGODB_URI) {
    return new Response(JSON.stringify({ useFallback: true }), { status: 200, headers: COMMON_HEADERS });
  }

  try {
    const db = await connectToDatabase();
    if (!db) return new Response(JSON.stringify({ error: "Database connection failed" }), { status: 500, headers: COMMON_HEADERS });
    const url = new URL(req.url);
    const pathParts = url.pathname.replace(/^\/?api\/?/, '').split('/').filter(Boolean);
    const collectionName = pathParts[0] || "products"; 
    const id = pathParts[1]; 

    const collection = db.collection(collectionName);

    // GET
    if (req.method === "GET") {
      if (id) {
          const item = await collection.findOne({ id: id });
          return new Response(JSON.stringify(item || {}), { status: 200, headers: COMMON_HEADERS });
      }
      const items = await collection.find({}).toArray();
      return new Response(JSON.stringify(items), { status: 200, headers: COMMON_HEADERS });
    }

    // POST: PayHere Notify
    if (req.method === "POST" && collectionName === "payhere-notify") {
      const formData = await req.formData();
      const merchant_id = formData.get("merchant_id") as string;
      const order_id = formData.get("order_id") as string;
      const payhere_amount = formData.get("payhere_amount") as string;
      const payhere_currency = formData.get("payhere_currency") as string;
      const status_code = formData.get("status_code") as string;
      const md5sig = formData.get("md5sig") as string;

      // We need the payhereSecret to verify the signature.
      // Since we don't have it in env vars (it's in the DB settings), we can fetch it from DB.
      const settings = await db.collection("settings").findOne({ id: "store_settings" });
      const payhereConfig = settings?.paymentGateways?.find((g: PaymentGateway) => g.id === PaymentMethod.PAYHERE);
      const payhereSecret = payhereConfig?.payhereSecret;

      if (payhereSecret) {
        const crypto = await import('crypto');
        const merchantSecretHash = crypto.createHash('md5').update(payhereSecret).digest('hex').toUpperCase();
        const hashString = merchant_id + order_id + payhere_amount + payhere_currency + status_code + merchantSecretHash;
        const generatedSig = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

        if (generatedSig === md5sig) {
          if (!db) return new Response(JSON.stringify({ error: "Database connection failed" }), { status: 500, headers: COMMON_HEADERS });
          const ordersCollection = db.collection("orders");
          const order = await ordersCollection.findOne({ id: order_id }) as unknown as Order | null;
          
          if (order) {
            let newStatus = order.status;
            if (status_code === "2") {
              newStatus = OrderStatus.PROCESSING; // Successful payment
            } else if (parseInt(status_code) < 0) {
              newStatus = OrderStatus.CANCELLED; // Failed or cancelled payment
            }

            if (newStatus !== order.status) {
              await ordersCollection.updateOne({ id: order_id }, { $set: { status: newStatus } });
              
              // EMAIL LOGIC: Status Change
              if (order.customerEmail) {
                  const updatedOrder = { ...order, status: newStatus };
                  await sendEmail(order.customerEmail, `Order Update: #${order_id} is now ${newStatus}`, generateStatusHtml(updatedOrder));
              }
            }
          }
        }
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: COMMON_HEADERS });
    }

    // POST: Create
    if (req.method === "POST") {
      const body = await req.json();
      if (!body.id) body.id = new ObjectId().toString(); 
      
      await collection.replaceOne({ id: body.id }, body, { upsert: true });

      // EMAIL LOGIC: New Order
      if (collectionName === "orders") {
        if (body.customerEmail) {
            await sendEmail(body.customerEmail, `Order Confirmation #${body.id}`, generateOrderHtml(body, false));
        }
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            await sendEmail(adminEmail, `[New Order] #${body.id} - LKR ${body.total}`, generateOrderHtml(body, true));
        }
      }
      
      return new Response(JSON.stringify(body), { status: 200, headers: COMMON_HEADERS });
    }

    // PATCH: Update (Status Updates)
    if (req.method === "PATCH" && id) {
       const updates = await req.json();
       const originalOrder = await collection.findOne({ id: id });
       
       await collection.updateOne({ id: id }, { $set: updates });

       // EMAIL LOGIC: Status Change
       if (collectionName === "orders" && originalOrder && updates.status && originalOrder.status !== updates.status) {
          if (originalOrder.customerEmail) {
              const updatedOrder = { ...originalOrder, ...updates };
              await sendEmail(originalOrder.customerEmail, `Order Update: #${id} is now ${updates.status}`, generateStatusHtml(updatedOrder));
          }
       }

       return new Response(JSON.stringify({ success: true }), { status: 200, headers: COMMON_HEADERS });
    }

    // DELETE
    if (req.method === "DELETE" && id) {
        await collection.deleteOne({ id: id });
        return new Response(JSON.stringify({ deleted: true }), { status: 200, headers: COMMON_HEADERS });
    }

    return new Response(JSON.stringify({ error: "Method not supported" }), { status: 405, headers: COMMON_HEADERS });

  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: COMMON_HEADERS });
  }
};
