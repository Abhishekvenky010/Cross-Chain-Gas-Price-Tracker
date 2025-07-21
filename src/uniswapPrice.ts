import { useAppStore } from './store';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
const FALLBACK_ETH_USD_PRICE = 3735.87;

export async function fetchEthUsdPrice(): Promise<number> {
  try {
    const response = await fetch(COINGECKO_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const ethUsdPrice = data.ethereum.usd;

    if (!ethUsdPrice || isNaN(ethUsdPrice) || ethUsdPrice === 0) {
      console.warn('CoinGecko price not found or zero, returning fallback value.');
      useAppStore.getState().setPriceError(true);
      return FALLBACK_ETH_USD_PRICE;
    }

    useAppStore.getState().setPriceError(false);
    return ethUsdPrice;
  } catch (err) {
    console.error('Error fetching ETH/USD price from CoinGecko:', err);
    useAppStore.getState().setPriceError(true);
    return FALLBACK_ETH_USD_PRICE;
  }
}

export async function startPriceUpdates() {
  const price = await fetchEthUsdPrice();
  if (price > 0) {
    useAppStore.getState().setUsdPrice(price);
  }

  setInterval(async () => {
    const price = await fetchEthUsdPrice();
    if (price > 0) {
      useAppStore.getState().setUsdPrice(price);
    }
  }, 30000);
}
