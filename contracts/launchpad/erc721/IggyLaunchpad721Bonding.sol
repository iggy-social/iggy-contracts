// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { OwnableWithManagers } from "../../access/OwnableWithManagers.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Nft721Bonding.sol";

interface INftDirectory {
  function addNftAddressToAllWithUniqueId(address _nftAddress, string calldata uniqueId_) external;
  function getAllFeaturedNftContracts() external view returns(address[] memory);
  function getFeaturedNftContracts(uint256 amount) external view returns(address[] memory);
  function getFeaturedNftContractsArrayLength() external view returns(uint256);
  function getLastNftContracts(uint256 amount) external view returns(address[] memory);
  function getNftContractAddress(string calldata _uniqueId) external view returns(address);
  function getNftContracts(uint256 fromIndex, uint256 toIndex) external view returns(address[] memory);
  function getNftContractsArrayLength() external view returns(uint256);
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
@title Factory contract for launching new ERC721 collections with bonding curve pricing
@author Tempe Techie
*/
contract IggyLaunchpad721Bonding is OwnableWithManagers, ReentrancyGuard {
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
    metadataAddress = _metadataAddress;
    mintingFeeReceiver = _mintingFeeReceiver;
    nftDirectoryAddress = _nftDirectoryAddress;
    statsAddress = _statsAddress;
    mintingFeePercentage = _mintingFeePercentage;
    price = _price;
  }

  // READ

  function getAllFeaturedNftContracts() external view returns(address[] memory) {
    return INftDirectory(nftDirectoryAddress).getAllFeaturedNftContracts();
  }

  /// @notice Get last X amount of featured NFT contract addresses
  function getFeaturedNftContracts(uint256 amount) external view returns(address[] memory) {
    return INftDirectory(nftDirectoryAddress).getFeaturedNftContracts(amount);
  }

  /// @notice Get array length of featured NFT contracts
  function getFeaturedNftContractsArrayLength() external view returns(uint256) {
    return INftDirectory(nftDirectoryAddress).getFeaturedNftContractsArrayLength();
  }

  /// @notice Get last X amount of NFT contract addresses
  function getLastNftContracts(uint256 amount) external view returns(address[] memory) {
    return INftDirectory(nftDirectoryAddress).getLastNftContracts(amount);
  }

  /// @notice Get NFT contract address by unique ID
  function getNftContractAddress(string calldata _uniqueId) external view returns(address) {
    return INftDirectory(nftDirectoryAddress).getNftContractAddress(_uniqueId);
  }

  /// @notice Get NFT contract addresses between two indexes
  function getNftContracts(uint256 fromIndex, uint256 toIndex) external view returns(address[] memory) {
    return INftDirectory(nftDirectoryAddress).getNftContracts(fromIndex, toIndex);
  }

  /// @notice Get NFT the length of the allNftContracts array
  function getNftContractsArrayLength() external view returns(uint256) {
    return INftDirectory(nftDirectoryAddress).getNftContractsArrayLength();
  }

  /// @notice Check if unique ID is available
  function isUniqueIdAvailable(string calldata _uniqueId) public view returns(bool) {
    return INftDirectory(nftDirectoryAddress).isUniqueIdAvailable(_uniqueId);
  }

  // WRITE
  
  /// @notice Launch new ERC721 collection with bonding curve pricing
  function launch(
    address contractOwner_,
    address referrer_,
    string memory mdDescription_,
    string memory mdImage_,
    string memory mdName_,
    string memory name_,
    string memory symbol_,
    string calldata uniqueId_, // to easily find the NFT contract address
    uint256 ratio // ratio of price increase per token minted for bonding curve (in wei)
  ) external payable nonReentrant {
    require(!paused, "Launching new collections is paused");
    require(msg.value >= price, "Not enough ETH sent to cover price");
    
    require(ratio >= 1e16 && ratio <= 9_000_000 ether, "Ratio out of bounds");

    require(isUniqueIdAvailable(uniqueId_), "Unique ID is not available");
    require(bytes(name_).length <= maxNftNameLength, "Name must be 32 characters or less");

    uint256 paid = msg.value;

    // send referral fee
    if (referrer_ != address(0) && referralFeePercentage > 0) {
      uint256 referralFee = msg.value * referralFeePercentage / 1 ether;
      (bool sentRef, ) = referrer_.call{value: referralFee}("");
      IStatsContract(statsAddress).addWeiSpent(referrer_, referralFee);
      paid -= referralFee;
    }

    (bool sent, ) = mintingFeeReceiver.call{value: address(this).balance}("");
    require(sent, "Failed to send launch payment to the payment receiver");

    // create new NFT contract
    bytes32 saltedHash = keccak256(abi.encodePacked(msg.sender, block.timestamp, uniqueId_));
    Nft721Bonding nftContract = new Nft721Bonding{salt: saltedHash}(
      address(this), metadataAddress, mintingFeeReceiver, name_, symbol_, mintingFeePercentage, ratio
    );

    // update nftAddressById mapping and allNftContracts array
    INftDirectory(nftDirectoryAddress).addNftAddressToAllWithUniqueId(address(nftContract), uniqueId_);

    // update metadata contract
    INftMetadata(metadataAddress).addImageToCollection(address(nftContract), mdImage_);
    INftMetadata(metadataAddress).setCollectionPreview(address(nftContract), mdImage_);
    INftMetadata(metadataAddress).setDescription(address(nftContract), mdDescription_);
    INftMetadata(metadataAddress).setName(address(nftContract), mdName_);

    nftContract.transferOwnership(contractOwner_);

    // update stats
    if (statsAddress != address(0)) {
      IStatsContract(statsAddress).addWeiSpent(msg.sender, paid);
      IStatsContract(statsAddress).addWriterByWriter(address(nftContract));
    }

    emit CollectionLaunch(contractOwner_, msg.sender, name_, uniqueId_, address(nftContract));
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
