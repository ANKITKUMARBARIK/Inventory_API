const generateFinalPrice = (price, discount) => {
    return Math.round(price - (price * discount) / 100);
};

export default generateFinalPrice;
