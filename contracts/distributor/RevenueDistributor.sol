// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title RevenueDistributor
/// @author Tempe Techie
/// @notice Automatically distribute revenue to multiple recipients
contract RevenueDistributor is Ownable, ReentrancyGuard {

  struct Recipient {
    address addr;
    string label;
    uint256 percentage; // 100% = 1 ether
  }

  Recipient[] public recipients; // array of Recipient structs

  address[] public managers; // array of managers
  mapping (address => bool) public isManager; // mapping of managers

  // MODIFIERS
  modifier onlyManager() {
    require(isManager[msg.sender] || msg.sender == owner(), "RevenueDistributor: caller is not a manager");
    _;
  }

  // READ

  function getManagers() external view returns (address[] memory) {
    return managers;
  }

  function getRecipient(address recipient_) external view returns (Recipient memory) {
    uint256 length = recipients.length;

    for (uint256 i = 0; i < length;) {
      if (recipients[i].addr == recipient_) {
        return recipients[i];
      }

      unchecked {
        i++;
      }
    }

    revert("RevenueDistributor: recipient not found");
  }

  function getRecipients() external view returns (Recipient[] memory) {
    return recipients;
  }

  function getRecipientsLength() external view returns (uint256) {
    return recipients.length;
  }

  function isRecipient(address addr_) external view returns (bool) {
    uint256 length = recipients.length;

    for (uint256 i = 0; i < length;) {
      if (recipients[i].addr == addr_) {
        return true;
      }

      unchecked {
        i++;
      }
    }

    return false;
  }

  // MANAGER

  function addRecipient(address addr_, string calldata label_, uint256 percentage_) external onlyManager {
    uint256 percentageTotal;
    uint256 length = recipients.length;

    for (uint256 i = 0; i < length;) {
      require(recipients[i].addr != addr_, "RevenueDistributor: recipient already in the list");

      percentageTotal += recipients[i].percentage;

      unchecked {
        i++;
      }
    }

    require(percentageTotal + percentage_ <= 1 ether, "RevenueDistributor: percentage total must be less than or equal to 100%");

    recipients.push(Recipient(addr_, label_, percentage_));
  }

  function removeAllRecipients() external onlyManager {
    delete recipients;
  }

  function removeLastRecipient() external onlyManager {
    recipients.pop();
  }

  function removeRecipient(address recipient_) external onlyManager {
    uint256 length = recipients.length;

    for (uint256 i = 0; i < length;) {
      if (recipients[i].addr == recipient_) {
        recipients[i] = recipients[length - 1];
        recipients.pop();
        return;
      }

      unchecked {
        i++;
      }
    }
  }

  function updateRecipient(address recipient_, string calldata label_, uint256 newPercentage_) external onlyManager {
    uint256 percentageTotal;
    uint256 length = recipients.length;

    for (uint256 i = 0; i < length;) {
      if (recipients[i].addr == recipient_) {
        recipients[i].label = label_;
        recipients[i].percentage = newPercentage_;
        percentageTotal += newPercentage_;
      } else {
        percentageTotal += recipients[i].percentage;
      }

      unchecked {
        i++;
      }
    }

    require(percentageTotal <= 1 ether, "RevenueDistributor: percentage total must be less than or equal to 100%");
  }

  function updateRecipientByIndex(uint256 index_, address newAddr_, string calldata label_, uint256 newPercentage_) external onlyManager {
    uint256 percentageTotal;
    uint256 length = recipients.length;

    for (uint256 i = 0; i < length;) {
      if (i == index_) {
        recipients[i].addr = newAddr_;
        recipients[i].label = label_;
        recipients[i].percentage = newPercentage_;
        percentageTotal += newPercentage_;
      } else {
        percentageTotal += recipients[i].percentage;
      }

      unchecked {
        i++;
      }
    }

    require(percentageTotal <= 1 ether, "RevenueDistributor: percentage total must be less than or equal to 100%");
  }

  // OWNER

  function addManager(address manager_) external onlyOwner {
    require(!isManager[manager_], "RevenueDistributor: manager already added");
    isManager[manager_] = true;
    managers.push(manager_);
  }

  function removeManagerByAddress(address manager_) external onlyOwner {
    isManager[manager_] = false;
    uint256 length = managers.length;

    for (uint256 i = 0; i < length;) {
      if (managers[i] == manager_) {
        managers[i] = managers[length - 1];
        managers.pop();
        return;
      }

      unchecked {
        i++;
      }
    }
  }

  function removeManagerByIndex(uint256 index_) external onlyOwner {
    isManager[managers[index_]] = false;
    managers[index_] = managers[managers.length - 1];
    managers.pop();
  }

  /// @dev Manual withdrawal in case there's an excess of ETH in the contract
  function withdrawEth() external onlyOwner {
    (bool success, ) = msg.sender.call{ value: address(this).balance }("");
    require(success, "RevenueDistributor: transfer failed");
  }

  // INTERNAL
  
  function _distribute(uint256 value_) internal nonReentrant {
    uint256 length = recipients.length;
    
    for (uint256 i = 0; i < length;) {
      address recipient = recipients[i].addr;

      if (recipient != address(0)) {
        uint256 percentage = recipients[i].percentage;
        uint256 amount = (value_ * percentage) / 1 ether;

        (bool success, ) = recipient.call{ value: amount }("");
        require(success, "RevenueDistributor: transfer failed");
      }

      unchecked {
        i++;
      }
    }
  }

  // RECEIVE
  receive() external payable {
    _distribute(msg.value);
  }
}