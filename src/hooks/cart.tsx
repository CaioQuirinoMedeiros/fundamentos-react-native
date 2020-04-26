import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const PRODUCTS_KEY = '@GoMarketplace:products';

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStorage = await AsyncStorage.getItem(PRODUCTS_KEY);

      if (productsStorage) {
        setProducts(JSON.parse(productsStorage));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(newProducts);

      await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products
        .map(product =>
          product.id === id
            ? {
                ...product,
                quantity:
                  product.quantity > 0
                    ? product.quantity - 1
                    : product.quantity,
              }
            : product,
        )
        .filter(product => !!product.quantity);

      setProducts(newProducts);

      await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts));
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const alreadyOnCart = products.find(prod => prod.id === product.id);

      if (alreadyOnCart) {
        increment(product.id);
      } else {
        setProducts(oldProducts => [
          ...oldProducts,
          { ...product, quantity: 1 },
        ]);
      }

      await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    },
    [increment, products],
  );

  const value = React.useMemo(() => {
    return { addToCart, increment, decrement, products };
  }, [products, addToCart, increment, decrement]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
