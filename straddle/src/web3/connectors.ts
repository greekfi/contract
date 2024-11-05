// src/web3/connectors.ts
import { InjectedConnector } from '@web3-react/injected-connector'

export const injected = new InjectedConnector({
  supportedChainIds: [1, 5, 137, 80001], // Mainnet, Goerli, Polygon, Mumbai
})

// src/web3/hooks.ts
import { useEffect, useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import { ethers } from 'ethers'
import Web3Modal from 'web3modal'

const web3Modal = new Web3Modal({
  network: "mainnet",
  cacheProvider: true,
  providerOptions: {} // Add custom providers here
})

export function useWeb3() {
  const { activate, deactivate, account, library, chainId } = useWeb3React()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  async function connect() {
    try {
      setLoading(true)
      setError(null)
      const provider = await web3Modal.connect()
      const web3Provider = new ethers.providers.Web3Provider(provider)
      await activate(injected)
      
      // Listen for account changes
      provider.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect()
        }
      })

      // Listen for chain changes
      provider.on("chainChanged", () => {
        window.location.reload()
      })

    } catch (error) {
      setError(error as Error)
      console.error("Connection error:", error)
    } finally {
      setLoading(false)
    }
  }

  async function disconnect() {
    try {
      await web3Modal.clearCachedProvider()
      deactivate()
    } catch (error) {
      console.error("Disconnection error:", error)
    }
  }

  // Auto connect if previously connected
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connect()
    }
  }, [])

  return {
    connect,
    disconnect,
    account,
    library,
    chainId,
    loading,
    error
  }
}

// src/App.tsx
import { Web3ReactProvider } from '@web3-react/core'
import { ethers } from 'ethers'
import { Toaster } from 'react-hot-toast'
import Navigation from './components/Navigation'

function getLibrary(provider: any) {
  return new ethers.providers.Web3Provider(provider)
}

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Your app content */}
        </main>
        <Toaster position="bottom-right" />
      </div>
    </Web3ReactProvider>
  )
}

export default App
