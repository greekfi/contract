import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
        optimizer: {
            enabled: true,
            runs: 1, // A lower runs value can further optimize your contract
        },
    },
},
  networks: {
    // hardhat: {
    //   chainId: 1337
    // },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};

export default config;
