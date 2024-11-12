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
        // [mainnet.id]: http(), https://rpc.sepolia.dev
        [sepolia.id]: http("https://endpoints.omniatech.io/v1/eth/sepolia/public"),
  },
})