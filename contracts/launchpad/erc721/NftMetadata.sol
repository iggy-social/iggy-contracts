// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

interface INFT {
  function owner() external view returns(address);
}

/** 
@title Default metadata contract for ERC-721 NFTs made with Iggy Launchpad
@author Tempe Techie
*/
contract NftMetadata {
  using Strings for uint256;

  struct Metadata {
    string name;
    string description;
    string collectionPreview;
    string[] images;
    string externalUrl;
    string mdUrl;
    uint256 mdType;
  }

  mapping (address => Metadata) public mds;
  
  // mdType options: 
  // - 0 (default): encoded metadata, no need for metadata from a 3rd party source such as IPFS or a custom API.
  // - 1: url to metadata IPFS or custom API. One metadata URL for all NFTs (meaning all NFTs have the same metadata and image).
  // - 2: base url to metadata IPFS or custom API. Token ID of each NFT is appended to the base url to get the metadata and image (ends with .json extension).
  // - 3: base url to metadata IPFS or custom API. Token ID of each NFT is appended to the base url to get the metadata and image (does NOT end with .json extension).

  // INTERNAL
  
  // get image from the array of image URLs based on the tokenId (use modulo if tokenId is larger than array length)
  function _getImage(address nftAddress_, uint256 _tokenId) internal view returns(string memory) {
    if (_tokenId > 0) {
      uint256 imgLength = mds[nftAddress_].images.length;
      return mds[nftAddress_].images[(_tokenId-1) % imgLength];
    } else {
      return mds[nftAddress_].images[0];
    }
  }

  // READ

  function getCollectionDescription(address nftAddress_) external view returns (string memory) {
    return mds[nftAddress_].description;
  }

  function getCollectionExternalUrl(address nftAddress_) external view returns (string memory) {
    return mds[nftAddress_].externalUrl;
  }

  function getCollectionImages(address nftAddress_) external view returns (string[] memory) {
    return mds[nftAddress_].images;
  }

  function getCollectionMetadataType(address nftAddress_) external view returns (uint256) {
    return mds[nftAddress_].mdType;
  }

  function getCollectionMetadataUrl(address nftAddress_) external view returns (string memory) {
    return mds[nftAddress_].mdUrl;
  }

  function getCollectionName(address nftAddress_) external view returns (string memory) {
    return mds[nftAddress_].name;
  }

  function getCollectionPreviewImage(address nftAddress_) external view returns (string memory) {
    return mds[nftAddress_].collectionPreview;
  }

  function getMetadata(address nftAddress_, uint256 tokenId_) external view returns (string memory) {
    if (mds[nftAddress_].mdType == 1) {
      return mds[nftAddress_].mdUrl;
    } else if (mds[nftAddress_].mdType == 2) {
      return string(abi.encodePacked(mds[nftAddress_].mdUrl, tokenId_.toString(), ".json"));
    } else if (mds[nftAddress_].mdType == 3) {
      return string(abi.encodePacked(mds[nftAddress_].mdUrl, tokenId_.toString()));
    }

    // default mdType: 0
    return string(
      abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(abi.encodePacked(
        '{"name": "', mds[nftAddress_].name,' #', tokenId_.toString(),'", ',
        '"image": "', _getImage(nftAddress_, tokenId_), '", ',
        '"external_url": "', mds[nftAddress_].externalUrl, '", ',
        '"description": "', mds[nftAddress_].description, '"',
        '}'))))
    );
  }

  // WRITE

  function addImageToCollection(address nftAddress_, string memory imageUrl_) public {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    mds[nftAddress_].images.push(imageUrl_);
  }

  function changeImage(address nftAddress_, uint256 index_, string memory imageUrl_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    mds[nftAddress_].images[index_] = imageUrl_;
  }

  /// @notice While this removes an image from the array, it also puts the last image in the array into the place of this removed image
  function removeImageFromCollection(address nftAddress_, string memory imageUrl_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    uint256 imgLength = mds[nftAddress_].images.length;

    for (uint256 i = 0; i < imgLength; i++) {
      if (keccak256(bytes(mds[nftAddress_].images[i])) == keccak256(bytes(imageUrl_))) {
        mds[nftAddress_].images[i] = mds[nftAddress_].images[imgLength - 1];
        mds[nftAddress_].images.pop();
        break;
      }
    }
  }

  /// @notice While this removes an image from the array, it also puts the last image in the array into the place of this removed image
  function removeImageFromCollectionByIndex(address nftAddress_, uint256 index_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    uint256 imgLength = mds[nftAddress_].images.length;

    require(index_ < imgLength, "Index out of bounds");

    mds[nftAddress_].images[index_] = mds[nftAddress_].images[imgLength - 1];
    mds[nftAddress_].images.pop();
  }

  function setCollectionPreview(address nftAddress_, string memory collectionPreview_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    mds[nftAddress_].collectionPreview = collectionPreview_;
  }

  function setDescription(address nftAddress_, string memory description_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    mds[nftAddress_].description = description_;
  }

  function setExternalUrl(address nftAddress_, string memory externalUrl_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    mds[nftAddress_].externalUrl = externalUrl_;
  }

  function setMdType(address nftAddress_, uint256 mdType_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    mds[nftAddress_].mdType = mdType_;
  }

  function setMdTypeAndUrlOrImage(
    address nftAddress_, 
    uint256 mdType_, 
    string memory mdUrlOrImage_,
    string memory collectionImage_
  ) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");

    mds[nftAddress_].mdType = mdType_;

    if (mdType_ == 0) {
      mds[nftAddress_].images[0] = mdUrlOrImage_;
    } else {
      mds[nftAddress_].mdUrl = mdUrlOrImage_;
    }

    if (bytes(collectionImage_).length > 0) {
      mds[nftAddress_].collectionPreview = collectionImage_;
    }
  }

  function setMdUrl(address nftAddress_, string memory mdUrl_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    mds[nftAddress_].mdUrl = mdUrl_;
  }

  function setName(address nftAddress_, string memory name_) external {
    require(msg.sender == INFT(nftAddress_).owner(), "Not owner of NFT smart contract");
    mds[nftAddress_].name = name_;
  }

}
