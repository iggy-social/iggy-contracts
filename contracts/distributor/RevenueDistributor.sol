// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { OwnableWithManagers } from "../access/OwnableWithManagers.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IERC20 {
  function transfer(address to, uint256 amount) external returns (bool);
}

/// @title RevenueDistributor
/// @author Tempe Techie
/// @notice Automatically distribute revenue to multiple recipients
contract RevenueDistributor is OwnableWithManagers, ReentrancyGuard {
  string public constant NAME = "RevenueDistributor";
  uint256 private constant LABEL_MAX_LENGTH = 30;

  struct Recipient {
    address addr;
    string label;
    uint256 percentage; // 100% = 1 ether
  }

  Recipient[] public recipients; // array of Recipient structs

  // EVENTS
  event RecipientAdd(address indexed adder_, address indexed recipient_, string label_, uint256 percentage_);
  event RecipientRemove(address indexed remover_, address indexed recipient_);
  event RecipientRemoveAll(address indexed remover_);
  event RecipientUpdate(address indexed updater_, address indexed recipient_, address newAddr_, string label_, uint256 percentage_);
  event WithdrawEth(address indexed owner_, uint256 amount_);

  // READ

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

  function addRecipient(address addr_, string calldata label_, uint256 percentage_) external onlyManagerOrOwner {
    require(bytes(label_).length < LABEL_MAX_LENGTH, "RevenueDistributor: label too long");

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
    emit RecipientAdd(msg.sender, addr_, label_, percentage_);
  }

  function removeAllRecipients() external onlyManagerOrOwner {
    delete recipients;
    emit RecipientRemoveAll(msg.sender);
  }

  function removeLastRecipient() external onlyManagerOrOwner {
    emit RecipientRemove(msg.sender, recipients[recipients.length - 1].addr);
    recipients.pop();
  }

  function removeRecipientByAddress(address recipient_) external onlyManagerOrOwner {
    uint256 length = recipients.length;

    for (uint256 i = 0; i < length;) {
      if (recipients[i].addr == recipient_) {
        recipients[i] = recipients[length - 1];
        recipients.pop();
        emit RecipientRemove(msg.sender, recipient_);
        return;
      }

      unchecked {
        i++;
      }
    }
  }

  function removeRecipientByIndex(uint256 index_) external onlyManagerOrOwner {
    emit RecipientRemove(msg.sender, recipients[index_].addr);
    recipients[index_] = recipients[recipients.length - 1];
    recipients.pop();
  }

  function updateRecipientByAddress(
    address recipient_, 
    address newAddr_, 
    string calldata label_, 
    uint256 newPercentage_
  ) external onlyManagerOrOwner {
    require(bytes(label_).length < LABEL_MAX_LENGTH, "RevenueDistributor: label too long");

    uint256 percentageTotal;
    uint256 length = recipients.length;

    for (uint256 i = 0; i < length;) {
      if (recipients[i].addr == recipient_) {
        recipients[i].addr = newAddr_;
        recipients[i].label = label_;
        recipients[i].percentage = newPercentage_;
        percentageTotal += newPercentage_;
        emit RecipientUpdate(msg.sender, recipient_, newAddr_, label_, newPercentage_);
      } else {
        percentageTotal += recipients[i].percentage;
      }

      unchecked {
        i++;
      }
    }

    require(percentageTotal <= 1 ether, "RevenueDistributor: percentage total must be less than or equal to 100%");
  }

  function updateRecipientByIndex(
    uint256 index_, 
    address newAddr_, 
    string calldata label_, 
    uint256 newPercentage_
  ) external onlyManagerOrOwner {
    require(bytes(label_).length < LABEL_MAX_LENGTH, "RevenueDistributor: label too long");

    uint256 percentageTotal;
    uint256 length = recipients.length;

    for (uint256 i = 0; i < length;) {
      if (i == index_) {
        emit RecipientUpdate(msg.sender, recipients[i].addr, newAddr_, label_, newPercentage_);
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

  /// @notice Recover any ERC-20 token mistakenly sent to this contract address
  function recoverERC20(address tokenAddress_, uint256 tokenAmount_, address recipient_) external onlyOwner {
    IERC20(tokenAddress_).transfer(recipient_, tokenAmount_);
  }

  /// @notice Recover any ERC-721 token mistakenly sent to this contract address
  function recoverERC721(address tokenAddress_, uint256 tokenId_, address recipient_) external onlyOwner {
    IERC721(tokenAddress_).transferFrom(address(this), recipient_, tokenId_);
  }

  /// @dev Manual withdrawal in case there's an excess of ETH in the contract
  function withdrawEth() external onlyOwner {
    emit WithdrawEth(msg.sender, address(this).balance);
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