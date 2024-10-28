import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Predefined list of ERC20 tokens (replace with actual addresses)
const PREDEFINED_TOKENS = [
  { name: 'Select a token', address: '' },
  { name: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
  { name: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { name: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  { name: 'USCC', address: '0xF8d99FcadE2E7F4002D23CF6685DcC58ed1B89F6' },
  { name: 'CT', address: '0x1Bf2A38993B542C9a5d182f5ce75136dFE63380C' },
  { name: 'Mock', address: '0x8f86403a4de0bb5791fa46b8e795c547942fe4cf' },
  // 0x1Bf2A38993B542C9a5d182f5ce75136dFE63380C
  { name: 'Custom', address: 'custom' }
];

// ABI for ERC20 token
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const MetaMaskERC20Balance = () => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [customAddress, setCustomAddress] = useState('');

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
      } catch (err) {
        setError('Failed to connect to MetaMask: ' + err.message);
      }
    } else {
      setError('MetaMask is not installed');
    }
  };

  const getTokenBalance = async (tokenAddress) => {
    if (!account || !tokenAddress) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      const balance = await tokenContract.balanceOf(account);
      const decimals = await tokenContract.decimals();
      const symbol = await tokenContract.symbol();

      setBalance(ethers.formatUnits(balance, decimals));
      setTokenSymbol(symbol);
      setError(null);
    } catch (err) {
      setError('Failed to fetch token balance: ' + err.message);
      setBalance(null);
      setTokenSymbol('');
    }
  };

  const handleTokenChange = (e) => {
    const address = e.target.value;
    setSelectedToken(address);
    if (address !== 'custom') {
      getTokenBalance(address);
    } else {
      setCustomAddress('');
      setBalance(null);
      setTokenSymbol('');
    }
  };

  const handleCustomAddressSubmit = (e) => {
    e.preventDefault();
    if (ethers.isAddress(customAddress)) {
      getTokenBalance(customAddress);
    } else {
      setError('Invalid Ethereum address');
    }
  };

  useEffect(() => {
    if (account && selectedToken && selectedToken !== 'custom') {
      getTokenBalance(selectedToken);
    }
  }, [account, selectedToken]);

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">MetaMask ERC20 Token Balance</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Connect to MetaMask
        </button>
      ) : (
        <div>
          <p className="mb-2">Connected Account: {account}</p>
          <select
            value={selectedToken}
            onChange={handleTokenChange}
            className="mb-2 p-2 border rounded w-full"
          >
            {PREDEFINED_TOKENS.map((token) => (
              <option key={token.address} value={token.address}>
                {token.name}
              </option>
            ))}
          </select>
          {selectedToken === 'custom' && (
            <form onSubmit={handleCustomAddressSubmit} className="mb-2">
              <input
                type="text"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="Enter custom token address"
                className="p-2 border rounded w-full mb-2"
              />
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full"
              >
                Get Custom Token Balance
              </button>
            </form>
          )}
          {balance !== null && (
            <p className="mb-2">Token Balance: {balance} {tokenSymbol}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MetaMaskERC20Balance;