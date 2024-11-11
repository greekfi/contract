import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { InputNumber, Button, Card, Space, message } from 'antd';
import { parseUnits } from 'viem';
// import { useWriteContracts } from 'wagmi/experimental';

// Import ABIs and addresses
import LongOptionABI from '../../contracts/artifacts/LongOption_metadata.json';
import erc20abi from './erc20.abi.json';
import TokenBalance from './optionTokenBalance';

const longAbi = LongOptionABI.output.abi;

const addressA = "0xca81e41A3eDF50Ed0DF26B89DD7696eE61f4631a";
console.log(addressA);

const ExerciseInterface = ({
  optionAddress,
  shortAddress,
  collateralAddress,
  considerationAddress,
  collateralDecimals,
  considerationDecimals,
  isExpired,
}: {
  optionAddress: `0x${string}`;
  shortAddress: `0x${string}`;
  collateralAddress: `0x${string}`;
  considerationAddress: `0x${string}`;
  collateralDecimals: number;
  considerationDecimals: number;
  isExpired: boolean;
}) => {
  const [amount, setAmount] = useState(0);
  const { address: userAddress } = useAccount();

  // Check allowance
  // const { data: allowance = 0n } = useReadContract({
  //   address: considerationAddress as `0x${string}`,
  //   abi: erc20abi,
  //   functionName: 'allowance',
  //   args: [userAddress, optionAddress],
  // });

  const { writeContract, error, isPending } = useWriteContract();

  const handleExercise = async () => {
      // Then exercise
      const exerciseConfig = {
        address: optionAddress,
        abi: longAbi,
        functionName: 'exercise',
        args: [parseUnits(amount.toString(), Number(considerationDecimals))],
      };
      
      writeContract(exerciseConfig);

  };

  const approveTransfers = async () => {
      
      // First approve if needed
        const approveConsideration = {
          address: considerationAddress as `0x${string}`,
          abi: erc20abi,
          functionName: 'approve',
          args: [shortAddress, parseUnits(amount.toString(), Number(considerationDecimals))],
      };
      writeContract(approveConsideration);
      const approveCollateral = {
        address: collateralAddress as `0x${string}`,
        abi: erc20abi,
        functionName: 'approve',
        args: [shortAddress, parseUnits(amount.toString(), Number(collateralDecimals))],
    };
    writeContract(approveCollateral);
      
      // Then exercise
      console.log(error);
      message.success('Options exercised successfully!');

  };

  return (
    <Card title="Exercise Options">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <TokenBalance
            userAddress={userAddress as `0x${string}`}
            tokenAddress={optionAddress}
            label="Your Option Balance"
            decimals={collateralDecimals as number}
            watch={true}
          />
          <TokenBalance
            userAddress={userAddress as `0x${string}`}
            tokenAddress={considerationAddress as `0x${string}`}
            label="Your Consideration Balance"
            decimals={considerationDecimals as number}
            watch={true}
          />
        </Space>

        <InputNumber
          style={{ width: '100%' }}
          placeholder="Amount to exercise"
          value={amount}
          onChange={(value) => setAmount(value || 0)}
          min={0}
        />

        <Space>
          <Button 
            type="primary"
            onClick={approveTransfers}
            loading={isPending}
            disabled={!amount  || isExpired}
          >
            Approve Transfers
          </Button>
        </Space>
        
        <Space>
          <Button 
            type="primary"
            onClick={handleExercise}
            loading={isPending}
            disabled={!amount  || isExpired}
          >
            Exercise Options
          </Button>
        </Space>
        
      </Space>
    </Card>
  );
};

export default ExerciseInterface;