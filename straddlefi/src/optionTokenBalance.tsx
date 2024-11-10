import { useReadContract } from 'wagmi';
import { Statistic } from 'antd';
import { Address, formatUnits } from 'viem';
import erc20abi from './erc20.abi.json';


const TokenBalance = ({ 
    userAddress,  
    tokenAddress, 
    label, 
    decimals,
  }: {
    userAddress: `0x${string}`,
    tokenAddress: `0x${string}`,
    decimals: number,
    label: string,
    watch?: boolean
  }) => {
    const { data: balance = 0n } = useReadContract({
      address: tokenAddress as Address,
      abi: erc20abi,
      functionName: 'balanceOf',
      args: [userAddress],
    });
  

    
    const { data: decimals_ } = useReadContract({
      address: tokenAddress as Address,
      abi: erc20abi,
      functionName: 'decimals',
    });
    if (!decimals) {
      decimals = decimals_ as number;
    }
    console.log("decimals", decimals);
      
    const { data: name = '' } = useReadContract({
      address: tokenAddress as Address,
      abi: erc20abi,
      functionName: 'name',
    });
  
    return (
      <Statistic 
        title={`${label} (${name}) ${tokenAddress}`} 
        value={Number(formatUnits(balance as bigint, Number(decimals)))} 
        precision={6} 
      />
    );
  };
export default TokenBalance;