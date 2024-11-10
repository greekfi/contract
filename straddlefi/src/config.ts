import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}



export const config = createConfig({
  chains: [
    // mainnet, 
    sepolia],
  transports: {
    // [mainnet.id]: http(),
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
  },
})