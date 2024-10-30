// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./LongOption.sol";
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract OptionsFactory is Ownable {

    mapping (bool=>mapping(address=>mapping(address=>mapping(uint256=>mapping(uint256=>mapping(uint256=>address)))))) optionsContracts;
    mapping (address=>address[]) public userContracts;
    address[] public contracts;

    event OptionCreated(
        address optionContractAddress, 
        address indexed collateralAddress, 
        address indexed considerationAddress, 
        uint256 indexed expirationDate, 
        uint256 strikeNum, 
        uint256 strikeDen, 
        bool isPut
    );

    constructor(
    ) Ownable(msg.sender) {
    }

    function mint(
        string memory name, 
        string memory symbol, 
        address collateralAddress, 
        address considerationAddress, 
        uint256 expirationDate, 
        uint256 strikeNum,
        uint256 strikeDen, 
        bool isPut
        ) public {

        LongOption optionToken = new LongOption(name, symbol, collateralAddress, considerationAddress, expirationDate, strikeNum, strikeDen, isPut);
        address optionContractAddress = address(optionToken);
        optionsContracts[isPut][collateralAddress][considerationAddress][expirationDate][strikeNum][strikeDen] = optionContractAddress;
        contracts.push(optionContractAddress);
        userContracts[msg.sender].push(optionContractAddress);
        emit OptionCreated(optionContractAddress, collateralAddress, considerationAddress, expirationDate, strikeNum, strikeDen, isPut);
    }

    function getOptionContractAddress(address collateralAddress, address considerationAddress, uint256 expirationDate, uint256 strikeNum, uint256 strikeDen, bool isPut) public view returns (address){
        return optionsContracts[isPut][collateralAddress][considerationAddress][expirationDate][strikeNum][strikeDen];
    }
}