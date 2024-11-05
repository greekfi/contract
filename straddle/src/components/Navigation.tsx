// src/components/Navigation.tsx
import { useWeb3 } from '../web3/hooks'
import { shortenAddress } from '../utils/format'

export default function Navigation() {
  const { connect, disconnect, account, loading, chainId } = useWeb3()

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold">dApp</h1>
          </div>
          
          <div>
            {account ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {shortenAddress(account)}
                </span>
                <button
                  onClick={disconnect}
                  className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

