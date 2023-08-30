// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

interface IKeyStats {
  function getFee(address _address) external view returns (uint256);
  function addFee(address _address, uint256 _amount) external;
}