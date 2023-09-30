// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

interface INFT {
  function owner() external view returns(address);
}

/** 
 * DEPRECATED
@title Default metadata contract for ERC-721 NFTs made with Iggy Launchpad
@author Tempe Techie
*/
contract NftMetadata2 {
  using Strings for uint256;

  mapping (address => string) public collectionPreviews;
  mapping (address => string) public descriptions;
  mapping (address => string) public externalUrls;
  mapping (address => string) public images;
  mapping (address => string) public mdUrls; // optional, if mdType is not 0
  mapping (address => string) public names;

  mapping (address => uint256) public mdTypes; 
  // mdType options: 
  // - 0 (default): encoded metadata, no need for metadata from a 3rd party source such as IPFS or a custom API.
  // - 1: url to metadata IPFS or custom API. One metadata URL for all NFTs (meaning all NFTs have the same metadata and image).
  // - 2: base url to metadata IPFS or custom API. Token ID of each NFT is appended to the base url to get the metadata and image (ends with .json extension).
  // - 3: base url to metadata IPFS or custom API. Token ID of each NFT is appended to the base url to get the metadata and image (does NOT end with .json extension).

  // READ

  function getMetadata(address nftAddress_, uint256 tokenId_) external view returns (string memory) {
    if (mdTypes[nftAddress_] == 1) {
      return mdUrls[nftAddress_];
    } else if (mdTypes[nftAddress_] == 2) {
      return string(abi.encodePacked(mdUrls[nftAddress_], tokenId_.toString(), ".json"));
    } else if (mdTypes[nftAddress_] == 3) {
      return string(abi.encodePacked(mdUrls[nftAddress_], tokenId_.toString()));
    }

    // default mdType: 0
    return string(
      abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(abi.encodePacked(
        '{"name": "', names[nftAddress_],' #', tokenId_.toString(),'", ',
        '"image": "', images[nftAddress_], '", ',
        '"external_url": "', externalUrls[nftAddress_], '", ',
        '"description": "', descriptions[nftAddress_], '"',
        '}'))))
    );
  }

  // WRITE

  function setCollectionPreview(address nftAddress_, string memory collectionPreview_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    collectionPreviews[nftAddress_] = collectionPreview_;
  }

  function setDescription(address nftAddress_, string memory description_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    descriptions[nftAddress_] = description_;
  }

  function setExternalUrl(address nftAddress_, string memory externalUrl_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    externalUrls[nftAddress_] = externalUrl_;
  }

  function setImage(address nftAddress_, string memory image_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    images[nftAddress_] = image_;
  }

  function setMdType(address nftAddress_, uint256 mdType_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    mdTypes[nftAddress_] = mdType_;
  }

  function setMdTypeAndUrlOrImage(
    address nftAddress_, 
    uint256 mdType_, 
    string memory mdUrlOrImage_,
    string memory collectionImage_
  ) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");

    mdTypes[nftAddress_] = mdType_;

    if (mdType_ == 0) {
      images[nftAddress_] = mdUrlOrImage_;
    } else {
      mdUrls[nftAddress_] = mdUrlOrImage_;
    }

    if (bytes(collectionImage_).length > 0) {
      collectionPreviews[nftAddress_] = collectionImage_;
    }
  }

  function setMdUrl(address nftAddress_, string memory mdUrl_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    mdUrls[nftAddress_] = mdUrl_;
  }

  function setName(address nftAddress_, string memory name_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    names[nftAddress_] = name_;
  }

}
