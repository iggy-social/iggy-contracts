// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.17;

import { IPunkTLD } from "../interfaces/IPunkTLD.sol";
import { OwnableWithManagers } from "../access/OwnableWithManagers.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStats {
  function addWeiSpent(address user_, uint256 weiSpent_) external;
}

/** 
@title Friend Keys contract for buying and selling keys of punk domains using an ERC-20 token as payment method
@author Tempe Techie
@notice IMPORTANT: Only tested with ERC-20 tokens with 18 decimals
*/
contract FriendKeysErc20 is OwnableWithManagers, ReentrancyGuard {
  address public feeReceiver; // protocol fee receiver
  address public statsAddress; // stats contract
  address public immutable tldAddress; // Punk Domains TLD contract address
  address public immutable tokenAddress; // ERC-20 token address for key payments (only tested for tokens with 18 decimals)

  string public tldName;
  
  uint256 public domainHolderFeePercent;
  uint256 public protocolFeePercent;
  uint256 public referrerFeeShare = 100000000000000000; // referrer's share of the protocol and domain holder fee in wei (default: 100000000000000000 wei = 10%)
  uint256 public immutable ratio;
  uint256 public totalVolumeWei;

  // Domain => (Holder => Balance)
  mapping(string => mapping(address => uint256)) public keysBalance;

  // Domain => Supply
  mapping(string => uint256) public keysSupply;  

  // EVENTS
  event Trade(address trader, string domain, bool isBuy, uint256 keyAmount, uint256 ethAmount, uint256 protocolEthAmount, uint256 subjectEthAmount, uint256 supply);

  // CONSTRUCTOR
  constructor(
    address _tldAddress,
    address _tokenAddress,
    address _feeReceiver, 
    address _statsAddress,
    uint256 _protocolFeePercent, 
    uint256 _domainHolderFeePercent,
    uint256 _ratio
  ) {
    tldAddress = _tldAddress;
    tldName = IPunkTLD(_tldAddress).name();

    tokenAddress = _tokenAddress; // ERC-20 token address

    feeReceiver = _feeReceiver;
    statsAddress = _statsAddress;

    protocolFeePercent = _protocolFeePercent;
    domainHolderFeePercent = _domainHolderFeePercent;
    ratio = _ratio; // default: set to 1 ether (for 16000 keys)
  }

  // READ

  function getPrice(uint256 supply, uint256 amount) public view returns (uint256) {
    uint256 sum1 = supply == 0 ? 0 : (supply - 1 )* (supply) * (2 * (supply - 1) + 1) / 6;
    uint256 sum2 = supply == 0 && amount == 1 ? 0 : (supply - 1 + amount) * (supply + amount) * (2 * (supply - 1 + amount) + 1) / 6;
    uint256 summation = sum2 - sum1;
    return summation * ratio / 16000;
  }

  function getBuyPrice(string memory domainName, uint256 amount) public view returns (uint256) {
    uint256 supply = keysSupply[domainName];

    if (supply == 0) {
      return ratio / 16000;
    }

    return getPrice(supply, amount);
  }

  function getBuyPriceAfterFee(string memory domainName, uint256 amount) public view returns (uint256) {
    uint256 price = getBuyPrice(domainName, amount);
    uint256 protocolFee = price * protocolFeePercent / 1 ether;
    uint256 subjectFee = price * domainHolderFeePercent / 1 ether;
    return price + protocolFee + subjectFee;
  }

  function getDomainHolder(string memory domainName) external view returns (address) {
    return IPunkTLD(tldAddress).getDomainHolder(domainName);
  }

  function getKeyBalance(string memory domainName, address user) external view returns (uint256) {
    return keysBalance[domainName][user];
  }

  function getSellPrice(string memory domainName, uint256 amount) public view returns (uint256) {
    uint256 supply = keysSupply[domainName];

    if (supply == 0) {
      return 0;
    }

    return getPrice(supply - amount, amount);
  }

  function getSellPriceAfterFee(string memory domainName, uint256 amount) public view returns (uint256) {
    if (keysSupply[domainName] == 0) {
      return 0;
    }

    uint256 price = getSellPrice(domainName, amount);
    uint256 protocolFee = price * protocolFeePercent / 1 ether;
    uint256 subjectFee = price * domainHolderFeePercent / 1 ether;
    return price - protocolFee - subjectFee;
  }

  function isKeyHolder(string memory domainName, address user) external view returns (bool) {
    return keysBalance[domainName][user] > 0;
  }

  // WRITE

  function buyKeys(string memory domainName, uint256 amount, address referrer) external nonReentrant {
    address domainOwner = IPunkTLD(tldAddress).getDomainHolder(domainName);
    require(domainOwner != address(0), "Domain does not exist");

    uint256 supply = keysSupply[domainName];

    // if supply is zero, send the first key to domainOwner for free
    if (supply == 0) {
      keysBalance[domainName][domainOwner] = 1;
      keysSupply[domainName] = 1;
      supply = 1;
    }

    uint256 price = getPrice(supply, amount);
    uint256 protocolFee = price * protocolFeePercent / 1 ether;
    uint256 subjectFee = price * domainHolderFeePercent / 1 ether;

    // transfer tokens from key buyer to this contract
    IERC20(tokenAddress).transferFrom(msg.sender, address(this), price + protocolFee + subjectFee);
    
    keysBalance[domainName][msg.sender] += amount;
    keysSupply[domainName] += amount;

    emit Trade(msg.sender, domainName, true, amount, price, protocolFee, subjectFee, supply + amount);

    // increase total volume stats
    totalVolumeWei += (price + protocolFee + subjectFee);

    // if there is a referrer, send them their share of the protocol and domain holder fee
    if (referrer != address(0)) {
      uint256 referrerFeeProtocol = protocolFee * referrerFeeShare / 1 ether;
      uint256 referrerFeeSubject = subjectFee * referrerFeeShare / 1 ether;

      // send referrer their share in tokens
      IERC20(tokenAddress).transfer(referrer, referrerFeeProtocol + referrerFeeSubject);

      if (statsAddress != address(0)) {
        IStats(statsAddress).addWeiSpent(referrer, referrerFeeProtocol + referrerFeeSubject);
      }

      protocolFee = protocolFee - referrerFeeProtocol;
      subjectFee = subjectFee - referrerFeeSubject;
    }

    // send protocol fee to the project, and domain holder fee to the domain owner
    IERC20(tokenAddress).transfer(feeReceiver, protocolFee);
    IERC20(tokenAddress).transfer(domainOwner, subjectFee);

    // add protocol fees to stats
    if (statsAddress != address(0)) {
      IStats(statsAddress).addWeiSpent(msg.sender, protocolFee);
    }
  }

  function sellKeys(string memory domainName, uint256 amount, address referrer) external nonReentrant {
    uint256 supply = keysSupply[domainName];
    require(supply > amount, "Cannot sell the last key");

    uint256 price = getPrice(supply - amount, amount);
    uint256 protocolFee = price * protocolFeePercent / 1 ether;
    uint256 subjectFee = price * domainHolderFeePercent / 1 ether;

    require(keysBalance[domainName][msg.sender] >= amount, "Insufficient keys");

    keysBalance[domainName][msg.sender] -= amount;
    keysSupply[domainName] = supply - amount;

    emit Trade(msg.sender, domainName, false, amount, price, protocolFee, subjectFee, supply - amount);

    // send the key seller their share
    IERC20(tokenAddress).transfer(msg.sender, price - protocolFee - subjectFee);

    // increase total volume stats
    totalVolumeWei += (price + protocolFee + subjectFee);

    // if there is a referrer, send them their share of the protocol and domain holder fee
    if (referrer != address(0)) {
      uint256 referrerFeeProtocol = protocolFee * referrerFeeShare / 1 ether;
      uint256 referrerFeeSubject = subjectFee * referrerFeeShare / 1 ether;

      // send referrer their share in tokens
      IERC20(tokenAddress).transfer(referrer, referrerFeeProtocol + referrerFeeSubject);

      if (statsAddress != address(0)) {
        IStats(statsAddress).addWeiSpent(referrer, referrerFeeProtocol + referrerFeeSubject);
      }

      protocolFee = protocolFee - referrerFeeProtocol;
      subjectFee = subjectFee - referrerFeeSubject;
    }
    
    // send protocol fee to the project, and domain holder fee to the domain owner
    IERC20(tokenAddress).transfer(feeReceiver, protocolFee);
    address domainOwner = IPunkTLD(tldAddress).getDomainHolder(domainName);
    IERC20(tokenAddress).transfer(domainOwner, subjectFee);

    // add protocol fees to stats
    if (statsAddress != address(0)) {
      IStats(statsAddress).addWeiSpent(msg.sender, protocolFee);
    }
  }

  // OWNER OR MANAGER

  /// @notice Fee in wei, 1 ether = 100%
  function changeDomainHolderFeePercent(uint256 _feePercent) public onlyManagerOrOwner {
    domainHolderFeePercent = _feePercent;
  }

  function changeFeeReceiver(address _feeReceiver) public onlyManagerOrOwner {
    feeReceiver = _feeReceiver;
  }

  /// @notice Fee in wei, 1 ether = 100%
  function changeProtocolFeePercent(uint256 _feePercent) public onlyManagerOrOwner {
    protocolFeePercent = _feePercent;
  }

  /// @notice Fee in wei, 1 ether = 100%
  function changeReferrerFeeShare(uint256 _referrerFeeShare) public onlyManagerOrOwner {
    referrerFeeShare = _referrerFeeShare;
  }

  function changeStatsAddress(address _statsAddress) public onlyManagerOrOwner {
    statsAddress = _statsAddress;
  }
  
}