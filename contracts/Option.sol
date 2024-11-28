// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

using SafeERC20 for IERC20;
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

    uint256 public  expirationDate;
    uint256 public  strike;
    uint256 public constant STRIKE_DECIMALS = 10**18;
    // The strike price includes the ratio of the consideration to the collateral
    // and the decimal difference between the consideration and collateral along
    // with the strike decimals of 18. 
    bool public isPut;
    IERC20 public collateral;
    IERC20 public consideration;
    error ContractNotExpired();
    error ContractExpired();
    error InsufficientBalance();
    error InvalidValue();

    modifier expired() {
        if (block.timestamp < expirationDate) revert ContractNotExpired();
        _;
    }

    modifier notExpired() {
        if (block.timestamp >= expirationDate) revert ContractExpired();
        
        _;
    }

    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidValue();
        _;
    }

    modifier sufficientBalance(address contractHolder, uint256 amount) {
        if (balanceOf(contractHolder) < amount) revert InsufficientBalance();
        _;
    }


    constructor(
        string memory name, 
        string memory symbol, 
        address _collateral, 
        address _consideration,
        uint256 _expirationDate, 
        uint256 _strike,
        bool _isPut
        ) 
        ERC20(name, symbol) 
        Ownable(msg.sender) 
        ReentrancyGuard() {


        expirationDate = _expirationDate;
        strike = _strike;
        isPut = _isPut;
        collateral = IERC20(_collateral);
        consideration = IERC20(_consideration);
        }

        function toConsideration(uint256 amount) public view returns (uint256 ) {
            // The strike price actually contains the ratio of Consideration
            // over Collateral including the decimals associated. The ratio is 
            // multiplied by 10**18 as is the standard convention. That's why 
            // we eventually divide by the STRIKE_DECIMALS.
            return (amount * strike)/ STRIKE_DECIMALS;
        }

}

contract ShortOption is OptionBase {

    address public longOption;

    event Redemption(
        address longOption,
        address holder,
        uint256 amount
    );

    modifier sufficientCollateral(address contractHolder, uint256 amount) {
        if (collateral.balanceOf(contractHolder) < amount) {
            revert InsufficientBalance();
        }
        _;
    }

    constructor(
        string memory name, 
        string memory symbol, 
        address collateral, 
        address consideration,
        uint256 expirationDate, 
        uint256 strike,
        bool isPut
        ) OptionBase(name, symbol, collateral, consideration, expirationDate, strike, isPut) {
        }
    function setLongOption(address longOption_) public onlyOwner() {
        longOption = longOption_;
    }

    function mint(address to, uint256 amount) public onlyOwner sufficientCollateral(to, amount) validAmount(amount) {
        __mint(to, amount);
    }

    function __mint(address to, uint256 amount) private nonReentrant sufficientCollateral(to, amount) validAmount(amount) {
        collateral.safeTransferFrom(to, address(this), amount);
        _mint(to, amount);
    }

    function _redeem(address to, uint256 amount) private nonReentrant sufficientBalance(to, amount) validAmount(amount){

        uint256 collateralBalance = collateral.balanceOf(address(this));
        uint256 considerationBalance = consideration.balanceOf(address(this));
        
        // First try to fulfill with collateral
        uint256 collateralToSend = amount <= collateralBalance ? amount : collateralBalance;
        
        // Burn the redeemed tokens
        _burn(to, amount);
        // If we couldn't fully fulfill with collateral, try to fulfill remainder with consideration
        if (collateralToSend < amount) {
            uint256 remainingAmount = amount - collateralToSend;
            uint256 considerationNeeded = toConsideration(remainingAmount);
            
            // Verify we have enough consideration tokens; this should never happen
            if (considerationBalance < considerationNeeded) {
                revert InsufficientBalance();
            }
            
            // Transfer consideration tokens for the remaining amount
            consideration.safeTransfer(to, considerationNeeded);
        }
        
        // Transfer whatever collateral we can
        if (collateralToSend > 0) {
            collateral.safeTransfer(to, collateralToSend);
        }
        emit Redemption(address(longOption), to, amount);

    }

    function _redeemConsideration(address to, uint256 amount) private nonReentrant sufficientBalance(to, amount) validAmount(amount){
        // Verify we have enough consideration tokens
        if (consideration.balanceOf(address(this)) < amount) revert InsufficientBalance();
        _burn(to, amount);
        // Transfer consideration tokens for the remaining amount
        consideration.safeTransfer(to, toConsideration(amount));
        emit Redemption(address(longOption), to, amount);

    }

    function redeem(uint256 amount) public expired sufficientBalance(msg.sender, amount) {
        _redeem(msg.sender, amount);
    }

    function redeemConsideration(uint256 amount) public sufficientBalance(msg.sender, amount) expired {
        _redeemConsideration(msg.sender, amount);
    }

    function _redeemPair(address to, uint256 amount) public notExpired onlyOwner() sufficientBalance(to, amount) {
        _redeem(to, amount);
    }

    function __exercise(address contractHolder, uint256 amount) private nonReentrant notExpired onlyOwner() {
        // uint256 considerationAmount = toConsideration(amount);
        // if (consideration.balanceOf(contractHolder) < considerationAmount) revert InsufficientBalance();

        consideration.safeTransferFrom(contractHolder, address(this), toConsideration(amount));
        collateral.safeTransfer(contractHolder, amount);
    }

    function _exercise(address contractHolder, uint256 amount) public notExpired onlyOwner() {
        __exercise(contractHolder, amount);
    }

}

contract LongOption is OptionBase {
    ShortOption public shortOption;


    event Exercise(
        address longOption,
        address holder,
        uint256 amount
    );

    constructor (
        string memory name,
        string memory symbol,
        address collateral,
        address consideration,
        uint256 expirationDate,
        uint256 strike,
        bool isPut,
        address shortOptionAddress_
    ) OptionBase(
        name, 
        symbol, 
        collateral, 
        consideration, 
        expirationDate, 
        strike, 
        isPut
    ) {
        shortOption = ShortOption(shortOptionAddress_);


    } 

    function mint( uint256 amount) public nonReentrant validAmount(amount) {
        _mint(msg.sender, amount);
        shortOption.mint(msg.sender, amount);
    }

    function exercise(uint256 amount) public notExpired nonReentrant validAmount(amount) {
        _burn(msg.sender, amount);
        shortOption._exercise(msg.sender, amount);
        emit Exercise(address(this), msg.sender, amount);
    }

    function redeem(uint256 amount) 
        public 
        notExpired 
        nonReentrant
        sufficientBalance(msg.sender, amount) 
        validAmount(amount){
        if (shortOption.balanceOf(msg.sender) < amount) revert InsufficientBalance();

        address contractHolder = msg.sender;
        _burn(contractHolder, amount);
        shortOption._redeemPair(contractHolder, amount);
    }
}

contract OptionFactory is Ownable {

    event LongOptionCreated(
        address longOption,
        address shortOption,
        address collateral, 
        address consideration,
        uint256 expirationDate, 
        uint256 strike,
        bool isPut
    );

    error InvalidValue();
    address[] public createdOptions;
    mapping (uint256 => address[])  public shortLong;

    mapping(address => mapping(uint256 => mapping(uint256 => address[]))) public allOptions;

    constructor() Ownable(msg.sender) {}

    function createOption(
        string memory longOptionName, 
        string memory shortOptionName,
        string memory longSymbol,
        string memory shortSymbol,
        address collateral, 
        address consideration, 
        uint256 expirationDate, 
        uint256 strike,
        bool isPut
        ) public {
        if (collateral == address(0)) revert InvalidValue();

        if (strike == 0) revert InvalidValue();
        if (expirationDate < block.timestamp) revert InvalidValue();

        ShortOption shortOption = new ShortOption(
            shortOptionName, 
            shortSymbol, 
            collateral, 
            consideration, 
            expirationDate, 
            strike,
            isPut
        );
        address shortOptionAddress = address(shortOption);

        LongOption longOption = new LongOption(
            longOptionName, 
            longSymbol, 
            collateral, 
            consideration, 
            expirationDate, 
            strike, 
            isPut, 
            shortOptionAddress
        );
        address longOptionAddress = address(longOption);
        createdOptions.push(longOptionAddress);
        allOptions[collateral][expirationDate][strike].push(longOptionAddress);
        shortOption.setLongOption(longOptionAddress);
        shortOption.transferOwnership(longOptionAddress);

        emit LongOptionCreated(
            longOptionAddress,
            shortOptionAddress, 
            collateral, 
            consideration,
            expirationDate, 
            strike,
            isPut
        );
    }

    function getCreatedOptions() public view returns (address[] memory) {
        return createdOptions;
    }
    // function getOption(address collateral, uint256 expiration, uint256 strike) public view returns (address[] memory) {
    //     return allOptions[collateral][expiration][strike];
    // }

}