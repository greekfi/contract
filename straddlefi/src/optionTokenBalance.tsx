import { useReadContract } from 'wagmi';
import { Statistic } from 'antd';
import { formatUnits } from 'viem';
import erc20abi from './erc20.abi.json';


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

export default TokenBalance;