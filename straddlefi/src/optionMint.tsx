import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { InputNumber, Button, Card, Space, message } from 'antd';
import { Address, parseUnits } from 'viem';

// Import ABIs and addresses
import LongOptionABI from '../../contracts/artifacts/LongOption_metadata.json';
import erc20abi from './erc20.abi.json';
import TokenBalance from './optionTokenBalance';

const longAbi = LongOptionABI.output.abi;


const MintInterface = (
  {optionAddress, collateralAddress, collateralDecimals, isExpired}: 
  {optionAddress: Address, collateralAddress: Address, collateralDecimals: number, isExpired: boolean}) => {


  const [amount, setAmount] = useState(0);
  const [isMinting, setIsMinting] = useState(false);
  const { address: userAddress } = useAccount();


  const { data: shortOptionAddress } = useReadContract({
    address: optionAddress as `0x${string}`, 
    abi: longAbi,
    functionName: 'shortOptionAddress',
    query: {
      enabled: !!optionAddress,
    },
  });


  // Check allowance
  const { data: allowance = 0n } = useReadContract({
    address: collateralAddress as `0x${string}`,
    abi: erc20abi,
    functionName: 'allowance',
    args: [shortOptionAddress as `0x${string}`],
    query: {
      enabled: !!collateralAddress,
    },
  });
  
  const amountToMint = parseUnits(amount.toString(), Number(collateralDecimals));
  const isApproved = (allowance as bigint) >= amountToMint;

  console.log("isApproved", isApproved);
  console.log("allowance", allowance);
  console.log("amountToMint", amountToMint);

  const { writeContract } = useWriteContract();

  const handleApprove = async () => {
    try {
      setIsMinting(true);
      
      // First approve if needed
      const approveCollateral = {
        address: collateralAddress as `0x${string}`,
        abi: erc20abi,
        functionName: 'approve',
        args: [shortOptionAddress, amountToMint],
    };
    writeContract(approveCollateral);

      message.success('Collateral approved successfully!');
    } catch (error) {
      message.error('Failed to mint options');
      console.error(error);
    } finally {
      setIsMinting(false);
    }
  };
  const handleMint = async () => {
    try {
      handleApprove();
      
      // Then mint
      const mintConfig = {
        address: optionAddress as `0x${string}`,
        abi: longAbi,
        functionName: 'mint',
        args: [amountToMint],

      };
      
      writeContract(mintConfig);
      message.success('Options minted successfully!');
    } catch (error) {
      message.error('Failed to mint options');
      console.error(error);
    } finally {
      setIsMinting(false);
    }
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
            loading={isMinting}
            disabled={!amount || isMinting || isApproved || isExpired}
          >
            Approve Collateral
          </Button>
          <Button 
            type="primary"
            onClick={handleMint}
            loading={isMinting}
            disabled={!amount || isMinting || isApproved || isExpired}
          >
            Mint Options
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default MintInterface;
