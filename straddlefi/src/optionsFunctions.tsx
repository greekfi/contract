import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAccount, WagmiProvider } from 'wagmi'
import { config } from './config'
import RedeemInterface from './optionRedeemPair';
import ExerciseInterface from './optionExercise';
import MintInterface from './optionMint';
import { Account } from './account';
import { WalletOptions } from './walletoptions';
import OptionCreator from './optionCreate';

const queryClient = new QueryClient()

function ConnectWallet() {
  const { isConnected } = useAccount()
  if (isConnected) return <Account />
  return <WalletOptions />
}

function OptionsFunctions() {
    const longOptionAddress = '0x55a0acf6d9511ce3719ff8274ff8e30f3e35c543';
    return (

    <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
    <ConnectWallet />     
    <OptionCreator />
    <MintInterface longOptionAddress={longOptionAddress} />
    <ExerciseInterface longOptionAddress={longOptionAddress} />
    <RedeemInterface longOptionAddress={longOptionAddress} />
    </QueryClientProvider>
    </WagmiProvider>
    )
}

export default OptionsFunctions;