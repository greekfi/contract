import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { InputNumber, Button, Card, Space } from 'antd';
import { Address, parseUnits } from 'viem';
import LongOptionABI from '../../contracts/artifacts/LongOption_metadata.json';
import TokenBalance from './optionTokenBalance';
import erc20abi from './erc20.abi.json';
const longAbi = LongOptionABI.output.abi;


interface RedeemInterfaceProps {
  optionAddress: `0x${string}`;
  shortAddress: `0x${string}`;
  collateralAddress: `0x${string}`;
  collateralDecimals: number;
  isExpired: boolean;
}

const RedeemInterface = ({
  optionAddress,
  shortAddress,
  collateralAddress,
  collateralDecimals,
  isExpired,
}: RedeemInterfaceProps) => {
  const { address: userAddress } = useAccount();
  const [amount, setAmount] = useState<number>(0);
  const { writeContract, isPending, error } = useWriteContract();

  const approveTransfers = async () => {
    // First approve if needed
    const approveCollateral = {
      address: collateralAddress as `0x${string}`,
      abi: erc20abi,
      functionName: 'approve',
      args: [shortAddress, parseUnits(amount.toString(), Number(collateralDecimals))],
  };
  writeContract(approveCollateral);
    
    // Then exercise
    console.log(error);

};

  const handleRedeem = async () => {
    await approveTransfers();

      // Prepare redeem transaction
      const redeemConfig = {
        address: optionAddress,
        abi: longAbi,
        functionName: 'redeem',
        args: [parseUnits(amount.toString(), collateralDecimals)],
      };

      writeContract(redeemConfig);
      console.log(isExpired);
  };


  return (
    <Card title="Redeem Collateral">
      <Space direction="vertical" style={{ width: '100%' }}>
      <TokenBalance
          userAddress={userAddress as `0x${string}`}
          tokenAddress={optionAddress as Address}
          label="Your Long Balance"
          decimals={collateralDecimals as number}
          watch={true}
        />
      <TokenBalance
          userAddress={userAddress as `0x${string}`}
          tokenAddress={shortAddress as Address}
          label="Your Short Balance"
          decimals={collateralDecimals as number}
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
          // disabled={!amount || isExpired}
        >
          Redeem Collateral
        </Button>
      </Space>
    </Card>
  );
};

export default RedeemInterface;