// utils/cartId.js
export const generateCartId = () => {
    // Generate a unique cart ID (e.g., using shortUUID or a random string)
    return Math.random().toString(36).substring(2, 15); // Example random ID
  };
  
  export const getCartId = () => {
    // Retrieve the cart ID from localStorage or generate a new one
    let cartId = localStorage.getItem('cartId');
    if (!cartId) {
      cartId = generateCartId();
      localStorage.setItem('cartId', cartId);
    }
    return cartId;
  };