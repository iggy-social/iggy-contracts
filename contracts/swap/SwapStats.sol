// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { OwnableWithManagers } from "../access/OwnableWithManagers.sol";

/** 
@title Iggy Swap Stats
@author Tempe Techie
*/
contract SwapStats is OwnableWithManagers {
  address public statsWriterAddress;
  uint256 public weiSpentTotal;
  
  mapping (address => uint256) public weiSpentPerAddress;
  
  // READ
  function getWeiSpent(address user_) external view returns (uint256) {
    return weiSpentPerAddress[user_];
  }

  // WRITE
  function addWeiSpent(address user_, uint256 weiSpent_) external {
    require(msg.sender == statsWriterAddress, "Not a stats writer");
    
    weiSpentPerAddress[user_] += weiSpent_;
    weiSpentTotal += weiSpent_;
  }
  
  // OWNER
  function setStatsWriterAddress(address statsWriterAddress_) external onlyManagerOrOwner {
    statsWriterAddress = statsWriterAddress_;
  }

}
