
import { Product, Order, OrderStatus, PaymentMethod } from './types';

// Using high-quality reliable images for the initial demo state
// These are direct URLs that work well with the optimization layer
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Neon Cyber Headset',
    price: 12900.00,
    category: 'Electronics',
    description: 'Immersive sound with active noise cancellation and RGB lighting integration.',
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 45,
    reviews: [
      { id: 'r1', user: 'Alex D.', rating: 5, comment: 'Best headset I have ever owned!', date: '2023-10-01' },
      { id: 'r2', user: 'Sam K.', rating: 4, comment: 'Great sound, but a bit heavy.', date: '2023-10-05' }
    ]
  },
  {
    id: 'p2',
    name: 'ErgoMaster Chair',
    price: 34900.00,
    category: 'Furniture',
    description: 'Designed for 24/7 comfort with breathable mesh and lumbar support.',
    images: [
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 12,
    reviews: []
  },
  {
    id: 'p3',
    name: 'Mechanical Keyboard',
    price: 19950.00,
    category: 'Electronics',
    description: 'Tactile switches with a transparent aluminum chassis.',
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b91a603?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 30,
    reviews: []
  },
  {
    id: 'p4',
    name: 'Minimalist Desk Lamp',
    price: 5900.00,
    category: 'Home Decor',
    description: 'Smart ambient lighting that syncs with your circadian rhythm.',
    images: [
      "https://images.unsplash.com/photo-1507473888900-52e1adad5474?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 100,
    reviews: []
  },
  {
    id: 'p5',
    name: 'Obsidian Chronograph',
    price: 45000.00,
    category: 'Fashion',
    description: 'Precision engineered automatic movement with sapphire crystal.',
    images: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 5,
    isTrending: true,
    colors: ['#000000', '#C0C0C0'],
    reviews: []
  },
  {
    id: 'p6',
    name: 'Streetwear Bomber',
    price: 15500.00,
    category: 'Fashion',
    description: 'Classic oversized fit with premium nylon fabric.',
    images: [
        "https://images.unsplash.com/photo-1551028919-3016477a29bf?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 20,
    isTrending: true,
    sizes: ['M', 'L', 'XL'],
    reviews: []
  },
  {
    id: 'p7',
    name: 'Limited Sneakers',
    price: 28000.00,
    category: 'Fashion',
    description: 'High-top sneakers with limited edition colorway.',
    images: [
        "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1000&auto=format&fit=crop"
    ],
    stock: 8,
    isTrending: true,
    sizes: ['42', '43', '44'],
    reviews: []
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-7782',
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    address: '123 Tech Lane, Silicon Valley',
    items: [
      { ...INITIAL_PRODUCTS[0], quantity: 1 }
    ],
    total: 12900.00,
    status: OrderStatus.SHIPPED,
    paymentMethod: PaymentMethod.BASE_ETH,
    date: '2023-10-25'
  },
  {
    id: 'ORD-9921',
    customerName: 'John Smith',
    customerEmail: 'john@example.com',
    address: '456 Innovation Blvd, Austin',
    items: [
      { ...INITIAL_PRODUCTS[2], quantity: 2 }
    ],
    total: 39900.00,
    status: OrderStatus.PENDING,
    paymentMethod: PaymentMethod.COD,
    date: '2023-10-26'
  }
];
