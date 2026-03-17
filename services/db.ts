
import { Product, Order, Review, SiteSettings, OrderStatus, PaymentMethod, Category } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS } from '../constants';
import { normalizeIpfsUrl } from './ipfs';

const API_URL = (import.meta as any).env.VITE_API_URL || '/api';

const DB_KEYS = {
  PRODUCTS: 'arobazzar_products',
  CATEGORIES: 'arobazzar_categories',
  ORDERS: 'arobazzar_orders',
  SETTINGS: 'arobazzar_settings'
};

const INITIAL_CATEGORIES: Category[] = [
    { id: 'cat_electronics', name: 'Electronics' },
    { id: 'cat_fashion', name: 'Fashion' },
    { id: 'cat_home', name: 'Home' },
    { id: 'cat_toys', name: 'Toys' },
    { id: 'cat_art', name: 'Art' },
    { id: 'sub_men', name: 'Men', parentId: 'cat_fashion' },
    { id: 'sub_women', name: 'Women', parentId: 'cat_fashion' },
    { id: 'sub_headphones', name: 'Headphones', parentId: 'cat_electronics' }
];

const INITIAL_SETTINGS: SiteSettings = {
  heroTitle: "WELCOME.",
  heroSubtitle: "Your premium destination for fashion and lifestyle.",
  heroImage: "https://raw.githubusercontent.com/ethoart/arobazzar-img/main/photo_2025-12-07_13-20-00.jpg",
  
  siteLogo: "https://raw.githubusercontent.com/ethoart/arobazzar-img/main/logoabz.png",
  siteFavicon: "https://raw.githubusercontent.com/ethoart/arobazzar-img/main/favicona.png",

  heroBanners: [],
  
  bannerTitle: "LATEST DROPS",
  bannerText: "Sign up for exclusive drops, early access to sales, and limited edition items.",
  
  middleBanner: {
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop",
    title: "DEFINE YOUR STYLE.",
    subtitle: "Premium collections curated for the bold.",
    linkType: 'CATEGORY',
    linkValue: 'Fashion'
  },
  watchSection: {
    image: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?q=80&w=1200&auto=format&fit=crop",
    title: "TIMELESS ELEGANCE.",
    linkType: 'CATEGORY',
    linkValue: 'Fashion'
  },
  watchSectionProductIds: [], 
  fashionSection: {
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop",
    title: "STREET CULTURE.",
    subtitle: "Apparel that speaks louder than words.",
    linkType: 'CATEGORY',
    linkValue: 'Fashion'
  },
  bentoGrid: {
    largeImage: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000",
    largeTitle: "ATHLETIC GEAR",
    topImage: "https://images.unsplash.com/photo-1523293188086-b51292955d2c?q=80&w=1000",
    topTitle: "ACCESSORIES",
    bottomImage: "https://images.unsplash.com/photo-1485230946387-dd4091693b42?q=80&w=1000",
    bottomTitle: "NEW ARRIVALS"
  },
  discountCodes: [
    { code: 'WELCOME10', type: 'PERCENTAGE', value: 10, isActive: true },
    { code: 'SAVE500', type: 'FIXED', value: 500, isActive: true, minOrderAmount: 2000 }
  ],
  deliveryCharge: 350, 
  contactEmail: "support@arobazzar.com",
  contactPhone: "+1 (555) 123-4567",
  contactAddress: "Online Only",
  
  privacyText: `ARObazzar Privacy Policy...`,
  termsText: `ARObazzar Terms of Service...`,
  paymentPolicyText: `ARObazzar Payment Policy...`,
  returnPolicyText: `ARObazzar Return Policy...`,

  paymentGateways: [
    { id: PaymentMethod.COD, enabled: true, nameOverride: "Cash on Delivery", instructions: "Pay with cash upon delivery." },
    { id: PaymentMethod.BANK_DEPOSIT, enabled: true, nameOverride: "Bank Deposit / Transfer", instructions: "Please upload your slip.", bankDetails: { bankName: "Commercial Bank", accountName: "Arobazzar PVT LTD", accountNumber: "1234567890", branch: "Main" } },
    { id: PaymentMethod.PAYPAL, enabled: true, nameOverride: "PayPal / Cards", instructions: "Pay via PayPal or Credit/Debit Card.", paypalClientId: "" },
    { id: PaymentMethod.PAYHERE, enabled: false, nameOverride: "PayHere", instructions: "Pay securely with PayHere.", payhereMerchantId: "", payhereSecret: "", payhereEnv: "sandbox" },
    { id: PaymentMethod.BASE_ETH, enabled: true, nameOverride: "ETH (Base)", walletAddress: "0x37F01B225bce58E3ebB6331Febc051527EfEe484", instructions: "Secured by Smart Contract." },
    { id: PaymentMethod.BASE_USDC, enabled: true, nameOverride: "USDC (Base)", walletAddress: "0x37F01B225bce58E3ebB6331Febc051527EfEe484", instructions: "Secured by Smart Contract." },
    { id: PaymentMethod.BASE_USDT, enabled: true, nameOverride: "USDT (Base)", walletAddress: "0x37F01B225bce58E3ebB6331Febc051527EfEe484", instructions: "Secured by Smart Contract." }
  ]
};

// --- IMAGE OPTIMIZATION ---
export const getOptimizedImage = (url: string | undefined, width: number = 600) => {
    if (!url || url.length < 5) return "https://placehold.co/600x600/f3f4f6/a3a3a3?text=No+Image";
    
    // Step 1: Normalize IPFS URLs to the fastest gateway (Pinata)
    // This resolves the issue where 1MB files were taking minutes to load.
    let cleanUrl = normalizeIpfsUrl(url.trim());
    
    // Step 2: Fix GitHub blob URLs
    if (cleanUrl.includes('github.com') && cleanUrl.includes('/blob/')) {
        cleanUrl = cleanUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }

    // Skip optimization for local/blob/placeholder
    if (cleanUrl.includes('placehold.co') || cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:') || cleanUrl.includes('localhost')) {
        return cleanUrl;
    }

    // Step 3: Bucket width for better CDN caching
    let targetWidth = 600;
    if (width <= 150) targetWidth = 150;
    else if (width <= 400) targetWidth = 400;
    else if (width <= 800) targetWidth = 800;
    else if (width <= 1200) targetWidth = 1200;
    else targetWidth = 1920;

    // Step 4: Use high-speed proxy with WebP conversion
    // This is the final layer of optimization for ultra-fast perceived load times.
    return `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=${targetWidth}&q=75&output=webp&il=1&n=-1`;
};

// ... Auth and other DB functions remain same ...

export const warmUp = () => { try { fetch(`${API_URL}/settings?warmup=true`).catch(() => {}); } catch(e) {} };
warmUp();

const fetchFromApi = async (endpoint: string, options?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
        let url = `${API_URL}${endpoint}`;
        const token = sessionStorage.getItem('admin_token');
        const headers: HeadersInit = {
            ...options?.headers,
        };
        if (token) {
            (headers as any)['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch(url, { ...options, headers, signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const data = await res.json();
        if (data && data.useFallback) throw new Error("API requested fallback");
        return data;
    } catch (e: any) {
        clearTimeout(timeoutId);
        throw new Error("FALLBACK_TO_LOCAL");
    }
};

export const authenticate = async (email: string, pass: string): Promise<boolean> => {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.token) {
                sessionStorage.setItem('admin_token', data.token);
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error("Login Error:", e);
        return false;
    }
};

export const getInitialSettings = (): SiteSettings => {
    try {
        const stored = localStorage.getItem(DB_KEYS.SETTINGS);
        if (stored) return { ...INITIAL_SETTINGS, ...JSON.parse(stored) };
    } catch (e) {}
    return INITIAL_SETTINGS;
};

export const getLocalProducts = (): Product[] => {
    try {
        const stored = localStorage.getItem(DB_KEYS.PRODUCTS);
        return stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
    } catch(e) { return INITIAL_PRODUCTS; }
};

export const getLocalCategories = (): Category[] => {
    try {
        const stored = localStorage.getItem(DB_KEYS.CATEGORIES);
        return stored ? JSON.parse(stored) : INITIAL_CATEGORIES;
    } catch(e) { return INITIAL_CATEGORIES; }
};

export const getProducts = async (): Promise<Product[]> => {
  try {
      const data = await fetchFromApi('/products');
      if (Array.isArray(data)) localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(data));
      return data;
  } catch (e) { return getLocalProducts(); }
};

export const saveProduct = async (product: Product): Promise<Product> => {
  try {
      return await fetchFromApi('/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product) });
  } catch (e) {
      const products = await getProducts();
      const existingIndex = products.findIndex(p => p.id === product.id);
      let newList = existingIndex >= 0 ? [...products] : [product, ...products];
      if (existingIndex >= 0) newList[existingIndex] = product;
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(newList));
      return product;
  }
};

export const removeProduct = async (id: string): Promise<void> => {
  try { await fetchFromApi(`/products/${id}`, { method: 'DELETE' }); } catch (e) {
      const products = await getProducts();
      const newList = products.filter(p => p.id !== id);
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(newList));
  }
};

export const getCategories = async (): Promise<Category[]> => {
    try {
        const data = await fetchFromApi('/categories');
        if (Array.isArray(data)) localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(data));
        return data;
    } catch (e) { return getLocalCategories(); }
};

export const saveCategory = async (category: Category): Promise<Category> => {
    try {
        return await fetchFromApi('/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(category) });
    } catch (e) {
        const categories = await getCategories();
        const existingIndex = categories.findIndex(c => c.id === category.id);
        let newList = existingIndex >= 0 ? [...categories] : [...categories, category];
        if (existingIndex >= 0) newList[existingIndex] = category;
        localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(newList));
        return category;
    }
};

export const removeCategory = async (id: string): Promise<void> => {
    try { await fetchFromApi(`/categories/${id}`, { method: 'DELETE' }); } catch (e) {
        const categories = await getCategories();
        const newList = categories.filter(c => c.id !== id);
        localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(newList));
    }
};

export const addProductReview = async (productId: string, review: Review): Promise<void> => {
    try { await fetchFromApi(`/products/${productId}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(review) }); } catch (e) {
        const products = await getProducts();
        const newList = products.map(p => p.id === productId ? { ...p, reviews: [review, ...p.reviews] } : p);
        localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(newList));
    }
};

export const deleteProductReview = async (productId: string, reviewId: string): Promise<void> => {
    try {
         const products = await getProducts();
         const product = products.find(p => p.id === productId);
         if (product) await saveProduct({ ...product, reviews: product.reviews.filter(r => r.id !== reviewId) });
    } catch (e) {
        const products = await getProducts();
        const newList = products.map(p => p.id === productId ? { ...p, reviews: p.reviews.filter(r => r.id !== reviewId) } : p);
        localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(newList));
    }
};

export const getOrders = async (): Promise<Order[]> => {
  try { return await fetchFromApi('/orders'); } catch (e) {
      const stored = localStorage.getItem(DB_KEYS.ORDERS);
      if (!stored) { localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS)); return INITIAL_ORDERS; }
      return JSON.parse(stored);
  }
};

export const createOrder = async (order: Order): Promise<Order> => {
  try { return await fetchFromApi('/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) }); } catch (e) {
      const orders = await getOrders();
      const newList = [order, ...orders];
      localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(newList));
      return order;
  }
};

export const updateOrder = async (id: string, updates: Partial<Order>): Promise<void> => {
  try { await fetchFromApi(`/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }); } catch (e) {
      const orders = await getOrders();
      const newList = orders.map(o => o.id === id ? { ...o, ...updates } : o);
      localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(newList));
  }
};

export const removeOrder = async (id: string): Promise<void> => {
    try { await fetchFromApi(`/orders/${id}`, { method: 'DELETE' }); } catch (e) {
        const orders = await getOrders();
        const newList = orders.filter(o => o.id !== id);
        localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(newList));
    }
};

export const getSettings = async (): Promise<SiteSettings> => {
  let apiData: any = null;
  try { apiData = await fetchFromApi('/settings'); if (Array.isArray(apiData)) apiData = apiData.find(s => s.id === 'global_settings') || apiData[0]; } catch (e) {}
  const local = localStorage.getItem(DB_KEYS.SETTINGS);
  const source = apiData || (local ? JSON.parse(local) : INITIAL_SETTINGS);
  
  const merged = { ...INITIAL_SETTINGS, ...source };

  // Merge payment gateways to ensure new methods (like PayPal) appear even if not in local storage
  if (merged.paymentGateways && INITIAL_SETTINGS.paymentGateways) {
      const mergedGateways = INITIAL_SETTINGS.paymentGateways.map(initGw => {
          const existing = merged.paymentGateways.find((g: any) => g.id === initGw.id);
          return existing ? existing : initGw;
      });
      merged.paymentGateways = mergedGateways;
  }

  return merged;
};

export const saveSettings = async (settings: SiteSettings): Promise<void> => {
  const payload = { ...settings, id: 'global_settings' };
  localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(payload));
  try { await fetchFromApi('/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); } catch (e) {}
};
