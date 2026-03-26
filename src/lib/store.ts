// localStorage-based data store for Basta Market

export interface User {
  username: string;
  password: string;
  joinDate: string;
  feedbackScore: number;
  totalSales: number;
  ltcBalance: number;
  ltcAddress: string;
  bio: string;
}

export interface Product {
  id: string;
  seller: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  shipping: string;
  createdAt: string;
  active: boolean;
}

export interface Order {
  id: string;
  productId: string;
  productTitle: string;
  buyer: string;
  seller: string;
  price: number;
  status: 'escrow' | 'shipped' | 'completed' | 'disputed';
  createdAt: string;
  completedAt?: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
}

export interface Review {
  id: string;
  orderId: string;
  from: string;
  to: string;
  rating: number;
  text: string;
  date: string;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function generateLtcAddress(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let addr = 'L';
  for (let i = 0; i < 33; i++) addr += chars[Math.floor(Math.random() * chars.length)];
  return addr;
}

// --- Users ---
export function getUsers(): User[] {
  return JSON.parse(localStorage.getItem('bm_users') || '[]');
}
function saveUsers(users: User[]) {
  localStorage.setItem('bm_users', JSON.stringify(users));
}
export function registerUser(username: string, password: string): User | null {
  const users = getUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) return null;
  const user: User = {
    username, password, joinDate: new Date().toISOString().split('T')[0],
    feedbackScore: 0, totalSales: 0, ltcBalance: 0,
    ltcAddress: generateLtcAddress(), bio: ''
  };
  users.push(user);
  saveUsers(users);
  return user;
}
export function loginUser(username: string, password: string): User | null {
  const user = getUsers().find(u => u.username === username && u.password === password);
  if (user) localStorage.setItem('bm_currentUser', username);
  return user || null;
}
export function getCurrentUser(): User | null {
  const name = localStorage.getItem('bm_currentUser');
  if (!name) return null;
  return getUsers().find(u => u.username === name) || null;
}
export function logout() { localStorage.removeItem('bm_currentUser'); }
export function getUserByName(name: string): User | null {
  return getUsers().find(u => u.username === name) || null;
}
export function updateUser(username: string, updates: Partial<User>) {
  const users = getUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx >= 0) { users[idx] = { ...users[idx], ...updates }; saveUsers(users); }
}

// --- Products ---
export function getProducts(): Product[] {
  return JSON.parse(localStorage.getItem('bm_products') || '[]');
}
function saveProducts(products: Product[]) {
  localStorage.setItem('bm_products', JSON.stringify(products));
}
export function createProduct(p: Omit<Product, 'id' | 'createdAt' | 'active'>): Product {
  const products = getProducts();
  const product: Product = { ...p, id: generateId(), createdAt: new Date().toISOString().split('T')[0], active: true };
  products.push(product);
  saveProducts(products);
  return product;
}
export function getProductById(id: string): Product | null {
  return getProducts().find(p => p.id === id) || null;
}
export function deleteProduct(id: string) {
  saveProducts(getProducts().filter(p => p.id !== id));
}

// --- Orders ---
export function getOrders(): Order[] {
  return JSON.parse(localStorage.getItem('bm_orders') || '[]');
}
function saveOrders(orders: Order[]) {
  localStorage.setItem('bm_orders', JSON.stringify(orders));
}
export function createOrder(productId: string, buyer: string): Order | null {
  const product = getProductById(productId);
  if (!product) return null;
  const buyerUser = getUserByName(buyer);
  if (!buyerUser || buyerUser.ltcBalance < product.price) return null;
  updateUser(buyer, { ltcBalance: buyerUser.ltcBalance - product.price });
  const order: Order = {
    id: generateId(), productId, productTitle: product.title,
    buyer, seller: product.seller, price: product.price,
    status: 'escrow', createdAt: new Date().toISOString().split('T')[0]
  };
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
  return order;
}
export function updateOrderStatus(orderId: string, status: Order['status']) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx >= 0) {
    orders[idx].status = status;
    if (status === 'completed') {
      orders[idx].completedAt = new Date().toISOString().split('T')[0];
      const seller = getUserByName(orders[idx].seller);
      if (seller) {
        updateUser(seller.username, {
          ltcBalance: seller.ltcBalance + orders[idx].price,
          totalSales: seller.totalSales + 1
        });
      }
    }
    saveOrders(orders);
  }
}

// --- Messages ---
export function getMessages(): Message[] {
  return JSON.parse(localStorage.getItem('bm_messages') || '[]');
}
function saveMessages(messages: Message[]) {
  localStorage.setItem('bm_messages', JSON.stringify(messages));
}
export function sendMessage(from: string, to: string, subject: string, body: string): Message {
  const msg: Message = { id: generateId(), from, to, subject, body, date: new Date().toISOString().split('T')[0], read: false };
  const messages = getMessages();
  messages.push(msg);
  saveMessages(messages);
  return msg;
}
export function markMessageRead(id: string) {
  const msgs = getMessages();
  const idx = msgs.findIndex(m => m.id === id);
  if (idx >= 0) { msgs[idx].read = true; saveMessages(msgs); }
}

// --- Reviews ---
export function getReviews(): Review[] {
  return JSON.parse(localStorage.getItem('bm_reviews') || '[]');
}
function saveReviews(reviews: Review[]) {
  localStorage.setItem('bm_reviews', JSON.stringify(reviews));
}
export function createReview(orderId: string, from: string, to: string, rating: number, text: string): Review {
  const review: Review = { id: generateId(), orderId, from, to, rating, text, date: new Date().toISOString().split('T')[0] };
  const reviews = getReviews();
  reviews.push(review);
  saveReviews(reviews);
  // update seller feedback
  const sellerReviews = reviews.filter(r => r.to === to);
  const avg = sellerReviews.reduce((s, r) => s + r.rating, 0) / sellerReviews.length;
  updateUser(to, { feedbackScore: Math.round(avg * 10) / 10 });
  return review;
}

// --- Seed Data ---
export function seedIfEmpty() {
  if (getUsers().length > 0) return;
  registerUser('darkvendor', 'pass123');
  registerUser('cryptobuyer', 'pass123');
  registerUser('silktrader', 'pass123');
  updateUser('darkvendor', { bio: 'Trusted vendor since 2012. Fast shipping worldwide.', totalSales: 147, feedbackScore: 4.8, ltcBalance: 12.5 });
  updateUser('cryptobuyer', { ltcBalance: 5.0 });
  updateUser('silktrader', { bio: 'Quality goods. Escrow only.', totalSales: 89, feedbackScore: 4.6, ltcBalance: 8.3 });

  const categories = ['Electronics', 'Digital Goods', 'Books', 'Services', 'Software', 'Other'];
  const sampleProducts = [
    { seller: 'darkvendor', title: 'VPN Lifetime License', description: 'Premium VPN service. No logs. Lifetime access. Supports all platforms.', price: 0.15, category: 'Software', image: '', shipping: 'Digital delivery - instant' },
    { seller: 'darkvendor', title: 'USB Hardware Wallet', description: 'Cold storage wallet for your crypto. Brand new, sealed. Ships worldwide.', price: 0.85, category: 'Electronics', image: '', shipping: 'Worldwide - 5-14 days' },
    { seller: 'silktrader', title: 'eBook Collection - Privacy Guide', description: '50+ eBooks on digital privacy, OPSEC, and anonymity. PDF format.', price: 0.05, category: 'Books', image: '', shipping: 'Digital delivery' },
    { seller: 'silktrader', title: 'Dedicated Server - 1 Month', description: 'Offshore dedicated server. 4 cores, 16GB RAM, 1TB SSD. Bulletproof hosting.', price: 1.2, category: 'Services', image: '', shipping: 'Setup within 24h' },
    { seller: 'darkvendor', title: 'Raspberry Pi 3 Bundle', description: 'RPi 3 + case + SD card + power supply. Perfect for Tor relay.', price: 0.45, category: 'Electronics', image: '', shipping: 'Worldwide - 7-21 days' },
    { seller: 'silktrader', title: 'Custom Code Review', description: 'Professional security audit of your code. Up to 5000 lines.', price: 0.3, category: 'Services', image: '', shipping: 'Delivered via encrypted message' },
  ];
  sampleProducts.forEach(p => createProduct(p));
}

export const CATEGORIES = ['All', 'Electronics', 'Digital Goods', 'Books', 'Services', 'Software', 'Other'];
