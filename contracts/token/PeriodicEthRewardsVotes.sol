// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { ERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Votes, ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/** 
@title Staking contract with periodic ETH rewards (with voting and permit)
@author Tempe Techie
@notice The contract issues a receipt token for any staked token in 1:1 ratio. Receipt token holders can 
claim ETH rewards periodically. Receipt token holders can also vote in governance (ERC20Votes) or have tokens 
transferred using the erc-2612 permit() function (ERC20Permit).
*/
contract PeriodicEthRewardsVotes is ERC20, Ownable, ReentrancyGuard, ERC20Votes {
  using SafeERC20 for IERC20;

  address public immutable asset; // staked token address (rebase tokens and tokens with fee-on-transfer are NOT supported!)
  
  uint256 public claimRewardsTotal; // total ETH rewards that can be claimed for the previous period
  uint256 public claimRewardsMinimum; // if minimum not reached, no one can claim (all ETH rewards go to next period)

  uint256 public futureRewards; // ETH rewards that have not been claimed yet
  uint256 public lastClaimPeriod; // timestamp of the last claim period

  uint256 public maxDeposit = type(uint256).max; // maximum amount of tokens that can be deposited by a user (in wei)
  uint256 public minDeposit; // minimum amount of tokens that can be deposited by a user (in wei)

  uint256 public immutable periodLength; // length of the claim period (in seconds), the most common is 1 week (604800s)

  mapping (address => uint256) public lastClaimed; // timestamp of the last claim for each user
  mapping (address => uint256) public lastDeposit; // timestamp of the last deposit for each user

  // EVENTS
  event Claim(address indexed user, address indexed owner, uint256 rewards);
  event Deposit(address indexed user, uint256 assets);
  event LastClaimPeriodUpdate(address indexed user, uint256 timestamp, uint256 claimRewardsTotal_, uint256 futureRewards_);
  event OwnerClaimRewardsMinimumSet(address indexed owner, uint256 claimRewardsMinimum_);
  event OwnerMaxDepositSet(address indexed owner, uint256 maxDeposit_);
  event OwnerMinDepositSet(address indexed owner, uint256 minDeposit_);
  event OwnerRecoverErc20(address indexed owner, address indexed token, uint256 amount);
  event Withdraw(address indexed user, uint256 assets);

  // CONSTRUCTOR
  constructor(
    address _asset,
    string memory _receiptTokenName,
    string memory _receiptTokenSymbol,
    uint256 _claimRewardsMinimum,
    uint256 _minDeposit,
    uint256 _periodLength
  ) ERC20(_receiptTokenName, _receiptTokenSymbol) ERC20Permit(_receiptTokenName) {
    require(_asset != address(0), "PeriodicEthRewards: asset is the zero address");
    require(_periodLength > 0, "PeriodicEthRewards: period length is zero");
    require(bytes(_receiptTokenName).length > 0, "PeriodicEthRewards: receipt token name is empty");
    require(bytes(_receiptTokenSymbol).length > 0, "PeriodicEthRewards: receipt token symbol is empty");

    asset = _asset;
    
    claimRewardsMinimum = _claimRewardsMinimum;
    emit OwnerClaimRewardsMinimumSet(msg.sender, _claimRewardsMinimum);

    minDeposit = _minDeposit;
    emit OwnerMinDepositSet(msg.sender, _minDeposit);

    periodLength = _periodLength;

    lastClaimPeriod = block.timestamp;
  }

  // RECEIVE (receive ETH)
  receive() external payable {
    // futureRewards update must happen before _updateLastClaimPeriod() 
    // because claimRewardsTotal is then set to current balance
    futureRewards += msg.value;

    _updateLastClaimPeriod();
  }

  // READ

  // Overrides IERC6372 functions to make the token & governor timestamp-based
  function clock() public view override returns (uint48) {
    return uint48(block.timestamp);
  }

  // Overrides IERC6372 functions to make the token & governor timestamp-based
  function CLOCK_MODE() public pure override returns (string memory) { // solhint-disable-line func-name-mixedcase
    return "mode=timestamp";
  }

  /// @notice Returns the amount of time left (in seconds) until the user can withdraw their assets.
  function getLockedTimeLeft(address _user) external view returns (uint256) {
    uint256 _lastDeposit = lastDeposit[_user];

    if (_lastDeposit == 0) {
      // in case periodLength is bigger than block.timestamp
      return 0;
    }

    if ((_lastDeposit + periodLength) > block.timestamp) {
      return _lastDeposit + periodLength - block.timestamp;
    }

    return 0;
  }

  /// @notice Returns the amount of ETH that can be claimed for a given user
  function previewClaim(address _claimer) public view returns (uint256) {
    if (lastClaimed[_claimer] < lastClaimPeriod && totalSupply() > 0) {
      return claimRewardsTotal * balanceOf(_claimer) / totalSupply(); // get current ETH claim for a given user
    }

    return 0;
  }

  /** @notice Returns the amount of ETH that may be claimed for a given user in the next claim period. The amount can 
  change up or down until the current period is over. */
  function previewFutureClaim(address _claimer) external view returns (uint256) {
    if (totalSupply() > 0) {
      return futureRewards * balanceOf(_claimer) / totalSupply(); // get future ETH claim for a given user
    }

    return 0;
  }

  // WRITE

  /// @notice Claim ETH rewards for yourself.
  function claimRewards() external nonReentrant returns (uint256) {
    return _claim(msg.sender); // returns the amount of ETH claimed
  }

  /// @notice Claim ETH rewards for someone else.
  function claimRewardsFor(address _claimer) external nonReentrant returns (uint256) {
    return _claim(_claimer); // returns the amount of ETH claimed
  }

  /// @notice Deposit assets and mint receipt tokens.
  function deposit(uint256 _assets) external nonReentrant returns (uint256) {
    require(_assets <= maxDeposit, "PeriodicEthRewards: deposit is more than max");
    require(_assets >= minDeposit, "PeriodicEthRewards: deposit is less than min");

    lastDeposit[msg.sender] = block.timestamp; // after deposit withdrawals are disabled for periodLength

    IERC20(asset).safeTransferFrom(msg.sender, address(this), _assets); // transfer staking tokens to this contract
    
    _mint(msg.sender, _assets); // mint receipt tokens

    emit Deposit(msg.sender, _assets);

    return _assets;
  }

  /// @notice Manually update the last claim period (if needed). Anyone can call this function.
  function updateLastClaimPeriod() external nonReentrant {
    // it's better to call _claim() instead of _updateLastClaimPeriod() in case user has forgotten to claim
    // _claim() will call _updateLastClaimPeriod() anyway
    _claim(msg.sender);
  }

  /// @notice Withdraw assets and burn receipt tokens.
  function withdraw(uint256 _assets) external nonReentrant returns (uint256) {
    uint _balance = balanceOf(msg.sender);

    require(_assets > 0, "PeriodicEthRewards: cannot withdraw 0");
    require(_assets <= _balance, "PeriodicEthRewards: cannot withdraw more than balance");
    require(block.timestamp > (lastDeposit[msg.sender] + periodLength), "PeriodicEthRewards: assets are still locked");

    // if not full withdraw, require balance to stay at least the min user deposit amount
    if (_balance > _assets) {
      require(
        (_balance - _assets) >= minDeposit, 
        "PeriodicEthRewards: the remaining balance too low"
      );
    }

    _burn(msg.sender, _assets); // burn receipt tokens

    IERC20(asset).safeTransfer(msg.sender, _assets); // receive back the asset tokens (staking tokens)

    // note: if user withdraws all staked tokens, they forfeit their claim for the current 
    // staking period (unless they deposit again)

    emit Withdraw(msg.sender, _assets);

    return _assets;
  }

  // OWNER

  /// @notice Recover any ERC-20 token mistakenly sent to this contract address (except the staking and receipt tokens)
  function recoverERC20(address _tokenAddress, uint256 _tokenAmount, address _recipient) external onlyOwner {
    require(_tokenAddress != asset, "PeriodicEthRewards: cannot recover staking token");
    require(_tokenAddress != address(this), "PeriodicEthRewards: cannot recover receipt token");

    IERC20(_tokenAddress).safeTransfer(_recipient, _tokenAmount);

    emit OwnerRecoverErc20(msg.sender, _tokenAddress, _tokenAmount);
  }

  /** 
  @notice 
  Sets the minimum amount of ETH that must be in the contract for rewards to be distributed.
  If minimum is not met, rewards roll over into the next period.
  */
  function setClaimRewardsMinimum(uint256 _claimRewardsMinimum) external onlyOwner {
    claimRewardsMinimum = _claimRewardsMinimum;
    emit OwnerClaimRewardsMinimumSet(msg.sender, _claimRewardsMinimum);
  }

  /// @notice Sets the maximum amount of assets that a user can deposit at once.
  function setMaxDeposit(uint256 _maxDeposit) external onlyOwner {
    maxDeposit = _maxDeposit;
    emit OwnerMaxDepositSet(msg.sender, _maxDeposit);
  }

  /// @notice Sets the minimum amount of assets that a user can deposit.
  function setMinDeposit(uint256 _minDeposit) external onlyOwner {
    minDeposit = _minDeposit;
    emit OwnerMinDepositSet(msg.sender, _minDeposit);
  }

  // INTERNAL

  function _afterTokenTransfer(
    address from, 
    address to, 
    uint256 amount
  ) internal override(ERC20, ERC20Votes) {
    super._afterTokenTransfer(from, to, amount);
  }

  function _beforeTokenTransfer(
    address _from,
    address _to,
    uint256 _amount
  ) internal override {
    super._beforeTokenTransfer(_from, _to, _amount);
    require(_to != address(this), "PeriodicEthRewards: cannot transfer to token contract");

    // this does not run on mint or burn, only on transfer
    if (_from != address(0) && _from != address(0)) {
      // if sender's assets are locked, receipt tokens cannot be transferred
      require(block.timestamp > (lastDeposit[_from] + periodLength), "PeriodicEthRewards: assets are still locked");
    }

    // this does not run on mint, but it runs on burn or transfer
    if (_from != address(0)) {
      _claim(_from);
    }

    // this does not run on burn, but it runs on mint or transfer
    if (_to != address(0)) {  
      _claim(_to);
      // Set lastClaimed to the current timestamp just in case the receiver had no previous claims.
      // This prevents double claiming of rewards, because the sender should have gotten all 
      // the rewards from the current claim period.
      // This also prevents a new depositor from claiming rewards from the previous period right away.
      // They have to wait until the next period to claim. It prevents gaming the system.
      lastClaimed[_to] = block.timestamp;
    }
  }

  function _claim(address _claimer) internal returns (uint256 _ethToClaim) {
    // check if claimer has any ETH (left) to claim
    _ethToClaim = previewClaim(_claimer);

    if (_ethToClaim > 0) {
      // update lastClaimed
      lastClaimed[_claimer] = block.timestamp;

      // send ETH to the claimer
      (bool _success, ) = payable(_claimer).call{value: _ethToClaim}("");
      require(_success, "ETH transfer failed");

      emit Claim(msg.sender, _claimer, _ethToClaim);
    }

    _updateLastClaimPeriod();
  }

  function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
    super._mint(to, amount);
  }

  function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
    super._burn(account, amount);
  }

  function _updateLastClaimPeriod() internal {
    // only run if the current period has ended (start a new period)
    if (block.timestamp > (lastClaimPeriod + periodLength)) {
      lastClaimPeriod = block.timestamp;

      // set total rewards to be claimed for the previous period
      if (address(this).balance >= claimRewardsMinimum) {
        // if the minimum is reached, claimRewardsTotal is set to the current balance
        claimRewardsTotal = address(this).balance;
        futureRewards = 0; // reset future rewards to 0
      } else {
        // if minimum not reached, no one can claim. All ETH rewards go into the next period
        claimRewardsTotal = 0;
        futureRewards = address(this).balance; // set future rewards to the current balance
      } 

      emit LastClaimPeriodUpdate(msg.sender, block.timestamp, claimRewardsTotal, futureRewards);
    }
  }

}