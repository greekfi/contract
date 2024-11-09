import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { InputNumber, Button, Card, Space, Statistic, message } from 'antd';
import { parseUnits, formatUnits } from 'viem';

// Import ABIs and addresses
import LongOptionABI from '../../contracts/artifacts/LongOption_metadata.json';
import erc20abi from './erc20.abi.json';

const longAbi = LongOptionABI.output.abi;


const TokenBalance = ({ 
  userAddress,  
  tokenAddress, 
  label, 
}: {
  userAddress: `0x${string}`,
  tokenAddress: `0x${string}`,
  label: string,
  watch?: boolean
}) => {
  const { data: balance = 0n } = useReadContract({
    address: tokenAddress,
    abi: erc20abi,
    functionName: 'balanceOf',
    args: [userAddress],
  });

  const { data: decimals = 18n } = useReadContract({
    address: tokenAddress,
    abi: erc20abi,
    functionName: 'decimals',
  });

  return (
    <Statistic 
      title={label} 
      value={Number(formatUnits(balance as bigint, Number(decimals)))} 
      precision={6} 
    />
  );
};


interface ExerciseInterfaceProps {
  longOptionAddress: `0x${string}`;
  considerationAddress: `0x${string}`;
}

const ExerciseInterface = ({
  longOptionAddress,
}: ExerciseInterfaceProps) => {
  const [amount, setAmount] = useState(0);
  const { address: userAddress } = useAccount();
  const [isExercising, setIsExercising] = useState(false);


  const { data: collateralAddress } = useReadContract({
    address: longOptionAddress, 
    abi: longAbi,
    functionName: 'collateralToken',
  });

  const { data: considerationAddress } = useReadContract({
    address: longOptionAddress,
    abi: longAbi, 
    functionName: 'considerationToken',
  });

  // Get token decimals
  const { data: considerationDecimals = 18n } = useReadContract({
    address: considerationAddress as `0x${string}`,
    abi: erc20abi,
    functionName: 'decimals',
  });

  const { data: collateralDecimals = 18n } = useReadContract({
    address: collateralAddress as `0x${string}`,
    abi: erc20abi,
    functionName: 'decimals',
  });

  // Check if contract is expired
  const { data: expirationDate } = useReadContract({
    address: longOptionAddress,
    abi: longAbi,
    functionName: 'expirationDate',
  });

  const isExpired = expirationDate ? (Date.now() / 1000) > (expirationDate as number): false;

  // Check allowance
  const { data: allowance = 0n } = useReadContract({
    address: considerationAddress as `0x${string}`,
    abi: erc20abi,
    functionName: 'allowance',
    args: [userAddress, longOptionAddress],
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
          args: [longOptionAddress, parseUnits(amount.toString(), Number(considerationDecimals))],
      };
      writeContract(approveConsideration);
      const approveCollateral = {
        address: collateralAddress as `0x${string}`,
        abi: erc20abi,
        functionName: 'approve',
        args: [longOptionAddress, parseUnits(amount.toString(), Number(collateralDecimals))],
    };
    writeContract(approveCollateral);
      
      // Then exercise
      const exerciseConfig = {
        address: longOptionAddress,
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
            tokenAddress={longOptionAddress}
            label="Your Option Balance"
            watch={true}
          />
          <TokenBalance
            userAddress={userAddress as `0x${string}`}
            tokenAddress={considerationAddress as `0x${string}`}
            label="Your Consideration Balance"
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