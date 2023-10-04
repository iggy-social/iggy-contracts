// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/** 
@title Extended Ownable contract with managers functionality
@author Tempe Techie
*/
abstract contract OwnableWithManagers is Ownable {
  address[] public managers; // array of managers
  mapping (address => bool) public isManager; // mapping of managers

  // MODIFIERS
  modifier onlyManagerOrOwner() {
    require(isManager[msg.sender] || msg.sender == owner(), "OwnableWithManagers: caller is not a manager or owner");
    _;
  }

  // EVENTS
  event ManagerAdd(address indexed owner_, address indexed manager_);
  event ManagerRemove(address indexed owner_, address indexed manager_);

  // READ
  function getManagers() external view returns (address[] memory) {
    return managers;
  }

  function getManagersLength() external view returns (uint256) {
    return managers.length;
  }

  // MANAGER
  
  function removeYourselfAsManager() external onlyManagerOrOwner {
    address manager_ = msg.sender;

    isManager[manager_] = false;
    uint256 length = managers.length;

    for (uint256 i = 0; i < length;) {
      if (managers[i] == manager_) {
        managers[i] = managers[length - 1];
        managers.pop();
        emit ManagerRemove(msg.sender, manager_);
        return;
      }

      unchecked {
        i++;
      }
    }
  }

  // OWNER

  function addManager(address manager_) external onlyOwner {
    require(!isManager[manager_], "OwnableWithManagers: manager already added");
    isManager[manager_] = true;
    managers.push(manager_);
    emit ManagerAdd(msg.sender, manager_);
  }

  function removeManagerByAddress(address manager_) external onlyOwner {
    isManager[manager_] = false;
    uint256 length = managers.length;

    for (uint256 i = 0; i < length;) {
      if (managers[i] == manager_) {
        managers[i] = managers[length - 1];
        managers.pop();
        emit ManagerRemove(msg.sender, manager_);
        return;
      }

      unchecked {
        i++;
      }
    }
  }

  function removeManagerByIndex(uint256 index_) external onlyOwner {
    emit ManagerRemove(msg.sender, managers[index_]);
    isManager[managers[index_]] = false;
    managers[index_] = managers[managers.length - 1];
    managers.pop();
  }
}