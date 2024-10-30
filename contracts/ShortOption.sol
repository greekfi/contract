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
        uint256 strikeNum,
        uint256 strikeDen,
        bool isPut
        ) OptionBase(name, symbol, collateralAddress, considerationAddress, expirationDate, strikeNum, strikeDen, isPut) {

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
            uint256 considerationNeeded = (remainingAmount * strikeNum) / strikeDen;
            
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
        // Update consideration calculation
        uint256 considerationAmount = (amount * strikeNum) / strikeDen;
        consideration.transferFrom(contractHolder, address(this), considerationAmount);
    }

    function redeemAdmin(address contractHolder, uint256 amount) public onlyOwner sufficientBalance(contractHolder, amount) {
        redeem_(contractHolder, amount);
    }

    function isBalanced() public view returns (bool) {
        return strikeNum * vaultCollateral() + vaultConsideration() * strikeDen == strikeNum * totalSupply();
    }
    function vaultCollateral() public view returns (uint256) {
        return collateral.balanceOf(address(this));
    }

    function vaultConsideration() public view returns (uint256) {
        return consideration.balanceOf(address(this));
    }

}
