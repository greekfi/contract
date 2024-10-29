// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./OptionBase.sol";

contract ShortOption is OptionBase {

    address public longOption;

    constructor(
        string memory name, 
        string memory symbol, 
        address collateralAddress, 
        address considerationAddress,
        uint256 expirationDate, 
        uint256 strike,
        bool isPut
        ) OptionBase(name, symbol, collateralAddress, considerationAddress, expirationDate, strike, isPut) {

        longOption = msg.sender;
        }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        collateral.transferFrom(to, address(this), amount);
    }

    function redeem(address to, uint256 amount) public expired {
        if(balanceOf(to) == 0) {
            revert NoBalance();
        }

        if (getCollateralBalance() >= amount) {
            collateral.transfer(to, amount);
            burn(to, amount);
        } else {
            consideration.transfer(to, amount * strike);
            burn(to, amount);
        }
    }

    function exercise(address contractHolder, uint256 amount) public notExpired {
        collateral.transfer(contractHolder, amount);
        consideration.transferFrom(contractHolder, address(this), amount * strike);
    }
}