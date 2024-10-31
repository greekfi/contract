// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/ReentrancyGuard.sol";

contract OptionBase is ERC20, Ownable, ReentrancyGuard {

    address public collateralAddress;
    address public considerationAddress;
    uint256 public  expirationDate;
    uint256 public  strikeNum;
    uint256 public  strikeDen;
    bool public isPut;
    IERC20 public collateral;
    IERC20 public consideration;

    error ContractNotExpired();
    error ContractExpired();
    error InsufficientOptionBalance();
    error InsufficientBalance();
    error NoBalance();
    error InvalidStrike();

    modifier expired() {
        if (block.timestamp < expirationDate) {
            revert ContractNotExpired();
        }
        _;
    }

    modifier notExpired() {
        if (block.timestamp >= expirationDate) {
            revert ContractExpired();
        }
        _;
    }

    modifier sufficientBalance(address contractHolder, uint256 amount) {
        if (balanceOf(contractHolder) < amount) {
            revert InsufficientOptionBalance();
        }
        _;
    }

    constructor(
        string memory name, 
        string memory symbol, 
        address _collateralAddress, 
        address _considerationAddress,
        uint256 _expirationDate, 
        uint256 _strikeNum,
        uint256 _strikeDen,
        bool _isPut
        ) ERC20(name, symbol) Ownable(msg.sender) ReentrancyGuard() {

        if (_strikeDen == 0) revert InvalidStrike();

        expirationDate = _expirationDate;
        strikeNum = _strikeNum;
        strikeDen = _strikeDen;
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
        return block.timestamp < expirationDate;
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


}

contract ShortOption is OptionBase {

    address public longOption;

    error InsufficientCollateral();

    modifier sufficientCollateral(address contractHolder, uint256 amount) {
        if (collateral.balanceOf(contractHolder) < amount) {
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

    function mint(address to, uint256 amount) public onlyOwner sufficientCollateral(to, amount) {
        _mint(to, amount);
        collateral.transferFrom(to, address(this), amount);
    }

    function redeem_(address to, uint256 amount) private sufficientBalance(to, amount) {
        // Get current balances
        uint256 collateralBalance = getCollateralBalance();
        uint256 considerationBalance = getConsiderationBalance();
        
        // First try to fulfill with collateral
        uint256 collateralToSend = amount <= collateralBalance ? amount : collateralBalance;
        
        // Burn the redeemed tokens
        burn(to, amount);
        // If we couldn't fully fulfill with collateral, try to fulfill remainder with consideration
        if (collateralToSend < amount) {
            uint256 remainingAmount = amount - collateralToSend;
            uint256 considerationNeeded = (remainingAmount * strikeNum) / strikeDen;
            
            // Verify we have enough consideration tokens
            if (considerationBalance < considerationNeeded) {
                revert InsufficientBalance();
            }
            
            // Transfer consideration tokens for the remaining amount
            consideration.transfer(to, considerationNeeded);
        }
        
        // Transfer whatever collateral we can
        if (collateralToSend > 0) {
            collateral.transfer(to, collateralToSend);
        }
        
    }

    function redeem(address to, uint256 amount) public expired sufficientBalance(to, amount) {
        redeem_(to, amount);
    }


    function redeemPair(address to, uint256 amount) public notExpired onlyOwner() sufficientBalance(to, amount) {
        redeem_(to, amount);
    }

    function exercise(address contractHolder, uint256 amount) public notExpired onlyOwner(){
        collateral.transfer(contractHolder, amount);
        // Update consideration calculation
        uint256 considerationAmount = (amount * strikeNum) / strikeDen;
        consideration.transferFrom(contractHolder, address(this), considerationAmount);
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

contract LongOption is OptionBase {
    address public shortOptionAdress;
    ShortOption public shortOption;

    event LongOptionCreated(
        address optionContractAddress,
        address collateralAddress, 
        address shortOptionAdress,
        uint256 expirationDate, 
        uint256 strikeNum,
        uint256 strikeDen, 
        bool isPut
    );

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
        uint256 strikeNum,
        uint256 strikeDen,
        bool isPut
    ) OptionBase(
        name, 
        symbol, 
        collateralAddress, 
        considerationAddress, 
        expirationDate, 
        strikeNum, 
        strikeDen, 
        isPut
    ) {
        shortOption = new ShortOption(
            name, 
            symbol, 
            collateralAddress, 
            considerationAddress, 
            expirationDate, 
            strikeNum,
            strikeDen, 
            isPut
        );
        shortOptionAdress = address(shortOption);

        emit LongOptionCreated(
            address(this),
            collateralAddress, 
            shortOptionAdress, 
            expirationDate, 
            strikeNum,
            strikeDen, 
            isPut
        );
    } 

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
        shortOption.mint(to, amount);
    }

    function exercise(uint256 amount) public notExpired onlyOwner() {
        address contractHolder = msg.sender;
        shortOption.exercise(contractHolder, amount);
        burn(contractHolder, amount);
    }

    function redeem(uint256 amount) 
        public 
        notExpired 
        onlyOwner()
        sufficientBalance(msg.sender, amount) 
        sufficientShortBalance(msg.sender, amount) {

        address contractHolder = msg.sender;
        shortOption.redeemPair(contractHolder, amount);
        burn(contractHolder, amount);
    }
}

contract OptionFactory is Ownable {


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

    function createOption(
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
        emit OptionCreated(address(optionToken), collateralAddress, considerationAddress, expirationDate, strikeNum, strikeDen, isPut);
    }

}