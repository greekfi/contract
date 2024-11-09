import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { InputNumber, Button, Card, Space, message } from 'antd';
import { parseUnits } from 'viem';
import LongOptionABI from '../../contracts/artifacts/LongOption_metadata.json';
import TokenBalance from './optionTokenBalance';

const longAbi = LongOptionABI.output.abi;


const RedeemInterface = ({
  option
}: {
  option: {
    longOptionAddress: `0x${string}`;
    collateralAddress: `0x${string}`;
    collateralDecimals: number;
    collateralAllowance: bigint;
    considerationAddress: `0x${string}`;
    considerationDecimals: number;
    considerationAllowance: bigint;
    isExpired: boolean;
  };
}) => {
  const { longOptionAddress, collateralDecimals, isExpired } = option;
  
  const [amount, setAmount] = useState<number>(0);
  const { address: userAddress, isConnected } = useAccount();


  // Prepare redeem transaction
  const redeemConfig = {
    address: longOptionAddress,
    abi: longAbi,
    functionName: 'redeem',
    args: [parseUnits(amount.toString(), collateralDecimals)],
    enabled: Boolean(amount && isExpired),
  };

  const { writeContract: redeem, isPending } = useWriteContract();

  const handleRedeem = async () => {
      redeem(redeemConfig);
      message.loading({ content: 'Redeeming tokens...', key: 'redeem', duration: 0 });
  };

  if (!isConnected || !userAddress) {
    return (
      <Card>
        <Space>Please connect your wallet to continue.</Space>
      </Card>
    );
  }

  return (
    <Card title="Redeem Tokens">
      <Space direction="vertical" style={{ width: '100%' }}>
        <TokenBalance
          userAddress={userAddress}
          tokenAddress={longOptionAddress}
          label="Your Token Balance"
          watch={true}
        />

        <InputNumber
          style={{ width: '100%' }}
          placeholder="Amount to redeem"
          value={amount}
          onChange={(value) => setAmount(value || 0)}
          min={0}
        />

        <Button 
          type="primary"
          onClick={handleRedeem}
          // loading={isPending}
          disabled={!amount || !isExpired || isPending}
        >
          Redeem Tokens
        </Button>
      </Space>
    </Card>
  );
};

export default RedeemInterface;