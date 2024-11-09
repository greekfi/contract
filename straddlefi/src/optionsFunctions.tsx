import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAccount, useReadContract, WagmiProvider } from 'wagmi'
import { config } from './config'
import RedeemInterface from './optionRedeemPair';
import ExerciseInterface from './optionExercise';
import MintInterface from './optionMint';
import { Account } from './account';
import { WalletOptions } from './walletoptions';
import OptionCreator from './optionCreate';
// Import ABIs and addresses
import LongOptionABI from '../../contracts/artifacts/LongOption_metadata.json';
import erc20abi from './erc20.abi.json';
const queryClient = new QueryClient()

const longAbi = LongOptionABI.output.abi;


function ConnectWallet() {
  const { isConnected } = useAccount()
  if (isConnected) return <Account />
  return <WalletOptions />
}

function OptionsFunctions() {
    const longOptionAddress = '0x55a0acf6d9511ce3719ff8274ff8e30f3e35c543';

    const { address } = useAccount()

  const { data: collateralAddress } = useReadContract({
    address: longOptionAddress, 
    abi: longAbi,
    functionName: 'collateralAddress',
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
  const { data: collateralAllowance = 0n } = useReadContract({
    address: collateralAddress as `0x${string}`,
    abi: erc20abi,
    functionName: 'allowance',
    args: [address as `0x${string}`, longOptionAddress],
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



  // Check allowance
  const { data: considerationAllowance = 0n } = useReadContract({
    address: considerationAddress as `0x${string}`,
    abi: erc20abi,
    functionName: 'allowance',
    args: [address, longOptionAddress],
  });



  const option =         {
    longOptionAddress: longOptionAddress as `0x${string}`, 
    collateralAddress: collateralAddress as `0x${string}`, 
    collateralDecimals: Number(collateralDecimals), 
    collateralAllowance: collateralAllowance as bigint, 
    considerationAddress: considerationAddress as `0x${string}`, 
    considerationDecimals: Number(considerationDecimals), 
    considerationAllowance: considerationAllowance as bigint, 
    isExpired: isExpired
}

    return (

    <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
    <ConnectWallet />     
    <OptionCreator />
    <MintInterface option={option} />
    <ExerciseInterface option={option} />
    <RedeemInterface option={option} />
    </QueryClientProvider>
    </WagmiProvider>
    )
}

export default OptionsFunctions;