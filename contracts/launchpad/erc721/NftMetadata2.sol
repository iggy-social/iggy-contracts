// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

/** 
@title Metadata contract for a single ERC-721 NFT made with Iggy Launchpad
@author Tempe Techie
*/
contract NftMetadata2 is Ownable {
  using Strings for uint256;

  string public description;
  string public externalUrl;
  string public image;
  string public name;

  string public urlMetadata; // optional, if mdType is not 0

  uint256 mdType = 0; 
  // mdType options: 
  // - 0: encoded metadata, no need for metadata from a 3rd party source such as IPFS or a custom API.
  // - 1: url to metadata IPFS or custom API. One metadata URL for all NFTs (meaning all NFTs have the same metadata and image).
  // - 2: base url to metadata IPFS or custom API. Token ID of each NFT is appended to the base url to get the metadata and image (ends with .json extension).
  // - 3: base url to metadata IPFS or custom API. Token ID of each NFT is appended to the base url to get the metadata and image (does NOT end with .json extension).

  // CONSTRUCTOR
  constructor (
    string memory description_, 
    string memory externalUrl_,
    string memory image_,
    string memory name_
  ) {
    description = description_;
    externalUrl = externalUrl_;
    image = image_;
    name = name_;
  }

  // READ

  // for compatibility with NftMetadata.sol
  function descriptions(address nftAddress_) external view returns (string memory) {
    return description;
  }

  function getMetadata(uint256 tokenId_) public view returns (string memory) {
    if (mdType == 1) {
      return urlMetadata;
    } else if (mdType == 2) {
      return string(abi.encodePacked(urlMetadata, tokenId_.toString(), ".json"));
    } else if (mdType == 3) {
      return string(abi.encodePacked(urlMetadata, tokenId_.toString()));
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

  // OWNER

  function changeDescription(string memory description_) external onlyOwner {
    description = description_;
  }

  function changeExternalUrl(string memory externalUrl_) external onlyOwner {
    externalUrl = externalUrl_;
  }

  function changeImage(string memory image_) external onlyOwner {
    image = image_;
  }

  function changeMdType(uint256 mdType_) external onlyOwner {
    mdType = mdType_;
  }

  function changeName(string memory name_) external onlyOwner {
    name = name_;
  }

  /// @notice URL to metadata on IPFS or from a custom API (needed for mdType 1 and 2). Needs to end with slash /
  function changeUrlMetadata(string memory urlMetadata_) external onlyOwner {
    urlMetadata = urlMetadata_;
  }

}
