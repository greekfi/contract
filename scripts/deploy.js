const hre = require("hardhat");

async function main() {
  const OptionManager = await hre.ethers.getContractFactory("OptionManager");
  const optionManager = await OptionManager.deploy();


  console.log("OptionManager deployed to:", optionManager.address);
  console.log(optionManager)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});