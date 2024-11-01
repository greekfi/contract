// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/ReentrancyGuard.sol";

// The Long Option contract is the owner of the Short Option contract
// The Long Option contract is the only one that can mint new options
// The Long Option contract is the only one that can exercise options
// The redemption is only possible if you own both the Long and Short Option contracts but 
// performed by the Long Option contract

// In options traditionally a Consideration is cash and a Collateral is an asset
// Here, we do not distinguish between the Cash and Asset concept and allow consideration
// to be any asset and collateral to be any asset as well. This can allow wETH to be used
// as collateral and wBTC to be used as consideration. Similarly, staked ETH can be used
// or even staked stable coins can be used as well for either consideration or collateral.

contract OptionBase is ERC20, ReentrancyGuard {

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
    error InsufficientBalance(string message);
    error InvalidStrike();
    error InvalidExpiration();
    error InvalidAmount();

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

    modifier validAmount(uint256 amount) {
        if (amount < 1) revert InvalidAmount();
        _;
    }

    modifier sufficientBalance(address contractHolder, uint256 amount) {
        if (balanceOf(contractHolder) < amount) {
            revert InsufficientBalance("Insufficient balance");
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
        if (_strikeNum == 0) revert InvalidStrike();
        if (_expirationDate < block.timestamp) revert InvalidExpiration();

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

    function burn(address from, uint256 amount) private {
        _burn(from, amount);
    }


}

contract ShortOption is OptionBase, Ownable {

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
        )
        Ownable(msg.sender)
        OptionBase(name, symbol, collateralAddress, considerationAddress, expirationDate, strikeNum, strikeDen, isPut) {

        longOption = msg.sender;
        }

    function mint(address to, uint256 amount) public onlyOwner sufficientCollateral(to, amount) validAmount(amount) {
        mint__(to, amount);
    }

    function mint__(address to, uint256 amount) private nonReentrant sufficientCollateral(to, amount) validAmount(amount) {
        _mint(to, amount);
        collateral.transferFrom(to, address(this), amount);
    }

    function redeem_(address to, uint256 amount) private nonReentrant sufficientBalance(to, amount) validAmount(amount){

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

    // The redemption is only possible if the option is expired
    // The redemption can actually be performed by anyone because it's a safe function
    // The result is that the actual owner of the Short Option will get the collateral or consideration
    function redeem(address to, uint256 amount) public expired sufficientBalance(to, amount) {
        redeem_(to, amount);
    }


    function redeemPair(address to, uint256 amount) public notExpired onlyOwner() sufficientBalance(to, amount) {
        redeem_(to, amount);
    }

    function exercise_(address contractHolder, uint256 amount) private nonReentrant notExpired onlyOwner(){
        collateral.transfer(contractHolder, amount);
        // Update consideration calculation
        uint256 considerationAmount = (amount * strikeNum) / strikeDen;
        consideration.transferFrom(contractHolder, address(this), considerationAmount);
    }

    function exercise(address contractHolder, uint256 amount) public notExpired onlyOwner() {
        exercise_(contractHolder, amount);
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
    address public shortOptionAddress;
    ShortOption public shortOption;

    event LongOptionCreated(
        address optionContractAddress,
        address collateralAddress, 
        address shortOptionAddress,
        uint256 expirationDate, 
        uint256 strikeNum,
        uint256 strikeDen, 
        bool isPut
    );

    modifier sufficientShortBalance(address contractHolder, uint256 amount) {
        if (shortOption.balanceOf(contractHolder) < amount) {
            revert InsufficientBalance();
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
        shortOptionAddress = address(shortOption);

        emit LongOptionCreated(
            address(this),
            collateralAddress, 
            shortOptionAddress, 
            expirationDate, 
            strikeNum,
            strikeDen, 
            isPut
        );
    } 

    function mint( uint256 amount) public nonReentrant validAmount(amount) {
        address contractHolder = msg.sender;
        _mint(contractHolder, amount);
        shortOption.mint(contractHolder, amount);
    }

    function exercise(uint256 amount) public notExpired nonReentrant validAmount(amount) {
        address contractHolder = msg.sender;
        burn(contractHolder, amount);
        shortOption.exercise(contractHolder, amount);
    }

    function redeem(uint256 amount) 
        public 
        notExpired 
        nonReentrant
        sufficientBalance(msg.sender, amount) 
        sufficientShortBalance(msg.sender, amount) 
        validAmount(amount){

        address contractHolder = msg.sender;
        shortOption.redeemPair(contractHolder, amount);
        burn(contractHolder, amount);
    }
}

contract OptionFactory is Ownable {
    address[] public createdOptions;


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
        createdOptions.push(address(optionToken));
        emit OptionCreated(address(optionToken), collateralAddress, considerationAddress, expirationDate, strikeNum, strikeDen, isPut);
    }

}