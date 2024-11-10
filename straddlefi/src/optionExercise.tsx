import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { InputNumber, Button, Card, Space, message } from 'antd';
import { parseUnits } from 'viem';

// Import ABIs and addresses
import LongOptionABI from '../../contracts/artifacts/LongOption_metadata.json';
import erc20abi from './erc20.abi.json';
import TokenBalance from './optionTokenBalance';

const longAbi = LongOptionABI.output.abi;

const addressA = "0xca81e41A3eDF50Ed0DF26B89DD7696eE61f4631a";
console.log(addressA);

const ExerciseInterface = ({
  optionAddress,
  collateralAddress,
  considerationAddress,
  collateralDecimals,
  considerationDecimals,
  isExpired,
}: {
  optionAddress: `0x${string}`;
  collateralAddress: `0x${string}`;
  considerationAddress: `0x${string}`;
  collateralDecimals: number;
  considerationDecimals: number;
  isExpired: boolean;
}) => {
  const [amount, setAmount] = useState(0);
  const { address: userAddress } = useAccount();
  const [isExercising, setIsExercising] = useState(false);

  // Check allowance
  const { data: allowance = 0n } = useReadContract({
    address: considerationAddress as `0x${string}`,
    abi: erc20abi,
    functionName: 'allowance',
    args: [userAddress, optionAddress],
  });

  const isApproved = (allowance as bigint) >= parseUnits(amount.toString(), Number(considerationDecimals));

  const { writeContract } = useWriteContract();

  const handleExercise = async () => {
    try {
      setIsExercising(true);
      
      // First approve if needed
        const approveConsideration = {
          address: considerationAddress as `0x${string}`,
          abi: erc20abi,
          functionName: 'approve',
          args: [optionAddress, parseUnits(amount.toString(), Number(considerationDecimals))],
      };
      writeContract(approveConsideration);
      const approveCollateral = {
        address: collateralAddress as `0x${string}`,
        abi: erc20abi,
        functionName: 'approve',
        args: [optionAddress, parseUnits(amount.toString(), Number(collateralDecimals))],
    };
    writeContract(approveCollateral);
      
      // Then exercise
      const exerciseConfig = {
        address: optionAddress,
        abi: longAbi,
        functionName: 'exercise',
        args: [parseUnits(amount.toString(), Number(considerationDecimals))],
      };
      
      writeContract(exerciseConfig);
      message.success('Options exercised successfully!');
    } catch (error) {
      message.error('Failed to exercise options');
      console.error(error);
    } finally {
      setIsExercising(false);
    }
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
            onClick={handleExercise}
            loading={isExercising}
            disabled={!amount || !isApproved || isExercising || isExpired}
          >
            Exercise Options
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default ExerciseInterface;