import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { InputNumber, Button, Card, Space, message } from 'antd';
import { parseUnits } from 'viem';
import LongOptionABI from '../../contracts/artifacts/LongOption_metadata.json';
import TokenBalance from './optionTokenBalance';

const longAbi = LongOptionABI.output.abi;


interface RedeemInterfaceProps {
  longOptionAddress: `0x${string}`;
}

const RedeemInterface = ({
  longOptionAddress,
}: RedeemInterfaceProps) => {
  const [amount, setAmount] = useState<number>(0);
  const { address: userAddress } = useAccount();

  // Check if contract is expired
  const { data: expirationDate } = useReadContract({
    address: longOptionAddress,
    abi: longAbi,
    functionName: 'expirationDate',
  });

  const isExpired = expirationDate ? (Date.now() / 1000) > (expirationDate as number): false;

  // Prepare redeem transaction
  const redeemConfig = {
    address: longOptionAddress,
    abi: longAbi,
    functionName: 'redeem',
    args: [parseUnits(amount.toString(), 18)],
    enabled: Boolean(amount && isExpired),
  };

  const { writeContract: redeem, isPending } = useWriteContract();

  const handleRedeem = async () => {
      redeem(redeemConfig);
      message.loading({ content: 'Redeeming tokens...', key: 'redeem', duration: 0 });
    
  };

  if (!userAddress) {
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
          loading={isPending}
          disabled={!amount || !isExpired || isPending}
        >
          Redeem Tokens
        </Button>
      </Space>
    </Card>
  );
};

export default RedeemInterface;