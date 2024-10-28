
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {abi} from "./OptionManager.json"
import erc20abi from "./erc20abi.json"
// const erc20abi = [
//   "function balanceOf(address owner) view returns (uint256)",
//   "function decimals() view returns (uint8)",
//   "function symbol() view returns (string)",

//   "function transfer(address to, uint amount) returns (bool)",

//   "event Transfer(address indexed from, address indexed to, uint amount)"
// ];

const ERC20_TOKENS = [
  
  { name: 'Wrapped BTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
  { name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
  { name: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
  { name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  { name: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { name: 'CT', address: '0x1Bf2A38993B542C9a5d182f5ce75136dFE63380C' },
  { name: 'Mock', address: '0x8f86403a4de0bb5791fa46b8e795c547942fe4cf' },
  
  // Add more tokens as needed
];

// Failed to create option: execution reverted (unknown custom error) 
// (action="estimateGas", data="0xe450d38c000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000000000000000000000000000000000000000000000005af3107a3fff0000000000000000000000000000000000000000000000000de0b6b3a7640000", 
// reason=null, transaction={ "data": "0xa647e8ec0000000000000000000000008f86403a4de0bb5791fa46b8e795c547942fe4cf000000000000000000000000000000000000000000000000000000006712f6800000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000de0b6b3a7640000", 
// "from": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "to": "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d" }, invocation=null, revert=null, code=CALL_EXCEPTION, version=6.13.4)
const CONTRACT_ADDRESS = "0xCD8a1C3ba11CF5ECfa6267617243239504a98d90";

const ERC20OptionForm = () => {
  const [assetToken, setSelectedToken] = useState('');
  const [date, setDate] = useState('');
  const [strikePrice, setStrikePrice] = useState('');
  const [amount_, setAmount] = useState('');
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  useEffect(() => {
    const initializeEthers = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          console.log("window.eth != undef");
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(window.ethereum);
          // setProvider(provider);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setAccount(account);
          console.log(signer);


        //   const cookcontractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        //   setContract(cookcontractInstance);

        //   const tx = await cookcontractInstance.approve(CONTRACT_ADDRESS, 1000000)
        //   console.log(await tx.wait())
          


          // const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
          // setContract(contractInstance);
          

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

    // if (!contract) {
    //   setError('Contract is not initialized');
    //   return;
    // }

    try {

      const expiration = Math.floor(new Date(date).getTime() / 1000);
      const strike = ethers.parseUnits(strikePrice, 18); // Assuming 18 decimals, adjust if needed
      const amount = ethers.parseUnits(amount_, 18); // Assuming 18 decimals, adjust if needed

      console.log("Submission");
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      setAccount(account);

      console.log(signer);
      


      const optionConvert = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      setContract(contract);


      console.log(contract);

      const token = new ethers.Contract(assetToken, erc20abi, signer);

      // await optionConvert.approve(assetToken, amount);
      const approval = await token.approve(CONTRACT_ADDRESS, amount);
      approval.wait();
      console.log("approved", optionConvert)

      const tx = await optionConvert.mint(
        assetToken,
        expiration,
        strike,
        amount
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
            value={assetToken}
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
            value={amount_}
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
            // disabled={!account}
          >
            Create Option
          </button>
        </div>
      </form>
    </div>
  );
};

export default ERC20OptionForm;