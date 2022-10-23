// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Iggy Social Reputation Contract
/// @notice Contract that measures users reputation scores
contract IggyReputation is Ownable {
  mapping (address => uint256) public reputationScore;

  // TODO: upgradable?
}