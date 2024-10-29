// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OptionBase is ERC20, Ownable {

    address public collateralAddress;
    address public considerationAddress;
    uint256 public  expirationDate;
    uint256 public  strike;
    address[] public owners;
    bool public isPut;
    IERC20 public collateral;
    IERC20 public consideration;

    error ContractNotExpired();
    error ContractExpired();
    error InsufficientOptionBalance();
    error NoBalance();

    modifier expired() {
        if (block.timestamp >= expirationDate) {
            revert ContractNotExpired();
        }
        _;
    }

    modifier notExpired() {
        if (block.timestamp < expirationDate) {
            revert ContractExpired();
        }
        _;
    }

    constructor(
        string memory name, 
        string memory symbol, 
        address _collateralAddress, 
        address _considerationAddress,
        uint256 _expirationDate, 
        uint256 _strike,
        bool _isPut
        ) ERC20(name, symbol) Ownable(msg.sender) {

        expirationDate = _expirationDate;
        strike = _strike;
        collateralAddress = _collateralAddress;
        considerationAddress = _considerationAddress;
        isPut = _isPut;
        collateral = IERC20(_collateralAddress);
        consideration = IERC20(_considerationAddress);

        }


    function getCollateralBalance() public view returns (uint256) {
        return collateral.balanceOf(address(this));
    }

    function getConsiderationBalance() public view returns (uint256) {
        return consideration.balanceOf(address(this));
    }

    function isExpired() public view returns (bool) {
        return block.timestamp >= expirationDate;
    }
    function isNotExpired() public view returns (bool) {
        return block.timestamp >= expirationDate;
    }

    function optionType() public view returns (string memory) {
        if (isPut) {
            return "PUT";
        } else {
            return "CALL";
        }
    }

    function burn(address from, uint256 amount) public {
        _burn(from, amount);
    }

     function transfer(address to, uint256 value) public override returns (bool) {

        emit Transfer(msg.sender, to, value);
        return super.transfer(to, value);
    }

     function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        return super.transferFrom(from, to, value);
    }
}