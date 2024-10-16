import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

// Token list (you'll need to provide the actual addresses)
const tokens = [
    { name: 'Wrapped BTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
    { name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
    { name: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
    { name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
    { name: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    { name: 'CT', address: '0x1Bf2A38993B542C9a5d182f5ce75136dFE63380C' },
    { name: 'Mock', address: '0x8f86403a4de0bb5791fa46b8e795c547942fe4cf' },
];


const TokenOptionComponent = () => {
  const [selectedToken, setSelectedToken] = useState(tokens[0]);
  const [date, setDate] = useState('');
  const [strikePrice, setStrikePrice] = useState('');
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setWallet(wallet);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      console.error('Metamask is not installed');
    }
  };

  const handleSubmit = async () => {
    if (!wallet) {
      alert('Please connect your wallet first');
      return;
    }

    // Here you would typically interact with a smart contract
    // For this example, we'll just log the data
    console.log({
      token: selectedToken,
      date,
      strikePrice,
      amount
    });

    // Example of how you might approve a token spend (this is just a placeholder)
    const tokenContract = new ethers.Contract(selectedToken.address, ['function approve(address spender, uint256 amount) public returns (bool)'], wallet);
    const provider = new ethers.BrowserProvider(window.ethereum);

    const signer = await provider.getSigner();
    console.log("signer", signer)

    try {
      const tx = await tokenContract.approve(signer, ethers.parseUnits(amount, 18));
      await tx.wait();
      console.log('Transaction approved');
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Token Option</h2>
      
      <div className="space-y-4">
        <Select onValueChange={(value) => setSelectedToken(tokens.find(t => t.name === value))}>
          <SelectTrigger>
            <SelectValue placeholder="Select token" />
          </SelectTrigger>
          <SelectContent>
            {tokens.map((token) => (
              <SelectItem key={token.address} value={token.name}>{token.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full"
        />

        <Input
          type="number"
          placeholder="Strike Price (USDC)"
          value={strikePrice}
          onChange={(e) => setStrikePrice(e.target.value)}
          className="w-full"
        />

        <Input
          type="number"
          placeholder={`Amount (${selectedToken.name})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full"
        />

        {!wallet ? (
          <Button onClick={connectWallet} className="w-full">Connect Wallet</Button>
        ) : (
          <Button onClick={handleSubmit} className="w-full">Submit</Button>
        )}
      </div>
    </div>
  );
};

export default TokenOptionComponent;