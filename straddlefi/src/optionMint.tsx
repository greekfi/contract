import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { InputNumber, Button, Card, Space, message } from 'antd';
import { parseUnits } from 'viem';

// Import ABIs and addresses
import LongOptionABI from '../../contracts/artifacts/LongOption_metadata.json';
import erc20abi from './erc20.abi.json';
import TokenBalance from './optionTokenBalance';

const longAbi = LongOptionABI.output.abi;


const MintInterface = ({
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
  const { collateralAddress, collateralDecimals, collateralAllowance, longOptionAddress, isExpired } = option;
  const [amount, setAmount] = useState(0);
  const { address: userAddress } = useAccount();
  const [isMinting, setIsMinting] = useState(false);

  const isApproved = (collateralAllowance as bigint) >= parseUnits(amount.toString(), Number(collateralDecimals));

  const { writeContract } = useWriteContract();

  const handleMint = async () => {
    try {
      setIsMinting(true);
      
      // First approve if needed
      const approveCollateral = {
        address: collateralAddress as `0x${string}`,
        abi: erc20abi,
        functionName: 'approve',
        args: [longOptionAddress, parseUnits(amount.toString(), Number(collateralDecimals))],
    };
    writeContract(approveCollateral);
      
      // Then mint
      const mintConfig = {
        address: longOptionAddress,
        abi: longAbi,
        functionName: 'mint',
        args: [parseUnits(amount.toString(), Number(collateralDecimals))],
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
            tokenAddress={longOptionAddress}
            label="Your Option Balance"
            watch={true}
          />
          <TokenBalance
            userAddress={userAddress as `0x${string}`}
            tokenAddress={collateralAddress as `0x${string}`}
            label="Your Collateral Balance"
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
            onClick={handleMint}
            // loading={isMinting}
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
