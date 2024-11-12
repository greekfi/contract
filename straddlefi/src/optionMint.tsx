import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { InputNumber, Button, Card, Space } from 'antd';
import { Address, parseUnits } from 'viem';

// Import ABIs and addresses
import LongOptionABI from '../../contracts/artifacts/LongOption_metadata.json';
import erc20abi from './erc20.abi.json';
import TokenBalance from './optionTokenBalance';

const longAbi = LongOptionABI.output.abi;


const MintInterface = (
  {optionAddress, shortAddress, collateralAddress, collateralDecimals, isExpired}: 
  {optionAddress: Address, shortAddress: Address, collateralAddress: Address, collateralDecimals: number, isExpired: boolean}) => {


  const [amount, setAmount] = useState(0);
  const { address: userAddress } = useAccount();
  const amountToMint = parseUnits(amount.toString(), Number(collateralDecimals));
  const { writeContract, isPending } = useWriteContract();

  // Check allowance
  const { data: allowance = 0n } = useReadContract({
    address: collateralAddress as `0x${string}`,
    abi: erc20abi,
    functionName: 'allowance',
    args: [shortAddress as `0x${string}`],
    query: {
      enabled: !!collateralAddress,
    },
  });
  
  const isApproved = (allowance as bigint) >= amountToMint;

  console.log("isApproved", isApproved);
  console.log("allowance", allowance);
  console.log("amountToMint", amountToMint);

  const handleApprove = async () => {
      const approveCollateral = {
        address: collateralAddress as `0x${string}`,
        abi: erc20abi,
        functionName: 'approve',
        args: [shortAddress, amountToMint],
    };
    writeContract(approveCollateral);

  };
  const handleMint = async () => {
      // handleApprove();
      // Then mint
      const mintConfig = {
        address: optionAddress as `0x${string}`,
        abi: longAbi,
        functionName: 'mint',
        args: [amountToMint],

      };
      
      writeContract(mintConfig);
  };

  return (
    <Card title="Mint Options">
      <Space direction="vertical" style={{ width: '100%' }}>

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <TokenBalance
            userAddress={userAddress as `0x${string}`}
            tokenAddress={optionAddress as `0x${string}`}
            label="Your Option Balance"
            decimals={collateralDecimals as number}
            watch={true}
          />
          <TokenBalance
            userAddress={userAddress as `0x${string}`}
            tokenAddress={collateralAddress as `0x${string}`}
            label="Your Collateral Balance"
            decimals={collateralDecimals as number}
            watch={true}
          />
        </Space>

        <InputNumber
          style={{ width: '50%' }}
          placeholder="Amount to Mint"
          value={amount}
          onChange={(value) => setAmount(value || 0)}
          min={0}
        />

        <Space>
          <Button 
            type="primary"
            onClick={handleApprove}
            loading={isPending}
            disabled={!amount || isPending || isApproved || isExpired}
          >
            Approve Collateral
          </Button>
          <Button 
            type="primary"
            onClick={handleMint}
            loading={isPending}
            disabled={!amount || isPending || isApproved || isExpired}
          >
            Mint Options
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default MintInterface;
