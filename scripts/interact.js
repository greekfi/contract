const hre = require("hardhat");
const { ethers } = require("hardhat");
const { mock } = require("node:test");
const { exit } = require("process");
// const { ethers } = require("ethers");

async function main() {
  // Get the contract factory and signers

  const [deployer, user1, user2] = await ethers.getSigners();
//   console.log(user1);
//   console.log(user2);
  
  const optionManagerAddress = "0x67d269191c92caf3cd7723f116c85e6e9bf55933";
  const mockAddress = "0xa51c1fc2f0d1a1b8494ed1fe312d7c3a78ed91c0";
  const OptionManagerArtifact = require("../artifacts/contracts/OptionsActions.sol/OptionManager.json");
  const abi = OptionManagerArtifact.abi;
  const MockArtifact = require("../artifacts/contracts/mockerc.sol/MockUSDC.json");
  const mockabi = MockArtifact.abi;

  console.log(ethers);
//   const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
//   console.log(provider);

  // Get the first account from the node to use as a signer
//   const deployer = provider.getSigner(0);
  console.log(deployer);

  const MockUSDC = new ethers.ContractFactory(mockabi, MockArtifact.bytecode, deployer);
  // const initialSupply = ethers.utils.parseUnits("1000000", 6); // 1,000,000 USDC with 6 decimals
  const mockContract = await MockUSDC.deploy(100000000000000);
  // await mockUSDC.deployed();
  const tx = await mockContract.waitForDeployment();

  console.log("Mock USDC deployed to:", tx);
  console.log(mockContract);

  const optionManager = new ethers.Contract(optionManagerAddress, abi, deployer);

  console.log("OptionManager address:", optionManager);
  
//   const mockContract = new ethers.Contract(mockAddress, mockabi, user1);

  console.log("Mock Collateral address:", mockContract  );

  await mockContract.connect(deployer).approve(optionManagerAddress, 100000);

  console.log(await mockContract);
  const expirationDate = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

  console.log("Creating option...", mockContract.address);
  const createTx = await optionManager.connect(deployer).mint(
    await mockContract.getAddress(),
    expirationDate,
    100,
    1
  );
  const receipt = await createTx.wait();
  console.log("Option created!");
  console.log(receipt);
  console.log(receipt.events)

  const a = await optionManager.testEmit();
  console.log(a);
  const b = await a.wait();
  console.log(b);
  console.log(b.events);
  console.log(optionManager.filters.OptionCreated(null, null))
  console.log(await mockContract.balanceOf(deployer.address))
//   console.log(receipt.logs)

//   console.log(user1);
//   console.log("Created option address:", await mockContract.balanceOf(deployer.address));
//   console.log(await optionManager.contracts(0));

// const mintFunction = optionManager.interface.getFunction("mint");

// // Decode the input arguments (which would include the address, strike, etc.)
// const decodedInput = optionManager.interface.decodeFunctionData(mintFunction, createTx.data);

// // The `collateralAddress`, `expirationDate`, `strike`, and `amount` are inputs.
// // The return value, `optionContractAddress`, is part of the event logs as mentioned earlier.
// console.log("Decoded inputs for mint:", decodedInput);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });