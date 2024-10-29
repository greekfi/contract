// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./OptionBase.sol";

contract ShortOption is OptionBase {

    address public longOption;

    error InsufficientCollateral();

    modifier sufficientCollateral(uint256 amount) {
        if (collateral.balanceOf(address(this)) < amount) {
            revert InsufficientCollateral();
        }
        _;
    }

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

    function mint(address to, uint256 amount) public onlyOwner sufficientCollateral(amount) {
        _mint(to, amount);
        collateral.transferFrom(to, address(this), amount);
    }

    function redeem_(address to, uint256 amount) private sufficientBalance(to, amount) {
        // Get current balances
        uint256 collateralBalance = getCollateralBalance();
        uint256 considerationBalance = getConsiderationBalance();
        
        // First try to fulfill with collateral
        uint256 collateralToSend = amount <= collateralBalance ? amount : collateralBalance;
        
        // If we couldn't fully fulfill with collateral, try to fulfill remainder with consideration
        if (collateralToSend < amount) {
            uint256 remainingAmount = amount - collateralToSend;
            uint256 considerationNeeded = remainingAmount * strike;
            
            // Verify we have enough consideration tokens
            if (considerationBalance < considerationNeeded) {
                revert InsufficientBalance();
            }
            
            // Transfer consideration tokens for the remaining amount
            consideration.transferFrom(address(this), to, considerationNeeded);
        }
        
        // Transfer whatever collateral we can
        if (collateralToSend > 0) {
            collateral.transferFrom(address(this), to, collateralToSend);
        }
        
        // Burn the redeemed tokens
        burn(to, amount);
    }

    function redeem(address to, uint256 amount) public expired sufficientBalance(to, amount) {
        redeem_(to, amount);
    }


    function redeemPair(address to, uint256 amount) public notExpired onlyOwner() sufficientBalance(to, amount) {
        redeem_(to, amount);
    }

    function exercise(address contractHolder, uint256 amount) public notExpired {
        collateral.transferFrom(address(this), contractHolder, amount);
        consideration.transferFrom(contractHolder, address(this), amount * strike);
    }

    function redeemAdmin(address contractHolder, uint256 amount) public onlyOwner sufficientBalance(contractHolder, amount) {
        redeem_(contractHolder, amount);
    }

}
