// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CollateralToken is ERC20 {

    address public collateralAddress;
    uint256 public  expirationDate;
    uint256 public  strike;
    address[] public owners;

    constructor(
        string memory name, 
        string memory symbol, 
        address _collateralAddress, 
        uint256 _expirationDate, 
        uint256 _strike
        ) ERC20(name, symbol) {

        expirationDate = _expirationDate;
        strike = _strike;
        collateralAddress = _collateralAddress;
        }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
        owners.push(to);
    }

    function burn(address from, uint256 amount) public {
        _burn(from, amount);
    }

     function transfer(address to, uint256 value) public override returns (bool) {
        owners.push(to);
        return super.transfer(to, value);
    }

     function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        owners.push(to);
        return super.transferFrom(from, to, value);
    }

    function checkBalances(uint256 amount) public view returns (address[] memory) {
        address[] memory qualifiedOwners;
        uint256 count;

        for (uint256 i = 0; i < owners.length && i < 100; i++) {
            address owner = owners[i];
            if (balanceOf(owner) >= amount) {
                qualifiedOwners[count] = owner;
                count++;
            }
        }

        // Resize the array to the actual number of qualified owners
        address[] memory result = new address[](count);
        for (uint256 j = 0; j < count; j++) {
            result[j] = qualifiedOwners[j];
        }

        return result;
    }
    
}