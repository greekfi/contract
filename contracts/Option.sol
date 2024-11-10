// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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

contract OptionBase is ERC20, Ownable, ReentrancyGuard {

    address public collateralAddress;
    address public considerationAddress;
    uint256 public  expirationDate;
    uint256 public  strike;
    bool public isPut;
    IERC20 public collateral;
    IERC20 public consideration;

    error ContractNotExpired();
    error ContractExpired();
    error InsufficientBalance();
    error InvalidStrike();
    error InvalidExpiration();
    error InvalidAmount();

    modifier expired() {
        if (block.timestamp < expirationDate) revert ContractNotExpired();
        _;
    }

    modifier notExpired() {
        if (block.timestamp >= expirationDate) revert ContractExpired();
        
        _;
    }

    modifier validAmount(uint256 amount) {
        if (amount < 1) revert InvalidAmount();
        _;
    }

    modifier sufficientBalance(address contractHolder, uint256 amount) {
        if (balanceOf(contractHolder) < amount) revert InsufficientBalance();
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
        ) ERC20(name, symbol) Ownable(msg.sender) ReentrancyGuard() {

        if (_strike == 0) revert InvalidStrike();
        if (_expirationDate < block.timestamp) revert InvalidExpiration();

        expirationDate = _expirationDate;
        strike = _strike;
        collateralAddress = _collateralAddress;
        considerationAddress = _considerationAddress;
        isPut = _isPut;
        collateral = IERC20(_collateralAddress);
        consideration = IERC20(_considerationAddress);

        }

}

contract ShortOption is OptionBase {

    address public longOption;

    modifier sufficientCollateral(address contractHolder, uint256 amount) {
        if (collateral.balanceOf(contractHolder) < amount) {
            revert InsufficientBalance();
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
        )
        OptionBase(name, symbol, collateralAddress, considerationAddress, expirationDate, strike, isPut) {

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
        uint256 collateralBalance = collateral.balanceOf(address(this));
        uint256 considerationBalance = consideration.balanceOf(address(this));
        
        // First try to fulfill with collateral
        uint256 collateralToSend = amount <= collateralBalance ? amount : collateralBalance;
        
        // Burn the redeemed tokens
        _burn(to, amount);
        // If we couldn't fully fulfill with collateral, try to fulfill remainder with consideration
        if (collateralToSend < amount) {
            uint256 remainingAmount = amount - collateralToSend;
            uint256 considerationNeeded = (remainingAmount * strike) / 10**18;
            
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

    function redeemConsideration_(address to, uint256 amount) private nonReentrant sufficientBalance(to, amount) validAmount(amount){
        // Verify we have enough consideration tokens
        if (consideration.balanceOf(address(this)) < amount) revert InsufficientBalance();
        _burn(to, amount);
        // Transfer consideration tokens for the remaining amount
        consideration.transfer(to, (amount * strike) / 10**18);
        
    }

    // The redemption is only possible if the option is expired
    // The redemption can actually be performed by anyone because it's a safe function
    // The result is that the actual owner of the Short Option will get the collateral or consideration
    function redeem(address to, uint256 amount) public expired sufficientBalance(to, amount) {
        redeem_(to, amount);
    }

    function redeemConsideration(address to, uint256 amount) public  sufficientBalance(to, amount) expired {
        redeemConsideration_(to, amount);
    }


    function redeemPair(address to, uint256 amount) public notExpired onlyOwner() sufficientBalance(to, amount) {
        redeem_(to, amount);
    }

    function exercise_(address contractHolder, uint256 amount) private nonReentrant notExpired onlyOwner(){
        collateral.transfer(contractHolder, amount);
        // Update consideration calculation
        consideration.transferFrom(contractHolder, address(this), (amount * strike) / 10**18);
    }

    function exercise(address contractHolder, uint256 amount) public notExpired onlyOwner() {
        exercise_(contractHolder, amount);
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
        uint256 strike,
        bool isPut
    );

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
        shortOption = new ShortOption(
            name, 
            symbol, 
            collateralAddress, 
            considerationAddress, 
            expirationDate, 
            strike,
            isPut
        );
        shortOptionAddress = address(shortOption);

        emit LongOptionCreated(
            address(this),
            collateralAddress, 
            shortOptionAddress, 
            expirationDate, 
            strike,
            isPut
        );
    } 

    function mint( uint256 amount) public nonReentrant validAmount(amount) {
        _mint(msg.sender, amount);
        shortOption.mint(msg.sender, amount);
    }

    function exercise(uint256 amount) public notExpired nonReentrant validAmount(amount) {
        _burn(msg.sender, amount);
        shortOption.exercise(msg.sender, amount);
    }

    function redeem(uint256 amount) 
        public 
        notExpired 
        nonReentrant
        sufficientBalance(msg.sender, amount) 
        validAmount(amount){
        if (shortOption.balanceOf(msg.sender) < amount) revert InsufficientBalance();

        address contractHolder = msg.sender;
        shortOption.redeemPair(contractHolder, amount);
        _burn(contractHolder, amount);
    }
}

contract OptionFactory is Ownable {

    event LongOptionCreated(
        address optionContractAddress,
        address collateralAddress, 
        address shortOptionAddress,
        uint256 expirationDate, 
        uint256 strike,
        bool isPut
    );
    address[] public createdOptions;

    constructor() Ownable(msg.sender) {}

    function createOption(
        string memory name, 
        string memory symbol, 
        address collateralAddress, 
        address considerationAddress, 
        uint256 expirationDate, 
        uint256 strike,
        bool isPut
        ) public {

        LongOption longOption = new LongOption(name, symbol, collateralAddress, considerationAddress, expirationDate, strike, isPut);
        createdOptions.push(address(longOption));

        emit LongOptionCreated(
            address(longOption),
            collateralAddress, 
            longOption.shortOptionAddress(),
            expirationDate, 
            strike,
            isPut
        );
    }

    function getCreatedOptions() public view returns (address[] memory) {
        return createdOptions;
    }

}