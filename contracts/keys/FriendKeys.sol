// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IPunkTLD } from "../interfaces/IPunkTLD.sol";
import { IKeyStats } from "../interfaces/IKeyStats.sol";

contract FriendKeys is Ownable {
  address public feeReceiver; // protocol fee receiver
  address public keyStats;
  address public immutable tldAddress;

  string public tldName;
  
  uint256 public protocolFeePercent;
  uint256 public domainHolderFeePercent;

  uint256 public immutable ratio;

  // Domain => (Holder => Balance)
  mapping(string => mapping(address => uint256)) public keysBalance;

  // Domain => Supply
  mapping(string => uint256) public keysSupply;

  // stats
  bool public collectStats = true;
  uint256 public totalVolumeWei;

  // EVENTS
  event Trade(address trader, string domain, bool isBuy, uint256 keyAmount, uint256 ethAmount, uint256 protocolEthAmount, uint256 subjectEthAmount, uint256 supply);

  // CONSTRUCTOR
  constructor(
    address _tldAddress,
    address _feeReceiver, 
    address _keyStats,
    uint256 _protocolFeePercent, 
    uint256 _domainHolderFeePercent,
    uint256 _ratio
  ) {
    tldAddress = _tldAddress;
    tldName = IPunkTLD(_tldAddress).name();

    feeReceiver = _feeReceiver;
    keyStats = _keyStats;

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

  function buyKeys(string memory domainName, uint256 amount) external payable {
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

    require(msg.value >= price + protocolFee + subjectFee, "Insufficient payment");
    
    keysBalance[domainName][msg.sender] += amount;
    keysSupply[domainName] += amount;

    emit Trade(msg.sender, domainName, true, amount, price, protocolFee, subjectFee, supply + amount);

    (bool success1, ) = feeReceiver.call{value: protocolFee}("");
    (bool success2, ) = domainOwner.call{value: subjectFee}("");

    // add protocol fees to stats
    if (collectStats) {
      IKeyStats(keyStats).addFee(msg.sender, protocolFee);
    }
    totalVolumeWei += (price + protocolFee + subjectFee);

    require(success1 && success2, "Unable to send funds");
  }

  function sellKeys(string memory domainName, uint256 amount) external payable {
    uint256 supply = keysSupply[domainName];
    require(supply > amount, "Cannot sell the last key");

    uint256 price = getPrice(supply - amount, amount);
    uint256 protocolFee = price * protocolFeePercent / 1 ether;
    uint256 subjectFee = price * domainHolderFeePercent / 1 ether;

    require(keysBalance[domainName][msg.sender] >= amount, "Insufficient keys");

    keysBalance[domainName][msg.sender] -= amount;
    keysSupply[domainName] = supply - amount;

    emit Trade(msg.sender, domainName, false, amount, price, protocolFee, subjectFee, supply - amount);

    (bool success1, ) = msg.sender.call{value: price - protocolFee - subjectFee}("");
    (bool success2, ) = feeReceiver.call{value: protocolFee}("");

    address domainOwner = IPunkTLD(tldAddress).getDomainHolder(domainName);
    (bool success3, ) = domainOwner.call{value: subjectFee}("");

    // add protocol fees to stats
    if (collectStats) {
      IKeyStats(keyStats).addFee(msg.sender, protocolFee);
    }
    totalVolumeWei += (price + protocolFee + subjectFee);

    require(success1 && success2 && success3, "Unable to send funds");
  }

  // OWNER

  function changeDomainHolderFeePercent(uint256 _feePercent) public onlyOwner {
    domainHolderFeePercent = _feePercent;
  }

  function changeFeeReceiver(address _feeReceiver) public onlyOwner {
    feeReceiver = _feeReceiver;
  }

  function changeKeyStatsAddress(address _keyStats) public onlyOwner {
    keyStats = _keyStats;
  }

  function changeProtocolFeePercent(uint256 _feePercent) public onlyOwner {
    protocolFeePercent = _feePercent;
  }

  function stopCollectingStats() public onlyOwner {
    collectStats = false;
  }
  
}