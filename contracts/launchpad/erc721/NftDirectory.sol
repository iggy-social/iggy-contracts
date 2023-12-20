// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { OwnableWithManagers } from "../../access/OwnableWithManagers.sol";

/** 
@title A directory of ERC-721 NFTs made with a Iggy Launchpad
@author Tempe Techie
*/
contract NftDirectory is OwnableWithManagers {
  address[] public allNftContracts; // array of all NFT contracts launched by this contract
  address[] public featuredNftContracts; // array of NFT contracts that are featured by the contract owner

  mapping (address => bool) public writers; // writer contracts that can send stats to this contract
  mapping (string => address) public nftAddressById; // mapping(uniqueID => NFT contract address) to easily find the NFT contract address

  // READ

  function getAllFeaturedNftContracts() external view returns(address[] memory) {
    return featuredNftContracts;
  }

  /// @notice Get last X amount of featured NFT contract addresses
  function getFeaturedNftContracts(uint256 amount) external view returns(address[] memory) {
    uint256 length = featuredNftContracts.length;

    if (length <= amount) {
      return featuredNftContracts; // Return the whole array if it has the same or fewer items than the amount requested
    }

    address[] memory nftContracts_ = new address[](amount);

    for (uint256 i = 0; i < amount; i++) {
      nftContracts_[i] = featuredNftContracts[length - amount + i];
    }

    return nftContracts_;
  }

  /// @notice Get array length of featured NFT contracts
  function getFeaturedNftContractsArrayLength() external view returns(uint256) {
    return featuredNftContracts.length;
  }

  /// @notice Get last X amount of NFT contract addresses
  function getLastNftContracts(uint256 amount) external view returns(address[] memory) {
    uint256 length = allNftContracts.length;

    if (length <= amount) {
      return allNftContracts; // Return the whole array if it has the same or fewer items than the amount requested
    }

    address[] memory nftContracts_ = new address[](amount);

    for (uint256 i = 0; i < amount; i++) {
      nftContracts_[i] = allNftContracts[length - amount + i];
    }

    return nftContracts_;
  }

  /// @notice Get NFT contract address by unique ID
  function getNftContractAddress(string calldata _uniqueId) external view returns(address) {
    return nftAddressById[_uniqueId];
  }

  /// @notice Get NFT contract addresses between two indexes
  function getNftContracts(uint256 fromIndex, uint256 toIndex) external view returns(address[] memory) {
    require(fromIndex < toIndex, "fromIndex must be less than toIndex");
    require(toIndex < allNftContracts.length, "toIndex out of bounds");

    address[] memory nftContracts_ = new address[](toIndex - fromIndex + 1);

    for (uint256 i = fromIndex; i <= toIndex; i++) {
      nftContracts_[i - fromIndex] = allNftContracts[i];
    }

    return nftContracts_;
  }

  /// @notice Get NFT the length of the allNftContracts array
  function getNftContractsArrayLength() external view returns(uint256) {
    return allNftContracts.length;
  }

  /// @notice Check if unique ID is available
  function isUniqueIdAvailable(string calldata _uniqueId) public view returns(bool) {
    return nftAddressById[_uniqueId] == address(0);
  }

  // LAUNCHPADS / WRITERS
  function addNftAddressToAllWithUniqueId(address _nftAddress, string calldata uniqueId_) external {
    require(writers[msg.sender], "Not a writer contract");

    nftAddressById[uniqueId_] = _nftAddress;
    allNftContracts.push(_nftAddress);
  }

  // OWNER

  function addNftAddressToAll(address _nftAddress) external onlyManagerOrOwner {
    allNftContracts.push(_nftAddress);
  }

  function addNftAddressToFeatured(address _nftAddress) external onlyManagerOrOwner {
    featuredNftContracts.push(_nftAddress);
  }

  function addWriter(address writer_) external onlyManagerOrOwner {
    writers[writer_] = true;
  }

  function removeNftAddressFromAllByIndex(uint256 _index) external onlyManagerOrOwner {
    allNftContracts[_index] = allNftContracts[allNftContracts.length - 1];
    allNftContracts.pop();
  }

  function removeNftAddressFromFeatured(address _nftAddress) external onlyManagerOrOwner {
    for (uint256 i = 0; i < featuredNftContracts.length; i++) {
      if (featuredNftContracts[i] == _nftAddress) {
        featuredNftContracts[i] = featuredNftContracts[featuredNftContracts.length - 1];
        featuredNftContracts.pop();
        break;
      }
    }
  }

  function removeNftAddressFromFeaturedByIndex(uint256 _index) external onlyManagerOrOwner {
    featuredNftContracts[_index] = featuredNftContracts[featuredNftContracts.length - 1];
    featuredNftContracts.pop();
  }
}