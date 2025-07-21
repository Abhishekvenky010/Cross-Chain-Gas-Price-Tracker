import { useMemo, useState } from "react";
import { useAppStore } from "../store";
import { formatUSD } from "../lib/utils";

type Chain = "ethereum" | "polygon" | "arbitrum";
type TransactionType = "eth" | "matic" | "eth-arb";

interface SimulationResult {
  chain: Chain;
  valueInToken: number;
  gasCostUSD: number;
  totalCostUSD: number;
}

const GasSimulator = () => {
  const [transactionValue, setTransactionValue] = useState("");
  const [transactionType, setTransactionType] = useState<TransactionType>("eth");

  const chains = useAppStore((state) => state.chains);
  const usdPrice = useAppStore((state) => state.usdPrice);

  const results = useMemo(() => {
    if (!transactionValue || parseFloat(transactionValue) <= 0 || !usdPrice || usdPrice === 0) return [];

    const value = parseFloat(transactionValue);
    const gasLimit = 21000; // Standard ETH transfer gas limit

    const chainsToSimulate: Chain[] = ({
      eth: ["ethereum"],
      matic: ["polygon"],
      "eth-arb": ["arbitrum"],
    } as Record<TransactionType, Chain[]>)[transactionType];

    return chainsToSimulate
      .map((chain) => {
        const chainData = chains[chain];
        if (!chainData || chainData.baseFee === undefined || chainData.priorityFee === undefined) {
          return null;
        }

        const baseFee = chainData.baseFee;
        const priorityFee = chainData.priorityFee;
        const gasPriceGwei = baseFee + priorityFee;
        const gasCostInNative = (gasPriceGwei * gasLimit) / 1e9; // Convert Gwei to ETH/MATIC
        const gasCostInUSD = gasCostInNative * usdPrice;
        const totalCostUSD = value + gasCostInUSD; // Assuming transactionValue is in USD

        return {
          chain,
          valueInToken: value,
          gasCostUSD: gasCostInUSD,
          totalCostUSD,
        };
      })
      .filter(Boolean) as SimulationResult[];
  }, [transactionValue, chains, usdPrice, transactionType]);

  return (
    <div style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 8, marginTop: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Gas Simulator</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="number"
          placeholder="Enter transaction value (USD)"
          style={{ padding: 8, borderRadius: 4, border: '1px solid #555', background: '#333', color: '#fff', width: '100%' }}
          value={transactionValue}
          onChange={(e) => setTransactionValue(e.target.value)}
        />
        <select
          style={{ padding: 8, borderRadius: 4, border: '1px solid #555', background: '#333', color: '#fff' }}
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value as TransactionType)}
        >
          <option value="eth">ETH</option>
          <option value="matic">MATIC</option>
          <option value="eth-arb">ETH (Arbitrum)</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {results.map((result) => (
          <div key={result.chain} style={{ background: '#333', padding: 16, borderRadius: 8 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'capitalize' }}>{result.chain}</div>
            <div>Value: {formatUSD(result.valueInToken)}</div>
            <div>Gas Cost: {formatUSD(result.gasCostUSD)}</div>
            <div style={{ fontWeight: 'semibold' }}>
              Total: {formatUSD(result.totalCostUSD)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GasSimulator;
