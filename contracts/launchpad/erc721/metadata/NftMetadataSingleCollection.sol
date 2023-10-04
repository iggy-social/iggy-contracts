// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { OwnableWithManagers } from "../../../access/OwnableWithManagers.sol";
import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

/** 
@title Metadata contract for a single ERC-721 NFT made with Iggy Launchpad
@author Tempe Techie
*/
contract NftMetadataSingleCollection is OwnableWithManagers {
  using Strings for uint256;

  string public collectionPreview;
  string public description;
  string public externalUrl;
  string public image;
  string public mdUrl; // optional, if mdType is not 0

  string public name;

  uint256 mdType = 0; 
  // mdType options: 
  // - 0: encoded metadata, no need for metadata from a 3rd party source such as IPFS or a custom API.
  // - 1: url to metadata IPFS or custom API. One metadata URL for all NFTs (meaning all NFTs have the same metadata and image).
  // - 2: base url to metadata IPFS or custom API. Token ID of each NFT is appended to the base url to get the metadata and image (ends with .json extension).
  // - 3: base url to metadata IPFS or custom API. Token ID of each NFT is appended to the base url to get the metadata and image (does NOT end with .json extension).

  // CONSTRUCTOR
  constructor (
    string memory collectionPreview_,
    string memory description_, 
    string memory externalUrl_,
    string memory image_,
    string memory name_
  ) {
    collectionPreview = collectionPreview_;
    description = description_;
    externalUrl = externalUrl_;
    image = image_;
    name = name_;
  }

  // READ

  /// @dev for compatibility with NftMetadata.sol
  function collectionPreviews(address nftAddress_) external view returns (string memory) {
    return collectionPreview;
  }

  /// @dev for compatibility with NftMetadata.sol
  function descriptions(address nftAddress_) external view returns (string memory) {
    return description;
  }

  /// @dev for compatibility with NftMetadata.sol
  function externalUrls(address nftAddress_) external view returns (string memory) {
    return externalUrl;
  }

  function getMetadata(uint256 tokenId_) public view returns (string memory) {
    if (mdType == 1) {
      return mdUrl;
    } else if (mdType == 2) {
      return string(abi.encodePacked(mdUrl, tokenId_.toString(), ".json"));
    } else if (mdType == 3) {
      return string(abi.encodePacked(mdUrl, tokenId_.toString()));
    }

    return string(
      abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(abi.encodePacked(
        '{"name": "', name,' #', tokenId_.toString(),'", ',
        '"image": "', image, '", ',
        '"external_url": "', externalUrl, '", ',
        '"description": "', description, '"',
        '}'))))
    );
  }

  /// @dev for compatibility with NftMetadata.sol
  function images(address nftAddress_) external view returns (string memory) {
    return image;
  }

  /// @dev for compatibility with NftMetadata.sol
  function mdTypes(address nftAddress_) external view returns (uint256) {
    return mdType;
  }

  /// @dev for compatibility with NftMetadata.sol
  function mdUrls(address nftAddress_) external view returns (string memory) {
    return mdUrl;
  }

  /// @dev for compatibility with NftMetadata.sol
  function names(address nftAddress_) external view returns (string memory) {
    return name;
  }

  // OWNER

  /// @dev nftAddress_ as param for compatibility with NftMetadata.sol
  function setCollectionPreview(address nftAddress_, string memory collectionPreview_) external onlyManagerOrOwner {
    collectionPreview = collectionPreview_;
  }

  /// @dev nftAddress_ as param for compatibility with NftMetadata.sol
  function setDescription(address nftAddress_, string memory description_) external onlyManagerOrOwner {
    description = description_;
  }

  /// @dev nftAddress_ as param for compatibility with NftMetadata.sol
  function setExternalUrl(address nftAddress_, string memory externalUrl_) external onlyManagerOrOwner {
    externalUrl = externalUrl_;
  }

  /// @dev nftAddress_ as param for compatibility with NftMetadata.sol
  function setImage(address nftAddress_, string memory image_) external onlyManagerOrOwner {
    image = image_;
  }

  /// @dev nftAddress_ as param for compatibility with NftMetadata.sol
  function setMdType(address nftAddress_, uint256 mdType_) external onlyManagerOrOwner {
    mdType = mdType_;
  }

  /// @dev nftAddress_ as param for compatibility with NftMetadata.sol
  function setMdTypeAndUrlOrImage(
    address nftAddress_, 
    uint256 mdType_, 
    string memory mdUrlOrImage_,
    string memory collectionImage_
  ) external onlyManagerOrOwner {
    mdType = mdType_;

    if (mdType_ == 0) {
      image = mdUrlOrImage_;
    } else {
      mdUrl = mdUrlOrImage_;
    }

    if (bytes(collectionImage_).length > 0) {
      collectionPreview = collectionImage_;
    }
  }

  /// @notice URL to metadata on IPFS or from a custom API (needed for mdType 1 and 2). Needs to end with slash /
  /// @dev nftAddress_ as param for compatibility with NftMetadata.sol
  function setMdUrl(address nftAddress_, string memory mdUrl_) external onlyManagerOrOwner {
    mdUrl = mdUrl_;
  }

  /// @dev nftAddress_ as param for compatibility with NftMetadata.sol
  function setName(address nftAddress_, string memory name_) external onlyManagerOrOwner {
    name = name_;
  }

}
