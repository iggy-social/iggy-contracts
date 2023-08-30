// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

interface IPunkTLD {
  function getDomainHolder(string calldata _domainName) external view returns(address);
  function name() external view returns(string memory);
}