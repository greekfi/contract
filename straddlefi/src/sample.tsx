import { useReadContract, useAccount } from 'wagmi'
import { Address } from 'viem';
import LongOptionABI from '../../contracts/artifacts/LongOption_metadata.json';
import erc20abi from './erc20.abi.json';

const longAbi = LongOptionABI.output.abi;



const ReadContract = (
  {optionAddress, setCollateralAddress, setConsiderationAddress, setCollateralDecimals, setConsiderationDecimals, setIsExpired}: 
  {optionAddress: Address, setCollateralAddress: (address: Address) => void, setConsiderationAddress: (address: Address) => void, setCollateralDecimals: (decimals: number) => void, setConsiderationDecimals: (decimals: number) => void, setIsExpired: (isExpired: boolean) => void}) => {
  const { address } = useAccount();

  const { data: balance } = useReadContract({
    address: optionAddress,
    functionName: 'balanceOf',
    args: [address],
  })


  const { data: collateralAddress } = useReadContract({
    address: optionAddress as `0x${string}`, 
    abi: longAbi,
    functionName: 'collateralAddress',
    query: {
        enabled: !!optionAddress,
    },
});
console.log("collateralAddress", collateralAddress);
setCollateralAddress(collateralAddress as Address);


const { data: considerationAddress } = useReadContract({
  address: optionAddress as `0x${string}`, 
  abi: longAbi,
  functionName: 'considerationAddress',
  query: {
      enabled: !!optionAddress,
  },
});
console.log("considerationAddress", considerationAddress);
setConsiderationAddress(considerationAddress as Address);


const { data: collateralDecimals } = useReadContract({
  address: collateralAddress as `0x${string}`, 
  abi: erc20abi,
  functionName: 'decimals',
  query: {
      enabled: !!collateralAddress,
  },
});
console.log("collateralDecimals", collateralDecimals);
setCollateralDecimals(collateralDecimals as number);


const { data: considerationDecimals } = useReadContract({
  address: considerationAddress as `0x${string}`, 
  abi: erc20abi,
  functionName: 'decimals',
  query: {
      enabled: !!considerationAddress,
  },
});
console.log("considerationDecimals", considerationDecimals);
setConsiderationDecimals(considerationDecimals as number);

const { data: expirationDate } = useReadContract({
  address: optionAddress,
  abi: longAbi,
  functionName: 'expirationDate',
  query: {
      enabled: !!optionAddress,
  },
});

const isExpired = expirationDate ? (Date.now() / 1000) > (expirationDate as number): false;
setIsExpired(isExpired);




  console.log("balance");
  console.log(balance);
  return (
    <div>Balance: {balance?.toString()}</div>
  )
}

export default ReadContract;