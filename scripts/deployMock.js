const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    const MockUSDC = new ethers.Contract("MockUSDC", mockabi, user1);
    // const initialSupply = ethers.utils.parseUnits("1000000", 6); // 1,000,000 USDC with 6 decimals
    const mockUSDC = await MockUSDC.deploy(100000000000000);
    // await mockUSDC.deployed();
    const tx = await mockUSDC.waitForDeployment();

    console.log("Mock USDC deployed to:", tx);
    console.log(mockUSDC);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
