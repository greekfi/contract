import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { Select, Input, Switch, DatePicker, Button, Space, Form, Card } from 'antd';
import { Address } from 'viem';
import tokenList from './tokenList.json';
import moment from 'moment-timezone';
import TokenBalance from './optionTokenBalance';


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

const OptionCreator = (
  {baseContractAddress}: 
  {baseContractAddress: Address}
) => {
  const {isConnected, address: userAddress} = useAccount();  

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
    const date = new Date(expirationDate);
    const fmtDate = moment(date).format('YYYYMMDD');;
    // fix time to gmt
    
    // Generate option name and symbol
    const name = `OPT${isPut ? 'P' : 'C'}-${collateral.symbol}-${consideration.symbol}-${fmtDate}-${strikePrice}`;
    const symbol = `OPT${isPut ? 'P' : 'C'}-${collateral.symbol}-${consideration.symbol}-${fmtDate}-${strikePrice}`;

    try {
      console.log(name, symbol, collateral.address, consideration.address, BigInt(expTimestamp), strikeInteger, isPut);
      writeContract({
        address: baseContractAddress,
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
    } catch (error) {
      console.error('Error creating option:', error);
      alert('Failed to create option. Check console for details.');
    }
  };


  moment.tz.setDefault("Europe/London");
  return (
    <Card className="max-w-2xl mx-auto">
      <Form layout="vertical">
        <Space direction="vertical" style={{ width: '100%' }} size="large">

        <Space>
        <TokenBalance
            userAddress={userAddress as `0x${string}`}
            tokenAddress={collateralTokenSymbol?.address as `0x${string}`}
            label="Your Collateral Balance"
            decimals={collateralTokenSymbol?.decimals as number}
            watch={true}
          />

        </Space>
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
            disabled={!isConnected || !collateral || !consideration || !strikePrice || !expirationDate}
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