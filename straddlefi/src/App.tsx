// import { useState } from 'react'
import { Account } from './account'
import { WalletOptions } from './walletoptions'
import  OptionCreator  from './createOption'
import 'antd/dist/reset.css';
import './App.css'


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
      <ConnectWallet />     
      <OptionCreator />
          
      
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
