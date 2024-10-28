// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ShortOption.sol";
import "./OptionBase.sol";


contract LongOption is OptionBase {
    address public shortOptionAdress;
    ShortOption public shortOption;


    event OptionTokenCreated(address collateralAddress, address shortOptionAdress,uint256 expirationDate, uint256 strikePrice);

    constructor (
        string memory name,
        string memory symbol,
        address _collateralAddress,
        address _considerationAddress,
        uint256 _expirationDate,
        uint256 _strike,
        bool _isPut
        
    ) OptionBase(name, symbol, _collateralAddress, _considerationAddress, _expirationDate, _strike, _isPut) {
        shortOption = new ShortOption(name, symbol, _collateralAddress, _considerationAddress, _expirationDate, _strike, _isPut);
        shortOptionAdress = address(shortOption);

        emit OptionTokenCreated(collateralAddress, shortOptionAdress, expirationDate, strike);
    } 

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
        shortOption.mint(to, amount);
    }

    function exercise(address contractHolder, uint256 amount) public notExpired {
        shortOption.exercise(contractHolder, amount);
        burn(contractHolder, amount);
    }

    function redeem(address contractHolder, uint256 amount) public notExpired {
        if (shortOption.balanceOf(contractHolder) >= amount) {
            shortOption.redeem(contractHolder, amount);
        } else {
            revert InsufficientOptionBalance();
        }
    }


}