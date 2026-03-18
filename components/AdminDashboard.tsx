
import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../context/ShopContext';
import { Product, OrderStatus, SiteSettings, PaymentMethod, Order, DiscountCode, LinkType } from '../types';
import { generateProductDescription } from '../services/gemini';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Plus, Trash2, Edit, Package, BarChart2, DollarSign, Loader2, Sparkles, Box, ListOrdered, Search, LogOut, Settings, Save, RefreshCw, UploadCloud, X, Banknote, Wallet, Eye, Ticket, LayoutDashboard, Clock, FolderTree, Link as LinkIcon, Landmark, Star, Mail, Phone, MapPin, MessageSquare, ArrowRight } from 'lucide-react';
import * as db from '../services/db';
import { uploadToLocal, uploadToPinata } from '../services/ipfs';

const PLACEHOLDER_IMG = "https://placehold.co/600x600/f3f4f6/a3a3a3?text=No+Image";

const RANDOM_IMAGES = [
    "https://placehold.co/600x600/111/FFF?text=Product+1",
    "https://placehold.co/600x600/222/FFF?text=Product+2",
    "https://placehold.co/600x600/333/FFF?text=Product+3"
];

const ImageUploader: React.FC<{ 
    label: string; 
    value: string; 
    onChange: (val: string) => void; 
    placeholder?: string 
}> = ({ label, value, onChange, placeholder }) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadMethodRef = useRef<'local' | 'ipfs'>('local');
    const { notify } = useShop();

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const method = uploadMethodRef.current;
            const url = method === 'local' ? await uploadToLocal(file) : await uploadToPinata(file);
            onChange(url);
            notify(`Image uploaded to ${method === 'local' ? 'Local Storage' : 'IPFS'}!`, "success");
        } catch (error) {
            notify("Upload failed: " + (error as Error).message, "error");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerUpload = (method: 'local' | 'ipfs') => {
        uploadMethodRef.current = method;
        fileInputRef.current?.click();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
                    <button 
                        type="button" 
                        onClick={() => triggerUpload('local')} 
                        disabled={isUploading}
                        className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded flex items-center gap-1 font-bold disabled:opacity-50"
                    >
                        {isUploading && uploadMethodRef.current === 'local' ? <Loader2 size={10} className="animate-spin"/> : <UploadCloud size={10}/>} Local
                    </button>
                    <button 
                        type="button" 
                        onClick={() => triggerUpload('ipfs')} 
                        disabled={isUploading}
                        className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2 py-1 rounded flex items-center gap-1 font-bold disabled:opacity-50"
                    >
                        {isUploading && uploadMethodRef.current === 'ipfs' ? <Loader2 size={10} className="animate-spin"/> : <UploadCloud size={10}/>} IPFS
                    </button>
                    {value && (
                        <button 
                            type="button" 
                            onClick={() => onChange('')} 
                            className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-2 py-1 rounded flex items-center gap-1 font-bold"
                            title="Delete Image"
                        >
                            <Trash2 size={10}/> Delete
                        </button>
                    )}
                </div>
            </div>
            <input 
                className="w-full bg-gray-50 border-transparent focus:border-black focus:bg-white border-2 p-4 rounded-xl font-medium outline-none transition-colors text-sm" 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                placeholder={placeholder || "https://gateway.pinata.cloud/ipfs/..."} 
            />
            {value && value.length > 5 && (
                <div className="mt-2 h-16 w-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                    <img 
                        src={db.getOptimizedImage(value, 100)} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        onError={(e) => { 
                            const target = e.currentTarget; 
                            target.onerror = null;
                            if (target.src.includes('wsrv.nl')) {
                                target.src = value;
                            } else {
                                target.src = PLACEHOLDER_IMG; 
                            }
                        }} 
                    />
                </div>
            )}
        </div>
    );
};

const LinkInput: React.FC<{
    linkType: LinkType;
    linkValue: string;
    onTypeChange: (val: LinkType) => void;
    onValueChange: (val: string) => void;
}> = ({ linkType, linkValue, onTypeChange, onValueChange }) => {
    return (
        <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Link To</label>
                <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none"
                    value={linkType || 'NONE'}
                    onChange={e => onTypeChange(e.target.value as LinkType)}
                >
                    <option value="NONE">None</option>
                    <option value="PRODUCT">Product</option>
                    <option value="CATEGORY">Category</option>
                </select>
            </div>
            <div className="col-span-2">
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Target (ID or Name)</label>
                 <input 
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm outline-none"
                    value={linkValue || ''}
                    onChange={e => onValueChange(e.target.value)}
                    placeholder={linkType === 'PRODUCT' ? 'Product Name or ID' : linkType === 'CATEGORY' ? 'Category Name' : ''}
                    disabled={linkType === 'NONE'}
                 />
            </div>
        </div>
    );
};

const DashboardOverview: React.FC = () => {
    const { orders } = useShop();

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;

    const salesByDate = orders.reduce((acc, order) => {
        const date = order.date; 
        if (!acc[date]) acc[date] = 0;
        acc[date] += (order.total || 0);
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.keys(salesByDate)
        .map(date => ({ name: date, sales: salesByDate[date] }))
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
        .slice(-7);

    const displayChartData = chartData.length > 0 ? chartData : [
        { name: 'Mon', sales: 0 }, { name: 'Tue', sales: 0 }, { name: 'Wed', sales: 0 }, 
        { name: 'Thu', sales: 0 }, { name: 'Fri', sales: 0 }, { name: 'Sat', sales: 0 }, { name: 'Sun', sales: 0 }
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-10">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-black text-white p-6 rounded-[2rem] shadow-xl hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center gap-4 mb-2 opacity-80">
                        <DollarSign size={24} />
                        <span className="font-bold uppercase text-xs tracking-wider">Total Revenue</span>
                    </div>
                    <div className="text-3xl font-display font-black">LKR {totalRevenue.toLocaleString()}</div>
                </div>
                 <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Package size={20} />
                        </div>
                        <span className="text-gray-400 font-bold uppercase text-xs tracking-wider">Total Orders</span>
                    </div>
                    <div className="text-3xl font-display font-black">{totalOrders}</div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                            <Clock size={20} />
                        </div>
                        <span className="text-gray-400 font-bold uppercase text-xs tracking-wider">Pending Orders</span>
                    </div>
                    <div className="text-3xl font-display font-black">{pendingOrders}</div>
                </div>
                 <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                            <BarChart2 size={20} />
                        </div>
                        <span className="text-gray-400 font-bold uppercase text-xs tracking-wider">Avg. Order Value</span>
                    </div>
                    <div className="text-3xl font-display font-black">LKR {avgOrderValue.toFixed(0)}</div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                     <h3 className="font-display font-black text-xl mb-6 flex items-center gap-2"><LayoutDashboard size={20}/> Revenue Trend</h3>
                     <div className="h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={displayChartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10}/>
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `LKR ${value}`} width={80}/>
                                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}/>
                                <Area type="monotone" dataKey="sales" stroke="#000000" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                         </ResponsiveContainer>
                     </div>
                 </div>

                 <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-full flex flex-col">
                     <h3 className="font-display font-black text-xl mb-6">Recent Orders</h3>
                     <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
                        {[...orders].reverse().slice(0, 6).map(order => (
                             <div key={order.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                     {order.customerName ? order.customerName.charAt(0) : '?'}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <div className="font-bold truncate text-sm">#{order.id}</div>
                                     <div className="text-xs text-gray-400">{order.date} • {order.status}</div>
                                 </div>
                                 <div className="font-bold text-sm">LKR {order.total.toFixed(0)}</div>
                             </div>
                        ))}
                     </div>
                 </div>
             </div>
        </div>
    );
};

const CategoryManager: React.FC = () => {
    const { categories, addCategory, deleteCategory, notify } = useShop();
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState('');
    const [image, setImage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return notify("Name required", "error");
        
        const uniqueId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        await addCategory({
            id: uniqueId,
            name,
            parentId: parentId || undefined,
            image: image || undefined
        });
        
        setName('');
        setImage('');
    };

    const parentCategories = categories.filter(c => !c.parentId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in pb-10">
            <div className="lg:col-span-1 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-fit">
                <h3 className="font-display font-black text-xl mb-6 flex items-center gap-3"><Plus size={24}/> Add Category</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category Name</label>
                         <input className="w-full bg-gray-50 border-transparent focus:border-black border-2 p-4 rounded-xl font-medium outline-none" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Shoes" />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Parent Category (Optional)</label>
                         <select className="w-full bg-gray-50 border-transparent focus:border-black border-2 p-4 rounded-xl font-medium outline-none" value={parentId} onChange={e => setParentId(e.target.value)}>
                            <option value="">None (Top Level)</option>
                            {parentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                    </div>
                    <ImageUploader label="Category Image (Optional)" value={image} onChange={setImage} />
                    <button type="submit" className="w-full bg-black text-white py-4 rounded-full font-bold hover:bg-gray-800 transition-all">Save Category</button>
                </form>
            </div>
            <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 className="font-display font-black text-xl mb-6 flex items-center gap-3"><FolderTree size={24}/> Category Tree</h3>
                <div className="space-y-4">
                    {parentCategories.map(parent => (
                        <div key={parent.id} className="bg-gray-50 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <div className="font-bold text-lg flex items-center gap-2">
                                    {parent.image && <img src={db.getOptimizedImage(parent.image, 100)} className="w-8 h-8 rounded object-cover" alt="" onError={(e) => { e.currentTarget.onerror = null; if(parent.image) e.currentTarget.src = parent.image; }}/>}
                                    {parent.name}
                                </div>
                                <button onClick={() => deleteCategory(parent.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-full"><Trash2 size={16}/></button>
                            </div>
                            <div className="pl-6 space-y-2 border-l-2 border-gray-200 ml-2">
                                {categories.filter(c => c.parentId === parent.id).map(sub => (
                                    <div key={sub.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                                        <span className="text-sm font-medium text-gray-600">{sub.name}</span>
                                        <button onClick={() => deleteCategory(sub.id)} className="text-red-400 p-1 hover:bg-red-50 rounded-full"><Trash2 size={14}/></button>
                                    </div>
                                ))}
                                {categories.filter(c => c.parentId === parent.id).length === 0 && <div className="text-xs text-gray-400 italic">No sub-categories</div>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ProductManager: React.FC = () => {
    const { products, saveProduct, deleteProduct, notify, categories } = useShop();
    const [newProduct, setNewProduct] = useState<Partial<Product>>({
        name: '', price: 0, discountPrice: undefined, category: '', subCategory: '', description: '', images: [], stock: 10, isTrending: false, colors: [], sizes: [], tags: []
    });
    const [imageInput, setImageInput] = useState('');
    const [colorInput, setColorInput] = useState('');
    const [sizeInput, setSizeInput] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [editModeId, setEditModeId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadMethodRef = useRef<'local' | 'ipfs'>('local');

    const parentCategories = categories.filter(c => !c.parentId);
    const subCategories = categories.filter(c => c.parentId === (categories.find(cat => cat.name === newProduct.category || cat.id === newProduct.category)?.id));

    const startEdit = (product: Product) => {
        setNewProduct(product);
        setImageInput((product.images || []).join(', '));
        setColorInput((product.colors || []).join(', '));
        setSizeInput((product.sizes || []).join(', '));
        setTagsInput((product.tags || []).join(', '));
        setEditModeId(product.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleGenerate = async () => {
        if (!newProduct.name || !newProduct.category) {
            notify("Please enter a product name and category first.", "error");
            return;
        }
        setIsGenerating(true);
        const desc = await generateProductDescription(newProduct.name, newProduct.category || '', 'Premium, high quality, useful, futuristic');
        setNewProduct(prev => ({ ...prev, description: desc }));
        setIsGenerating(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const method = uploadMethodRef.current;
            const url = method === 'local' ? await uploadToLocal(file) : await uploadToPinata(file);
            const currentImages = imageInput ? imageInput.split(',').map(s => s.trim()).filter(Boolean) : [];
            const newImages = [...currentImages, url];
            setImageInput(newImages.join(', '));
            notify(`Image uploaded to ${method === 'local' ? 'Local Storage' : 'IPFS'}!`, "success");
        } catch (error) {
            notify((error as Error).message || "Upload failed", "error");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerUpload = (method: 'local' | 'ipfs') => {
        uploadMethodRef.current = method;
        fileInputRef.current?.click();
    };

    const addRandomImage = () => {
        const randomImg = RANDOM_IMAGES[Math.floor(Math.random() * RANDOM_IMAGES.length)];
        const currentImages = imageInput ? imageInput.split(',').map(s => s.trim()).filter(Boolean) : [];
        const newImages = [...currentImages, randomImg];
        setImageInput(newImages.join(', '));
    };

    const processImageUrl = (url: string) => {
        let clean = url.trim();
        if (clean.includes('cloudflare-ipfs.com')) {
            clean = clean.replace('cloudflare-ipfs.com', 'gateway.pinata.cloud');
        }
        return clean;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProduct.name) {
             notify("Product Name is required.", "error");
             return;
        }
        
        const imgList = imageInput.split(',').map(processImageUrl).filter(s => s.length > 5);
        const colorList = colorInput.split(',').map(c => c.trim()).filter(c => c !== '');
        const sizeList = sizeInput.split(',').map(s => s.trim()).filter(s => s !== '');
        const tagsList = tagsInput.split(',').map(t => t.trim()).filter(t => t !== '');

        await saveProduct({
            id: editModeId || Date.now().toString(),
            name: newProduct.name,
            price: Number(newProduct.price),
            discountPrice: newProduct.discountPrice ? Number(newProduct.discountPrice) : undefined,
            category: newProduct.category || 'General',
            subCategory: newProduct.subCategory || undefined,
            description: newProduct.description || '',
            images: imgList.length > 0 ? imgList : [PLACEHOLDER_IMG], 
            colors: colorList,
            sizes: sizeList,
            tags: tagsList,
            reviews: editModeId ? (products.find(p => p.id === editModeId)?.reviews || []) : [],
            stock: newProduct.stock || 0,
            isTrending: newProduct.isTrending || false
        } as Product);

        setNewProduct({ name: '', price: 0, discountPrice: undefined, category: 'Electronics', description: '', images: [], stock: 10, isTrending: false, colors: [], sizes: [], tags: [] });
        setImageInput('');
        setColorInput('');
        setSizeInput('');
        setTagsInput('');
        setEditModeId(null);
    };

    const safeProducts = Array.isArray(products) ? products : [];
    const filteredProducts = safeProducts.filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const previewImages = imageInput.split(',').map(processImageUrl).filter(s => s.length > 5);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in pb-10">
            <div className="xl:col-span-1 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-fit">
                <h3 className="font-display font-black text-xl mb-6 flex items-center gap-3">
                    {editModeId ? <Edit size={24} className="text-black"/> : <Plus size={24} className="text-black"/>} 
                    {editModeId ? "Edit Product" : "Add Product"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Name</label>
                        <input className="w-full bg-gray-50 border-transparent focus:border-black focus:bg-white border-2 p-4 rounded-xl font-medium outline-none transition-colors" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g. Cyberpunk Hoodie" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price (LKR)</label>
                            <input type="number" className="w-full bg-gray-50 border-transparent focus:border-black focus:bg-white border-2 p-4 rounded-xl font-medium outline-none transition-colors" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Discount Price</label>
                            <input type="number" className="w-full bg-gray-50 border-transparent focus:border-black focus:bg-white border-2 p-4 rounded-xl font-medium outline-none transition-colors" value={newProduct.discountPrice || ''} onChange={e => setNewProduct({...newProduct, discountPrice: parseFloat(e.target.value)})} placeholder="Optional" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Stock</label>
                        <input type="number" className="w-full bg-gray-50 border-transparent focus:border-black focus:bg-white border-2 p-4 rounded-xl font-medium outline-none transition-colors" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                                <select className="w-full bg-gray-50 border-transparent focus:border-black focus:bg-white border-2 p-4 rounded-xl font-medium outline-none transition-colors appearance-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value, subCategory: ''})}>
                                    <option value="">Select...</option>
                                    {parentCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    {parentCategories.length === 0 && <option value="General">General</option>}
                                </select>
                        </div>
                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sub-Category</label>
                                <select className="w-full bg-gray-50 border-transparent focus:border-black focus:bg-white border-2 p-4 rounded-xl font-medium outline-none transition-colors appearance-none" value={newProduct.subCategory} onChange={e => setNewProduct({...newProduct, subCategory: e.target.value})} disabled={!newProduct.category}>
                                    <option value="">None</option>
                                    {subCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                            Description 
                            <button type="button" onClick={handleGenerate} className="text-white bg-black px-3 py-1 rounded-md text-[10px] flex items-center gap-1 hover:bg-gray-800 transition-colors disabled:opacity-50" disabled={isGenerating}>
                                {isGenerating ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>} AI GENERATE
                            </button>
                        </label>
                        <textarea className="w-full bg-gray-50 border-transparent focus:border-black focus:bg-white border-2 p-4 rounded-xl font-medium outline-none transition-colors h-32 resize-none" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} placeholder="Describe the product..." />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Images</label>
                            <div className="flex gap-2">
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                <button type="button" onClick={() => triggerUpload('local')} disabled={isUploading} className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded flex items-center gap-1 font-bold disabled:opacity-50">
                                    {isUploading && uploadMethodRef.current === 'local' ? <Loader2 size={10} className="animate-spin"/> : <UploadCloud size={10}/>} Local
                                </button>
                                <button type="button" onClick={() => triggerUpload('ipfs')} disabled={isUploading} className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2 py-1 rounded flex items-center gap-1 font-bold disabled:opacity-50">
                                    {isUploading && uploadMethodRef.current === 'ipfs' ? <Loader2 size={10} className="animate-spin"/> : <UploadCloud size={10}/>} IPFS
                                </button>
                                <button type="button" onClick={addRandomImage} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1 font-bold">
                                    <RefreshCw size={10}/> Random
                                </button>
                            </div>
                        </div>
                        <input className="w-full bg-gray-50 border-transparent focus:border-black focus:bg-white border-2 p-4 rounded-xl font-medium outline-none transition-colors" value={imageInput} onChange={e => setImageInput(e.target.value)} placeholder="https://example.com/image.jpg, ..." />
                        {previewImages.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {previewImages.map((url, i) => (
                                    <div key={i} className="aspect-square relative rounded-lg overflow-hidden border border-gray-200 group bg-gray-50">
                                        <img 
                                            src={db.getOptimizedImage(url, 100)} 
                                            className="w-full h-full object-cover" 
                                            onError={(e) => { 
                                                const target = e.currentTarget; 
                                                target.onerror = null;
                                                if (target.src.includes('wsrv.nl')) {
                                                    target.src = url;
                                                } else {
                                                    target.src = PLACEHOLDER_IMG; 
                                                }
                                            }} 
                                            referrerPolicy="no-referrer" 
                                            alt="Preview"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Colors (Comma Separated)</label>
                         <input className="w-full bg-gray-50 border-transparent focus:border-black focus:bg-white border-2 p-4 rounded-xl font-medium outline-none transition-colors" value={colorInput} onChange={e => setColorInput(e.target.value)} placeholder="Red, Blue, #000000" />
                         {colorInput && (
                             <div className="flex gap-2 mt-2">
                                 {colorInput.split(',').map((c, i) => (
                                     <div key={i} className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: c.trim() }} title={c.trim()} />
                                 ))}
                             </div>
                         )}
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sizes (Comma Separated)</label>
                         <input className="w-full bg-gray-50 border-transparent focus:border-black focus:bg-white border-2 p-4 rounded-xl font-medium outline-none transition-colors" value={sizeInput} onChange={e => setSizeInput(e.target.value)} placeholder="S, M, L, XL, XXL" />
                         {sizeInput && (
                             <div className="flex gap-2 mt-2 flex-wrap">
                                 {sizeInput.split(',').map((s, i) => (
                                     <span key={i} className="px-2 py-1 border rounded text-xs font-bold">{s.trim()}</span>
                                 ))}
                             </div>
                         )}
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tags (Comma Separated)</label>
                         <input className="w-full bg-gray-50 border-transparent focus:border-black focus:bg-white border-2 p-4 rounded-xl font-medium outline-none transition-colors" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Summer, Sale, New, Exclusive" />
                    </div>
                     <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl cursor-pointer" onClick={() => setNewProduct({...newProduct, isTrending: !newProduct.isTrending})}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${newProduct.isTrending ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                            {newProduct.isTrending && <Star size={12} className="text-white" fill="currentColor"/>}
                        </div>
                        <span className="font-bold text-sm text-gray-600">Mark as Trending</span>
                    </div>
                    <div className="flex gap-2">
                        {editModeId && (
                            <button type="button" onClick={() => { setEditModeId(null); setNewProduct({ name: '', price: 0, discountPrice: undefined, category: '', subCategory: '', description: '', images: [], stock: 10, isTrending: false, colors: [], sizes: [], tags: [] }); setImageInput(''); setColorInput(''); setSizeInput(''); setTagsInput(''); }} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-full font-bold hover:bg-gray-200 transition-all">Cancel</button>
                        )}
                        <button type="submit" className="flex-1 bg-black text-white py-4 rounded-full font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-95">
                            {editModeId ? "Update Product" : "Publish Product"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="xl:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col h-[800px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-display font-black text-xl flex items-center gap-3"><Box size={24} className="text-black"/> Inventory</h3>
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search inventory..." className="pl-10 pr-4 py-2 bg-gray-50 rounded-full text-sm font-medium outline-none focus:ring-2 focus:ring-black/5 w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 pr-2">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 rounded-l-xl font-bold uppercase text-xs tracking-wider">Product</th>
                                <th className="p-4 font-bold uppercase text-xs tracking-wider">Details</th>
                                <th className="p-4 font-bold uppercase text-xs tracking-wider">Stock</th>
                                <th className="p-4 rounded-r-xl text-right font-bold uppercase text-xs tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts.map(p => (
                                <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                                            <img 
                                                src={db.getOptimizedImage(p.images?.[0], 100)} 
                                                onError={(e) => { 
                                                    const target = e.currentTarget; 
                                                    target.onerror = null; 
                                                    if (target.src.includes('wsrv.nl') && p.images?.[0]) {
                                                        target.src = p.images[0];
                                                    } else {
                                                        target.src = PLACEHOLDER_IMG; 
                                                    }
                                                }} 
                                                alt="" 
                                                className="w-full h-full object-cover" 
                                                referrerPolicy="no-referrer" 
                                            />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{p.name || 'Untitled'}</div>
                                            <div className="text-xs text-gray-400">{p.category} {p.subCategory && `> ${p.subCategory}`}</div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-600">LKR {(p.price || 0).toFixed(2)}</div>
                                        {p.discountPrice && <div className="text-xs text-red-500 font-bold line-through">LKR {p.discountPrice.toFixed(2)}</div>}
                                        {p.tags && p.tags.length > 0 && <div className="text-xs text-blue-500 mt-1">{p.tags.slice(0,3).join(', ')}</div>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`font-bold ${p.stock < 10 ? 'text-red-500' : 'text-gray-900'}`}>{p.stock}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => startEdit(p)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all"><Edit size={18}/></button>
                                            <button onClick={() => deleteProduct(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const OrderDetailsModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2">Order Details <span className="text-gray-400 font-mono">#{order.id}</span></h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                            <h4 className="font-bold text-sm uppercase text-gray-500">Customer Info</h4>
                            <div className="font-bold text-lg">{order.customerName}</div>
                            <div className="text-gray-600 flex items-center gap-2"><Mail size={14}/> {order.customerEmail}</div>
                            {order.contactNumber && <div className="text-gray-600 flex items-center gap-2"><Phone size={14}/> {order.contactNumber}</div>}
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                             <h4 className="font-bold text-sm uppercase text-gray-500">Shipping Address</h4>
                             <div className="text-gray-800 whitespace-pre-wrap flex items-start gap-2"><MapPin size={16} className="mt-1 flex-shrink-0"/> {order.address}</div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="p-3 font-bold uppercase text-xs">Item</th>
                                    <th className="p-3 font-bold uppercase text-xs">Details</th>
                                    <th className="p-3 font-bold uppercase text-xs text-right">Qty</th>
                                    <th className="p-3 font-bold uppercase text-xs text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {order.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                                                    <img 
                                                        src={db.getOptimizedImage(item.images?.[0], 100)} 
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { 
                                                            const target = e.currentTarget; 
                                                            target.onerror = null; 
                                                            if (target.src.includes('wsrv.nl') && item.images?.[0]) {
                                                                target.src = item.images[0];
                                                            } else {
                                                                target.src = PLACEHOLDER_IMG; 
                                                            }
                                                        }} 
                                                    />
                                                </div>
                                                <span className="font-bold">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-gray-500 text-xs">
                                            {item.selectedColor && <span className="block">Color: {item.selectedColor}</span>}
                                            {item.selectedSize && <span className="block">Size: {item.selectedSize}</span>}
                                        </td>
                                        <td className="p-3 text-right font-bold">{item.quantity}</td>
                                        <td className="p-3 text-right">LKR {item.price.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-4">
                            <h4 className="font-bold text-sm uppercase text-gray-500">Payment</h4>
                             <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.paymentMethod === PaymentMethod.COD ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>{order.paymentMethod}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-800' : order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{order.status}</span>
                            </div>
                            {order.transactionHash && (
                                <div className="text-xs text-gray-500 break-all bg-gray-50 p-2 rounded border border-gray-100">
                                    <span className="font-bold block mb-1">Transaction Ref / Hash / Slip:</span>
                                    {order.transactionHash.startsWith('http') ? (
                                        <a href={order.transactionHash} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                                            <LinkIcon size={12} /> View Uploaded Slip
                                        </a>
                                    ) : (
                                        order.transactionHash
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="w-full md:w-64 bg-gray-50 p-4 rounded-xl space-y-2">
                             <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>LKR {(order.subtotal || 0).toFixed(2)}</span></div>
                             {order.deliveryCharge && <div className="flex justify-between text-gray-500"><span>Delivery</span><span>LKR {order.deliveryCharge.toFixed(2)}</span></div>}
                             {order.discountApplied && <div className="flex justify-between text-green-600 font-bold"><span>Discount</span><span>- LKR {order.discountApplied.toFixed(2)}</span></div>}
                             <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg"><span>Total</span><span>LKR {order.total.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="bg-black text-white px-6 py-2 rounded-full font-bold hover:bg-gray-800">Close Details</button>
                </div>
            </div>
        </div>
    );
};

const OrderManager: React.FC = () => {
    const { orders, updateOrderStatus, deleteOrder } = useShop();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    
    const filteredOrders = orders.filter(o => {
        return o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
               o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-full flex flex-col animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-black text-xl flex items-center gap-3"><ListOrdered size={24}/> Orders</h3>
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search orders..." className="pl-10 pr-4 py-2 bg-gray-50 rounded-full text-sm font-medium outline-none focus:ring-2 focus:ring-black/5 w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
            <div className="overflow-auto flex-1">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 sticky top-0">
                        <tr>
                            <th className="p-4 rounded-l-xl">Order ID</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Total</th>
                            <th className="p-4">Date</th>
                            <th className="p-4 rounded-r-xl text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredOrders.map(order => (
                            <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 font-bold">{order.id}</td>
                                <td className="p-4">
                                    <div className="font-bold">{order.customerName}</div>
                                    <div className="text-xs text-gray-400">{order.customerEmail}</div>
                                </td>
                                <td className="p-4">
                                     <select 
                                        value={order.status} 
                                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider outline-none cursor-pointer border-none bg-transparent ${order.status === OrderStatus.DELIVERED ? 'text-green-600 bg-green-50' : order.status === OrderStatus.PENDING ? 'text-orange-600 bg-orange-50' : 'text-blue-600 bg-blue-50'}`}
                                     >
                                        {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                     </select>
                                </td>
                                <td className="p-4 font-bold">LKR {order.total.toFixed(2)}</td>
                                <td className="p-4 text-gray-500">{order.date}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setSelectedOrder(order)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full" title="View Details"><Eye size={18}/></button>
                                        <button onClick={() => { if(confirm('Delete order?')) deleteOrder(order.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full" title="Delete Order"><Trash2 size={18}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
            {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
        </div>
    );
};

const ReviewManager: React.FC = () => {
    const { products, deleteReview } = useShop();
    const reviews = products.flatMap(p => p.reviews.map(r => ({ ...r, productName: p.name, productId: p.id })));

    return (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-full flex flex-col animate-fade-in">
            <h3 className="font-display font-black text-xl mb-6 flex items-center gap-3"><MessageSquare size={24}/> Reviews</h3>
            <div className="overflow-auto flex-1">
                 {reviews.length === 0 ? <p className="text-gray-400">No reviews yet.</p> : (
                     <div className="space-y-4">
                         {reviews.map(r => (
                             <div key={r.id} className="p-4 bg-gray-50 rounded-xl flex justify-between items-start">
                                 <div>
                                     <div className="font-bold text-sm">{r.productName}</div>
                                     <div className="flex items-center gap-2 mt-1">
                                         <div className="flex text-yellow-400">
                                             {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < r.rating ? "currentColor" : "none"}/>)}
                                         </div>
                                         <span className="text-xs font-bold text-gray-500">by {r.user}</span>
                                     </div>
                                     <p className="text-sm text-gray-600 mt-2">{r.comment}</p>
                                 </div>
                                 <button onClick={() => deleteReview(r.productId, r.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                             </div>
                         ))}
                     </div>
                 )}
            </div>
        </div>
    );
};

const DiscountCodeManager: React.FC = () => {
    const { settings, updateSiteSettings, notify } = useShop();
    const [localCodes, setLocalCodes] = useState<DiscountCode[]>([]);
    const [newCode, setNewCode] = useState<Partial<DiscountCode>>({ type: 'PERCENTAGE', isActive: true });

    useEffect(() => {
        if (settings?.discountCodes) {
            setLocalCodes(settings.discountCodes);
        }
    }, [settings]);

    const handleSave = () => {
        if (settings) {
            updateSiteSettings({ ...settings, discountCodes: localCodes });
            notify("Discount codes updated", "success");
        }
    };

    const handleAdd = () => {
        if (!newCode.code || !newCode.value) {
            notify("Code and value are required", "error");
            return;
        }
        setLocalCodes([...localCodes, newCode as DiscountCode]);
        setNewCode({ type: 'PERCENTAGE', isActive: true });
    };

    const handleRemove = (index: number) => {
        setLocalCodes(localCodes.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-full overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tighter">DISCOUNT CODES</h3>
                <button onClick={handleSave} className="bg-black text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"><Save size={20}/> Save Changes</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="font-bold text-lg border-b pb-2 mb-4">Add New Code</h4>
                    <div className="space-y-4 bg-gray-50 p-6 rounded-xl">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Code</label>
                            <input className="w-full bg-white p-3 rounded-lg border-2 border-transparent focus:border-black outline-none" placeholder="e.g. SUMMER20" value={newCode.code || ''} onChange={(e) => setNewCode({...newCode, code: e.target.value.toUpperCase()})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Type</label>
                                <select className="w-full bg-white p-3 rounded-lg border-2 border-transparent focus:border-black outline-none" value={newCode.type} onChange={(e) => setNewCode({...newCode, type: e.target.value as 'PERCENTAGE' | 'FIXED'})}>
                                    <option value="PERCENTAGE">Percentage (%)</option>
                                    <option value="FIXED">Fixed Amount</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Value</label>
                                <input type="number" className="w-full bg-white p-3 rounded-lg border-2 border-transparent focus:border-black outline-none" value={newCode.value || ''} onChange={(e) => setNewCode({...newCode, value: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min Order Amount (Optional)</label>
                            <input type="number" className="w-full bg-white p-3 rounded-lg border-2 border-transparent focus:border-black outline-none" value={newCode.minOrderAmount || ''} onChange={(e) => setNewCode({...newCode, minOrderAmount: Number(e.target.value)})} />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={newCode.isActive} onChange={(e) => setNewCode({...newCode, isActive: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" />
                            <span className="font-bold">Active</span>
                        </label>
                        <button onClick={handleAdd} className="w-full bg-black text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"><Plus size={20}/> Add Code</button>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-lg border-b pb-2 mb-4">Existing Codes</h4>
                    <div className="space-y-3">
                        {localCodes.map((code, index) => (
                            <div key={index} className="bg-white border border-gray-100 p-4 rounded-xl flex justify-between items-center shadow-sm">
                                <div>
                                    <div className="font-black text-lg">{code.code}</div>
                                    <div className="text-sm text-gray-500">
                                        {code.type === 'PERCENTAGE' ? `${code.value}% off` : `$${code.value} off`}
                                        {code.minOrderAmount ? ` (Min: $${code.minOrderAmount})` : ''}
                                    </div>
                                    <div className={`text-xs font-bold mt-1 ${code.isActive ? 'text-green-500' : 'text-red-500'}`}>
                                        {code.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </div>
                                </div>
                                <button onClick={() => handleRemove(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={20}/></button>
                            </div>
                        ))}
                        {localCodes.length === 0 && (
                            <div className="text-center p-8 text-gray-400 font-bold">No discount codes found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SettingsManager: React.FC = () => {
    const { settings, updateSiteSettings } = useShop();
    const [localSettings, setLocalSettings] = useState<SiteSettings | null>(null);

    useEffect(() => {
        if (settings) setLocalSettings(settings);
    }, [settings]);

    if (!localSettings) return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block"/></div>;

    const handleSave = () => {
        if (localSettings) updateSiteSettings(localSettings);
    };

    const updateField = <K extends keyof SiteSettings>(field: K, value: SiteSettings[K]) => {
        setLocalSettings(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    return (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-full overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-white z-10 py-2">
                <h3 className="font-display font-black text-xl flex items-center gap-3"><Settings size={24}/> Site Settings</h3>
                <button onClick={handleSave} className="bg-black text-white px-6 py-2 rounded-full font-bold hover:bg-gray-800 flex items-center gap-2"><Save size={18}/> Save Changes</button>
            </div>
            
            <div className="space-y-8 max-w-4xl">
                <section className="space-y-4">
                    <h4 className="font-bold text-lg border-b pb-2">Branding</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ImageUploader label="Site Logo" value={localSettings.siteLogo || ''} onChange={(v) => updateField('siteLogo', v)} />
                        <ImageUploader label="Site Favicon" value={localSettings.siteFavicon || ''} onChange={(v) => updateField('siteFavicon', v)} />
                    </div>
                </section>

                <section className="space-y-4">
                    <h4 className="font-bold text-lg border-b pb-2">Hero Section</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hero Title</label>
                            <input className="w-full bg-gray-50 p-3 rounded-lg border-2 border-transparent focus:border-black outline-none" value={localSettings.heroTitle} onChange={(e) => updateField('heroTitle', e.target.value)} />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hero Subtitle</label>
                            <input className="w-full bg-gray-50 p-3 rounded-lg border-2 border-transparent focus:border-black outline-none" value={localSettings.heroSubtitle} onChange={(e) => updateField('heroSubtitle', e.target.value)} />
                         </div>
                    </div>
                    <ImageUploader label="Hero Image" value={localSettings.heroImage} onChange={(v) => updateField('heroImage', v)} />
                </section>

                <section className="space-y-4">
                    <h4 className="font-bold text-lg border-b pb-2">Hero Carousel (3 Banners)</h4>
                    <p className="text-sm text-gray-500 mb-4">These banners rotate automatically on the home page.</p>
                    <div className="space-y-8">
                        {localSettings.heroBanners?.map((banner, index) => (
                            <div key={index} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 relative">
                                <div className="absolute top-4 right-4 bg-black text-white text-xs font-bold px-2 py-1 rounded">
                                    Slide {index + 1}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Title</label>
                                        <input 
                                            className="w-full bg-white p-3 rounded-lg border-2 border-transparent focus:border-black outline-none" 
                                            value={banner.title} 
                                            onChange={(e) => {
                                                const newBanners = [...(localSettings.heroBanners || [])];
                                                newBanners[index] = { ...newBanners[index], title: e.target.value };
                                                updateField('heroBanners', newBanners);
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subtitle</label>
                                        <input 
                                            className="w-full bg-white p-3 rounded-lg border-2 border-transparent focus:border-black outline-none" 
                                            value={banner.subtitle} 
                                            onChange={(e) => {
                                                const newBanners = [...(localSettings.heroBanners || [])];
                                                newBanners[index] = { ...newBanners[index], subtitle: e.target.value };
                                                updateField('heroBanners', newBanners);
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Background Color</label>
                                    <div className="flex gap-2 items-center">
                                         <input 
                                            type="color"
                                            className="h-10 w-10 rounded cursor-pointer border-0 p-0" 
                                            value={banner.backgroundColor || '#000000'} 
                                            onChange={(e) => {
                                                const newBanners = [...(localSettings.heroBanners || [])];
                                                newBanners[index] = { ...newBanners[index], backgroundColor: e.target.value };
                                                updateField('heroBanners', newBanners);
                                            }}
                                        />
                                        <span className="text-sm font-mono text-gray-500">{banner.backgroundColor}</span>
                                    </div>
                                </div>

                                <ImageUploader 
                                    label="Banner Image" 
                                    value={banner.image} 
                                    onChange={(val) => {
                                        const newBanners = [...(localSettings.heroBanners || [])];
                                        newBanners[index] = { ...newBanners[index], image: val };
                                        updateField('heroBanners', newBanners);
                                    }} 
                                />

                                <LinkInput 
                                    linkType={banner.linkType || 'NONE'}
                                    linkValue={banner.linkValue || ''}
                                    onTypeChange={(t) => {
                                         const newBanners = [...(localSettings.heroBanners || [])];
                                         newBanners[index] = { ...newBanners[index], linkType: t };
                                         updateField('heroBanners', newBanners);
                                    }}
                                    onValueChange={(v) => {
                                         const newBanners = [...(localSettings.heroBanners || [])];
                                         newBanners[index] = { ...newBanners[index], linkValue: v };
                                         updateField('heroBanners', newBanners);
                                    }}
                                />
                                
                                <button 
                                    onClick={() => {
                                         const newBanners = [...(localSettings.heroBanners || [])];
                                         newBanners.splice(index, 1);
                                         updateField('heroBanners', newBanners);
                                    }}
                                    className="mt-4 text-xs text-red-500 font-bold hover:underline flex items-center gap-1"
                                >
                                    <Trash2 size={12}/> Remove Slide
                                </button>
                            </div>
                        ))}
                        
                        <button 
                            onClick={() => {
                                 const newBanners = [...(localSettings.heroBanners || [])];
                                 newBanners.push({ 
                                    title: 'New Slide', 
                                    subtitle: 'Description here', 
                                    image: '', 
                                    backgroundColor: '#111827',
                                    linkType: 'NONE'
                                 });
                                 updateField('heroBanners', newBanners);
                            }}
                            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={16}/> Add Slide
                        </button>
                    </div>
                </section>

                <section className="space-y-4">
                    <h4 className="font-bold text-lg border-b pb-2">Contact & Finance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Email</label>
                            <input className="w-full bg-gray-50 p-3 rounded-lg border-2 border-transparent focus:border-black outline-none" value={localSettings.contactEmail} onChange={(e) => updateField('contactEmail', e.target.value)} />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery Charge (LKR)</label>
                            <input type="number" className="w-full bg-gray-50 p-3 rounded-lg border-2 border-transparent focus:border-black outline-none" value={localSettings.deliveryCharge} onChange={(e) => updateField('deliveryCharge', parseFloat(e.target.value))} />
                         </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Address</label>
                        <textarea className="w-full bg-gray-50 p-3 rounded-lg border-2 border-transparent focus:border-black outline-none h-24" value={localSettings.contactAddress} onChange={(e) => updateField('contactAddress', e.target.value)} />
                    </div>
                </section>

                <section className="space-y-4">
                    <h4 className="font-bold text-lg border-b pb-2">Policies</h4>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Privacy Policy</label>
                        <textarea className="w-full bg-gray-50 p-3 rounded-lg border-2 border-transparent focus:border-black outline-none h-32" value={localSettings.privacyText || ''} onChange={(e) => updateField('privacyText', e.target.value)} placeholder="Enter Privacy Policy text..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Terms of Service</label>
                        <textarea className="w-full bg-gray-50 p-3 rounded-lg border-2 border-transparent focus:border-black outline-none h-32" value={localSettings.termsText || ''} onChange={(e) => updateField('termsText', e.target.value)} placeholder="Enter Terms of Service text..." />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Policy</label>
                        <textarea className="w-full bg-gray-50 p-3 rounded-lg border-2 border-transparent focus:border-black outline-none h-32" value={localSettings.paymentPolicyText || ''} onChange={(e) => updateField('paymentPolicyText', e.target.value)} placeholder="Enter Payment Policy text..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Return Policy</label>
                        <textarea className="w-full bg-gray-50 p-3 rounded-lg border-2 border-transparent focus:border-black outline-none h-32" value={localSettings.returnPolicyText || ''} onChange={(e) => updateField('returnPolicyText', e.target.value)} placeholder="Enter Return Policy text..." />
                    </div>
                </section>

                <section className="space-y-4">
                    <h4 className="font-bold text-lg border-b pb-2">Payment Gateways</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {localSettings.paymentGateways.map((gw, index) => (
                            <div key={gw.id} className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-200">
                                <div className="flex justify-between items-center">
                                    <h5 className="font-bold flex items-center gap-2">
                                        {gw.id === PaymentMethod.COD && <Banknote size={16}/>}
                                        {gw.id === PaymentMethod.BANK_DEPOSIT && <Landmark size={16}/>}
                                        {gw.id.includes('BASE') && <Wallet size={16}/>}
                                        {gw.nameOverride || gw.id}
                                    </h5>
                                    <label className="flex items-center gap-2 text-sm font-bold cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={gw.enabled} 
                                            onChange={(e) => {
                                                const newGateways = [...localSettings.paymentGateways];
                                                newGateways[index] = { ...newGateways[index], enabled: e.target.checked };
                                                updateField('paymentGateways', newGateways);
                                            }} 
                                            className="w-4 h-4"
                                        />
                                        <span className={gw.enabled ? "text-green-600" : "text-gray-400"}>{gw.enabled ? "Enabled" : "Disabled"}</span>
                                    </label>
                                </div>
                                
                                <input 
                                    className="w-full bg-white p-2 rounded border border-gray-200 text-sm" 
                                    placeholder="Display Name Override"
                                    value={gw.nameOverride || ''}
                                    onChange={(e) => {
                                         const newGateways = [...localSettings.paymentGateways];
                                         newGateways[index] = { ...newGateways[index], nameOverride: e.target.value };
                                         updateField('paymentGateways', newGateways);
                                    }}
                                />

                                <input 
                                    className="w-full bg-white p-2 rounded border border-gray-200 text-sm" 
                                    placeholder="Instructions for customer..."
                                    value={gw.instructions || ''}
                                    onChange={(e) => {
                                         const newGateways = [...localSettings.paymentGateways];
                                         newGateways[index] = { ...newGateways[index], instructions: e.target.value };
                                         updateField('paymentGateways', newGateways);
                                    }}
                                />

                                {gw.id === PaymentMethod.PAYPAL && (
                                    <div>
                                        <input 
                                            className="w-full bg-white p-2 rounded border border-gray-200 text-sm font-mono" 
                                            placeholder="PayPal Client ID"
                                            value={gw.paypalClientId || ''}
                                            onChange={(e) => {
                                                const newGateways = [...localSettings.paymentGateways];
                                                newGateways[index] = { ...newGateways[index], paypalClientId: e.target.value };
                                                updateField('paymentGateways', newGateways);
                                            }}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            Get this from <a href="https://developer.paypal.com/dashboard/applications/live" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">PayPal Developer Dashboard</a>. 
                                            Only <strong>Client ID</strong> is required (not Secret).
                                            <br/>
                                            <span className="text-red-500 font-bold">Note:</span> If testing, use a Sandbox Client ID. If live, use a Live Client ID. Do not mix them.
                                        </p>
                                    </div>
                                )}

                                {gw.id === PaymentMethod.PAYHERE && (
                                    <div className="space-y-2 mt-2 bg-white p-3 rounded border border-gray-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <label className="text-sm font-bold text-gray-700">Environment:</label>
                                            <select 
                                                className="p-1 border rounded text-sm bg-gray-50"
                                                value={gw.payhereEnv || 'sandbox'}
                                                onChange={(e) => {
                                                    const newGateways = [...localSettings.paymentGateways];
                                                    newGateways[index] = { ...newGateways[index], payhereEnv: e.target.value as 'sandbox' | 'live' };
                                                    updateField('paymentGateways', newGateways);
                                                }}
                                            >
                                                <option value="sandbox">Sandbox (Testing)</option>
                                                <option value="live">Live (Production)</option>
                                            </select>
                                        </div>
                                        <input 
                                            className="w-full bg-gray-50 p-2 rounded border border-gray-200 text-sm font-mono" 
                                            placeholder="PayHere Merchant ID"
                                            value={gw.payhereMerchantId || ''}
                                            onChange={(e) => {
                                                const newGateways = [...localSettings.paymentGateways];
                                                newGateways[index] = { ...newGateways[index], payhereMerchantId: e.target.value };
                                                updateField('paymentGateways', newGateways);
                                            }}
                                        />
                                        <input 
                                            className="w-full bg-gray-50 p-2 rounded border border-gray-200 text-sm font-mono" 
                                            placeholder="PayHere Secret"
                                            type="password"
                                            value={gw.payhereSecret || ''}
                                            onChange={(e) => {
                                                const newGateways = [...localSettings.paymentGateways];
                                                newGateways[index] = { ...newGateways[index], payhereSecret: e.target.value };
                                                updateField('paymentGateways', newGateways);
                                            }}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            Get your Merchant ID and Secret from the <a href="https://www.payhere.lk/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">PayHere Dashboard</a>.
                                        </p>
                                    </div>
                                )}

                                {gw.id.includes('BASE') && (
                                     <input 
                                        className="w-full bg-white p-2 rounded border border-gray-200 text-sm font-mono" 
                                        placeholder="Wallet / Contract Address"
                                        value={gw.walletAddress || ''}
                                        onChange={(e) => {
                                            const newGateways = [...localSettings.paymentGateways];
                                            newGateways[index] = { ...newGateways[index], walletAddress: e.target.value };
                                            updateField('paymentGateways', newGateways);
                                        }}
                                    />
                                )}

                                {gw.id === PaymentMethod.BANK_DEPOSIT && (
                                    <div className="grid grid-cols-2 gap-2 mt-2 bg-white p-3 rounded border border-gray-100">
                                        <input className="p-2 border rounded text-sm" placeholder="Bank Name" value={gw.bankDetails?.bankName || ''} onChange={(e) => {
                                             const newGateways = [...localSettings.paymentGateways];
                                             const details = newGateways[index].bankDetails || { bankName: '', accountName: '', accountNumber: '', branch: '' };
                                             newGateways[index] = { ...newGateways[index], bankDetails: { ...details, bankName: e.target.value } };
                                             updateField('paymentGateways', newGateways);
                                        }}/>
                                        <input className="p-2 border rounded text-sm" placeholder="Account Name" value={gw.bankDetails?.accountName || ''} onChange={(e) => {
                                             const newGateways = [...localSettings.paymentGateways];
                                             const details = newGateways[index].bankDetails || { bankName: '', accountName: '', accountNumber: '', branch: '' };
                                             newGateways[index] = { ...newGateways[index], bankDetails: { ...details, accountName: e.target.value } };
                                             updateField('paymentGateways', newGateways);
                                        }}/>
                                        <input className="p-2 border rounded text-sm" placeholder="Account Number" value={gw.bankDetails?.accountNumber || ''} onChange={(e) => {
                                             const newGateways = [...localSettings.paymentGateways];
                                             const details = newGateways[index].bankDetails || { bankName: '', accountName: '', accountNumber: '', branch: '' };
                                             newGateways[index] = { ...newGateways[index], bankDetails: { ...details, accountNumber: e.target.value } };
                                             updateField('paymentGateways', newGateways);
                                        }}/>
                                        <input className="p-2 border rounded text-sm" placeholder="Branch" value={gw.bankDetails?.branch || ''} onChange={(e) => {
                                             const newGateways = [...localSettings.paymentGateways];
                                             const details = newGateways[index].bankDetails || { bankName: '', accountName: '', accountNumber: '', branch: '' };
                                             newGateways[index] = { ...newGateways[index], bankDetails: { ...details, branch: e.target.value } };
                                             updateField('paymentGateways', newGateways);
                                        }}/>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
                
                <section className="space-y-4">
                    <h4 className="font-bold text-lg border-b pb-2">Banners</h4>
                    <div className="bg-gray-50 p-6 rounded-xl">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Middle Banner Title</label>
                        <input className="w-full bg-white p-3 rounded-lg border-2 border-transparent focus:border-black outline-none mb-4" value={localSettings.middleBanner?.title || ''} onChange={(e) => updateField('middleBanner', { title: e.target.value, image: localSettings.middleBanner?.image ?? '', subtitle: localSettings.middleBanner?.subtitle ?? '', linkType: localSettings.middleBanner?.linkType, linkValue: localSettings.middleBanner?.linkValue })} />
                         <ImageUploader label="Middle Banner Image" value={localSettings.middleBanner?.image || ''} onChange={(v) => updateField('middleBanner', { image: v, title: localSettings.middleBanner?.title ?? '', subtitle: localSettings.middleBanner?.subtitle ?? '', linkType: localSettings.middleBanner?.linkType, linkValue: localSettings.middleBanner?.linkValue })} />
                         <LinkInput 
                            linkType={localSettings.middleBanner?.linkType || 'NONE'}
                            linkValue={localSettings.middleBanner?.linkValue || ''}
                            onTypeChange={(t) => updateField('middleBanner', { linkType: t, title: localSettings.middleBanner?.title ?? '', image: localSettings.middleBanner?.image ?? '', subtitle: localSettings.middleBanner?.subtitle ?? '', linkValue: localSettings.middleBanner?.linkValue })}
                            onValueChange={(v) => updateField('middleBanner', { linkValue: v, title: localSettings.middleBanner?.title ?? '', image: localSettings.middleBanner?.image ?? '', subtitle: localSettings.middleBanner?.subtitle ?? '', linkType: localSettings.middleBanner?.linkType })}
                         />
                    </div>
                </section>
            </div>
        </div>
    );
};

export const AdminDashboard: React.FC = () => {
    const { navigateTo, notify } = useShop();
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'orders' | 'reviews' | 'discounts' | 'settings'>('overview');

    useEffect(() => {
        if (!sessionStorage.getItem('admin_token')) {
            navigateTo('LOGIN');
        }
    }, [navigateTo]);

    const handleLogout = () => {
        sessionStorage.removeItem('admin_token');
        notify("Logged out", "info");
        navigateTo('LOGIN');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-gray-100 flex flex-col fixed md:relative z-20 h-auto md:h-screen shadow-sm">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center md:block">
                    <h2 className="text-2xl font-display font-black tracking-tighter">ADMIN.</h2>
                    <button onClick={() => navigateTo('HOME')} className="md:hidden p-2"><X size={24}/></button>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'overview' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}><LayoutDashboard size={20}/> Overview</button>
                    <button onClick={() => setActiveTab('products')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'products' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}><Box size={20}/> Products</button>
                    <button onClick={() => setActiveTab('categories')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'categories' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}><FolderTree size={20}/> Categories</button>
                    <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'orders' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}><ListOrdered size={20}/> Orders</button>
                    <button onClick={() => setActiveTab('reviews')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'reviews' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}><MessageSquare size={20}/> Reviews</button>
                    <button onClick={() => setActiveTab('discounts')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'discounts' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}><Ticket size={20}/> Discounts</button>
                    <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'settings' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}><Settings size={20}/> Settings</button>
                </nav>
                <div className="p-4 border-t border-gray-50">
                     <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors"><LogOut size={20}/> Logout</button>
                     <button onClick={() => navigateTo('HOME')} className="w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 text-gray-500 hover:bg-gray-50 transition-colors mt-2"><ArrowRight size={20}/> Back to Store</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
                <header className="flex justify-between items-center mb-8 md:hidden">
                    <div className="font-bold text-xl uppercase tracking-wider text-gray-400">{activeTab}</div>
                </header>
                {activeTab === 'overview' && <DashboardOverview />}
                {activeTab === 'products' && <ProductManager />}
                {activeTab === 'categories' && <CategoryManager />}
                {activeTab === 'orders' && <OrderManager />}
                {activeTab === 'reviews' && <ReviewManager />}
                {activeTab === 'discounts' && <DiscountCodeManager />}
                {activeTab === 'settings' && <SettingsManager />}
            </main>
        </div>
    );
};
