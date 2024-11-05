import  { useState,  } from 'react';
import {  useAccount, useWriteContract } from 'wagmi';
import { Address } from 'viem'
// import { parseUnits } from 'viem';

// You'll need to import your token lists here
import tokenList from './tokenList.json';
import Select from 'react-select'
import Calendar from 'react-calendar';
// import contractAddresses from './contractAddresses.json';

const CONTRACT_ADDRESS = '0xd9145CCE52D386f254917e481eB44e9943F39138'

const abi = [
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'address', name: 'collateralAddress', type: 'address' },
      { internalType: 'address', name: 'considerationAddress', type: 'address' },
      { internalType: 'uint256', name: 'expirationDate', type: 'uint256' },
      { internalType: 'uint256', name: 'strike', type: 'uint256' },
      { internalType: 'bool', name: 'isPut', type: 'bool' }
    ],
    name: 'createOption',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

interface Token {
  address: string;
  symbol: string;
  decimals: number;
}

// const considerationSelectOptions = tokenList.consideration.map((token) => ({
//   value: token.symbol,
//   label: token.symbol
// }));

// const collateralSelectOptions = tokenList.collateral.map((token) => ({
//   value: token.symbol,
//   label: token.symbol
// }));

const OptionCreator = () => {
  const account = useAccount();
  console.log(account);

  // State management
  const [collateralTokenSymbol, setCollateralToken] = useState<Token>();
  const [considerationTokenSymbol, setConsiderationToken] = useState<Token>();
  const [amount, setAmount] = useState('');
  const [strikePrice, setStrikePrice] = useState<number >(0);
  const [isPut, setIsPut] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date>();
  
  const {writeContract } = useWriteContract()
  // Contract interaction setup
  const collMap = tokenList.collateral.reduce((acc, token) => {
    acc[token.symbol] = token;
    return acc;
  }, {} as Record<string, Token>);

  const consMap = tokenList.consideration.reduce((acc, token) => {
    acc[token.symbol] = token;
    return acc;
  }, {} as Record<string, Token>);

  const collateral = collateralTokenSymbol ? collMap[collateralTokenSymbol.symbol] : null;
  const consideration = considerationTokenSymbol ? consMap[considerationTokenSymbol.symbol] : null;

  // The strike price is actually represented as an integer with 18 decimals like erc20 tokens. 
  const calculateStrikeRatio = () => {
    if (!strikePrice || !consideration || !collateral) return {strikeInteger: BigInt(0)};
    return {strikeInteger: BigInt(strikePrice * Math.pow(10, 18 + consideration.decimals - collateral.decimals)),};
  };

  // const {strikeNum, strikeDen} = calculateStrikeRatio();
  const handleCreateOption = async () => {
    if (!collateral || !consideration || !amount || !strikePrice || !expirationDate) {
      alert('Please fill in all fields');
      return;
    }

    const { strikeInteger } = calculateStrikeRatio();
    const expTimestamp = Math.floor(new Date(expirationDate).getTime() / 1000);
    
    // Generate option name and symbol
    const name = `${collateral.symbol}-${consideration.symbol}-${isPut ? 'P' : 'C'}-${expirationDate}-${strikeInteger}`;
    const symbol = `${collateral.symbol}${consideration.symbol}${isPut ? 'P' : 'C'}${expirationDate}${strikeInteger}`;

    try {
      console.log(name, symbol, collateral.address, consideration.address, BigInt(expTimestamp), strikeInteger, isPut);
      const tx = writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'createOption',
        args: [
          name,
          symbol,
          collateral.address as Address,
          consideration.address as Address,
          BigInt(expTimestamp),
          strikeInteger,
          isPut
        ],
      });
      console.log(tx);
    } catch (error) {
      console.error('Error creating option:', error);
      alert('Failed to create option. Check console for details.');
    }
  };


  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Collateral Token</label>
          <Select
            options={tokenList.collateral}
            onChange={(selectedOption) => setCollateralToken(selectedOption as Token)}
          />

        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Consideration Token</label>
          <Select
            options={tokenList.consideration}
            onChange={(selectedOption) => setConsiderationToken(selectedOption as Token)}
          />

        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Strike Price</label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={Number(strikePrice)}
            onChange={(e) => setStrikePrice(Number(e.target.value))}
            placeholder="Enter strike price"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Option Type:</span>
          <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
            <input
              type="checkbox"
              className="hidden"
              checked={isPut}
              onChange={(e) => setIsPut(e.target.checked)}
            />
            <div 
              className={`w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${
                isPut ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              onClick={() => setIsPut(!isPut)}
            >
              <div
                className={`w-4 h-4 mt-1 ml-1 bg-white rounded-full shadow transform duration-200 ease-in-out ${
                  isPut ? 'translate-x-6' : ''
                }`}
              />
            </div>
          </div>
          <span className="text-sm text-gray-600">{isPut ? 'PUT' : 'CALL'}</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
        <Calendar onChange={(value) => setExpirationDate(value as Date)} value={expirationDate ? new Date(expirationDate) : null} />

      </div>

      <button
        className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        onClick={handleCreateOption}
        disabled={!account.address || !collateral || !consideration || !amount || !strikePrice || !expirationDate}
      >
        Create Option
      </button>
    </div>
  );
};

export default OptionCreator;