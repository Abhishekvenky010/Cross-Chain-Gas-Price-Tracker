"use client";

import { useAppStore, Chain } from '../store';
import React, { useEffect, useMemo } from 'react';
import { startGasEngine } from '../gasEngine';
import GasChart from '../components/GasChart';
import { startPriceUpdates } from '../uniswapPrice';
import SimulationForm from '../components/SimulationForm';

const chainDisplayName: Record<Chain, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum',
};

const GasWidget: React.FC = () => {
  const chains = useAppStore((s) => s.chains);
  const usdPrice = useAppStore((s) => s.usdPrice);
  const priceError = useAppStore((s) => s.priceError);

  const gasData = useMemo(() => {
    return (['ethereum', 'polygon', 'arbitrum'] as const).map((chain) => ({
      name: chainDisplayName[chain],
      baseFee: chains[chain].baseFee,
      priorityFee: chains[chain].priorityFee,
    }));
  }, [chains]);

  return (
    <div style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Gas Widgets</h2>
      {priceError && (
        <div style={{ color: 'red', marginBottom: 8 }}>
          <b>Warning:</b> Could not fetch live ETH/USD price. Using a fallback value.
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: 'green' }}>ETH/USD Price: ${usdPrice.toFixed(2)}</span>
      </div>
      <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 4 }}>Chain</th>
            <th style={{ textAlign: 'right', padding: 4 }}>Base Fee (Gwei)</th>
            <th style={{ textAlign: 'right', padding: 4 }}>Priority Fee (Gwei)</th>
          </tr>
        </thead>
        <tbody>
          {gasData.map((chain) => (
            <tr key={chain.name}>
              <td style={{ padding: 4 }}>{chain.name}</td>
              <td style={{ textAlign: 'right', padding: 4 }}>{chain.baseFee.toFixed(2)}</td>
              <td style={{ textAlign: 'right', padding: 4 }}>{chain.priorityFee.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MemoizedGasWidget = React.memo(GasWidget);

export default function DashboardPage() {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const selectedChain = useAppStore((s) => s.selectedChain);
  const setSelectedChain = useAppStore((s) => s.setSelectedChain);
  const priceError = useAppStore((s) => s.priceError);

  useEffect(() => {
    if (mode === 'live') {
      startGasEngine();
      startPriceUpdates();
    }
  }, [mode]);

  return (
    <main style={{ padding: 24, backgroundColor: '#111', color: '#fff', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1>Cross-Chain Gas Price Tracker</h1>
        {priceError && (
          <p style={{ color: 'red' }}>
            <b>Live price data is currently unavailable. Please check your network connection and browser settings.</b>
          </p>
        )}
        <p style={{ color: 'orange' }}>
          <b>Note:</b> This application uses public RPC endpoints. For a more reliable experience, please use your own API keys in a <code>.env.local</code> file.
        </p>
      </header>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div style={{ background: '#333', padding: 8, borderRadius: 8 }}>
          <button onClick={() => setMode('live')} style={{ background: mode === 'live' ? '#555' : 'transparent', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Live</button>
          <button onClick={() => setMode('simulation')} style={{ background: mode === 'simulation' ? '#555' : 'transparent', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Simulation</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        <div>
          <MemoizedGasWidget />
          {mode === 'simulation' && <SimulationForm />}
        </div>
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ marginRight: 8 }}>Select Chain:</label>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value as Chain)}
              style={{ padding: 4, borderRadius: 4, marginRight: 16, background: '#333', color: '#fff', border: '1px solid #555' }}
            >
              {Object.entries(chainDisplayName).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
          <GasChart />
        </div>
      </div>
    </main>
  );
}
