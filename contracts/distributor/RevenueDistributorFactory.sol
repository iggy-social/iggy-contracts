// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import "./RevenueDistributor.sol";

/// @title RevenueDistributor factory
/// @author Tempe Techie
/// @notice Factory that creates new RevenueDistributor contracts
contract RevenueDistributorFactory {
  uint256 private constant ID_MAX_LENGTH = 30;

  // mapping(uniqueID => RevenueDistributor contract address) to easily find a RevenueDistributor contract address
  mapping (string => address) private distributorAddressById; 

  // EVENTS
  event RevenueDistributorLaunch(address indexed contractOwner_, string uniqueId_, address indexed contractAddress_);

  // READ

  function getDistributorAddressById(string memory uniqueId_) external view returns(address) {
    return distributorAddressById[uniqueId_];
  }

  function isUniqueIdAvailable(string memory uniqueId_) public view returns(bool) {
    return distributorAddressById[uniqueId_] == address(0);
  }

  // WRITE

  function create(string calldata uniqueId_) external returns(address) {
    require(bytes(uniqueId_).length <= ID_MAX_LENGTH, "Unique ID is too long");
    require(isUniqueIdAvailable(uniqueId_), "Unique ID is not available");

    bytes32 saltedHash = keccak256(abi.encodePacked(msg.sender, block.timestamp, uniqueId_));
    RevenueDistributor distributor = new RevenueDistributor{salt: saltedHash}();

    distributorAddressById[uniqueId_] = address(distributor);

    distributor.transferOwnership(msg.sender);

    emit RevenueDistributorLaunch(msg.sender, uniqueId_, address(distributor));

    return address(distributor);
  }
}