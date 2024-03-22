// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { OwnableWithManagers } from "../../access/OwnableWithManagers.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Nft721Classic.sol";

interface INftDirectory {
  function addNftAddressToAllWithUniqueId(address _nftAddress, string calldata uniqueId_) external;
  function isUniqueIdAvailable(string calldata _uniqueId) external view returns(bool);
}

interface INftMetadata {
  function addImageToCollection(address nftAddress_, string memory imageUrl_) external;
  function setCollectionPreview(address nftAddress_, string memory collectionPreview_) external;
  function setDescription(address nftAddress_, string memory description_) external;
  function setName(address nftAddress_, string memory name_) external;
}

interface IStatsContract {
  function addWeiSpent(address user_, uint256 weiSpent_) external;
  function addWriterByWriter(address writer_) external;
}

/** 
@title Factory contract for launching new ERC721 collections with classic pricing (no bonding curve)
@author Tempe Techie
*/
contract IggyLaunchpad721Classic is OwnableWithManagers, ReentrancyGuard {
  address public metadataAddress;
  address public mintingFeeReceiver; // the address that receives the ETH paid for launching a new NFT contract & minting fees from NFT contracts
  address public nftDirectoryAddress;
  address public statsAddress; // usually the stats middleware address

  bool public paused = false; // pause launching collections through the factory contract

  uint256 public maxNftNameLength = 32;
  uint256 public mintingFeePercentage; // in wei
  uint256 public price; // price for creating new NFT contract
  uint256 public referralFeePercentage = 10**17; // in wei (1 ether is 100%, default is 10**17 = 10%)

  // EVENTS
  event CollectionLaunch(address indexed contractOwner_, address indexed msgSender_, string name_, string uniqueId_, address indexed nftContract_);

  // CONSTRUCTOR
  constructor(
    address _metadataAddress,
    address _mintingFeeReceiver,
    address _nftDirectoryAddress,
    address _statsAddress,
    uint256 _mintingFeePercentage,
    uint256 _price
  ) {
    require(_mintingFeePercentage < (5 * 1e16), "IggyLaunchpad721Classic: fee must be lower than 5%");

    metadataAddress = _metadataAddress;
    mintingFeeReceiver = _mintingFeeReceiver;
    nftDirectoryAddress = _nftDirectoryAddress;
    statsAddress = _statsAddress;
    mintingFeePercentage = _mintingFeePercentage;
    price = _price;
  }

  // WRITE
  
  /// @notice Launch new ERC721 collection with classic pricing
  function launch(
    address contractOwner_,
    address referrer_,
    string memory mdDescription_,
    string memory mdImage_,
    string memory mdName_,
    string memory name_,
    string memory symbol_,
    string calldata uniqueId_, // to easily find the NFT contract address
    uint256 maxSupply_, // max NFT supply
    uint256 mintPrice_ // NFT minting price
  ) external payable nonReentrant {
    require(!paused, "Launching new collections is paused");
    require(msg.value >= price, "Not enough ETH sent to cover price");

    require(INftDirectory(nftDirectoryAddress).isUniqueIdAvailable(uniqueId_), "Unique ID is not available");
    require(bytes(name_).length <= maxNftNameLength, "Name must be 32 characters or less");

    uint256 paid = msg.value;

    // send referral fee
    if (referrer_ != address(0) && referralFeePercentage > 0) {
      uint256 referralFee = msg.value * referralFeePercentage / 1 ether;
      (bool sentRef, ) = referrer_.call{value: referralFee}("");

      if (statsAddress != address(0)) {
        IStatsContract(statsAddress).addWeiSpent(referrer_, referralFee);
      }
      
      paid -= referralFee;
    }

    (bool sent, ) = mintingFeeReceiver.call{value: address(this).balance}("");
    require(sent, "Failed to send launch payment to the payment receiver");

    // create new NFT contract
    bytes32 saltedHash = keccak256(abi.encodePacked(msg.sender, block.timestamp, uniqueId_));
    Nft721Classic nftContract = new Nft721Classic{salt: saltedHash}(
      address(this), 
      metadataAddress, 
      mintingFeeReceiver, 
      name_, 
      symbol_, 
      maxSupply_,
      mintPrice_
    );

    // update nftAddressById mapping and allNftContracts array
    INftDirectory(nftDirectoryAddress).addNftAddressToAllWithUniqueId(address(nftContract), uniqueId_);

    // update metadata contract
    _updateMetadata(address(nftContract), mdDescription_, mdImage_, mdName_);

    // update stats
    _updateOwnerAndStats(contractOwner_, nftContract, uniqueId_, paid);
  }

  // INTERNAL
  function _updateMetadata(address nftAddress_, string memory mdDescription_, string memory mdImage_, string memory mdName_) internal {
    INftMetadata(metadataAddress).addImageToCollection(nftAddress_, mdImage_);
    INftMetadata(metadataAddress).setCollectionPreview(nftAddress_, mdImage_);
    INftMetadata(metadataAddress).setDescription(nftAddress_, mdDescription_);
    INftMetadata(metadataAddress).setName(nftAddress_, mdName_);
  }

  function _updateOwnerAndStats(address contractOwner_, Nft721Classic nftContract_, string calldata uniqueId_, uint256 weiSpent_) internal {
    nftContract_.transferOwnership(contractOwner_);

    if (statsAddress != address(0)) {
      IStatsContract(statsAddress).addWeiSpent(msg.sender, weiSpent_);
      IStatsContract(statsAddress).addWriterByWriter(address(nftContract_));
    }

    emit CollectionLaunch(contractOwner_, msg.sender, nftContract_.name(), uniqueId_, address(nftContract_));
  }

  // OWNER

  /// @notice Recover ETH sent to this contract
  function recoverEth() external onlyManagerOrOwner {
    (bool sent, ) = owner().call{value: address(this).balance}("");
    require(sent, "Failed to send ETH to TLD owner");
  }

  /// @notice Set max NFT name length
  function setMaxNftNameLength(uint256 _maxNftNameLength) external onlyManagerOrOwner {
    maxNftNameLength = _maxNftNameLength;
  }

  /// @notice Set metadata contract address
  function setMetadataAddress(address _metadataAddress) external onlyManagerOrOwner {
    metadataAddress = _metadataAddress;
  }

  /// @notice Set royalty fee receiver
  function setMintingFeeReceiver(address _mintingFeeReceiver) external onlyManagerOrOwner {
    mintingFeeReceiver = _mintingFeeReceiver;
  }

  /// @notice Set royalty fee percentage in wei
  function setMintingFeePercentage(uint256 _mintingFeePercentage) external onlyManagerOrOwner {
    require(_mintingFeePercentage < (5 * 1e16), "IggyLaunchpad721Classic: fee must be lower than 5%");
    mintingFeePercentage = _mintingFeePercentage;
  }

  /// @notice Set NFT directory contract address
  function setNftDirectoryAddress(address _nftDirectoryAddress) external onlyManagerOrOwner {
    nftDirectoryAddress = _nftDirectoryAddress;
  }

  /// @notice Set price for creating new NFT contract
  function setPrice(uint256 _price) external onlyManagerOrOwner {
    price = _price;
  }

  /// @notice Set referral fee percentage in wei (1 ether is 100%)
  function setReferralFeePercentage(uint256 _referralFeePercentage) external onlyManagerOrOwner {
    referralFeePercentage = _referralFeePercentage;
  }

  /// @notice Set stats contract address
  function setStatsAddress(address _statsAddress) external onlyManagerOrOwner {
    statsAddress = _statsAddress;
  }

  /// @notice Toggle pausing launching new collections
  function togglePaused() external onlyManagerOrOwner {
    paused = !paused;
  }
}