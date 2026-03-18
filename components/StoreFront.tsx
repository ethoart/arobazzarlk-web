
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useShop, Page } from '../context/ShopContext';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Product, PaymentMethod, OrderStatus, LinkType, HeroBanner, Order } from '../types';
import * as db from '../services/db';
import * as web3 from '../services/web3';
import { uploadToLocal } from '../services/ipfs';
import md5 from 'crypto-js/md5';
import { ShoppingBag, Star, X, Plus, Minus, CreditCard, Banknote, Truck, Heart, ArrowRight, ArrowLeft, Search, Menu, Lock, AlertCircle, CheckCircle, User, Wallet, Phone, Zap, Maximize2, Send, Landmark, Mail, MapPin, Loader2, UploadCloud, Trash2 } from 'lucide-react';

// --- SEO Helper ---
const SeoManager: React.FC<{ title: string; description?: string }> = ({ title, description }) => {
    useEffect(() => {
        document.title = `${title} | Arobazzar`;
        if (description) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', description);
        }
    }, [title, description]);
    return null;
};

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }> = ({ 
  children, variant = 'primary', className = '', ...props 
}) => {
  const baseStyle = "px-8 py-4 rounded-full font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide will-change-transform focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2";
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800 shadow-xl hover:shadow-2xl hover:-translate-y-1",
    secondary: "bg-white text-black hover:bg-gray-50 shadow-lg hover:shadow-xl hover:-translate-y-1",
    outline: "border-2 border-black text-black hover:bg-black hover:text-white",
    ghost: "text-gray-500 hover:text-black hover:bg-gray-100/50"
  };
  return <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const PLACEHOLDER_IMG = "https://placehold.co/600x600/f3f4f6/a3a3a3?text=No+Image";

const getContrastColor = (hex: string) => {
    if (!hex) return 'white';
    const cleanHex = hex.replace('#', '');
    const fullHex = cleanHex.length === 3 ? cleanHex.split('').map(char => char + char).join('') : cleanHex;
    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return 'white';
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? 'black' : 'white';
};

const Logo: React.FC<{ src?: string; className?: string; fallbackClass?: string }> = ({ src, className, fallbackClass }) => {
    const [error, setError] = useState(false);
    const validSrc = useMemo(() => db.getOptimizedImage(src, 200), [src]);
    
    useEffect(() => { setError(false); }, [validSrc]);

    if (validSrc && !error) {
        return <img src={validSrc} alt="Arobazzar Logo" className={className} onError={() => setError(true)} loading="eager" width="100" height="40" style={{minHeight: '40px', objectFit: 'contain'}} />;
    }
    return <span className={fallbackClass || "text-2xl font-display font-black tracking-tighter"}>AROBAZZAR.</span>;
};

const Footer: React.FC = () => {
    const { navigateTo, settings } = useShop();
    return (
        <footer className="bg-black text-white rounded-t-[2rem] md:rounded-t-[3rem] mt-20 pt-20 pb-10 px-6 relative overflow-hidden transform-gpu" role="contentinfo">
             <div className="absolute top-0 right-0 w-[200px] h-[200px] md:w-[500px] md:h-[500px] bg-gradient-to-br from-indigo-900 to-purple-900 rounded-full md:blur-3xl blur-xl opacity-30 pointer-events-none transform-gpu translate-x-1/4 -translate-y-1/4" />

             <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
                <div className="col-span-1 md:col-span-2">
                    <div className="mb-6">
                        <Logo src={settings?.siteLogo} className="h-16 w-auto object-contain brightness-0 invert" fallbackClass="text-4xl font-display font-black tracking-tighter text-white" />
                    </div>
                    <p className="text-gray-400 text-lg max-w-md mb-8">
                        The future of retail. We curate the extraordinary for the digital generation. Premium quality, verified authenticity, delivered worldwide.
                    </p>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-6 uppercase tracking-wider">Explore</h3>
                    <ul className="space-y-4 text-gray-400 font-medium">
                        <li><button onClick={() => navigateTo('HOME')} className="hover:text-white transition-colors">Home</button></li>
                        <li><button onClick={() => navigateTo('SHOP')} className="hover:text-white transition-colors">Shop All</button></li>
                        <li><button onClick={() => navigateTo('TRENDING')} className="hover:text-white transition-colors">Trending</button></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-6 uppercase tracking-wider">Legal & Support</h3>
                    <ul className="space-y-4 text-gray-400 font-medium">
                        <li><button onClick={() => navigateTo('PRIVACY')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                        <li><button onClick={() => navigateTo('TERMS')} className="hover:text-white transition-colors">Terms of Service</button></li>
                        <li><button onClick={() => navigateTo('PAYMENT')} className="hover:text-white transition-colors">Payment Policy</button></li>
                        <li><button onClick={() => navigateTo('RETURN')} className="hover:text-white transition-colors">Return Policy</button></li>
                        <li><button onClick={() => navigateTo('CONTACT')} className="hover:text-white transition-colors">Contact Us</button></li>
                    </ul>
                </div>
             </div>
             <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm font-medium">
                <div>&copy; 2024 Arobazzar Inc. • <a href="https://arobazzar.lk" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Visit Website">arobazzar.lk</a></div>
                <div className="flex flex-col md:flex-row items-center gap-6 mt-4 md:mt-0">
                    <span className="flex items-center gap-2"><Lock size={12}/> Secure Payment</span>
                </div>
             </div>
        </footer>
    );
};

const ContactPage: React.FC = () => {
    const { navigateTo, settings } = useShop();
    useEffect(() => { window.scrollTo(0, 0); }, []);
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SeoManager title="Contact Us" description="Get in touch with Arobazzar support." />
            <nav className="fixed top-0 inset-x-0 z-40 py-6 px-6 bg-white/80 backdrop-blur-md" role="navigation">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button onClick={() => navigateTo('HOME')} className="hover:scale-105 transition-transform" aria-label="Go to Home">
                         <Logo src={settings?.siteLogo} className="h-10 w-auto" />
                    </button>
                    <button onClick={() => navigateTo('HOME')} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-black hover:text-white transition-all" aria-label="Close Contact Page"><X size={20}/></button>
                </div>
             </nav>
            <div className="pt-32 pb-20 max-w-4xl mx-auto px-6 animate-fade-in flex-1">
                <h1 className="text-5xl md:text-7xl font-display font-black mb-12">Contact Us</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl space-y-6">
                        <h3 className="font-bold text-xl mb-4">Get in Touch</h3>
                        <div className="flex items-start gap-4">
                            <Mail className="mt-1 text-gray-400"/>
                            <div>
                                <div className="font-bold">Email Support</div>
                                <a href={`mailto:${settings?.contactEmail}`} className="text-blue-600 hover:underline" aria-label="Send email">{settings?.contactEmail}</a>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <Phone className="mt-1 text-gray-400"/>
                            <div>
                                <div className="font-bold">Phone</div>
                                <div className="text-gray-600">{settings?.contactPhone || 'Not Available'}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <MapPin className="mt-1 text-gray-400"/>
                            <div>
                                <div className="font-bold">Address</div>
                                <div className="text-gray-600 whitespace-pre-wrap">{settings?.contactAddress || 'Online Only'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

const PrivacyPolicy: React.FC = () => {
    const { navigateTo, settings } = useShop();
    useEffect(() => { window.scrollTo(0, 0); }, []);
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
             <SeoManager title="Privacy Policy" description="Read our privacy policy." />
             <nav className="fixed top-0 inset-x-0 z-40 py-6 px-6 bg-white/80 backdrop-blur-md" role="navigation">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button onClick={() => navigateTo('HOME')} className="hover:scale-105 transition-transform" aria-label="Go Home">
                         <Logo src={settings?.siteLogo} className="h-10 w-auto" />
                    </button>
                    <button onClick={() => navigateTo('HOME')} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-black hover:text-white transition-all" aria-label="Close"><X size={20}/></button>
                </div>
             </nav>
            <div className="pt-32 pb-20 max-w-4xl mx-auto px-6 animate-fade-in flex-1">
                <h1 className="text-5xl md:text-7xl font-display font-black mb-12">Privacy Policy</h1>
                <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl space-y-8 text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                    <p>{settings?.privacyText || "Privacy Policy details not available."}</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

const TermsOfService: React.FC = () => {
    const { navigateTo, settings } = useShop();
    useEffect(() => { window.scrollTo(0, 0); }, []);
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
             <SeoManager title="Terms of Service" />
             <nav className="fixed top-0 inset-x-0 z-40 py-6 px-6 bg-white/80 backdrop-blur-md" role="navigation">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button onClick={() => navigateTo('HOME')} className="hover:scale-105 transition-transform" aria-label="Go Home">
                         <Logo src={settings?.siteLogo} className="h-10 w-auto" />
                    </button>
                    <button onClick={() => navigateTo('HOME')} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-black hover:text-white transition-all" aria-label="Close"><X size={20}/></button>
                </div>
             </nav>
            <div className="pt-32 pb-20 max-w-4xl mx-auto px-6 animate-fade-in flex-1">
                <h1 className="text-5xl md:text-7xl font-display font-black mb-12">Terms of Service</h1>
                <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl space-y-8 text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                    <p>{settings?.termsText || "Terms of Service details not available."}</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

const PaymentPolicy: React.FC = () => {
    const { navigateTo, settings } = useShop();
    useEffect(() => { window.scrollTo(0, 0); }, []);
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
             <SeoManager title="Payment Policy" />
             <nav className="fixed top-0 inset-x-0 z-40 py-6 px-6 bg-white/80 backdrop-blur-md" role="navigation">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button onClick={() => navigateTo('HOME')} className="hover:scale-105 transition-transform" aria-label="Go Home">
                         <Logo src={settings?.siteLogo} className="h-10 w-auto" />
                    </button>
                    <button onClick={() => navigateTo('HOME')} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-black hover:text-white transition-all" aria-label="Close"><X size={20}/></button>
                </div>
             </nav>
            <div className="pt-32 pb-20 max-w-4xl mx-auto px-6 animate-fade-in flex-1">
                <h1 className="text-5xl md:text-7xl font-display font-black mb-12">Payment Policy</h1>
                <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl space-y-8 text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                    <p>{settings?.paymentPolicyText || "Payment Policy details not available."}</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

const ReturnPolicy: React.FC = () => {
    const { navigateTo, settings } = useShop();
    useEffect(() => { window.scrollTo(0, 0); }, []);
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
             <SeoManager title="Return Policy" />
             <nav className="fixed top-0 inset-x-0 z-40 py-6 px-6 bg-white/80 backdrop-blur-md" role="navigation">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button onClick={() => navigateTo('HOME')} className="hover:scale-105 transition-transform" aria-label="Go Home">
                         <Logo src={settings?.siteLogo} className="h-10 w-auto" />
                    </button>
                    <button onClick={() => navigateTo('HOME')} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-black hover:text-white transition-all" aria-label="Close"><X size={20}/></button>
                </div>
             </nav>
            <div className="pt-32 pb-20 max-w-4xl mx-auto px-6 animate-fade-in flex-1">
                <h1 className="text-5xl md:text-7xl font-display font-black mb-12">Return Policy</h1>
                <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl space-y-8 text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                    <p>{settings?.returnPolicyText || "Return Policy details not available."}</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

const LoginPage: React.FC = () => {
    const { navigateTo, notify, settings } = useShop();
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const success = await db.authenticate(email, password);
        if (success) {
            notify('Access Granted', 'success');
            navigateTo('ADMIN');
        } else {
            notify('Invalid credentials', 'error');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SeoManager title="Admin Login" />
            <nav className="fixed top-0 inset-x-0 z-40 py-6 px-6 bg-white/80 backdrop-blur-md" role="navigation">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button onClick={() => navigateTo('HOME')} className="hover:scale-105 transition-transform" aria-label="Go Home">
                         <Logo src={settings?.siteLogo} className="h-10 w-auto" />
                    </button>
                    <button onClick={() => navigateTo('HOME')} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-black hover:text-white transition-all" aria-label="Close"><X size={20}/></button>
                </div>
            </nav>
            <div className="flex-1 flex items-center justify-center p-6 animate-fade-in">
                <div className="bg-white p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl max-w-md w-full relative overflow-hidden transform-gpu">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20 transform-gpu"></div>
                    <div className="mb-10 text-center">
                        <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <User size={28} />
                        </div>
                        <h1 className="font-display font-black text-3xl">Admin Access</h1>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                             <input type="email" placeholder="Email" className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-xl outline-none font-medium transition-all" value={email} onChange={e => setEmail(e.target.value)} required aria-label="Email"/>
                        </div>
                        <div className="space-y-2 relative">
                            <input type="password" placeholder="Password" className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-xl outline-none font-medium transition-all" value={password} onChange={e => setPassword(e.target.value)} required aria-label="Password"/>
                        </div>
                        <div className="pt-4">
                             <button type="submit" disabled={isLoading} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">{isLoading ? 'Verifying...' : 'Sign In'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const UserProfile: React.FC = () => {
    const { userOrderIds, orders, navigateTo, settings } = useShop();
    const [lookupId, setLookupId] = useState('');
    const [lookupEmail, setLookupEmail] = useState('');
    const [foundOrder, setFoundOrder] = useState<Order | null | 'NOT_FOUND'>(null);
    const myOrders = orders.filter(o => userOrderIds.includes(o.id));
    const handleLookup = (e: React.FormEvent) => {
        e.preventDefault();
        const order = orders.find(o => o.id === lookupId && o.customerEmail === lookupEmail);
        setFoundOrder(order || 'NOT_FOUND');
    };
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col animate-fade-in">
             <SeoManager title="My Profile" />
             <nav className="fixed top-0 inset-x-0 z-40 py-6 px-6 bg-white/80 backdrop-blur-md" role="navigation">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button onClick={() => navigateTo('HOME')} className="hover:scale-105 transition-transform" aria-label="Go Home">
                         <Logo src={settings?.siteLogo} className="h-10 w-auto" />
                    </button>
                    <button onClick={() => navigateTo('HOME')} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-black hover:text-white transition-all" aria-label="Close"><X size={20}/></button>
                </div>
             </nav>
             <div className="pt-32 pb-20 max-w-4xl mx-auto px-6 w-full flex-1">
                <h1 className="text-5xl font-display font-black mb-12">My Profile</h1>
                <div className="grid gap-8">
                    <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><ShoppingBag size={24}/> Recent Orders</h2>
                        {myOrders.length > 0 ? (
                            <div className="space-y-4">
                                {myOrders.map(order => (
                                    <div key={order.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <div className="font-bold text-lg">#{order.id}</div>
                                            <div className="text-sm text-gray-500">{order.date} • {order.items.length} Items</div>
                                        </div>
                                        <div className="mt-2 md:mt-0 flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-700' : order.status === OrderStatus.PENDING ? 'bg-orange-100 text-orange-700' : order.status === OrderStatus.SHIPPED ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>{order.status}</span>
                                            <div className="font-bold">LKR {order.total.toFixed(2)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : ( <p className="text-gray-400 italic">No recent orders found on this device.</p> )}
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Search size={24}/> Track Order</h2>
                        <form onSubmit={handleLookup} className="flex flex-col md:flex-row gap-4 mb-6">
                            <input placeholder="Order ID (e.g. ORD-1234)" className="flex-1 p-4 bg-gray-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black/5" value={lookupId} onChange={e => setLookupId(e.target.value)} aria-label="Order ID"/>
                            <input placeholder="Email Address" type="email" className="flex-1 p-4 bg-gray-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black/5" value={lookupEmail} onChange={e => setLookupEmail(e.target.value)} aria-label="Email"/>
                            <Button type="submit">Track</Button>
                        </form>
                        {foundOrder && foundOrder !== 'NOT_FOUND' && (
                             <div className="p-6 bg-green-50 border border-green-100 rounded-xl animate-fade-in">
                                <div className="flex justify-between items-center mb-2"><span className="font-bold text-green-800">Order Found!</span><span className="font-bold text-lg">#{foundOrder.id}</span></div>
                                <div className="flex justify-between items-center"><span>Status: <strong>{foundOrder.status}</strong></span><span>Total: LKR {foundOrder.total.toFixed(2)}</span></div>
                            </div>
                        )}
                        {foundOrder === 'NOT_FOUND' && ( <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium text-center animate-fade-in">Order not found. Please check your details.</div> )}
                    </div>
                </div>
             </div>
             <Footer />
        </div>
    );
};

const ProductCard: React.FC<{ product: Product; onOpen: (p: Product) => void }> = ({ product, onOpen }) => {
  const { addToCart } = useShop();
  const [isHovered, setIsHovered] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  useEffect(() => { setActiveImgIndex(0); }, [product.id]);

  const images = useMemo(() => product.images && product.images.length > 0 ? product.images : [PLACEHOLDER_IMG], [product.images]);
  const mainImage = images[activeImgIndex] || images[0];
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  // Predictively pre-fetch high-res images on hover
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    // Fetch top 3 images for modal instantly
    images.slice(0, 4).forEach(url => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = db.getOptimizedImage(url, 800);
        document.head.appendChild(link);
        // Cleanup link after some time
        setTimeout(() => document.head.contains(link) && document.head.removeChild(link), 5000);
    });
  }, [images]);

  return (
    <div className="group cursor-pointer flex flex-col gap-4" onMouseEnter={handleMouseEnter} onMouseLeave={() => setIsHovered(false)} onClick={() => onOpen(product)} role="article" aria-label={`View ${product.name}`}>
      <div className="relative aspect-square bg-gray-100 rounded-[2rem] overflow-hidden transition-all duration-500 shadow-sm group-hover:shadow-xl border border-gray-100 transform-gpu">
        <div className="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm"><Heart size={20} className="text-black" /></div>
        {product.stock < 5 && <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-red-500 text-white text-xs font-bold uppercase rounded-full tracking-wider">Low Stock</div>}
        {hasDiscount && <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black text-white text-xs font-bold uppercase rounded-full tracking-wider">SALE</div>}
        {product.isTrending && !hasDiscount && <div className="absolute bottom-4 left-4 z-10 px-3 py-1 bg-indigo-600 text-white text-xs font-bold uppercase rounded-full tracking-wider flex items-center gap-1"><Star size={10} fill="currentColor" /> Trending</div>}
        
        <img 
          src={db.getOptimizedImage(mainImage, 400)} 
          onError={(e) => { 
            const target = e.currentTarget;
            target.onerror = null;
            if (target.src.includes('wsrv.nl') && mainImage && !mainImage.includes('wsrv.nl')) {
                target.src = mainImage;
            } else if (target.src !== PLACEHOLDER_IMG) {
                target.src = PLACEHOLDER_IMG;
            }
          }} 
          alt={product.name} 
          loading="lazy" 
          decoding="async" 
          className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out transform-gpu will-change-transform ${isHovered ? 'scale-110' : 'scale-100'}`} 
          referrerPolicy="no-referrer"
        />
        
        <div className={`absolute inset-x-0 bottom-0 p-4 transform transition-all duration-300 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
             <Button onClick={(e) => { e.stopPropagation(); addToCart(product, product.colors?.[0], product.sizes?.[0]); }} className="w-full py-3 text-sm shadow-xl" aria-label={`Add ${product.name} to cart`}>Add to Cart</Button>
        </div>
      </div>
      <div className="space-y-1 px-2">
        <div className="flex justify-between items-start"><h3 className="font-bold text-lg leading-tight group-hover:underline decoration-2 underline-offset-4 line-clamp-1">{product.name}</h3>
            <div className="flex flex-col items-end">
                {hasDiscount ? (
                    <>
                        <span className="font-bold text-lg text-red-600 whitespace-nowrap">LKR {product.discountPrice?.toFixed(2)}</span>
                        <span className="text-xs text-gray-400 line-through">LKR {product.price.toFixed(2)}</span>
                    </>
                ) : (
                    <span className="font-bold text-lg whitespace-nowrap">LKR {product.price.toFixed(2)}</span>
                )}
            </div>
        </div>
        <p className="text-gray-400 text-sm font-medium line-clamp-1">{product.category}</p>
        
        {product.colors && product.colors.length > 0 && (
            <div className="flex gap-2 mt-2">
                {product.colors.slice(0, 5).map((c, i) => (
                    <button 
                        key={i} 
                        className={`w-5 h-5 rounded-full border border-gray-300 transition-transform hover:scale-110 ${activeImgIndex === i ? 'ring-1 ring-black ring-offset-1' : ''}`}
                        style={{ backgroundColor: c.trim() }} 
                        title={c} 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (i < images.length) setActiveImgIndex(i);
                        }}
                        aria-label={`Select color ${c}`}
                    />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

const ReviewForm: React.FC<{ productId: string; onReviewAdded: () => void }> = ({ productId, onReviewAdded }) => {
    const { addReview, notify } = useShop();
    const [name, setName] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !comment) { notify("Please fill in all fields", "error"); return; }
        setIsSubmitting(true);
        try {
            await addReview(productId, { id: Date.now().toString(), user: name, rating, comment, date: new Date().toISOString().split('T')[0] });
            setName(''); setComment(''); setRating(5); onReviewAdded();
        } catch { 
            // Error handled by finally block or ignored
        } finally { setIsSubmitting(false); }
    };
    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">Write a Review</h4>
            <div className="space-y-3">
                <input type="text" placeholder="Your Name" className="w-full p-3 rounded-xl border border-gray-200 focus:border-black outline-none transition-colors" value={name} onChange={e => setName(e.target.value)} required aria-label="Your Name"/>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">Rating:</span>
                    <div className="flex text-yellow-400 cursor-pointer" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((star) => (<Star key={star} size={20} fill={star <= rating ? "currentColor" : "none"} onClick={() => setRating(star)} className="transition-transform hover:scale-110" role="radio" aria-checked={star === rating} aria-label={`${star} stars`}/>))}</div>
                </div>
                <textarea placeholder="Share your thoughts..." className="w-full p-3 rounded-xl border border-gray-200 focus:border-black outline-none transition-colors resize-none h-24" value={comment} onChange={e => setComment(e.target.value)} required aria-label="Review Comment"/>
                <Button type="submit" disabled={isSubmitting} className="w-full py-3 text-sm" variant="secondary">{isSubmitting ? 'Posting...' : 'Post Review'} <Send size={16}/></Button>
            </div>
        </form>
    );
};

const ProductModal: React.FC<{ product: Product | null; onClose: () => void }> = ({ product, onClose }) => {
  const { addToCart, notify } = useShop();
  const [activeImg, setActiveImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [zoomImgLoaded, setZoomImgLoaded] = useState(false); 

  // FIX: Moved useMemo before the conditional return to satisfy React Hook rules
  const images = useMemo(() => (product && product.images && product.images.length > 0) ? product.images : [PLACEHOLDER_IMG], [product]);

  useEffect(() => {
    if (product) {
        if (product.colors && product.colors.length > 0) setSelectedColor(product.colors[0]); else setSelectedColor(null);
        if (product.sizes && product.sizes.length > 0) setSelectedSize(product.sizes[0]); else setSelectedSize(null);
    }
    setActiveImg(0); 
    setIsZoomed(false);
    setImgLoaded(false);
    setZoomImgLoaded(false);
  }, [product]);

  useEffect(() => {
    setImgLoaded(false);
    setZoomImgLoaded(false);
  }, [activeImg]);

  if (!product) return null;
  const activeImageSrc = images[activeImg] || images[0];
  
  const handleAddToCart = () => {
    if (product.colors && product.colors.length > 0 && !selectedColor) { notify("Please select a color", "error"); return; }
    if (product.sizes && product.sizes.length > 0 && !selectedSize) { notify("Please select a size", "error"); return; }
    addToCart(product, selectedColor || undefined, selectedSize || undefined); onClose();
  };

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const percentOff = hasDiscount ? Math.round(((product.price - (product.discountPrice || 0)) / product.price) * 100) : 0;

  return (
    <>
        <SeoManager title={product.name} description={product.description.substring(0, 150)} />
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-0 md:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-product-name">
        <div className="bg-white w-full h-[100dvh] md:h-full md:max-h-[90vh] md:rounded-[3rem] rounded-none overflow-hidden shadow-2xl relative flex flex-col md:flex-row animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-6 right-6 z-30 p-2 bg-white/80 hover:bg-white rounded-full transition-colors shadow-lg" aria-label="Close Modal"><X size={24}/></button>
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row pb-32 md:pb-0">
                <div className="w-full md:w-1/2 bg-gray-50 md:p-12 relative flex flex-col items-center justify-center md:min-h-full transition-colors">
                    <div className="w-full h-[55vh] md:h-auto md:aspect-square md:max-w-md md:rounded-[2.5rem] overflow-hidden md:shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white cursor-zoom-in relative group flex items-center justify-center md:ring-1 md:ring-gray-100" onClick={() => setIsZoomed(true)}>
                        <div className={`absolute inset-0 bg-gray-200 animate-pulse z-0 ${imgLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}></div>
                        <img 
                            key={activeImageSrc}
                            src={db.getOptimizedImage(activeImageSrc, 800)} 
                            onLoad={() => setImgLoaded(true)}
                            onError={(e) => { 
                                const target = e.currentTarget;
                                target.onerror = null; 
                                if (target.src.includes('wsrv.nl') && activeImageSrc && !activeImageSrc.includes('wsrv.nl')) {
                                    target.src = activeImageSrc;
                                } else if (target.src !== PLACEHOLDER_IMG) {
                                    target.src = PLACEHOLDER_IMG;
                                    setImgLoaded(true);
                                }
                            }} 
                            className={`w-full h-full object-cover transition-all duration-500 ease-out transform-gpu bg-gray-50 relative z-10`}
                            referrerPolicy="no-referrer" 
                            alt={product.name} 
                            loading="eager" 
                            decoding="async"
                        />
                        <div className="absolute top-6 right-6 bg-black/5 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 z-20 hidden md:block"><Maximize2 size={24} className="text-black"/></div>
                    </div>
                    <div className="flex gap-3 overflow-x-auto max-w-full py-4 w-full justify-center hide-scrollbar px-4 bg-gray-50 md:bg-transparent">
                        {images.map((img, idx) => (
                            <button key={idx} onClick={() => setActiveImg(idx)} className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-300 ease-out border-2 transform-gpu will-change-transform ${activeImg === idx ? 'border-black shadow-lg scale-105 opacity-100' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105 hover:border-gray-200'}`} aria-label={`View image ${idx + 1}`}>
                                <img 
                                    src={db.getOptimizedImage(img, 150)} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer" 
                                    loading="eager"
                                    alt={`Thumbnail ${idx + 1}`}
                                    onError={(e) => {
                                        const target = e.currentTarget;
                                        target.onerror = null;
                                        if (target.src.includes('wsrv.nl') && img && !img.includes('wsrv.nl')) {
                                            target.src = img;
                                        } else if (target.src !== PLACEHOLDER_IMG) {
                                            target.src = PLACEHOLDER_IMG;
                                        }
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
                <div className="w-full md:w-1/2 p-6 md:p-12 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase rounded-full">In Stock</span>
                        <span className="text-gray-400 font-bold text-sm uppercase tracking-wider">{product.category}</span>
                        {product.isTrending && <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold uppercase rounded-full">Trending</span>}
                        {hasDiscount && <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold uppercase rounded-full">{percentOff}% OFF</span>}
                    </div>
                    <h2 id="modal-product-name" className="text-3xl md:text-5xl font-display font-black leading-tight mb-4">{product.name}</h2>
                    <div className="mb-6 flex items-baseline gap-4">
                        {hasDiscount ? (
                            <>
                                <span className="text-3xl font-bold text-red-600">LKR {product.discountPrice?.toFixed(2)}</span>
                                <span className="text-xl text-gray-400 line-through">LKR {product.price.toFixed(2)}</span>
                            </>
                        ) : (
                            <span className="text-3xl font-bold text-black">LKR {(product.price || 0).toFixed(2)}</span>
                        )}
                    </div>
                    
                    {product.colors && product.colors.length > 0 && (
                        <div className="mb-6">
                            <span className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Select Color</span>
                            <div className="flex flex-wrap gap-3">
                                {product.colors.map((color, idx) => (
                                    <button 
                                        key={color} 
                                        onClick={() => {
                                            setSelectedColor(color);
                                            if (idx < images.length) setActiveImg(idx);
                                        }} 
                                        className={`px-4 py-2 rounded-lg border-2 text-sm font-bold flex items-center gap-2 transition-all ${selectedColor === color ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'}`}
                                        aria-label={`Select color ${color}`}
                                        aria-pressed={selectedColor === color}
                                    >
                                        <span className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: color.trim() }}></span>
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {product.sizes && product.sizes.length > 0 && (
                         <div className="mb-6">
                            <span className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Select Size</span>
                            <div className="flex flex-wrap gap-3">
                                {product.sizes.map((size) => (
                                    <button 
                                        key={size} 
                                        onClick={() => setSelectedSize(size)}
                                        className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 text-sm font-bold transition-all ${selectedSize === size ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'}`}
                                        aria-label={`Select size ${size}`}
                                        aria-pressed={selectedSize === size}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-8 font-medium">{product.description}</p>
                    <div className="hidden md:block mb-12"><Button onClick={handleAddToCart} className="w-full text-lg h-16">Add to Cart</Button></div>
                    <div className="border-t border-gray-100 pt-8">
                        <h3 className="font-bold text-xl mb-6">Reviews</h3>
                        <div className="mb-8"><ReviewForm productId={product.id} onReviewAdded={() => { }} /></div>
                        <div className="space-y-6 mb-8 max-h-64 overflow-y-auto">
                            {product.reviews && product.reviews.length > 0 ? product.reviews.map(r => (
                                <div key={r.id} className="bg-gray-50 p-4 rounded-2xl">
                                    <div className="flex justify-between items-center mb-2"><span className="font-bold">{r.user}</span><div className="flex text-yellow-400">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} />)}</div></div>
                                    <p className="text-gray-600 text-sm">{r.comment}</p><p className="text-xs text-gray-400 mt-2">{r.date}</p>
                                </div>
                            )) : <p className="text-gray-400 italic">No reviews yet. Be the first!</p>}
                        </div>
                    </div>
                </div>
            </div>
            <div className="md:hidden absolute bottom-0 inset-x-0 p-4 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] pb-8"><Button onClick={handleAddToCart} className="w-full text-lg h-14 shadow-2xl z-50 relative">Add to Cart</Button></div>
        </div>
        </div>
        
        {isZoomed && (
            <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center animate-fade-in cursor-zoom-out" onClick={() => setIsZoomed(false)} role="dialog" aria-label="Zoomed Image">
                <button className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-20" aria-label="Close Zoom"><X size={32}/></button>
                <img 
                    src={db.getOptimizedImage(activeImageSrc, 800)} 
                    className={`absolute inset-0 m-auto max-w-[95vw] max-h-[95vh] w-full h-full object-contain filter blur-md scale-105 transition-opacity duration-700 ${zoomImgLoaded ? 'opacity-0' : 'opacity-50'}`} 
                    alt="" 
                />
                <img 
                    src={db.getOptimizedImage(activeImageSrc, 1200)} 
                    onLoad={() => setZoomImgLoaded(true)}
                    onError={(e) => { 
                        const target = e.currentTarget; 
                        target.onerror = null;
                        if (target.src.includes('wsrv.nl') && activeImageSrc && !activeImageSrc.includes('wsrv.nl')) {
                            target.src = activeImageSrc;
                        }
                    }}
                    className={`max-w-[95vw] max-h-[95vh] w-full h-full object-contain drop-shadow-2xl relative z-10 transition-opacity duration-500`} 
                    alt="Zoomed Product" 
                    referrerPolicy="no-referrer" 
                    loading="eager"
                />
            </div>
        )}
    </>
  );
};

const WalletSelectionModal: React.FC<{ onClose: () => void; onSelect: (type: 'METAMASK' | 'COINBASE' | 'INJECTED') => void }> = ({ onClose, onSelect }) => {
    const wallets = web3.getAvailableWallets();
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-label="Connect Wallet">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl">Connect Wallet</h3><button onClick={onClose} aria-label="Close"><X size={20}/></button></div>
                <div className="space-y-3">
                    <button onClick={() => onSelect('METAMASK')} className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-orange-500 hover:bg-orange-50 transition-all group"><div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold">M</div><div className="text-left"><div className="font-bold text-gray-900">MetaMask</div><div className="text-xs text-gray-500">{wallets.hasMetaMask ? 'Detected' : 'Not installed'}</div></div></button>
                    <button onClick={() => onSelect('COINBASE')} className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">C</div><div className="text-left"><div className="font-bold text-gray-900">Coinbase Wallet</div><div className="text-xs text-gray-500">{wallets.hasCoinbase ? 'Detected' : 'Not installed'}</div></div></button>
                     <button onClick={() => onSelect('INJECTED')} className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-purple-500 hover:bg-purple-50 transition-all group"><div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold"><Wallet size={20}/></div><div className="text-left"><div className="font-bold text-gray-900">Browser / Other</div><div className="text-xs text-gray-500">Trust, Rainbow, Brave</div></div></button>
                </div>
            </div>
        </div>
    );
};

const CheckoutPage: React.FC = () => {
    const { cart, clearCart, addOrder, notify, settings, validateDiscount, navigateTo } = useShop();
    const [formData, setFormData] = useState(() => {
        try {
            const local = localStorage.getItem('arobazzar_customer');
            return local ? JSON.parse(local) : { name: '', email: '', phone: '', address: '' };
        } catch { return { name: '', email: '', phone: '', address: '' }; }
    });

    useEffect(() => {
        localStorage.setItem('arobazzar_customer', JSON.stringify(formData));
    }, [formData]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [transactionRef, setTransactionRef] = useState('');
    const [slipUrl, setSlipUrl] = useState('');
    const [isUploadingSlip, setIsUploadingSlip] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showWalletSelector, setShowWalletSelector] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [discountApplied, setDiscountApplied] = useState<{code: string, amount: number} | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [exchangeRate, setExchangeRate] = useState<number>(0);
    const [convertedAmount, setConvertedAmount] = useState<number>(0);
    const [checkoutStep, setCheckoutStep] = useState<'DETAILS' | 'PAYMENT'>('DETAILS');

    const availableMethods = useMemo(() => settings?.paymentGateways?.filter(g => g.enabled) || [], [settings?.paymentGateways]);

    useEffect(() => {
        if (availableMethods.length > 0 && !paymentMethod) {
            setPaymentMethod(availableMethods[0].id);
        }
    }, [availableMethods, paymentMethod]);

    const subTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const deliveryCharge = settings?.deliveryCharge || 0;
    const finalTotal = subTotal + deliveryCharge - (discountApplied?.amount || 0);

    const isCrypto = paymentMethod === PaymentMethod.BASE_ETH || paymentMethod === PaymentMethod.BASE_USDC || paymentMethod === PaymentMethod.BASE_USDT;

    useEffect(() => {
        if (!document.getElementById('payhere-script')) {
            const script = document.createElement('script');
            script.id = 'payhere-script';
            script.src = 'https://www.payhere.lk/lib/payhere.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    useEffect(() => {
        if (isCrypto) {
            const fetchRate = async () => {
                const type = paymentMethod === PaymentMethod.BASE_ETH ? 'ETH' : 'USD';
                try {
                    const rate = await web3.getConversionRate(type);
                    setExchangeRate(rate);
                    setConvertedAmount(finalTotal * rate);
                } catch { /* ignore */ }
            };
            fetchRate();
        }
    }, [isCrypto, paymentMethod, finalTotal]);

    const handleApplyCoupon = () => {
        if (!couponCode) return;
        const result = validateDiscount(couponCode, subTotal);
        if (result.valid) {
            setDiscountApplied({ code: couponCode, amount: result.discount });
            notify(result.message, "success");
        } else {
            notify(result.message, "error");
            setDiscountApplied(null);
        }
    };

    const handleWalletSelect = async (type: 'METAMASK' | 'COINBASE' | 'INJECTED') => {
        setShowWalletSelector(false);
        const addr = await web3.connectWallet(type);
        if (addr) { setWalletAddress(addr); notify("Wallet Connected", "success"); }
    };

    const validateForm = () => {
        if (!formData.name || formData.name.trim().length < 3) { notify("Please enter your full name (min 3 chars)", "error"); return false; }
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(formData.email)) { notify("Please enter a valid email address", "error"); return false; }
        const phoneClean = formData.phone.replace(/[^0-9+]/g, '');
        if (phoneClean.length < 9 || phoneClean.length > 15) { notify("Please enter a valid phone number", "error"); return false; }
        if (!formData.address || formData.address.trim().length < 10) { notify("Please enter a complete delivery address", "error"); return false; }
        return true;
    };

    const handlePayHerePayment = async () => {
        if (!validateForm()) return;
        const payhereConfig = settings?.paymentGateways?.find(g => g.id === PaymentMethod.PAYHERE);
        if (!payhereConfig || !payhereConfig.payhereMerchantId || !payhereConfig.payhereSecret) {
            notify("PayHere is not properly configured.", "error");
            return;
        }

        setIsProcessing(true);
        const orderId = `ORD-${Math.floor(Math.random() * 90000) + 10000}`;
        const amountFormatted = finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });
        const merchantSecretHash = md5(payhereConfig.payhereSecret).toString().toUpperCase();
        const hashString = payhereConfig.payhereMerchantId + orderId + amountFormatted + "LKR" + merchantSecretHash;
        const hash = md5(hashString).toString().toUpperCase();

        const payment = {
            "sandbox": payhereConfig.payhereEnv === 'sandbox',
            "merchant_id": payhereConfig.payhereMerchantId,
            "return_url": window.location.origin,
            "cancel_url": window.location.origin,
            "notify_url": window.location.origin + "/api/payhere-notify",
            "order_id": orderId,
            "items": "Arobazzar Order " + orderId,
            "amount": amountFormatted,
            "currency": "LKR",
            "hash": hash,
            "first_name": formData.name.split(' ')[0] || '',
            "last_name": formData.name.split(' ').slice(1).join(' ') || '',
            "email": formData.email,
            "phone": formData.phone,
            "address": formData.address,
            "city": "Sri Lanka",
            "country": "Sri Lanka"
        };

        if (window.payhere) {
            window.payhere.onCompleted = async function onCompleted(completedOrderId: string) {
                setTransactionRef(completedOrderId);
                try {
                    await addOrder({
                        id: orderId,
                        customerName: formData.name,
                        customerEmail: formData.email,
                        contactNumber: formData.phone,
                        address: formData.address,
                        items: [...cart],
                        total: finalTotal,
                        subtotal: subTotal,
                        deliveryCharge: deliveryCharge,
                        status: OrderStatus.PROCESSING,
                        paymentMethod: PaymentMethod.PAYHERE,
                        transactionHash: completedOrderId,
                        date: new Date().toISOString().split('T')[0],
                        discountCode: discountApplied?.code,
                        discountApplied: discountApplied?.amount
                    }, discountApplied?.code);
                    clearCart();
                    setIsSuccess(true);
                } catch (error) {
                    notify("Failed to create order: " + (error as Error).message, "error");
                } finally {
                    setIsProcessing(false);
                }
            };

            window.payhere.onDismissed = function onDismissed() {
                notify("Payment dismissed", "info");
                setIsProcessing(false);
            };

            window.payhere.onError = function onError(error: unknown) {
                notify("Payment error: " + error, "error");
                setIsProcessing(false);
            };

            window.payhere.startPayment(payment);
        } else {
            notify("PayHere SDK not loaded.", "error");
            setIsProcessing(false);
        }
    };

    const handlePlaceOrder = async (preGeneratedOrderId?: string) => {
        if (!paymentMethod) return;
        if (!validateForm()) return;
        if (paymentMethod === PaymentMethod.BANK_DEPOSIT && !transactionRef && !slipUrl) { notify("Please enter the Reference or upload a Slip", "error"); return; }
        setIsProcessing(true);
        try {
            let txHash = undefined;
            const tempOrderId = preGeneratedOrderId || `ORD-${Math.floor(Math.random() * 90000) + 10000}`;
            let initialStatus = OrderStatus.PENDING;
            
            if (isCrypto) {
                if (!walletAddress) { setShowWalletSelector(true); setIsProcessing(false); return; }
                const config = availableMethods.find(m => m.id === paymentMethod);
                const recipient = config?.walletAddress;
                if (!recipient) { notify("Admin payment contract not configured", "error"); setIsProcessing(false); return; }
                if (paymentMethod === PaymentMethod.BASE_ETH) { txHash = await web3.sendNativePayment(recipient, finalTotal, tempOrderId); } else if (paymentMethod === PaymentMethod.BASE_USDC || paymentMethod === PaymentMethod.BASE_USDT) { const tokenAddr = paymentMethod === PaymentMethod.BASE_USDC ? web3.TOKENS.USDC : web3.TOKENS.USDT; txHash = await web3.sendTokenPayment(tokenAddr, recipient, finalTotal, tempOrderId); }
                notify("Transaction Sent on Base Chain!", "success");
                initialStatus = OrderStatus.PROCESSING; // Crypto payment successful
            } else if (paymentMethod === PaymentMethod.BANK_DEPOSIT) { 
                txHash = transactionRef || slipUrl; await new Promise(resolve => setTimeout(resolve, 1000)); 
            } else if (paymentMethod === PaymentMethod.PAYPAL) {
                txHash = transactionRef;
                initialStatus = OrderStatus.PROCESSING; // PayPal payment successful
            } else { 
                await new Promise(resolve => setTimeout(resolve, 1500)); 
            }
            
            await addOrder({ id: tempOrderId, customerName: formData.name, customerEmail: formData.email, contactNumber: formData.phone, address: formData.address, items: [...cart], total: finalTotal, subtotal: subTotal, deliveryCharge: deliveryCharge, status: initialStatus, paymentMethod, transactionHash: txHash, date: new Date().toISOString().split('T')[0], discountCode: discountApplied?.code, discountApplied: discountApplied?.amount }, discountApplied?.code);
            clearCart(); setIsSuccess(true);
        } catch (error) { notify((error as Error).message || "Payment Failed", "error"); } finally { setIsProcessing(false); }
    };

    if (isSuccess) {
        return (
            <div className="flex-1 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-label="Order Confirmed">
                <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100 max-sm:max-w-sm w-full text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-scale-in"><CheckCircle size={48} /></div>
                    <h3 className="text-3xl font-display font-black mb-4 uppercase">Order Confirmed!</h3>
                    <p className="text-gray-500 mb-8 font-medium">Thank you for shopping with Arobazzar.</p>
                    <Button onClick={() => navigateTo('HOME')} className="w-full">Back to Store</Button>
                </div>
            </div>
        );
    }

    const paypalGateway = settings?.paymentGateways?.find(g => g.id === PaymentMethod.PAYPAL);
    const paypalClientId = paypalGateway?.paypalClientId;

    const orderSummary = (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 h-fit sticky top-8">
            <h4 className="font-display font-black text-gray-900 mb-6 uppercase tracking-tight text-xl">Order Summary</h4>
            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-50">
                                <img src={db.getOptimizedImage(item.images?.[0], 100)} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                                <p className="font-bold text-gray-900 leading-tight line-clamp-1">{item.name}</p>
                                <p className="text-xs text-gray-500 mt-1 font-medium">
                                    Qty: {item.quantity} 
                                    {item.selectedSize ? ` | ${item.selectedSize}` : ''} 
                                    {item.selectedColor ? ` | ${item.selectedColor}` : ''}
                                </p>
                            </div>
                        </div>
                        <span className="font-bold text-gray-900 whitespace-nowrap">LKR {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>
            
            <div className="space-y-3 pt-6 border-t border-gray-100">
                <div className="flex justify-between text-gray-500 font-medium"><span>Subtotal</span><span>LKR {subTotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-500 font-medium"><span>Delivery</span><span>LKR {deliveryCharge.toFixed(2)}</span></div>
                {discountApplied && (
                    <div className="flex justify-between text-green-600 font-bold bg-green-50 p-2 rounded-lg">
                        <span>Discount ({discountApplied.code})</span>
                        <span>- LKR {discountApplied.amount.toFixed(2)}</span>
                    </div>
                )}
                <div className="border-t border-gray-100 mt-4 pt-4">
                    <div className="flex justify-between items-end">
                        <span className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-1">Total Amount</span>
                        <span className="font-display font-black text-gray-900 text-3xl tracking-tight">LKR {finalTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1">Have a coupon?</label>
                <div className="flex gap-2">
                    <input 
                        placeholder="CODE" 
                        className="flex-1 bg-gray-50 border-2 border-transparent focus:border-black p-3 rounded-xl font-bold text-sm outline-none uppercase transition-all" 
                        value={couponCode} 
                        onChange={e => setCouponCode(e.target.value.toUpperCase())} 
                    />
                    <button onClick={handleApplyCoupon} className="bg-black text-white px-5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors uppercase tracking-wider">Apply</button>
                </div>
            </div>
        </div>
    );

    return (
        <PayPalScriptProvider options={{ "clientId": paypalClientId || "sb", currency: "USD", intent: "capture" }}>
            {showWalletSelector && <WalletSelectionModal onClose={() => setShowWalletSelector(false)} onSelect={handleWalletSelect} />}
            <div className="max-w-7xl mx-auto pt-16 md:pt-28 pb-12 px-4 md:px-8 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Side: Order Summary */}
                    <div className="lg:col-span-5 order-1 lg:order-1">
                        {orderSummary}
                    </div>

                    {/* Right Side: Forms */}
                    <div className="lg:col-span-7 order-2 lg:order-2">
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                            <div className="p-6 md:p-8 border-b border-gray-100 bg-white shrink-0">
                                <h2 className="text-lg md:text-2xl font-display font-black uppercase tracking-tight">
                                    Checkout
                                </h2>
                            </div>
                            <div className="flex-1 p-6 md:p-8 bg-gray-50/50 overflow-y-auto">
                                <div className="space-y-8">
                                    {checkoutStep === 'DETAILS' ? (
                                        <div className="space-y-6 animate-fade-in">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-sm font-bold uppercase tracking-wider text-gray-400 pl-2">1. Customer Details</div>
                                                <div className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-full uppercase">Step 1 of 2</div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name *</label>
                                                    <input placeholder="Enter your full name" type="text" className="w-full bg-white border-2 border-transparent focus:border-black p-4 rounded-xl font-medium text-base outline-none transition-all shadow-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} aria-label="Full Name"/>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address *</label>
                                                        <input placeholder="email@example.com" type="email" className="w-full bg-white border-2 border-transparent focus:border-black p-4 rounded-xl font-medium text-base outline-none transition-all shadow-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} aria-label="Email"/>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number *</label>
                                                        <input placeholder="+94 7X XXX XXXX" type="tel" className="w-full bg-white border-2 border-transparent focus:border-black p-4 rounded-xl font-medium text-base outline-none transition-all shadow-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} aria-label="Phone"/>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Shipping Address *</label>
                                                    <textarea placeholder="House No, Street, City, etc." className="w-full bg-white border-2 border-transparent focus:border-black p-4 rounded-xl font-medium text-base outline-none transition-all shadow-sm" rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} aria-label="Address"></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 animate-fade-in">
                                            <div className="flex items-center justify-between mb-2">
                                                <button 
                                                    onClick={() => setCheckoutStep('DETAILS')}
                                                    className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
                                                >
                                                    <ArrowLeft size={14} /> Edit Details
                                                </button>
                                                <div className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-1 rounded-full uppercase">Step 2 of 2</div>
                                            </div>
                                            
                                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-6">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Shipping To:</div>
                                                <div className="text-sm font-bold text-gray-900">{formData.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">{formData.address}</div>
                                            </div>

                                            <div className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 pl-2">2. Payment Method</div>
                                            {availableMethods.length === 0 ? (<div className="text-center p-8 bg-red-50 text-red-500 rounded-2xl font-bold">No payment methods enabled in Admin settings.</div>) : (
                                                <div className="space-y-6">
                                                    {/* Card & Wallets */}
                                                    {availableMethods.some(m => m.id === PaymentMethod.PAYHERE || m.id === PaymentMethod.PAYPAL) && (
                                                        <div className="space-y-3">
                                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-2">Card & Digital Wallets</h4>
                                                            {availableMethods.filter(m => m.id === PaymentMethod.PAYHERE || m.id === PaymentMethod.PAYPAL).map(m => { 
                                                                const isSelected = paymentMethod === m.id; 
                                                                return (
                                                                    <div key={m.id} onClick={() => setPaymentMethod(m.id)} className={`flex items-center gap-4 p-4 md:p-6 rounded-2xl cursor-pointer border-2 transition-all shadow-sm ${isSelected ? 'border-blue-600 bg-blue-50/50' : 'border-transparent bg-white hover:border-gray-200'}`}>
                                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-600 text-white`}>
                                                                            {m.id === PaymentMethod.PAYPAL ? <span className="font-bold text-xs">PayPal</span> : <CreditCard size={24}/>}
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-bold text-base md:text-lg">{m.id === PaymentMethod.PAYHERE ? 'Card / Google Pay / Apple Pay (PayHere)' : m.nameOverride || m.id}</div>
                                                                            <div className="text-xs md:text-sm text-gray-500">{m.instructions}</div>
                                                                        </div>
                                                                    </div>
                                                                ); 
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Other Methods */}
                                                    {availableMethods.some(m => m.id === PaymentMethod.BANK_DEPOSIT || m.id === PaymentMethod.COD) && (
                                                        <div className="space-y-3">
                                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-2">Other Methods</h4>
                                                            {availableMethods.filter(m => m.id === PaymentMethod.BANK_DEPOSIT || m.id === PaymentMethod.COD).sort((a) => a.id === PaymentMethod.COD ? -1 : 1).map(m => { 
                                                                const isSelected = paymentMethod === m.id; 
                                                                return (
                                                                    <div key={m.id} onClick={() => setPaymentMethod(m.id)} className={`flex items-center gap-4 p-4 md:p-6 rounded-2xl cursor-pointer border-2 transition-all shadow-sm ${isSelected ? 'border-blue-600 bg-blue-50/50' : 'border-transparent bg-white hover:border-gray-200'}`}>
                                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${m.id === PaymentMethod.COD ? 'bg-black text-white' : 'bg-indigo-600 text-white'}`}>
                                                                            {m.id === PaymentMethod.COD ? <Banknote size={24}/> : <Landmark size={24}/>}
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-bold text-base md:text-lg">{m.nameOverride || m.id}</div>
                                                                            <div className="text-xs md:text-sm text-gray-500">{m.instructions}</div>
                                                                        </div>
                                                                    </div>
                                                                ); 
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Crypto */}
                                                    {availableMethods.some(m => [PaymentMethod.BASE_ETH, PaymentMethod.BASE_USDC, PaymentMethod.BASE_USDT].includes(m.id as PaymentMethod)) && (
                                                        <div className="space-y-3">
                                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-2">Crypto (Base Chain)</h4>
                                                            {availableMethods.filter(m => [PaymentMethod.BASE_ETH, PaymentMethod.BASE_USDC, PaymentMethod.BASE_USDT].includes(m.id as PaymentMethod)).map(m => { 
                                                                const isSelected = paymentMethod === m.id; 
                                                                return (
                                                                    <div key={m.id} onClick={() => setPaymentMethod(m.id)} className={`flex items-center gap-4 p-4 md:p-6 rounded-2xl cursor-pointer border-2 transition-all shadow-sm ${isSelected ? 'border-blue-600 bg-blue-50/50' : 'border-transparent bg-white hover:border-gray-200'}`}>
                                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-600 text-white`}>
                                                                            <Zap size={24}/>
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-bold text-base md:text-lg">{m.nameOverride || m.id}</div>
                                                                            <div className="text-xs md:text-sm text-gray-500">{m.instructions}</div>
                                                                        </div>
                                                                    </div>
                                                                ); 
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {paymentMethod === 'Bank Deposit' && (
                                                <div className="bg-white p-6 rounded-2xl border-2 border-indigo-100 animate-fade-in space-y-4 shadow-lg">
                                                    <div className="flex items-center justify-between"><span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Transfer to this account</span></div>
                                                    <div className="grid grid-cols-1 gap-3 text-sm">
                                                        <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500">Bank</span><span className="font-bold text-gray-900">{settings?.paymentGateways.find(g => g.id === PaymentMethod.BANK_DEPOSIT)?.bankDetails?.bankName || 'N/A'}</span></div>
                                                        <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500">Account Name</span><span className="font-bold text-gray-900">{settings?.paymentGateways.find(g => g.id === PaymentMethod.BANK_DEPOSIT)?.bankDetails?.accountName || 'N/A'}</span></div>
                                                        <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500">Account No</span><span className="font-mono font-bold text-lg text-indigo-700 select-all">{settings?.paymentGateways.find(g => g.id === PaymentMethod.BANK_DEPOSIT)?.bankDetails?.accountNumber || 'N/A'}</span></div>
                                                        <div className="flex justify-between"><span className="text-gray-500">Branch</span><span className="font-bold text-gray-900">{settings?.paymentGateways.find(g => g.id === PaymentMethod.BANK_DEPOSIT)?.bankDetails?.branch || 'N/A'}</span></div>
                                                    </div>
                                                    <div className="pt-4 border-t border-gray-100">
                                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 pl-1">Payment Verification</label>
                                                        <input type="text" placeholder="Enter Transaction Ref (Optional if slip uploaded)" className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 p-4 rounded-xl font-medium text-base outline-none transition-all shadow-sm mb-3" value={transactionRef} onChange={e => setTransactionRef(e.target.value)} aria-label="Transaction Reference"/>
                                                        
                                                        <div className="flex items-center gap-3">
                                                            <input 
                                                                type="file" 
                                                                id="slip-upload" 
                                                                className="hidden" 
                                                                accept="image/*,.pdf" 
                                                                onChange={async (e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (!file) return;
                                                                    setIsUploadingSlip(true);
                                                                    try {
                                                                        const url = await uploadToLocal(file);
                                                                        setSlipUrl(url);
                                                                        notify("Slip uploaded successfully!", "success");
                                                                    } catch (err) {
                                                                        notify("Failed to upload slip: " + (err as Error).message, "error");
                                                                    } finally {
                                                                        setIsUploadingSlip(false);
                                                                    }
                                                                }} 
                                                            />
                                                            <label 
                                                                htmlFor="slip-upload" 
                                                                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed ${slipUrl ? 'border-green-500 bg-green-50 text-green-700' : 'border-indigo-200 hover:border-indigo-400 text-indigo-600 bg-indigo-50'} cursor-pointer transition-colors font-medium text-sm`}
                                                            >
                                                                {isUploadingSlip ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                                                                {isUploadingSlip ? 'Uploading...' : slipUrl ? 'Slip Uploaded' : 'Upload Bank Slip'}
                                                            </label>
                                                            {slipUrl && (
                                                                <button onClick={() => setSlipUrl('')} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        <p className="text-xs text-indigo-500 mt-3 font-medium flex items-center gap-1"><AlertCircle size={12}/> Please transfer the exact amount and enter the reference ID or upload the slip.</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {isCrypto && (<div className="bg-white p-6 rounded-2xl border-2 border-blue-100 animate-fade-in space-y-4"><div className="flex items-center justify-between"><span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Conversion</span><span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">Live Rate</span></div><div className="text-3xl font-display font-black text-blue-900">{exchangeRate > 0 ? (<>{convertedAmount.toFixed(6)} <span className="text-lg text-blue-400">{paymentMethod === PaymentMethod.BASE_ETH ? 'ETH' : 'USD'}</span></>) : <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>}</div><div className="text-sm text-gray-400 font-medium">Equivalent to LKR {finalTotal.toFixed(2)}</div><div className="pt-4 border-t border-gray-100">{!walletAddress ? (<Button onClick={() => setShowWalletSelector(true)} variant="secondary" className="w-full"><Wallet size={18}/> Connect Web3 Wallet</Button>) : (<div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span className="text-xs font-mono font-bold text-gray-600">{(walletAddress || "").slice(0, 6)}...{(walletAddress || "").slice(-4)}</span></div><button onClick={() => setWalletAddress(null)} className="text-xs text-red-500 hover:underline">Disconnect</button></div>)}</div><p className="text-xs text-center text-gray-400 mt-2">Powered by Base Chain</p></div>)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-6 md:p-8 border-t border-gray-100 bg-white flex gap-4 shrink-0">
                                {checkoutStep === 'DETAILS' ? (
                                    <Button 
                                        className="w-full" 
                                        onClick={() => {
                                            if (validateForm()) {
                                                setCheckoutStep('PAYMENT');
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }
                                        }}
                                    >
                                        Continue to Payment
                                    </Button>
                                ) : (
                                    paymentMethod === PaymentMethod.PAYPAL ? (
                                        paypalClientId ? (
                                            <div className="w-full space-y-3">
                                                <PayPalButtons 
                                                    style={{ layout: "vertical", shape: "rect", label: "pay" }}
                                                    forceReRender={[finalTotal, paypalClientId]}
                                                    createOrder={(data, actions) => {
                                                        if (!validateForm()) return Promise.reject(new Error("Form invalid"));
                                                        const usdAmount = (finalTotal / 300).toFixed(2);
                                                        return actions.order.create({
                                                            intent: "CAPTURE",
                                                            purchase_units: [{
                                                                description: `Order from Arobazzar`,
                                                                amount: {
                                                                    currency_code: "USD",
                                                                    value: usdAmount
                                                                }
                                                            }]
                                                        });
                                                    }}
                                                    onApprove={async (data, actions) => {
                                                        if (actions.order) {
                                                            try {
                                                                const details = await actions.order.capture();
                                                                setTransactionRef(details.id || 'PAYPAL_TX');
                                                                await handlePlaceOrder();
                                                            } catch {
                                                                notify("Payment capture failed. Please try again.", "error");
                                                            }
                                                        }
                                                    }}
                                                    onError={(err) => {
                                                        console.error("PayPal Error:", err);
                                                        notify("PayPal Error: Could not initialize payment window. Check Client ID.", "error");
                                                    }}
                                                    onCancel={() => {
                                                        notify("Payment cancelled", "info");
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full p-4 bg-red-50 text-red-600 rounded-xl text-center font-bold text-sm">
                                                PayPal Client ID is missing. Please configure it in Admin Settings.
                                            </div>
                                        )
                                    ) : paymentMethod === PaymentMethod.PAYHERE ? (
                                        <Button className="w-full" onClick={handlePayHerePayment} disabled={isProcessing}>
                                            {isProcessing ? 'Processing...' : 'Pay with PayHere'}
                                        </Button>
                                    ) : (
                                        <Button className="w-full" onClick={isCrypto && !walletAddress ? () => setShowWalletSelector(true) : () => handlePlaceOrder()} disabled={isProcessing}>{isProcessing ? 'Processing...' : (isCrypto && !walletAddress ? 'Connect Wallet' : 'Pay Now')}</Button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PayPalScriptProvider>
    );
};

const useBannerClick = (onProductClick: (p: Product) => void, navigateTo: (page: Page, state?: Record<string, unknown>) => void) => {
    const { products } = useShop();
    return (linkType?: LinkType, linkValue?: string) => {
        if (!linkType || linkType === 'NONE' || !linkValue) return;
        if (linkType === 'PRODUCT') {
            const product = products.find(p => p.id === linkValue || p.name === linkValue);
            if (product) onProductClick(product);
        } else if (linkType === 'CATEGORY') {
            sessionStorage.setItem('arobazzar_active_category', linkValue);
            navigateTo('SHOP');
        }
    };
};

const HomePage: React.FC<{ onProductClick: (p: Product) => void }> = ({ onProductClick }) => {
    const { products, navigateTo, settings, categories } = useShop();
    const [activeCategory, setActiveCategory] = useState('All');
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const handleBannerClick = useBannerClick(onProductClick, navigateTo);

    const banners: HeroBanner[] = settings?.heroBanners && settings.heroBanners.length > 0 
        ? settings.heroBanners 
        : [{ 
            title: settings?.heroTitle || '', 
            subtitle: settings?.heroSubtitle || '', 
            image: settings?.heroImage || '', 
            backgroundColor: '#111827',
            linkType: 'NONE',
            linkValue: ''
        }];
    
    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => { setCurrentBannerIndex(prev => (prev + 1) % banners.length); }, 6000);
        return () => clearInterval(interval);
    }, [banners.length]);

    const currentBanner = banners[currentBannerIndex] || { 
        title: '', subtitle: '', image: '', backgroundColor: '#111827', linkType: 'NONE', linkValue: '' 
    };
    const textColor = getContrastColor(currentBanner.backgroundColor || '#111827');
    const isDarkText = textColor === 'black';

    const topCategories = ['All', ...categories.filter(c => !c.parentId).map(c => c.name)];
    const filteredProducts = activeCategory === 'All' ? products : products.filter(p => p.category === activeCategory);
    const displayProducts = filteredProducts.slice(0, 8);
    
    return (
        <div className="animate-fade-in">
            <SeoManager title="Home" description={settings?.heroSubtitle} />
            <div id="hero" className="pt-24 md:pt-32 pb-8 md:pb-12 px-2 md:px-6">
                <div 
                    className="max-w-7xl mx-auto rounded-[2rem] md:rounded-[3rem] px-6 md:px-24 py-12 md:py-16 relative overflow-hidden h-auto md:min-h-[500px] flex items-center group transition-colors duration-1000 ease-in-out cursor-pointer transform-gpu min-h-[400px]" 
                    style={{ backgroundColor: currentBanner.backgroundColor || '#111827', color: textColor }}
                    onClick={() => handleBannerClick(currentBanner.linkType, currentBanner.linkValue)}
                >
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] md:w-[600px] md:h-[600px] rounded-full md:blur-3xl blur-xl opacity-20 pointer-events-none transition-colors duration-1000 transform-gpu ${isDarkText ? 'bg-black/10' : 'bg-white/10'}`}></div>
                    <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-2 items-center gap-12">
                        <div className="text-left animate-slide-up order-2 md:order-1" key={`text-${currentBannerIndex}`}>
                            <span className={`inline-block py-2 px-4 border rounded-full text-xs font-bold tracking-widest uppercase mb-4 md:mb-6 shadow-sm transition-colors duration-1000 ${isDarkText ? 'border-black/20 bg-black/10 text-black/80' : 'border-white/20 bg-white/10 text-white/80'}`}>{settings?.bannerTitle || "New Season"}</span>
                            <h1 className="text-4xl md:text-7xl font-display font-black tracking-tighter leading-[0.95] mb-4 md:mb-6 break-words drop-shadow-xl transition-colors duration-1000">{currentBanner.title || "FUTURE RETAIL."}</h1>
                            <p className={`text-lg md:text-xl font-medium max-w-md mb-8 leading-relaxed transition-colors duration-1000 ${isDarkText ? 'text-gray-800' : 'text-white/80'}`}>{currentBanner.subtitle || "Arobazzar brings you the world's most desired products."}</p>
                            <Button 
                                variant={isDarkText ? 'primary' : 'secondary'} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (currentBanner.linkType && currentBanner.linkType !== 'NONE' && currentBanner.linkValue) {
                                        handleBannerClick(currentBanner.linkType, currentBanner.linkValue);
                                    } else {
                                        navigateTo('SHOP');
                                    }
                                }}
                            >
                                Shop Now <ArrowRight size={18} />
                            </Button>
                        </div>
                        <div className="relative order-1 md:order-2 h-[300px] md:h-[500px] flex items-center justify-center" key={`img-${currentBannerIndex}`}>
                            <div className={`absolute inset-0 rounded-full md:blur-3xl blur-xl transform-gpu scale-75 md:animate-pulse-slow transition-colors duration-1000 ${isDarkText ? 'bg-black/20' : 'bg-white/20'}`}></div>
                            <img 
                                src={db.getOptimizedImage(currentBanner.image, 800)} 
                                alt={currentBanner.title} 
                                className="w-full h-full object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] md:animate-float transform-gpu hover:scale-105 transition-transform duration-500 will-change-transform" 
                                onError={(e) => { 
                                    const target = e.currentTarget;
                                    target.onerror = null;
                                    if (target.src.includes('wsrv.nl') && currentBanner.image && !currentBanner.image.includes('wsrv.nl')) {
                                        target.src = currentBanner.image;
                                    } else {
                                        target.style.display = 'none'; 
                                    }
                                }} 
                                referrerPolicy="no-referrer" 
                                loading="eager" 
                                decoding="async"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div id="shop" className="max-w-7xl mx-auto px-6 mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h2 className="text-2xl font-display font-black">Latest Drops</h2>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar py-4 -mx-6 px-8 md:mx-0 md:px-2" role="tablist">
                        {topCategories.map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} role="tab" aria-selected={activeCategory === cat} className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 flex-shrink-0 min-w-[4rem] ${activeCategory === cat ? 'bg-black text-white shadow-lg scale-105' : 'bg-white text-gray-500 hover:bg-gray-200'}`}>{cat}</button>))}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{displayProducts.map(product => (<ProductCard key={product.id} product={product} onOpen={onProductClick} />))}</div>
                <div className="mt-12 text-center"><Button variant="outline" onClick={() => navigateTo('SHOP')}>View All Products</Button></div>
            </div>
            
            {settings?.middleBanner && (
                <div className="max-w-7xl mx-auto px-6 mb-12">
                     <div 
                        className="w-full relative overflow-hidden h-[300px] md:h-[500px] flex items-center justify-center text-center rounded-[2rem] md:rounded-[3rem] cursor-pointer group transform-gpu"
                        onClick={() => handleBannerClick(settings.middleBanner?.linkType, settings.middleBanner?.linkValue)}
                     >
                        <img 
                            src={db.getOptimizedImage(settings.middleBanner.image, 1200)} 
                            alt={settings.middleBanner.title} 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 transform-gpu will-change-transform" 
                            onError={(e) => { 
                                const target = e.currentTarget; 
                                target.onerror = null;
                                if (target.src.includes('wsrv.nl') && settings.middleBanner?.image) target.src = settings.middleBanner.image;
                                else target.src = PLACEHOLDER_IMG;
                            }}
                            loading="lazy" 
                            decoding="async" 
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                        <div className="relative z-10 max-w-2xl mx-auto p-6">
                            <h2 className="text-3xl md:text-6xl font-display font-black text-white mb-6 drop-shadow-xl">{settings.middleBanner.title}</h2>
                            <p className="text-white/90 text-lg md:text-xl font-medium mb-8 drop-shadow-md">{settings.middleBanner.subtitle}</p>
                            <div className="flex justify-center">
                                <Button 
                                    variant="secondary"
                                    className="text-lg py-5 px-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (settings.middleBanner?.linkType && settings.middleBanner?.linkType !== 'NONE' && settings.middleBanner?.linkValue) {
                                            handleBannerClick(settings.middleBanner.linkType, settings.middleBanner.linkValue);
                                        } else {
                                            navigateTo('SHOP');
                                        }
                                    }}
                                >
                                    Shop Now <ArrowRight size={20} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {settings?.watchSection && (
                 <div className="max-w-7xl mx-auto px-6 mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0 rounded-[2.5rem] overflow-hidden bg-gray-50 shadow-sm border border-gray-100">
                        <div 
                            className="h-[300px] md:h-[600px] relative group overflow-hidden cursor-pointer transform-gpu"
                            onClick={() => handleBannerClick(settings.watchSection?.linkType, settings.watchSection?.linkValue)}
                        >
                             <img 
                                src={db.getOptimizedImage(settings.watchSection.image, 800)} 
                                alt={settings.watchSection.title} 
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 transform-gpu will-change-transform" 
                                onError={(e) => { 
                                    const target = e.currentTarget; 
                                    target.onerror = null;
                                    if (target.src.includes('wsrv.nl') && settings.watchSection?.image) target.src = settings.watchSection.image;
                                    else target.src = PLACEHOLDER_IMG;
                                }}
                                referrerPolicy="no-referrer" 
                                loading="lazy" 
                                decoding="async" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8 md:p-12">
                                <h3 className="text-3xl md:text-5xl font-display font-black text-white mb-2">{settings.watchSection.title}</h3>
                                <p className="text-white/80 font-medium">Precision meets luxury.</p>
                            </div>
                        </div>
                        <div className="h-auto md:h-[600px] p-8 md:p-12 flex flex-col bg-white">
                             <div className="flex justify-between items-end mb-8">
                                <div><h3 className="text-2xl font-display font-black text-gray-900 mb-1">Exclusive Timepieces</h3><p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Curated Collection</p></div>
                                <button onClick={() => navigateTo('SHOP')} className="text-sm font-bold border-b-2 border-black pb-1 hover:text-gray-600 transition-colors">See All</button>
                             </div>
                             <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                {(settings.watchSectionProductIds?.length ? products.filter(p => settings.watchSectionProductIds!.includes(p.id)) : products.filter(p => p.category === 'Fashion').slice(0, 5)).map(p => (
                                    <div key={p.id} onClick={() => onProductClick(p)} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group border border-transparent hover:border-gray-100">
                                        <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                            <img 
                                                src={db.getOptimizedImage(p.images?.[0], 150)} 
                                                onError={(e) => { 
                                                    const target = e.currentTarget; 
                                                    target.onerror = null;
                                                    if (target.src.includes('wsrv.nl') && p.images?.[0]) target.src = p.images[0];
                                                    else target.src = PLACEHOLDER_IMG;
                                                }}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform transform-gpu" 
                                                alt={p.name} 
                                                referrerPolicy="no-referrer" 
                                                loading="lazy" 
                                                decoding="async" 
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-bold text-gray-900 line-clamp-1">{p.name}</h5>
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">{p.category}</p>
                                            <div className="flex justify-between items-center"><span className="font-bold">LKR {(p.price || 0).toFixed(2)}</span><div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors"><ArrowRight size={14}/></div></div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                             <div className="mt-8 pt-6 border-t border-gray-100"><Button className="w-full" onClick={() => navigateTo('SHOP')}>View More Watches</Button></div>
                        </div>
                    </div>
                 </div>
            )}
            
            {settings?.fashionSection && (
                 <div className="max-w-7xl mx-auto px-6 mb-20">
                     <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                        <div><span className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2 block">{settings.fashionSection.subtitle}</span><h3 className="text-3xl md:text-5xl font-display font-black">{settings.fashionSection.title}</h3></div>
                        <Button variant="outline" onClick={() => navigateTo('SHOP')} className="md:w-auto w-full">Shop Collection</Button>
                     </div>
                     <div className="relative overflow-x-auto hide-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
                         <div className="flex gap-6 pb-8">
                             <div 
                                className="min-w-[280px] md:min-w-[400px] aspect-[3/4] rounded-[2rem] overflow-hidden relative group cursor-pointer transform-gpu"
                                onClick={() => handleBannerClick(settings.fashionSection?.linkType, settings.fashionSection?.linkValue)}
                             >
                                 <img 
                                    src={db.getOptimizedImage(settings.fashionSection.image, 600)} 
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 transform-gpu will-change-transform" 
                                    onError={(e) => { 
                                        const target = e.currentTarget; 
                                        target.onerror = null;
                                        if (target.src.includes('wsrv.nl') && settings.fashionSection?.image) target.src = settings.fashionSection.image;
                                        else target.src = PLACEHOLDER_IMG;
                                    }}
                                    referrerPolicy="no-referrer" 
                                    loading="lazy" 
                                    decoding="async" 
                                    alt="Lookbook"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                <div className="absolute bottom-8 left-8"><h4 className="text-white font-display font-black text-2xl md:text-3xl">Lookbook</h4><p className="text-white/80 font-medium">{settings.fashionSection.lookbookText || 'Summer 2024'}</p></div>
                             </div>
                             {products.filter(p => p.category === 'Fashion').slice(0, 6).map(p => (
                                 <div key={p.id} onClick={() => onProductClick(p)} className="min-w-[260px] md:min-w-[280px] group cursor-pointer">
                                     <div className="aspect-[3/4] bg-gray-100 rounded-[2rem] overflow-hidden mb-4 relative transform-gpu">
                                        <img 
                                            src={db.getOptimizedImage(p.images?.[0], 400)} 
                                            onError={(e) => { 
                                                const target = e.currentTarget; 
                                                target.onerror = null;
                                                if (target.src.includes('wsrv.nl') && p.images?.[0]) target.src = p.images[0];
                                                else target.src = PLACEHOLDER_IMG;
                                            }}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 transform-gpu will-change-transform" 
                                            referrerPolicy="no-referrer" 
                                            loading="lazy" 
                                            decoding="async"
                                            alt={p.name}
                                        />
                                        <div className="absolute top-4 right-4 bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><ArrowRight size={16} /></div>
                                    </div>
                                     <h5 className="font-bold text-lg leading-tight">{p.name}</h5>
                                     <p className="text-gray-500 text-sm">{p.category}</p>
                                     <div className="font-bold mt-1">LKR {(p.price || 0).toFixed(2)}</div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>
            )}
            
            <div className="bg-white text-gray-900 border-t border-gray-100 py-20 px-6 rounded-t-[3rem] -mb-20 relative z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    <div className="flex flex-col items-center gap-4"><div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-black mb-2"><Banknote size={32} /></div><h4 className="text-xl font-bold">Cash on Delivery</h4><p className="text-gray-500 text-sm max-w-xs">Pay conveniently with cash when your order arrives at your doorstep.</p></div>
                    <div className="flex flex-col items-center gap-4"><div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-blue-600 mb-2"><Zap size={32} /></div><h4 className="text-xl font-bold">Crypto Payments</h4><p className="text-gray-500 text-sm max-w-xs">Secure, instant payments via Base Chain using ETH or USDC.</p></div>
                    <div className="flex flex-col items-center gap-4"><div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-green-600 mb-2"><Truck size={32} /></div><h4 className="text-xl font-bold">Fast Delivery</h4><p className="text-gray-500 text-sm max-w-xs">Expedited shipping options to get your gear to you in record time.</p></div>
                </div>
            </div>
        </div>
    );
};

const ShopPage: React.FC<{ onProductClick: (p: Product) => void }> = ({ onProductClick }) => {
    const { products, categories } = useShop();
    const [filter, setFilter] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
    
    useEffect(() => {
        const storedCat = sessionStorage.getItem('arobazzar_active_category');
        if (storedCat) {
            setActiveCategory(storedCat);
            sessionStorage.removeItem('arobazzar_active_category');
        }
        window.scrollTo(0,0);
    }, []);

    const parentCategories = useMemo(() => ['All', ...categories.filter(c => !c.parentId).map(c => c.name)], [categories]);
    const currentParentId = useMemo(() => categories.find(c => c.name === activeCategory)?.id, [categories, activeCategory]);
    const currentSubCategories = useMemo(() => currentParentId ? categories.filter(c => c.parentId === currentParentId) : [], [categories, currentParentId]);

    const filtered = products.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(filter.toLowerCase());
        const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
        const matchesSubCategory = !activeSubCategory || p.subCategory === activeSubCategory;
        return matchesSearch && matchesCategory && matchesSubCategory;
    });

    return (
        <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-fade-in min-h-screen">
            <SeoManager title="Shop" description="Explore our full collection of premium products." />
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                <div><h1 className="text-5xl font-display font-black mb-2">Shop All</h1><p className="text-gray-400 font-medium">Browse our full collection of premium items.</p></div>
                <div className="relative w-full md:w-96"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search products..." className="w-full bg-white border-2 border-gray-100 focus:border-black rounded-full py-4 pl-12 pr-6 outline-none transition-all shadow-sm" value={filter} onChange={e => setFilter(e.target.value)} aria-label="Search Products"/></div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-6 mb-2" role="tablist">
                {parentCategories.map(cat => (
                    <button key={cat} onClick={() => { setActiveCategory(cat); setActiveSubCategory(null); }} role="tab" aria-selected={activeCategory === cat} className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 flex-shrink-0 border-2 ${activeCategory === cat ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-transparent hover:border-gray-200'}`}>{cat}</button>
                ))}
            </div>

            {currentSubCategories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-6 mb-2 animate-slide-up">
                    <button onClick={() => setActiveSubCategory(null)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${!activeSubCategory ? 'bg-gray-200 text-black' : 'bg-gray-50 text-gray-500 hover:bg-gray-200'}`}>All {activeCategory}</button>
                    {currentSubCategories.map(sub => (
                        <button key={sub.id} onClick={() => setActiveSubCategory(sub.name)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeSubCategory === sub.name ? 'bg-black text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-200'}`}>{sub.name}</button>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filtered.length > 0 ? filtered.map(product => <ProductCard key={product.id} product={product} onOpen={onProductClick} />) : <div className="col-span-full text-center py-20 text-gray-400 font-medium">No products found.</div>}
            </div>
        </div>
    );
};

const TrendingPage: React.FC<{ onProductClick: (p: Product) => void }> = ({ onProductClick }) => {
    const { products } = useShop();
    const trendingProducts = useMemo(() => products.filter(p => p.isTrending), [products]);
    useEffect(() => { window.scrollTo(0,0); }, []);
    return (
        <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto animate-fade-in min-h-screen">
             <SeoManager title="Trending" description="See what's hot right now on Arobazzar." />
             <div className="text-center mb-16"><h1 className="text-5xl md:text-7xl font-display font-black mb-6">Trending</h1><p className="text-gray-400 font-medium text-lg max-w-2xl mx-auto">Items that are flying off the digital shelves.</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{trendingProducts.length > 0 ? trendingProducts.map(product => (<ProductCard key={product.id} product={product} onOpen={onProductClick} />)) : (<div className="col-span-full text-center py-20 text-gray-400 font-bold">No trending items yet.</div>)}</div>
        </div>
    );
};

export const StoreFront: React.FC = () => {
  const { cart, removeFromCart, updateCartQuantity, navigateTo, currentPage, settings } = useShop();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (currentPage === 'LOGIN') return <LoginPage />;
  if (currentPage === 'PRIVACY') return <PrivacyPolicy />;
  if (currentPage === 'TERMS') return <TermsOfService />;
  if (currentPage === 'PAYMENT') return <PaymentPolicy />;
  if (currentPage === 'RETURN') return <ReturnPolicy />;
  if (currentPage === 'PROFILE') return <UserProfile />;
  if (currentPage === 'CONTACT') return <ContactPage />;

  const handleMobileNav = (page: Page) => { navigateTo(page); setIsMobileMenuOpen(false); };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm py-4' : 'bg-transparent py-6'}`} role="navigation" aria-label="Main Navigation">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button className="md:hidden" onClick={() => setIsMobileMenuOpen(true)} aria-label="Open Menu"><Menu size={24}/></button>
                <button onClick={() => navigateTo('HOME')} className="cursor-pointer flex items-center gap-2" aria-label="Go to Home">
                    <Logo src={settings?.siteLogo} className="h-14 w-auto object-contain" fallbackClass="text-2xl font-display font-black tracking-tighter" />
                </button>
            </div>
            {currentPage !== 'CHECKOUT' && (
                <div className="hidden md:flex gap-8 font-bold text-sm text-gray-400">
                    <button onClick={() => navigateTo('HOME')} className={`transition-colors ${currentPage === 'HOME' ? 'text-black' : 'hover:text-black'}`}>Home</button>
                    <button onClick={() => navigateTo('SHOP')} className={`transition-colors ${currentPage === 'SHOP' ? 'text-black' : 'hover:text-black'}`}>Shop</button>
                    <button onClick={() => navigateTo('TRENDING')} className={`transition-colors ${currentPage === 'TRENDING' ? 'text-black' : 'hover:text-black'}`}>Trending</button>
                    <button onClick={() => navigateTo('CONTACT')} className="transition-colors hover:text-black">Contact</button>
                </div>
            )}
            <div className="flex items-center gap-4">
                 <button onClick={() => navigateTo('PROFILE')} className="p-3 rounded-full hover:bg-gray-100 transition-colors" aria-label="My Profile"><User size={20} /></button>
                <button onClick={() => setIsCartOpen(true)} className="relative group bg-white/80 p-3 rounded-full shadow-sm hover:shadow-md transition-all hover:bg-black hover:text-white" aria-label="Open Cart"><ShoppingBag size={20} />{cart.length > 0 && (<span className="absolute -top-1 -right-1 bg-black text-white group-hover:bg-white group-hover:text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-scale-in">{cart.reduce((a, b) => a + b.quantity, 0)}</span>)}</button>
            </div>
        </div>
      </nav>

      <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div className={`absolute top-0 left-0 w-3/4 max-w-xs h-full bg-white shadow-2xl transform transition-transform duration-300 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center"><span className="text-2xl font-display font-black tracking-tighter">MENU</span><button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close Menu"><X size={24}/></button></div>
            <div className="flex-1 p-6 flex flex-col gap-6 font-bold text-lg">
                {currentPage !== 'CHECKOUT' && (
                    <>
                        <button onClick={() => handleMobileNav('HOME')} className="text-left hover:text-gray-500">Home</button>
                        <button onClick={() => handleMobileNav('SHOP')} className="text-left hover:text-gray-500">Shop All</button>
                        <button onClick={() => handleMobileNav('TRENDING')} className="text-left hover:text-gray-500">Trending</button>
                    </>
                )}
                <button onClick={() => handleMobileNav('PROFILE')} className="text-left hover:text-gray-500">My Profile</button>
                {currentPage !== 'CHECKOUT' && (
                    <button onClick={() => handleMobileNav('CONTACT')} className="text-left hover:text-gray-500">Contact Us</button>
                )}
                <div className="border-t border-gray-100 my-2"></div>
                <button onClick={() => { setIsMobileMenuOpen(false); setIsCartOpen(true); }} className="text-left hover:text-gray-500 flex items-center gap-2">Cart <span className="bg-black text-white text-xs px-2 py-1 rounded-full">{cart.length}</span></button>
            </div>
            <div className="p-6 bg-gray-50 text-xs text-gray-400 font-bold uppercase tracking-wider">&copy; 2024 Arobazzar</div>
        </div>
      </div>

      <main className="flex-1">
          {currentPage === 'HOME' && <HomePage onProductClick={setSelectedProduct} />}
          {currentPage === 'SHOP' && <ShopPage onProductClick={setSelectedProduct} />}
          {currentPage === 'TRENDING' && <TrendingPage onProductClick={setSelectedProduct} />}
          {currentPage === 'CHECKOUT' && <CheckoutPage />}
      </main>

      <Footer />

      <div className={`fixed inset-0 z-50 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)} role="dialog" aria-label="Shopping Cart">
        <div onClick={(e) => e.stopPropagation()} className={`absolute right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white z-10"><h2 className="text-3xl font-display font-black tracking-tight flex items-center gap-3">Bag <span className="text-sm bg-black text-white px-2 py-1 rounded-md font-sans font-bold">{cart.length}</span></h2><button onClick={() => setIsCartOpen(false)} className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors" aria-label="Close Cart"><X size={20}/></button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4"><ShoppingBag size={80} className="opacity-10" /><p className="font-bold text-lg">Your bag is empty.</p><Button variant="outline" onClick={() => { setIsCartOpen(false); navigateTo('SHOP'); }}>Start Shopping</Button></div>) : (cart.map(item => (
                        <div key={`${item.id}-${item.selectedColor}-${item.selectedSize}`} className="flex gap-4 animate-fade-in group">
                            <div className="w-24 h-24 bg-gray-100 rounded-2xl flex-shrink-0 p-2 overflow-hidden border border-gray-100">
                                <img src={db.getOptimizedImage(item.images?.[0], 150)} onError={(e) => { const target = e.currentTarget; target.onerror = null; if (target.src.includes('wsrv.nl') && item.images?.[0]) target.src = item.images[0]; else target.src = PLACEHOLDER_IMG; }} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div><div className="flex justify-between items-start"><h4 className="font-bold text-lg leading-tight mb-1">{item.name}</h4><button onClick={() => removeFromCart(item.id, item.selectedColor, item.selectedSize)} className="text-gray-300 hover:text-red-500 transition-colors" aria-label="Remove item"><X size={18}/></button></div><p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{item.category}</p>
                                {item.selectedColor && (<div className="flex items-center gap-2 mt-1"><span className="w-3 h-3 rounded-full border border-gray-300" style={{backgroundColor: item.selectedColor.trim()}}></span><span className="text-xs font-medium text-gray-500">{item.selectedColor}</span></div>)}
                                {item.selectedSize && (<div className="flex items-center gap-2 mt-1"><span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Size: {item.selectedSize}</span></div>)}
                                </div>
                                <div className="flex items-center justify-between mt-2"><div className="font-bold text-lg">LKR {(item.discountPrice && item.discountPrice < item.price ? item.discountPrice : item.price).toFixed(2)}</div><div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-full px-2 py-1"><button onClick={() => updateCartQuantity(item.id, -1, item.selectedColor, item.selectedSize)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><Minus size={14}/></button><span className="text-sm font-bold w-4 text-center">{item.quantity}</span><button onClick={() => updateCartQuantity(item.id, 1, item.selectedColor, item.selectedSize)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><Plus size={14}/></button></div></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="p-8 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between mb-8 text-3xl font-display font-black tracking-tight mt-4"><span>Total</span><span>LKR {cart.reduce((a, b) => a + ((b.discountPrice && b.discountPrice < b.price ? b.discountPrice : b.price) * b.quantity), 0).toFixed(2)}</span></div>
                <Button onClick={() => { setIsCartOpen(false); navigateTo('CHECKOUT'); }} className="w-full text-lg py-5" disabled={cart.length === 0}>Checkout <ArrowRight size={20} /></Button>
            </div>
        </div>
      </div>

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
};
