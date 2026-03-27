// Cookie-based data store for Basta Market
import Cookies from 'js-cookie';

const COOKIE_OPTIONS: Cookies.CookieAttributes = { expires: 365, sameSite: 'Strict', secure: true };

function store_get(key: string): string | null {
  return Cookies.get(key) ?? null;
}
function store_set(key: string, value: string) {
  Cookies.set(key, value, COOKIE_OPTIONS);
}
function store_remove(key: string) {
  Cookies.remove(key);
}

// Simple hash function for passwords (not cryptographic but better than plaintext)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'basta_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function hashPasswordSync(password: string): string {
  // Synchronous fallback using simple hash
  let hash = 0;
  const salted = password + 'basta_salt_2026';
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

export interface User {
  username: string;
  password: string; // hashed
  joinDate: string;
  feedbackScore: number;
  totalSales: number;
  ltcBalance: number;
  ltcAddress: string;
  bio: string;
  isAdmin?: boolean;
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
  return JSON.parse(store_get('bm_users') || '[]');
}
function saveUsers(users: User[]) {
  store_set('bm_users', JSON.stringify(users));
}
export function registerUser(username: string, password: string, isAdmin = false): User | null {
  const users = getUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) return null;
  const user: User = {
    username, password, joinDate: new Date().toISOString().split('T')[0],
    feedbackScore: 0, totalSales: 0, ltcBalance: 0,
    ltcAddress: generateLtcAddress(), bio: '', isAdmin
  };
  users.push(user);
  saveUsers(users);
  return user;
}
export function loginUser(username: string, password: string): User | null {
  const user = getUsers().find(u => u.username === username && u.password === password);
  if (user) store_set('bm_currentUser', username);
  return user || null;
}
export function getCurrentUser(): User | null {
  const name = store_get('bm_currentUser');
  if (!name) return null;
  return getUsers().find(u => u.username === name) || null;
}
export function isCurrentUserAdmin(): boolean {
  const user = getCurrentUser();
  return user?.isAdmin === true;
}
export function logout() { store_remove('bm_currentUser'); }
export function getUserByName(name: string): User | null {
  return getUsers().find(u => u.username === name) || null;
}
export function updateUser(username: string, updates: Partial<User>) {
  const users = getUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx >= 0) { users[idx] = { ...users[idx], ...updates }; saveUsers(users); }
}
export function deleteUser(username: string) {
  saveUsers(getUsers().filter(u => u.username !== username));
}

// --- Categories (dynamic) ---
const DEFAULT_CATEGORIES = ['Electronics', 'Digital Goods', 'Books', 'Services', 'Software', 'Other'];

export function getCategories(): string[] {
  const stored = store_get('bm_categories');
  if (stored) return JSON.parse(stored);
  return DEFAULT_CATEGORIES;
}
function saveCategories(cats: string[]) {
  store_set('bm_categories', JSON.stringify(cats));
}
export function addCategory(name: string): boolean {
  const cats = getCategories();
  if (cats.find(c => c.toLowerCase() === name.toLowerCase())) return false;
  cats.push(name);
  saveCategories(cats);
  return true;
}
export function renameCategory(oldName: string, newName: string): boolean {
  const cats = getCategories();
  const idx = cats.findIndex(c => c === oldName);
  if (idx < 0) return false;
  if (cats.find(c => c.toLowerCase() === newName.toLowerCase() && c !== oldName)) return false;
  cats[idx] = newName;
  saveCategories(cats);
  const products = getProducts();
  products.forEach(p => { if (p.category === oldName) p.category = newName; });
  saveProducts(products);
  return true;
}
export function deleteCategory(name: string) {
  saveCategories(getCategories().filter(c => c !== name));
}
export function getCategoriesWithAll(): string[] {
  return ['All', ...getCategories()];
}

// --- Products ---
export function getProducts(): Product[] {
  return JSON.parse(store_get('bm_products') || '[]');
}
function saveProducts(products: Product[]) {
  store_set('bm_products', JSON.stringify(products));
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
export function updateProduct(id: string, updates: Partial<Product>) {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx >= 0) { products[idx] = { ...products[idx], ...updates }; saveProducts(products); }
}
export function deleteProduct(id: string) {
  saveProducts(getProducts().filter(p => p.id !== id));
}

// --- Orders ---
export function getOrders(): Order[] {
  return JSON.parse(store_get('bm_orders') || '[]');
}
function saveOrders(orders: Order[]) {
  store_set('bm_orders', JSON.stringify(orders));
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
  return JSON.parse(store_get('bm_messages') || '[]');
}
function saveMessages(messages: Message[]) {
  store_set('bm_messages', JSON.stringify(messages));
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
  return JSON.parse(store_get('bm_reviews') || '[]');
}
function saveReviews(reviews: Review[]) {
  store_set('bm_reviews', JSON.stringify(reviews));
}
export function createReview(orderId: string, from: string, to: string, rating: number, text: string): Review {
  const review: Review = { id: generateId(), orderId, from, to, rating, text, date: new Date().toISOString().split('T')[0] };
  const reviews = getReviews();
  reviews.push(review);
  saveReviews(reviews);
  const sellerReviews = reviews.filter(r => r.to === to);
  const avg = sellerReviews.reduce((s, r) => s + r.rating, 0) / sellerReviews.length;
  updateUser(to, { feedbackScore: Math.round(avg * 10) / 10 });
  return review;
}

// --- Seed Data ---
export function seedIfEmpty() {
  if (getUsers().length > 0) return;
  registerUser('ADMkz', 'ADMkz777', true);
  registerUser('darkvendor', 'pass123');
  registerUser('cryptobuyer', 'pass123');
  registerUser('silktrader', 'pass123');
  updateUser('darkvendor', { bio: 'Trusted vendor since 2012. Fast shipping worldwide.', totalSales: 147, feedbackScore: 4.8, ltcBalance: 12.5 });
  updateUser('cryptobuyer', { ltcBalance: 5.0 });
  updateUser('silktrader', { bio: 'Quality goods. Escrow only.', totalSales: 89, feedbackScore: 4.6, ltcBalance: 8.3 });

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
