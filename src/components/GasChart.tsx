"use client";

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';
import { useAppStore, Chain } from '../store';

interface GasCandlestick {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

const ONE_MINUTE = 60 * 1000; // 1 minute in milliseconds

function aggregateGasData(history: Array<{ timestamp: number; baseFee: number }>): GasCandlestick[] {
  if (history.length === 0) return [];

  const aggregated: Record<number, { prices: number[]; open: number }> = {};
  
  history.forEach((point) => {
    const intervalStart = Math.floor(point.timestamp / ONE_MINUTE) * ONE_MINUTE;
    
    if (!aggregated[intervalStart]) {
      aggregated[intervalStart] = { prices: [], open: point.baseFee };
    }
    
    aggregated[intervalStart].prices.push(point.baseFee);
  });

  return Object.entries(aggregated).map(([timestamp, data]) => {
    const prices = data.prices;
    return {
      time: (parseInt(timestamp) / 1000) as Time, // Convert to seconds for chart
      open: data.open,
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
    };
  });
}

const GasChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  
  const chains = useAppStore((s) => s.chains);
  const selectedChain = useAppStore((s) => s.selectedChain);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: '#1a1a1a' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2B2B43' },
        horzLines: { color: '#2B2B43' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#2B2B43',
      },
      timeScale: {
        borderColor: '#2B2B43',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create candlestick series
    const candlestickSeriesInstance = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeriesInstance;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;

    const chainData = chains[selectedChain as Chain];
    const candlestickData = aggregateGasData(chainData.history);
    
    if (candlestickData.length > 0) {
      (seriesRef.current as ISeriesApi<'Candlestick'>).setData(candlestickData);
    }
  }, [chains, selectedChain]);

  return (
    <div style={{ background: '#111', color: '#fff', padding: 16, borderRadius: 8 }}>
      <h2>Gas Price Chart - {selectedChain.charAt(0).toUpperCase() + selectedChain.slice(1)}</h2>
      <div ref={chartContainerRef} style={{ height: 300 }} />
    </div>
  );
}

export default React.memo(GasChart); 