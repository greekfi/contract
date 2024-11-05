// import { useState } from 'react'
import { Account } from './account'
import { WalletOptions } from './walletoptions'
import  OptionCreator  from './createOption'
import './App.css'

import { SendTransaction } from './sendtransaction'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAccount, WagmiProvider } from 'wagmi'
import { config } from './config'

const queryClient = new QueryClient()

function ConnectWallet() {
  const { isConnected } = useAccount()
  if (isConnected) return <Account />
  return <WalletOptions />
}

function App() {

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OptionCreator />
        <SendTransaction />
        
        <ConnectWallet />
      {/** ... */}
       
      
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
