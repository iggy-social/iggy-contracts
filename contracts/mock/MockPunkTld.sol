// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

contract MockPunkTld {
  function defaultNames(address) external pure returns(string memory) {
    return "mockname";
  }

  function name() external pure returns(string memory) {
    return ".tld";
  }
}