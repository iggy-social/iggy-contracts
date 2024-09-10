// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title BalanceChecker
 * @dev Helper contract to check balances of an ERC20 token for given accounts.
 */

contract BalanceChecker {
  address immutable public tokenAddress;

  struct Balance {
    address account;
    uint256 balance;
  }

  constructor(address _tokenAddress) {
    tokenAddress = _tokenAddress;
  }

  function getBalances(address[] calldata accounts) external view returns (uint256[] memory) {
    uint256[] memory result = new uint256[](accounts.length);
    for (uint256 i = 0; i < accounts.length;) {
      result[i] = IERC20(tokenAddress).balanceOf(accounts[i]);

      unchecked {
        i++;
      }
    }
    return result;
  }

  function getBalancesWithAddresses(address[] calldata accounts) external view returns (address[] memory, uint256[] memory) {
    address[] memory addresses = new address[](accounts.length);
    uint256[] memory result = new uint256[](accounts.length);
    for (uint256 i = 0; i < accounts.length;) {
      addresses[i] = accounts[i];
      result[i] = IERC20(tokenAddress).balanceOf(accounts[i]);

      unchecked {
        i++;
      }
    }
    return (addresses, result);
  }

  function getBalancesWithAddressesTuples(address[] calldata accounts) external view returns (Balance[] memory) {
    Balance[] memory result = new Balance[](accounts.length);
    for (uint256 i = 0; i < accounts.length;) {
      result[i] = Balance(accounts[i], IERC20(tokenAddress).balanceOf(accounts[i]));

      unchecked {
        i++;
      }
    }
    return result;
  }

  function getAddressWithHighestBalance(address[] calldata accounts) external view returns (address, uint256) {
    uint256 highestBalance = 0;
    address highestAddress = address(0);
    for (uint256 i = 0; i < accounts.length;) {
      uint256 balance = IERC20(tokenAddress).balanceOf(accounts[i]);
      if (balance > highestBalance) {
        highestBalance = balance;
        highestAddress = accounts[i];
      }

      unchecked {
        i++;
      }
    }
    return (highestAddress, highestBalance);
  }
}