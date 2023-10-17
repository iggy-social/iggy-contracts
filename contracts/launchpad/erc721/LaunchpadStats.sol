// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { OwnableWithManagers } from "../../access/OwnableWithManagers.sol";

/** 
@title Iggy Launchpad Stats
@author Tempe Techie
*/
contract LaunchpadStats is OwnableWithManagers {
  address public statsWriterAddress;
  uint256 public totalVolumeWei;
  mapping (address => uint256) public weiSpentPerAddress;
  
  // READ

  function getWeiSpent(address user_) external view returns (uint256) {
    return weiSpentPerAddress[user_];
  }

  function weiSpentTotal() external view returns (uint256) {
    return totalVolumeWei;
  }

  // WRITE

  function addWeiSpent(address user_, uint256 weiSpent_) external {
    require(msg.sender == statsWriterAddress, "Not a factory contract");
    
    weiSpentPerAddress[user_] += weiSpent_;
    totalVolumeWei += weiSpent_;
  }
  
  // OWNER

  function setStatsWriterAddress(address statsWriterAddress_) external onlyManagerOrOwner {
    statsWriterAddress = statsWriterAddress_;
  }

}
