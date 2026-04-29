function CartId() {
    const generateRandomString = () => {
      const length = 6;
      const characters = "1234567890";
      let randomString = "";
  
      for(let i = 0; i < length; i++){
          const randomIndex = Math.floor(Math.random() * characters.length) 
          randomString += characters.charAt(randomIndex)
      }
  
      return randomString;
    };
  
    const existingRandomString = localStorage.getItem("randomString");
  
    if(!existingRandomString){
      const newId = generateRandomString();
      localStorage.setItem('randomString', newId);
      return newId;
    } else {
      return existingRandomString;
    }
  }
  
  export default CartId;
  