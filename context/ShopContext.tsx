import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product, Order, CartItem, OrderStatus, Review, SiteSettings, Notification, DiscountCode, Category } from '../types';
import * as db from '../services/db';

export type Page = 'HOME' | 'SHOP' | 'TRENDING' | 'ADMIN' | 'LOGIN' | 'PRIVACY' | 'TERMS' | 'PROFILE' | 'CONTACT' | 'PAYMENT' | 'RETURN';

interface ShopContextType {
  products: Product[];
  categories: Category[]; 
  orders: Order[];
  cart: CartItem[];
  settings: SiteSettings | null;
  currentPage: Page;
  isLoading: boolean;
  notifications: Notification[];
  userOrderIds: string[];
  navigateTo: (page: Page, state?: any) => void;
  addToCart: (product: Product, color?: string, size?: string) => void;
  removeFromCart: (productId: string, color?: string, size?: string) => void;
  updateCartQuantity: (productId: string, delta: number, color?: string, size?: string) => void;
  clearCart: () => void;
  saveProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (category: Category) => Promise<void>; 
  deleteCategory: (id: string) => Promise<void>; 
  addOrder: (order: Order, usedDiscountCode?: string) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addReview: (productId: string, review: Review) => Promise<void>;
  deleteReview: (productId: string, reviewId: string) => Promise<void>;
  updateSiteSettings: (settings: SiteSettings) => Promise<void>;
  notify: (message: string, type: 'success' | 'error' | 'info') => void;
  dismissNotification: (id: string) => void;
  validateDiscount: (code: string, cartTotal: number) => { valid: boolean; discount: number; message: string };
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const PLACEHOLDER_IMG = "https://placehold.co/600x600/f3f4f6/a3a3a3?text=No+Image";

const ROUTE_MAP: Record<string, Page> = {
    '/': 'HOME',
    '/shop': 'SHOP',
    '/trending': 'TRENDING',
    '/contact': 'CONTACT',
    '/profile': 'PROFILE',
    '/admin': 'LOGIN', // Redirects to ADMIN if auth
    '/privacy-policy': 'PRIVACY',
    '/terms-service': 'TERMS',
    '/payment-policy': 'PAYMENT',
    '/return-policy': 'RETURN'
};

const PAGE_TO_ROUTE: Record<Page, string> = {
    'HOME': '/',
    'SHOP': '/shop',
    'TRENDING': '/trending',
    'CONTACT': '/contact',
    'PROFILE': '/profile',
    'LOGIN': '/admin',
    'ADMIN': '/admin',
    'PRIVACY': '/privacy-policy',
    'TERMS': '/terms-service',
    'PAYMENT': '/payment-policy',
    'RETURN': '/return-policy'
};

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Sync initialization from localStorage to prevent "fallback flash"
  const [products, setProducts] = useState<Product[]>(() => db.getLocalProducts());
  const [categories, setCategories] = useState<Category[]>(() => db.getLocalCategories());
  
  // Initialize settings from local storage if available, otherwise null.
  // This prevents showing INITIAL_SETTINGS (demo data) before the API fetch completes.
  const [settings, setSettings] = useState<SiteSettings | null>(() => {
      try {
          const local = localStorage.getItem('arobazzar_settings');
          return local ? JSON.parse(local) : null;
      } catch (e) { return null; }
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
      try {
          const local = localStorage.getItem('arobazzar_cart');
          return local ? JSON.parse(local) : [];
      } catch (e) { return []; }
  });

  useEffect(() => {
      localStorage.setItem('arobazzar_cart', JSON.stringify(cart));
  }, [cart]);
  
  // Initialize Page based on URL
  const getInitialPage = (): Page => {
      const path = window.location.pathname;
      // Handle trailing slashes
      const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
      return ROUTE_MAP[cleanPath] || 'HOME';
  };

  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage());
  
  // Set initial loading to true to allow App.tsx to show the Site Loader
  const [isLoading, setIsLoading] = useState(true);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userOrderIds, setUserOrderIds] = useState<string[]>([]);

  // Handle Browser Back/Forward Buttons
  useEffect(() => {
    const handlePopState = () => {
        const page = getInitialPage();
        setCurrentPage(page);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sanitization helper
  const sanitizeImages = (images: any): string[] => {
    if (!Array.isArray(images)) return [PLACEHOLDER_IMG];
    const filtered = images
      .filter(url => typeof url === 'string' && url.trim().length > 5)
      .map(url => url.trim());
    return filtered.length > 0 ? filtered : [PLACEHOLDER_IMG];
  };

  useEffect(() => {
    const loadData = async () => {
      // Parallelize fetches
      const pPromise = db.getProducts().catch(() => db.getLocalProducts());
      const cPromise = db.getCategories().catch(() => db.getLocalCategories());
      const sPromise = db.getSettings().catch(() => db.getInitialSettings());

      try {
        const [p, c, s] = await Promise.all([pPromise, cPromise, sPromise]);
        
        const safeProducts = (Array.isArray(p) ? p : []).map(prod => ({
            ...prod,
            name: typeof prod.name === 'string' ? prod.name : 'Untitled Product',
            category: typeof prod.category === 'string' ? prod.category : 'General',
            price: typeof prod.price === 'number' && !isNaN(prod.price) ? prod.price : 0,
            stock: typeof prod.stock === 'number' && !isNaN(prod.stock) ? prod.stock : 0,
            images: sanitizeImages(prod.images),
            colors: Array.isArray(prod.colors) ? prod.colors : [],
            sizes: Array.isArray(prod.sizes) ? prod.sizes : [],
            tags: Array.isArray(prod.tags) ? prod.tags : [],
            reviews: Array.isArray(prod.reviews) ? prod.reviews : []
        }));

        if (safeProducts.length > 0) setProducts(safeProducts);
        if (Array.isArray(c) && c.length > 0) setCategories(c);
        
        // If API returned settings, use them. If not, and we have no local settings, THEN fall back to initial.
        if (s) {
            setSettings(s);
        } else if (!settings) {
            setSettings(db.getInitialSettings());
        }

        const localHistory = localStorage.getItem('arobazzar_my_orders');
        if (localHistory) setUserOrderIds(JSON.parse(localHistory));

        // Background fetch orders
        db.getOrders().then(o => {
            const safeOrders = (Array.isArray(o) ? o : []).map(ord => ({
                ...ord,
                id: ord.id || 'UNKNOWN_ID',
                customerEmail: ord.customerEmail || '',
                total: typeof ord.total === 'number' && !isNaN(ord.total) ? ord.total : 0,
                items: (Array.isArray(ord.items) ? ord.items : []).map(item => ({
                    ...item,
                    name: item.name || 'Unknown Item',
                    price: typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0,
                    images: sanitizeImages(item.images)
                }))
            }));
            setOrders(safeOrders);
        }).catch(err => console.error("Background order fetch failed", err));

        // Finally, hide loader once settings and products are definitively synced
        setIsLoading(false);

      } catch (e) {
        console.error("Failed to load data", e);
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    let interval: any;
    if (currentPage === 'ADMIN') {
        const fetchOrders = async () => {
            try {
                const fetchedOrders = await db.getOrders();
                if (Array.isArray(fetchedOrders)) {
                     const safeOrders = fetchedOrders.map((ord: any) => ({
                        ...ord,
                        id: ord.id || 'UNKNOWN_ID',
                        customerEmail: ord.customerEmail || '',
                        total: typeof ord.total === 'number' && !isNaN(ord.total) ? ord.total : 0,
                        items: (Array.isArray(ord.items) ? ord.items : []).map((item: any) => ({
                            ...item,
                            name: item.name || 'Unknown Item',
                            price: typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0,
                            images: sanitizeImages(item.images)
                        }))
                    }));
                    setOrders(safeOrders);
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        };
        fetchOrders();
        interval = setInterval(fetchOrders, 5000);
    }
    return () => clearInterval(interval);
  }, [currentPage]);

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismissNotification(id), 3000); 
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const navigateTo = useCallback((page: Page, state?: any) => {
    if (state && state.category) {
        sessionStorage.setItem('arobazzar_active_category', state.category);
    }
    
    // Update URL without reload
    const route = PAGE_TO_ROUTE[page] || '/';
    if (window.location.pathname !== route) {
        window.history.pushState({ page }, '', route);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentPage(page);
  }, []);

  const addToCart = (product: Product, color?: string, size?: string) => {
    const effectivePrice = (product.discountPrice && product.discountPrice < product.price) 
        ? product.discountPrice 
        : product.price;

    const safeProduct = {
        ...product,
        name: product.name || 'Unknown Item',
        price: typeof effectivePrice === 'number' ? effectivePrice : 0,
        images: sanitizeImages(product.images)
    };

    setCart(prev => {
      const existing = prev.find(item => item.id === safeProduct.id && item.selectedColor === color && item.selectedSize === size);
      if (existing) {
        notify(`Updated quantity for ${safeProduct.name}`, 'info');
        return prev.map(item => 
            (item.id === safeProduct.id && item.selectedColor === color && item.selectedSize === size) 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      notify(`Added ${safeProduct.name} to bag`, 'success');
      return [...prev, { ...safeProduct, quantity: 1, selectedColor: color, selectedSize: size }];
    });
  };

  const removeFromCart = (productId: string, color?: string, size?: string) => {
    setCart(prev => prev.filter(item => !(item.id === productId && item.selectedColor === color && item.selectedSize === size)));
    notify('Removed item from bag', 'info');
  };

  const updateCartQuantity = (productId: string, delta: number, color?: string, size?: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId && item.selectedColor === color && item.selectedSize === size) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const validateDiscount = (code: string, cartTotal: number): { valid: boolean; discount: number; message: string } => {
      if (!settings?.discountCodes) return { valid: false, discount: 0, message: 'Invalid code' };
      const coupon = settings.discountCodes.find(c => c.code === code && c.isActive);
      if (!coupon) return { valid: false, discount: 0, message: 'Invalid or inactive code' };
      const usedKey = `arobazzar_used_${code}`;
      if (localStorage.getItem(usedKey)) return { valid: false, discount: 0, message: 'Code already used on this device' };
      if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) return { valid: false, discount: 0, message: `Min order LKR ${coupon.minOrderAmount} required` };
      let discount = 0;
      if (coupon.type === 'PERCENTAGE') discount = (cartTotal * coupon.value) / 100;
      else discount = coupon.value;
      return { valid: true, discount: Math.min(discount, cartTotal), message: 'Discount applied!' };
  };

  const saveProduct = async (product: Product) => {
    const safeProduct = {
        ...product,
        name: product.name || 'Untitled Product',
        price: typeof product.price === 'number' ? product.price : 0,
        stock: typeof product.stock === 'number' ? product.stock : 0,
        images: sanitizeImages(product.images),
        colors: Array.isArray(product.colors) ? product.colors : [],
        sizes: Array.isArray(product.sizes) ? product.sizes : [],
        tags: Array.isArray(product.tags) ? product.tags : []
    };

    setProducts(prev => {
        const idx = prev.findIndex(p => p.id === safeProduct.id);
        if (idx >= 0) {
            const newArr = [...prev];
            newArr[idx] = safeProduct;
            return newArr;
        }
        return [safeProduct, ...prev];
    });

    try {
      await db.saveProduct(safeProduct);
      notify('Product saved successfully', 'success');
    } catch (e) {
      notify('Saved locally. Connect to network to sync.', 'info');
    }
  };

  const deleteProduct = async (id: string) => {
      setProducts(prev => prev.filter(p => p.id !== id));
      await db.removeProduct(id);
      notify('Product deleted', 'info');
  };

  const addCategory = async (category: Category) => {
      setCategories(prev => {
          if (prev.find(c => c.id === category.id)) {
              return prev.map(c => c.id === category.id ? category : c);
          }
          return [...prev, category];
      });
      await db.saveCategory(category);
      notify('Category saved', 'success');
  };

  const deleteCategory = async (id: string) => {
      setCategories(prev => prev.filter(c => c.id !== id));
      await db.removeCategory(id);
      notify('Category removed', 'info');
  };

  const addOrder = async (order: Order, usedDiscountCode?: string) => {
    const updatedProducts = products.map(p => {
        const matchingItems = order.items.filter(item => item.id === p.id);
        if (matchingItems.length > 0) {
            const qtySold = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
            return { ...p, stock: Math.max(0, p.stock - qtySold) };
        }
        return p;
    });
    setProducts(updatedProducts);
    setOrders(prev => [order, ...prev]);

    const newOrderIds = [...userOrderIds, order.id];
    setUserOrderIds(newOrderIds);
    localStorage.setItem('arobazzar_my_orders', JSON.stringify(newOrderIds));
    
    if (usedDiscountCode) {
        localStorage.setItem(`arobazzar_used_${usedDiscountCode}`, 'true');
    }

    try {
        await db.createOrder(order);
        for (const item of order.items) {
           const product = products.find(p => p.id === item.id);
           if (product) {
               await db.saveProduct({ ...product, stock: Math.max(0, product.stock - item.quantity) });
           }
        }
        notify("Order placed successfully!", "success");
    } catch (e) {
        notify("Order saved locally. Will sync when online.", "info");
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      await db.updateOrder(id, { status });
      notify(`Order #${id} updated`, "success");
  };

  const deleteOrder = async (id: string) => {
      setOrders(prev => prev.filter(o => o.id !== id));
      await db.removeOrder(id);
      notify("Order deleted", "info");
  };

  const addReview = async (productId: string, review: Review) => {
      const updatedProducts = products.map(p => {
          if (p.id === productId) {
              return { ...p, reviews: [review, ...p.reviews] };
          }
          return p;
      });
      setProducts(updatedProducts);
      await db.addProductReview(productId, review);
      notify("Review added", "success");
  };

  const deleteReview = async (productId: string, reviewId: string) => {
      const updatedProducts = products.map(p => {
          if (p.id === productId) {
              return { ...p, reviews: p.reviews.filter(r => r.id !== reviewId) };
          }
          return p;
      });
      setProducts(updatedProducts);
      await db.deleteProductReview(productId, reviewId);
      notify("Review deleted", "info");
  };

  const updateSiteSettings = async (newSettings: SiteSettings) => {
      setSettings(newSettings);
      await db.saveSettings(newSettings);
      notify("Settings updated", "success");
  };

  return (
    <ShopContext.Provider value={{
      products, categories, orders, cart, settings, currentPage, isLoading, notifications, userOrderIds,
      navigateTo, addToCart, removeFromCart, updateCartQuantity, clearCart,
      saveProduct, deleteProduct, addCategory, deleteCategory, addOrder, updateOrderStatus, deleteOrder,
      addReview, deleteReview, updateSiteSettings, notify, dismissNotification, validateDiscount
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};