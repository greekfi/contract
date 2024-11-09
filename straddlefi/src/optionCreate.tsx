import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { Select, Input, Switch, DatePicker, Button, Space, Form, Card } from 'antd';
import { Address } from 'viem';
import tokenList from './tokenList.json';

const CONTRACT_ADDRESS = '0x55a0acf6d9511ce3719ff8274ff8e30f3e35c543'

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

const OptionCreator = () => {
  const account = useAccount();
  console.log(account);

  // State management
  const [collateralTokenSymbol, setCollateralToken] = useState<Token>();
  const [considerationTokenSymbol, setConsiderationToken] = useState<Token>();
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
    if (!collateral || !consideration || !strikePrice || !expirationDate) {
      alert('Please fill in all fields');
      return;
    }

    const { strikeInteger } = calculateStrikeRatio();
    const expTimestamp = Math.floor(new Date(expirationDate).getTime() / 1000);
    // fix time to gmt
    
    // Generate option name and symbol
    const name = `${collateral.symbol}-${consideration.symbol}-${isPut ? 'P' : 'C'}-${expTimestamp}-${strikeInteger}`;
    const symbol = `${collateral.symbol}${consideration.symbol}${isPut ? 'P' : 'C'}${expTimestamp}${strikeInteger}`;

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
    <Card className="max-w-2xl mx-auto">
      <Form layout="vertical">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Token Selection */}
          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              label="Collateral Token"
              style={{ width: '100%' }}
            >
              <Select
                options={tokenList.collateral.map(token => ({
                  value: token.symbol,
                  label: token.symbol,
                }))}
                onChange={(value) => setCollateralToken(tokenList.collateral.find(t => t.symbol === value))}
              />
            </Form.Item>


            <Form.Item
              label="Strike Price"
              style={{ width: '100%' }}
            >
              <Input
                type="number"
                value={strikePrice}
                onChange={(e) => setStrikePrice(Number(e.target.value))}
                placeholder="Enter strike price"
              />
            </Form.Item>

            <Form.Item
              label="Consideration Token"
              style={{ width: '100%' }}
            >
              <Select
                options={tokenList.consideration.map(token => ({
                  value: token.symbol,
                  label: token.symbol,
                }))}
                onChange={(value) => setConsiderationToken(tokenList.consideration.find(t => t.symbol === value))}
              />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">

          {/* Option Type Switch */}
          <Form.Item label="Option Type">
            <Space>
              <Switch
                checked={isPut}
                onChange={setIsPut}
                checkedChildren="PUT"
                unCheckedChildren="CALL"
              />
            </Space>
          </Form.Item>

          {/* Date Picker */}
          <Form.Item label="Expiration Date">
            <DatePicker
              onChange={(date) => setExpirationDate(date?.toDate())}
              showTime={false}
              style={{ width: '100%' }}
            />
            </Form.Item>
             {/* Create Button */}
          <Button
            type="primary"
            onClick={handleCreateOption}
            disabled={!account.address || !collateral || !consideration || !strikePrice || !expirationDate}
            block
          >
              Create Option
            </Button>
          </Space>

         
        </Space>
      </Form>
    </Card>
  );
};

export default OptionCreator;