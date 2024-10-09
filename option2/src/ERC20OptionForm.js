
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from "./abiOption.json"
const ERC20_TOKENS = [
  { name: 'Ethereum', address: '0x...ETH_CONTRACT_ADDRESS...' },
  { name: 'DAI', address: '0x...DAI_CONTRACT_ADDRESS...' },
//   { name: 'USDC', address: '0x1Bf2A38993B542C9a5d182f5ce75136dFE63380C' },
  { name: 'CT', address: '0x1Bf2A38993B542C9a5d182f5ce75136dFE63380C' },
  // Add more tokens as needed
];



// // Replace with your actual contract ABI
const CONTRACT_ABI = [
  "function approve(address collateralAddress, uint256 amount) public"
];

// Replace with your actual contract address
const CONTRACT_ADDRESS = "0x11b506d9a9003dfe423fc429b769c4460f8f6303";

const ERC20OptionForm = () => {
  const [selectedToken, setSelectedToken] = useState('');
  const [date, setDate] = useState('');
  const [strikePrice, setStrikePrice] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  
  useEffect(() => {
    const initializeEthers = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setAccount(address);


          const cookcontractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          setContract(cookcontractInstance);

          const tx = await cookcontractInstance.approve(CONTRACT_ADDRESS, 1000000)
          console.log(await tx.wait())
          


          const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
          setContract(contractInstance);
          

        } catch (err) {
          setError('Failed to connect to MetaMask: ' + err.message);
        }
      } else {
        setError('MetaMask is not installed');
      }
    };

    initializeEthers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!contract) {
      setError('Contract is not initialized');
      return;
    }

    try {
        console.log(contract);
      const expirationTimestamp = Math.floor(new Date(date).getTime() / 1000);
      const strikeInWei = ethers.parseUnits(strikePrice, 18); // Assuming 18 decimals, adjust if needed
      const amountInWei = ethers.parseUnits(amount, 18); // Assuming 18 decimals, adjust if needed

      const tx = await contract.createOption(
        selectedToken,
        expirationTimestamp,
        strikeInWei,
        amountInWei
      );

      await tx.wait();
      setSuccess('Option created successfully!');
    } catch (err) {
      setError('Failed to create option: ' + err.message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-6">Create ERC20 Option</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="token">
            Collateral Token
          </label>
          <select
            id="token"
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Select a token</option>
            {ERC20_TOKENS.map((token) => (
              <option key={token.address} value={token.address}>
                {token.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
            Expiration Date
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="strikePrice">
            Strike Price
          </label>
          <input
            type="number"
            id="strikePrice"
            value={strikePrice}
            onChange={(e) => setStrikePrice(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="0.00"
            step="0.000000000000000001"
            min="0"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
            Amount
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="0.00"
            step="0.000000000000000001"
            min="0"
            required
          />
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={!account}
          >
            Create Option
          </button>
        </div>
      </form>
    </div>
  );
};

export default ERC20OptionForm;