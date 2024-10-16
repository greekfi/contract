// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";


import "./Option.sol";
import "./Collateral.sol";

contract OptionManager is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public usdcToken;

    IERC20 public collateralAsset;
    
    CollateralToken collateralToken;
    OptionToken optionToken;

    mapping (address=>mapping(uint256=>mapping(uint256=>address))) optionsContracts;
    mapping (address=>address[]) public userContracts;
    address[] public contracts;

    event OptionCreated(address indexed creator, uint256 amount);
    event OptionExercised(address indexed exerciser, uint256 amount);
    event CollateralUnlocked(address indexed unlocker, uint256 amount);
    event FunctionCalled(address caller);

    constructor(
    ) Ownable(msg.sender) {
        usdcToken = IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
    }

    function testEmit() external returns (address){
        emit OptionCreated(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, 6);
        return 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    }

    function mint(address collateralAddress, uint256 expirationDate, uint256 strike, uint256 amount ) external  returns (address){
        
        emit FunctionCalled(msg.sender);
        require(block.timestamp < expirationDate, "Expiration date not in the future");
        
        collateralAsset = IERC20(collateralAddress);

        address optionContractAddress = optionsContracts[collateralAddress][expirationDate][strike];

        if (optionContractAddress == address(0)) {
            string memory name = "COLL";
            string memory symbol = "COL";
            collateralToken = new CollateralToken(name, symbol, collateralAddress, expirationDate, strike);
            optionToken = new OptionToken(name, symbol, collateralAddress, address(collateralToken), expirationDate, strike);
            optionContractAddress = address(optionToken);
            optionsContracts[collateralAddress][expirationDate][strike] = optionContractAddress;
            contracts.push(optionContractAddress);
            userContracts[msg.sender].push(optionContractAddress);
            console.log("New Option Address",optionContractAddress);
            console.log("New Collat Address",address(collateralToken));

            console.log("new Token created");
            emit OptionCreated(optionContractAddress, amount);

        } else {
            emit OptionCreated(optionContractAddress, amount);

            optionToken = OptionToken(optionContractAddress);
            collateralToken = CollateralToken(optionToken.collateralTokenAddress());

            console.log("Old Token created");
        }
        // Transfer ownership of the collateral asset to the contract
        collateralAsset.safeTransferFrom(msg.sender, address(this), amount);

        // Mint option and collateral tokens to the user
        optionToken.mint(msg.sender, amount);
        collateralToken.mint(msg.sender, amount);

        emit OptionCreated(optionContractAddress, amount);
        return optionContractAddress;
    }
    // address: user wallet address
    // expirationDate: epoch date set by user
    // strike: user choose dollar
    // amount: amount user choose to collate(<= total value)

    function exerciseOption(address optionAddress, uint256 amount) external  {
        optionToken = OptionToken(optionAddress);
        require(block.timestamp <= optionToken.expirationDate(), "Option expired");
        require(optionToken.balanceOf(msg.sender) >= amount, "Insufficient option tokens");
        require(optionToken.balanceOf(msg.sender) > 0, "Insufficient option tokens");

        collateralToken = CollateralToken(optionToken.collateralTokenAddress());
        uint256 usdcAmount = amount * optionToken.strike() / 1e18;
        address[] memory owners = collateralToken.checkBalances(amount);
        address owner;
        for (uint256 i = 0; i < owners.length && i < 100; i++) {
            owner = owners[i];
            if (collateralToken.balanceOf(owner)>amount){
                collateralToken.burn(owner, amount);
                usdcToken.safeTransferFrom(msg.sender, owner, usdcAmount);

                optionToken.burn(msg.sender, amount);
                collateralAsset.safeTransfer(msg.sender, amount);
                break;
                }
            }

        emit OptionExercised(msg.sender, amount);
    }

    function unlockCollateral(address optionAddress, uint256 amount) external  {
        optionToken = OptionToken(optionAddress);
        collateralToken = CollateralToken(optionToken.collateralTokenAddress());

        if (block.timestamp <= optionToken.expirationDate()) {
            require(
                optionToken.balanceOf(msg.sender) >= amount && 
                collateralToken.balanceOf(msg.sender) >= amount, 
                "Must own both option and collateral tokens"
            );
            optionToken.burn(msg.sender, amount);
        } else {
            require(collateralToken.balanceOf(msg.sender) >= amount, "Insufficient collateral tokens");
        }

        collateralToken.burn(msg.sender, amount);
        collateralAsset.safeTransfer(msg.sender, amount);

        emit CollateralUnlocked(msg.sender, amount);
    }

}