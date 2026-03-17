import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import nodemailer from "nodemailer";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// --- SECURITY MIDDLEWARE ---
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for Vite dev server and external assets
    crossOriginEmbedderPolicy: false,
}));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: "Too many requests from this IP, please try again after 15 minutes"
});

// Apply the rate limiting middleware to API calls only
app.use('/api/', apiLimiter);

// --- MONGODB CONNECTION ---
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  try {
    if (!cachedClient) {
        console.log("Initializing new MongoDB Client...");
        cachedClient = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            serverSelectionTimeoutMS: 5000, 
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            maxIdleTimeMS: 10000
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

const generateOrderHtml = (order: any, isAdmin = false) => {
  const itemsRows = order.items.map((item: any) => `
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

const generateStatusHtml = (order: any) => {
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
  secure: true,
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

async function startServer() {
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- AUTHENTICATION ---
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'mail@arobazzar.lk';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'arobazzar098@';
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || crypto.randomBytes(32).toString('hex');

  app.post('/api/login', (req, res) => {
      const { email, password } = req.body;
      if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
          res.json({ success: true, token: ADMIN_TOKEN });
      } else {
          res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
  });

  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
      // Allow GET requests and POST to /orders (for customers placing orders)
      if (req.method === 'GET' || (req.method === 'POST' && req.params.collection === 'orders')) {
          return next();
      }
      
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader === `Bearer ${ADMIN_TOKEN}`) {
          return next();
      }
      
      return res.status(401).json({ error: 'Unauthorized' });
  };

  // --- UPLOAD CONFIGURATION ---
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
      destination: function (req, file, cb) {
          cb(null, uploadDir)
      },
      filename: function (req, file, cb) {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
          cb(null, uniqueSuffix + path.extname(file.originalname))
      }
  });
  const upload = multer({ storage: storage });

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadDir));

  // --- API ROUTES ---
  app.post('/api/upload', upload.single('image'), (req, res) => {
      if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
      }
      // Return the URL to access the uploaded file
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl });
  });

  app.post('/api/payhere-notify', async (req, res) => {
      const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = req.body;

      try {
          const db = await connectToDatabase();
          if (!db) return res.status(500).json({ error: "Database connection failed" });

          const settings = await db.collection("settings").findOne({ id: "global_settings" });
          const payhereConfig = settings?.paymentGateways?.find((g: any) => g.id === "PAYHERE");
          const payhereSecret = payhereConfig?.payhereSecret;

          if (payhereSecret) {
              const merchantSecretHash = crypto.createHash('md5').update(payhereSecret).digest('hex').toUpperCase();
              const hashString = merchant_id + order_id + payhere_amount + payhere_currency + status_code + merchantSecretHash;
              const generatedSig = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

              if (generatedSig === md5sig) {
                  const ordersCollection = db.collection("orders");
                  const order = await ordersCollection.findOne({ id: order_id });
                  
                  if (order) {
                      let newStatus = order.status;
                      if (status_code === "2") {
                          newStatus = "PROCESSING"; // Successful payment
                      } else if (parseInt(status_code) < 0) {
                          newStatus = "CANCELLED"; // Failed or cancelled payment
                      }

                      if (newStatus !== order.status) {
                          await ordersCollection.updateOne({ id: order_id }, { $set: { status: newStatus } });
                          
                          if (order.customerEmail) {
                              const updatedOrder = { ...order, status: newStatus };
                              await sendEmail(order.customerEmail, `Order Update: #${order_id} is now ${newStatus}`, generateStatusHtml(updatedOrder));
                          }
                      }
                  }
              }
          }
          res.status(200).json({ success: true });
      } catch (error) {
          console.error("PayHere Notify Error:", error);
          res.status(500).json({ error: "Internal Server Error" });
      }
  });

  app.all('/api/:collection/:id?', requireAuth, async (req, res) => {
    if (!process.env.MONGODB_URI) {
      return res.status(200).json({ useFallback: true });
    }

    try {
      const db = await connectToDatabase();
      const collectionName = req.params.collection;
      const id = (req.params as any).id || (req.params as any)['id?'];

      const collection = db.collection(collectionName);

      // GET
      if (req.method === "GET") {
        if (id) {
            const item = await collection.findOne({ id: id });
            return res.status(200).json(item || {});
        }
        const items = await collection.find({}).toArray();
        return res.status(200).json(items);
      }

      // POST: Create
      if (req.method === "POST") {
        const body = req.body;
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
        
        return res.status(200).json(body);
      }

      // PATCH: Update
      if (req.method === "PATCH" && id) {
         const updates = req.body;
         const originalOrder = await collection.findOne({ id: id });
         
         await collection.updateOne({ id: id }, { $set: updates });

         // EMAIL LOGIC: Status Change
         if (collectionName === "orders" && originalOrder && updates.status && originalOrder.status !== updates.status) {
            if (originalOrder.customerEmail) {
                const updatedOrder = { ...originalOrder, ...updates };
                await sendEmail(originalOrder.customerEmail, `Order Update: #${id} is now ${updates.status}`, generateStatusHtml(updatedOrder));
            }
         }

         return res.status(200).json({ success: true });
      }

      // DELETE
      if (req.method === "DELETE" && id) {
          await collection.deleteOne({ id: id });
          return res.status(200).json({ deleted: true });
      }

      return res.status(405).json({ error: "Method not supported" });

    } catch (error: any) {
      console.error("API Error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
