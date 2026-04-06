
export enum PaymentMethod {
  COD = 'Cash on Delivery',
  BANK_DEPOSIT = 'Bank Deposit',
  PAYPAL = 'PayPal',
  PAYHERE = 'PayHere',
  BASE_ETH = 'Base ETH',
  BASE_USDC = 'Base USDC',
  BASE_USDT = 'Base USDT',
  KOKO = 'Koko',
  INSTALLMENTS = 'Installments'
}

export enum OrderStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled'
}

export interface Review {
  id: string;
  user: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string; // If present, this is a sub-category
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number; // New: Discounted Price
  category: string; 
  subCategory?: string; 
  description: string;
  images: string[];
  video?: string;
  colors?: string[];
  sizes?: string[];
  tags?: string[];
  reviews: Review[];
  stock: number;
  isTrending?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface DiscountCode {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  isActive: boolean;
  minOrderAmount?: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  contactNumber?: string;
  address: string;
  items: CartItem[];
  total: number;
  subtotal?: number;
  deliveryCharge?: number;
  discountApplied?: number;
  discountCode?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  transactionHash?: string;
  date: string;
}

export interface SalesData {
  name: string;
  sales: number;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
}

export interface PaymentGatewayConfig {
  id: PaymentMethod;
  enabled: boolean;
  nameOverride?: string;
  walletAddress?: string; 
  paypalClientId?: string;
  payhereMerchantId?: string;
  payhereSecret?: string;
  payhereEnv?: 'sandbox' | 'live';
  kokoMerchantId?: string;
  installmentProvider?: string;
  bankDetails?: BankDetails;
  instructions?: string;
}

export type PaymentGateway = PaymentGatewayConfig;

// Banner Linking Types
export type LinkType = 'NONE' | 'PRODUCT' | 'CATEGORY';

export interface HeroBanner {
  title: string;
  subtitle: string;
  image: string;
  backgroundColor?: string;
  linkType?: LinkType;
  linkValue?: string; 
}

export interface SiteSettings {
  id?: string;
  
  // Brand Identity
  siteLogo?: string;
  siteLogoDark?: string;
  siteFavicon?: string;
  
  heroTitle: string; 
  heroSubtitle: string; 
  heroImage: string; 
  heroBanners: HeroBanner[];
  
  bannerTitle: string;
  bannerText: string;
  
  // Contact & Legal
  contactEmail: string;
  contactPhone?: string;
  contactAddress?: string;
  privacyText?: string;
  termsText?: string;
  paymentPolicyText?: string;
  returnPolicyText?: string; // New

  // Finance
  deliveryCharge?: number;
  paymentGateways: PaymentGatewayConfig[];
  discountCodes?: DiscountCode[];

  // Section Content
  middleBanner?: {
    image: string;
    title: string;
    subtitle: string;
    linkType?: LinkType;
    linkValue?: string;
  };
  watchSection?: {
    image: string;
    title: string;
    linkType?: LinkType;
    linkValue?: string;
  };
  watchSectionProductIds?: string[]; 
  
  fashionSection?: {
    image: string;
    title: string;
    subtitle: string;
    lookbookText?: string;
    linkType?: LinkType;
    linkValue?: string;
  };
  bentoGrid?: {
    largeImage: string;
    largeTitle: string;
    largeLinkType?: LinkType;
    largeLinkValue?: string;

    topImage: string;
    topTitle: string;
    topLinkType?: LinkType;
    topLinkValue?: string;

    bottomImage: string;
    bottomTitle: string;
    bottomLinkType?: LinkType;
    bottomLinkValue?: string;
  };
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

declare global {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      providers?: any[];
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      send?: (method: string, params?: any[]) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
    payhere: {
      onCompleted: (orderId: string) => void;
      onDismissed: () => void;
      onError: (error: string) => void;
      startPayment: (payment: any) => void;
    };
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
