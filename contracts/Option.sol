// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OptionToken is ERC20 {
    address public collateralTokenAddress;
    address public collateralAddress;
    uint256 public  expirationDate;
    uint256 public  strike;

    event OptionTokenCreated(address collateralAddress, address collateralTokenAddress,uint256 expirationDate, uint256 strikePrice);

    constructor (
        string memory name,
        string memory symbol,
        address _collateralAddress,
        address _collateralTokenAddress,
        uint256 _expirationDate,
        uint256 _strike
    ) ERC20(name, symbol) {
        expirationDate = _expirationDate;
        strike = _strike;
        collateralAddress = _collateralAddress;
        collateralTokenAddress = _collateralTokenAddress;
        emit OptionTokenCreated(collateralAddress, collateralTokenAddress, expirationDate, strike);
    } 

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public {
        _burn(from, amount);
    }

    function isExpired() public view returns (bool) {
        return block.timestamp > expirationDate;
    }

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        require(!isExpired(), "Option has expired");
        return super.transfer(recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        require(!isExpired(), "Option has expired");
        return super.transferFrom(sender, recipient, amount);
    }

    function setMetadata(uint256 _expirationDate, uint256 _strikePrice) public {
    
        expirationDate = _expirationDate;
        strike = _strikePrice;
    }
}