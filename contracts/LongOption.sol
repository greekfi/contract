// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ShortOption.sol";
import "./OptionBase.sol";

contract LongOption is OptionBase {
    address public shortOptionAdress;
    ShortOption public shortOption;

    event OptionTokenCreated(address collateralAddress, address shortOptionAdress,uint256 expirationDate, uint256 strikePrice, bool isPut);


    modifier sufficientShortBalance(address contractHolder, uint256 amount) {
        if (shortOption.balanceOf(contractHolder) < amount) {
            revert InsufficientOptionBalance();
        }
        _;
    }

    constructor (
        string memory name,
        string memory symbol,
        address collateralAddress,
        address considerationAddress,
        uint256 expirationDate,
        uint256 strike,
        bool isPut
        
    ) OptionBase(
        name, 
        symbol, 
        collateralAddress, 
        considerationAddress, 
        expirationDate, 
        strike, 
        isPut
        ) {

            shortOption = new ShortOption(name, symbol, collateralAddress, considerationAddress, expirationDate, strike, isPut);
            shortOptionAdress = address(shortOption);

            emit OptionTokenCreated(collateralAddress, shortOptionAdress, expirationDate, strike, isPut);
    } 

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
        shortOption.mint(to, amount);
    }

    function exercise(address contractHolder, uint256 amount) public notExpired {
        shortOption.exercise(contractHolder, amount);
        burn(contractHolder, amount);
    }

    function redeem(address contractHolder, uint256 amount) 
        public 
        notExpired 
        sufficientBalance(contractHolder, amount) 
        sufficientShortBalance(contractHolder, amount) {
            shortOption.redeemPair(contractHolder, amount);
            burn(contractHolder, amount);
    }
}