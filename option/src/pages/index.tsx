import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useEffect, useState } from 'react';
import { useAccount, useConfig, useReadContract, useWriteContract } from 'wagmi';
import { readContract } from '@wagmi/core';
import { ethers } from 'ethers';
// import { LocalMessageDuplexStream } from '@types/node';

import detectEthereumProvider from '@metamask/detect-provider';

import ABI20 from '../erc20abi.json'
import ABI from '../abi.json'
import { constants } from 'buffer';

import { initializeProvider } from '@metamask/providers';


import React from "react";
import ReactDOM from "react-dom/server"
import App from "./App";
import { MetaMaskProvider } from "@metamask/sdk-react";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <MetaMaskProvider
      debug={false}
      sdkOptions={{
        dappMetadata: {
          name: "Example React Dapp",
          url: window.location.href,
        },
        infuraAPIKey: process.env.INFURA_API_KEY,
        // Other options.
      }}
    >
      <App />
    </MetaMaskProvider>
  </React.StrictMode>
);

// Create a stream to a remote provider:
// const metamaskStream = new LocalMessageDuplexStream({
//   name: 'inpage',
//   target: 'contentscript',
// });

// this will initialize the provider and set it as window.ethereum
// initializeProvider({
//   // connectionStream: metamaskStream,
// });

// const { ethereum } = window;


const detectedProvider = detectEthereumProvider();
console.log(detectedProvider);

const contractAddress = '0xf2332452f1e900dfcc96fe2296b2260a855e0046'

// ERC20 ABI (only including balanceOf function)
// const provider = new ethers.JsonRpcProvider("https://rpc-evm-sidechain.xrpl.org/");
const provider = new ethers.BrowserProvider(window.ethereum);

const getTokenBalance = async (userAddress: string, tokenAddress: string): Promise<string> => {
  try {

    const signer = provider.getSigner();

    const contract = new ethers.Contract(tokenAddress, ABI20, provider);
    console.log(userAddress)
    console.log(tokenAddress)
    // Try to get decimals
    let decimals = 18;
    // try {
    //   decimals = await contract.decimals();
    // } catch (error) {
    //   console.warn(`Could not fetch decimals for token ${tokenAddress}, using default of 18.`);
    // }

    // Get balance
    const balance = await contract.balanceOf(userAddress);
    console.log("balance");
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Error fetching token balance:', error);
    
    // Fallback: try to get the native balance if token balance fails
    try {
      const balance = await provider.getBalance(userAddress);
      return ethers.formatEther(balance);
    } catch (fallbackError) {
      console.error('Error fetching native balance:', fallbackError);
      return '0';
    }
  }
};

const Home: NextPage = () => {
  const { address } = useAccount();
  const config = useConfig();
  
  const { data: hash, writeContract, isSuccess, isPending, isError, error } = useWriteContract()

  const [expirationDate, setExpirationDate] = useState<string>('');
  const [strike, setStrike] = useState<number>(0);
  const [createAmount, setCreateAmount] = useState<string>('');
  const [exerciseAmount, setExerciseAmount] = useState<string>('');
  const [unlockAmount, setUnlockAmount] = useState<string>('');
  const [createSelectedToken, setCreateSelectedToken] = useState<string>('');
  const [exerciseSelectedToken, setExerciseSelectedToken] = useState<string>('');
  const [unlockSelectedToken, setUnlockSelectedToken] = useState<string>('');

  const [userTokens, setUserTokens] = useState<{address: string, symbol: string}[]>([
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH' },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC' },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC' },
  ]);

  useEffect(() => {
    console.log('isError is', isError);
    console.log('error is', error);
  }, [isError]);

  const [tokenBalances, setTokenBalances] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const fetchBalances = async () => {
      if (address) {
        const balances = await Promise.all(
          userTokens.map(async (token) => {
            const balance = await getTokenBalance(address, token.address);
            return { [token.address]: balance };
          })
        );
        setTokenBalances(Object.assign({}, ...balances));
      }
    };

    fetchBalances();
  }, [address, userTokens]);

  const handleCreateOption = async (caddress: string, expirationDate: number, strike: number, amount: bigint) => {
    console.log('Creating option...');
    try {
      await writeContract({
        address: contractAddress,
        abi: ABI,
        functionName: 'createOption',
        args: [caddress, expirationDate, strike, amount],
      });
      console.log('Option created successfully');
    } catch (error) {
      console.error('Error creating option:', error);
    }
  };

  const handleExerciseOption = async (caddress: string, amount: bigint) => {
    console.log('Exercising option...');
    try {
      await writeContract({
        address: contractAddress,
        abi: ABI,
        functionName: 'exerciseOption',
        args: [caddress, amount],
      });
      console.log('Option exercised successfully');
    } catch (error) {
      console.error('Error exercising option:', error);
    }
  };

  const handleUnlockCollateral = async (caddress: string, amount: bigint) => {
    console.log('Unlocking collateral...');
    try {
      await writeContract({
        address: contractAddress,
        abi: ABI,
        functionName: 'unlockCollateral',
        args: [caddress, amount],
      });
      console.log('Collateral unlocked successfully');
    } catch (error) {
      console.error('Error unlocking collateral:', error);
    }
  };

  const dateToEpoch = (date: Date) => {
    return Math.floor(new Date(date).getTime() / 1000);
  };

  const epochToDate = (epoch: number) => {
    return new Date(Number(epoch) * 1000).toLocaleString();
  };

  const handleCreateOptionClick = () => {
    const selectedDate = new Date(expirationDate);
    selectedDate.setUTCHours(0, 0, 0, 0);
    const epochDate = dateToEpoch(selectedDate);
    handleCreateOption(createSelectedToken, epochDate, strike, BigInt(createAmount));
  };

  const handleExerciseOptionClick = () => {
    handleExerciseOption(exerciseSelectedToken, BigInt(exerciseAmount));
  };

  const handleUnlockCollateralClick = () => {
    handleUnlockCollateral(unlockSelectedToken, BigInt(unlockAmount));
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>RainbowKit App</title>
        <meta
          content="Generated by @rainbow-me/create-rainbowkit"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <main className={styles.main}>
        <ConnectButton />

        <h1 className={styles.title}>Option Manager</h1>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Create Option</h2>
            <label>
              Expiration Date:
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </label>
            <br/>
            <label>
              Strike Price:
              <input
                type="number"
                value={strike}
                onChange={(e) => setStrike(Number(e.target.value))}
              />
            </label>
            <br/>
            <label>
              Token:
              <select
                value={createSelectedToken}
                onChange={(e) => {
                  setCreateSelectedToken(e.target.value);
                  setCreateAmount('');
                }}
              >
                <option value="">Select a token</option>
                {userTokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} ({tokenBalances[token.address] || '0'})
                  </option>
                ))}
              </select>
            </label>
            <br/>
            <label>
              Amount:
              <input
                type="text"
                value={createAmount}
                onChange={(e) => {
                  const balance = parseFloat(tokenBalances[createSelectedToken] || '0');
                  if (parseFloat(e.target.value) <= balance) {
                    setCreateAmount(e.target.value);
                  }
                }}
                placeholder={tokenBalances[createSelectedToken] || '0'}
              />
            </label>
            <button onClick={handleCreateOptionClick}>Create Option</button>
          </div>

          <div className={styles.card}>
            <h2>Exercise Option</h2>
            <label>
              Token:
              <select
                value={exerciseSelectedToken}
                onChange={(e) => {
                  setExerciseSelectedToken(e.target.value);
                  setExerciseAmount('');
                }}
              >
                <option value="">Select a token</option>
                {userTokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} ({tokenBalances[token.address] || '0'})
                  </option>
                ))}
              </select>
            </label>
            <br/>
            <label>
              Amount to Exercise:
              <input
                type="text"
                value={exerciseAmount}
                onChange={(e) => setExerciseAmount(e.target.value)}
                placeholder={tokenBalances[exerciseSelectedToken] || '0'}
              />
            </label>
            <button onClick={handleExerciseOptionClick}>Exercise Option</button>
          </div>

          <div className={styles.card}>
            <h2>Unlock Collateral</h2>
            <label>
              Token:
              <select
                value={unlockSelectedToken}
                onChange={(e) => {
                  setUnlockSelectedToken(e.target.value);
                  setUnlockAmount('');
                }}
              >
                <option value="">Select a token</option>
                {userTokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol} ({tokenBalances[token.address] || '0'})
                  </option>
                ))}
              </select>
            </label>
            <br/>
            <label>
              Amount to Unlock:
              <input
                type="text"
                value={unlockAmount}
                onChange={(e) => setUnlockAmount(e.target.value)}
                placeholder={tokenBalances[unlockSelectedToken] || '0'}
              />
            </label>
            <button onClick={handleUnlockCollateralClick}>Unlock Collateral</button>
          </div>
        </div>

        {isSuccess && <div>Transaction successful!</div>}
        {isPending && <div>Transaction pending...</div>}
        {isError && <div>Error: {error?.message}</div>}
      </main>

      <footer className={styles.footer}>
        <a href="https://rainbow.me" rel="noopener noreferrer" target="_blank">
          Made with ❤️ by your frens at 🌈
        </a>
      </footer>
    </div>
  );
};
export default Home;