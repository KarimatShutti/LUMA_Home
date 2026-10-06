import 'react-native-url-polyfill/auto';
import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const PRODUCT_CATALOG = [
  {
    id: 'preview-1',
    category_id: 'living-room',
    category: 'Living Room',
    name: 'Solis Throw Pillow',
    slug: 'solis-throw-pillow',
    description: 'A soft cotton blend in a quiet sand tone, made for layering on the sofa.',
    price: 18500,
    image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1200&q=85',
    stock_quantity: 24,
    material: 'Cotton blend',
    dimensions: '45 × 45 cm',
    colour: 'Sand Beige',
    care_instructions: 'Spot clean gently. Air dry away from direct sunlight.',
    featured: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'preview-2',
    category_id: 'living-room',
    category: 'Living Room',
    name: 'Alba Ceramic Vase',
    slug: 'alba-ceramic-vase',
    description: 'An understated ceramic silhouette that looks just as lovely with a few stems as it does on its own.',
    price: 32000,
    image_url: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1200&q=85',
    stock_quantity: 15,
    material: 'Ceramic',
    dimensions: '24 × 12 cm',
    colour: 'Ivory',
    care_instructions: 'Wipe with a soft, dry cloth. Not intended for food use.',
    featured: true,
    is_active: true,
    created_at: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'preview-5',
    category_id: 'bedroom',
    category: 'Bedroom',
    name: 'Luna Bedside Lamp',
    slug: 'luna-bedside-lamp',
    description: 'A calming ceramic base and softly diffused shade bring warmth to your bedside routine.',
    price: 48000,
    image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85',
    stock_quantity: 12,
    material: 'Ceramic and fabric',
    dimensions: '38 × 20 cm',
    colour: 'Ivory',
    care_instructions: 'Wipe ceramic with a soft cloth. Dust shade regularly.',
    featured: true,
    is_active: true,
    created_at: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'preview-9',
    category_id: 'dining',
    category: 'Dining',
    name: 'Oakley Serving Tray',
    slug: 'oakley-serving-tray',
    description: 'A generous acacia-wood tray for coffee, shared plates and everyday rituals.',
    price: 31500,
    image_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
    stock_quantity: 11,
    material: 'Acacia wood',
    dimensions: '45 × 30 × 5 cm',
    colour: 'Natural Wood',
    care_instructions: 'Hand wipe only. Keep dry and condition wood occasionally.',
    featured: true,
    is_active: true,
    created_at: '2026-01-09T00:00:00.000Z',
  },
  {
    id: 'preview-12',
    category_id: 'lighting',
    category: 'Lighting',
    name: 'Lumi Table Lamp',
    slug: 'lumi-table-lamp',
    description: 'A considered mix of forest green and warm gold, designed to add a softly sculptural glow.',
    price: 58000,
    image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85',
    stock_quantity: 9,
    material: 'Metal and glass',
    dimensions: '40 × 20 cm',
    colour: 'Forest Green / Gold',
    care_instructions: 'Wipe with a soft cloth. Bulb sold separately.',
    featured: true,
    is_active: true,
    created_at: '2026-01-12T00:00:00.000Z',
  },
  {
    id: 'preview-15',
    category_id: 'storage',
    category: 'Storage',
    name: 'Haven Storage Basket',
    slug: 'haven-storage-basket',
    description: 'A woven natural fibre basket that gives throws and everyday belongings a handsome home.',
    price: 26000,
    image_url: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=85',
    stock_quantity: 20,
    material: 'Woven natural fibre',
    dimensions: '40 × 30 × 30 cm',
    colour: 'Natural Beige',
    care_instructions: 'Keep dry. Brush gently to remove dust.',
    featured: true,
    is_active: true,
    created_at: '2026-01-15T00:00:00.000Z',
  },
];

const CURRENCY = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: AsyncStorage,
      },
    })
  : null;

const productMap = Object.fromEntries(PRODUCT_CATALOG.map((product) => [product.id, product]));

function formatMoney(value) {
  return CURRENCY.format(value);
}

function App() {
  const [session, setSession] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) {
      setCart([]);
      return;
    }

    let isMounted = true;

    const loadCart = async () => {
      try {
        const { data: cartId, error: cartError } = await supabase.rpc('ensure_my_cart');
        if (cartError || !cartId) {
          setCart([]);
          return;
        }

        const { data, error } = await supabase
          .from('cart_items')
          .select('id, product_id, quantity')
          .eq('cart_id', cartId);

        if (error) {
          setCart([]);
          return;
        }

        const nextCart = (data ?? [])
          .map((line) => {
            const product = productMap[line.product_id];
            if (!product) return null;
            return { ...line, product, quantity: Number(line.quantity || 0) };
          })
          .filter(Boolean);

        if (isMounted) {
          setCart(nextCart);
        }
      } catch (error) {
        console.error('Cart sync failed', error);
        if (isMounted) {
          setCart([]);
        }
      }
    };

    loadCart();

    const channel = supabase
      .channel('mobile-cart-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart_items' },
        () => {
          loadCart();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
    [cart]
  );

  const handleAuth = async () => {
    if (!supabase) {
      Alert.alert('Supabase not configured', 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to the mobile .env file.');
      return;
    }

    setBusy(true);
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          Alert.alert('Sign in failed', error.message);
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name || 'LUMA Customer' } },
        });

        if (error) {
          Alert.alert('Create account failed', error.message);
        } else {
          Alert.alert('Account created', 'Check your email to confirm the registration.');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCart([]);
  };

  const handleAddToCart = async (product) => {
    if (!supabase || !session?.user) {
      Alert.alert('Sign in required', 'Log in with your LUMA account before saving items to your cart.');
      return;
    }

    try {
      const { data: cartId, error: cartError } = await supabase.rpc('ensure_my_cart');
      if (cartError || !cartId) {
        Alert.alert('Unable to sync cart', 'Your cart could not be opened. Please try again.');
        return;
      }

      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', product.id)
        .maybeSingle();

      const nextQuantity = (existingItem?.quantity ?? 0) + 1;

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: nextQuantity })
          .eq('id', existingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cart_items').insert({
          cart_id: cartId,
          product_id: product.id,
          quantity: 1,
        });
        if (error) throw error;
      }

      Alert.alert('Added to cart', `${product.name} is now in your bag.`);
    } catch (error) {
      Alert.alert('Cart update failed', error?.message || 'Please try again.');
    }
  };

  const handleQuantityUpdate = async (lineId, productId, delta) => {
    if (!supabase || !session?.user) return;

    const current = cart.find((line) => line.id === lineId);
    if (!current) return;

    const nextQuantity = Math.max(0, current.quantity + delta);
    if (nextQuantity === 0) {
      const { error } = await supabase.from('cart_items').delete().eq('id', lineId);
      if (error) Alert.alert('Remove failed', error.message);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: nextQuantity })
      .eq('id', lineId);

    if (error) Alert.alert('Update failed', error.message);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.loadingText}>Loading your LUMA account…</Text>
      </SafeAreaView>
    );
  }

  if (!session?.user) {
    return (
      <SafeAreaView style={styles.authShell}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.authCard}>
          <Text style={styles.brand}>LUMA HOME</Text>
          <Text style={styles.title}>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</Text>
          <Text style={styles.subtitle}>Use the same Supabase account on web and mobile.</Text>

          {authMode === 'signup' && (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              autoCapitalize="words"
              style={styles.input}
            />
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            style={styles.input}
          />

          <Pressable style={styles.primaryButton} onPress={handleAuth} disabled={busy}>
            <Text style={styles.primaryButtonText}>{busy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}</Text>
          </Pressable>

          <Pressable onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
            <Text style={styles.switchText}>
              {authMode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.appShell}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.brand}>LUMA HOME</Text>
        <Pressable onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <Text style={styles.heading}>Shop the edit</Text>
        <Text style={styles.subheading}>Shared auth + synced cart for web and mobile.</Text>

        {PRODUCT_CATALOG.map((product) => {
          const line = cart.find((item) => item.product_id === product.id);
          const quantity = line?.quantity ?? 0;

          return (
            <View key={product.id} style={styles.productCard}>
              <Image source={{ uri: product.image_url }} style={styles.productImage} />
              <View style={styles.productBody}>
                <Text style={styles.productCategory}>{product.category}</Text>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>{formatMoney(product.price)}</Text>
                <Text style={styles.productDescription} numberOfLines={3}>{product.description}</Text>

                <View style={styles.productFooter}>
                  <Pressable style={styles.cartButton} onPress={() => handleAddToCart(product)}>
                    <Text style={styles.cartButtonText}>Add to cart</Text>
                  </Pressable>
                  <Text style={styles.quantityText}>{quantity > 0 ? `${quantity} in bag` : 'No items yet'}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.cartBar}>
        <View>
          <Text style={styles.cartBarLabel}>Your bag</Text>
          <Text style={styles.cartBarTotal}>{formatMoney(subtotal)}</Text>
        </View>

        <View style={styles.cartItemsList}>
          {cart.map((line) => (
            <View key={line.id} style={styles.cartLine}>
              <Text style={styles.cartLineLabel}>{line.product.name}</Text>
              <View style={styles.stepperRow}>
                <Pressable onPress={() => handleQuantityUpdate(line.id, line.product_id, -1)} style={styles.stepperButton}>
                  <Text style={styles.stepperText}>-</Text>
                </Pressable>
                <Text style={styles.stepperValue}>{line.quantity}</Text>
                <Pressable onPress={() => handleQuantityUpdate(line.id, line.product_id, 1)} style={styles.stepperButton}>
                  <Text style={styles.stepperText}>+</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5efe7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authShell: {
    flex: 1,
    backgroundColor: '#f5efe7',
    justifyContent: 'center',
    padding: 24,
  },
  authCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  appShell: {
    flex: 1,
    backgroundColor: '#f5efe7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#f9f4ed',
    borderBottomWidth: 1,
    borderBottomColor: '#efe4da',
  },
  brand: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#1d1d1d',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1d1d1d',
    marginTop: 18,
  },
  subtitle: {
    fontSize: 15,
    color: '#5e5a55',
    marginTop: 8,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd0c5',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
    color: '#1d1d1d',
  },
  primaryButton: {
    backgroundColor: '#1d1d1d',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  switchText: {
    marginTop: 16,
    color: '#7f5348',
    textAlign: 'center',
    fontWeight: '600',
  },
  signOutText: {
    color: '#7f5348',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 16,
    paddingBottom: 18,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1d1d1d',
  },
  subheading: {
    fontSize: 15,
    color: '#5b564f',
    marginTop: 4,
    marginBottom: 18,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee3d7',
  },
  productImage: {
    width: '100%',
    height: 210,
  },
  productBody: {
    padding: 14,
  },
  productCategory: {
    color: '#846953',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  productName: {
    color: '#1d1d1d',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  productPrice: {
    color: '#1d1d1d',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  productDescription: {
    color: '#5b564f',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  cartButton: {
    backgroundColor: '#1d1d1d',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cartButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  quantityText: {
    color: '#5b564f',
    fontSize: 13,
    fontWeight: '600',
  },
  cartBar: {
    backgroundColor: '#1d1d1d',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },
  cartBarLabel: {
    color: '#d7cabf',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cartBarTotal: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  cartItemsList: {
    marginTop: 12,
  },
  cartLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  cartLineLabel: {
    color: '#f3ede7',
    fontSize: 14,
    flex: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperText: {
    color: '#1d1d1d',
    fontSize: 18,
    fontWeight: '700',
  },
  stepperValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1d',
  },
});

export default App;
