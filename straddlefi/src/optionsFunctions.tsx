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
    const longOptionAddress = '0x827c62d1484c789c739f352e9E5947c6e1B8fb74';
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