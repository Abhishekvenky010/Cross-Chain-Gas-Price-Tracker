import { WebSocketProvider, ethers } from 'ethers';
import { useAppStore, Chain } from './store';

const RPC_URLS: Record<Chain, string> = {
  ethereum: process.env.NEXT_PUBLIC_INFURA_WSS_URL || 'wss://mainnet.infura.io/ws/v3/6a19cdd5cc1943dba2ca9d1545bb83af',
  polygon: process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_WSS_URL || 'wss://polygon-mainnet.g.alchemy.com/v2/demo',
  arbitrum: process.env.NEXT_PUBLIC_ALCHEMY_ARBITRUM_WSS_URL || 'wss://arb-mainnet.g.alchemy.com/v2/demo',
};

const NODE_INTERFACE_ADDRESS = '0x00000000000000000000000000000000000000C8';
const NodeInterface__factory = new ethers.Interface([
  'function gasEstimateComponents(address to, bool contractCreation, bytes calldata data) external view returns (uint64 gasEstimate, uint64 gasEstimateForL1, uint256 baseFee, uint256 l1BaseFeeEstimate)',
]);

const providers: Partial<Record<Chain, WebSocketProvider>> = {};
const intervalIds: Partial<Record<Chain, NodeJS.Timeout>> = {};

export function startGasEngine() {
  (['ethereum', 'polygon', 'arbitrum'] as Chain[]).forEach((chain) => {
    if (providers[chain]) return; // Already started

    const provider = new WebSocketProvider(RPC_URLS[chain]);
    providers[chain] = provider;

    provider.on('error', (err) => {
      console.error(`[${chain}] WebSocket Provider error:`, err);
    });

    // Fetch gas data every 6 seconds
    const intervalId = setInterval(async () => {
      try {
        const block = await provider.getBlock('latest');
        if (!block) {
          console.warn(`[${chain}] Block data is null`);
          return;
        }

        let baseFee = 0;
        let priorityFee = 0;

        if (chain === 'ethereum' || chain === 'polygon') {
          baseFee = Number(block?.baseFeePerGas) / 1e9; // Gwei
          priorityFee = 2; // Gwei, placeholder
        } else if (chain === 'arbitrum') {
          const nodeInterface = new ethers.Contract(NODE_INTERFACE_ADDRESS, NodeInterface__factory, provider);
          const gasComponents = await nodeInterface.gasEstimateComponents(
            '0x0000000000000000000000000000000000000000',
            false,
            '0x'
          );
          baseFee = Number(gasComponents.baseFee) / 1e9;
          priorityFee = 0;
        }

        useAppStore.getState().updateChain(chain, { baseFee, priorityFee });
        useAppStore.getState().addGasPoint(chain, {
          timestamp: Date.now(),
          baseFee,
          priorityFee,
        });

      } catch (error) {
        console.error(`[${chain}] Failed to fetch latest block:`, error);
      }
    }, 6000);

    intervalIds[chain] = intervalId;
  });
}
