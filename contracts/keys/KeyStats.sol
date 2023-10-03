// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract KeyStats is Ownable {
  address public submitter;

  mapping (address => uint256) public getFeesWei;

  // READ
  function getWeiSpent(address _user) external view returns(uint256) {
    return getFeesWei[_user];
  }

  // WRITE
  function addFee(address _address, uint256 _amount) external {
    require(msg.sender == submitter, "KeyStats: Only submitter can add fee");
    getFeesWei[_address] += _amount;
  }

  // OWNER
  function setSubmitter(address _submitter) external onlyOwner {
    submitter = _submitter;
  }
}