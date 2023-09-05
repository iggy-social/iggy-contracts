// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import "./Nft721Bonding.sol";

interface IStatsContract {
  function addWeiSpent(address user_, uint256 weiSpent_) external;
  function addWriterByWriter(address writer_) external;
}

interface INftMetadata {
  function setCollectionPreview(address nftAddress_, string memory collectionPreview_) external;
  function setDescription(address nftAddress_, string memory description_) external;
  function setImage(address nftAddress_, string memory image_) external;
  function setName(address nftAddress_, string memory name_) external;
}

/** 
@title Factory contract for launching new ERC721 collections with bonding curve pricing
@author Tempe Techie
*/
contract IggyLaunchpad721Bonding is Ownable {
  address public metadataAddress;
  address public mintingFeeReceiver;
  address public paymentReceiver; // the address that receives the ETH paid for launching a new NFT contract
  address public statsAddress; // usually the stats middleware address

  address[] public allNftContracts; // array of all NFT contracts launched by this contract
  address[] public featuredNftContracts; // array of NFT contracts that are featured by the contract owner

  bool public paused = false; // pause launching collections through the factory contract

  uint256 public maxNftNameLength = 32;
  uint256 public mintingFeePercentage; // in wei
  uint256 public price; // price for creating new NFT contract
  uint256 public ratio; // ratio for the bonding curve

  mapping (string => address) public nftContracts; // mapping of nft contract addresses to their unique IDs

  // EVENTS
  event CollectionLaunch(address indexed contractOwner_, address indexed msgSender_, string name_, string uniqueId_, address indexed nftContract_);

  // CONSTRUCTOR
  constructor(
    address _metadataAddress,
    address _mintingFeeReceiver,
    address _paymentReceiver,
    address _statsAddress,
    uint256 _mintingFeePercentage,
    uint256 _ratio
  ) {
    metadataAddress = _metadataAddress;
    mintingFeeReceiver = _mintingFeeReceiver;
    paymentReceiver = _paymentReceiver;
    statsAddress = _statsAddress;
    mintingFeePercentage = _mintingFeePercentage;
    ratio = _ratio;
  }

  // READ

  function getAllNftContracts() external view returns(address[] memory) {
    return allNftContracts;
  }

  /// @notice Get the last 5 NFT contract addresses launched by this factory contract
  function getLastFiveNftContracts() external view returns(address[] memory) {
    uint256 length = allNftContracts.length;
    
    if (length <= 5) {
      return allNftContracts; // Return the whole array if it has 5 or fewer items
    } else {
      address[] memory lastFive = new address[](5);

      for (uint256 i = 0; i < 5; i++) {
        lastFive[i] = allNftContracts[length - 5 + i];
      }

      return lastFive;
    }
  }

  // function to get NFT contract address by unique ID
  function getNftContractAddress(string calldata _uniqueId) external view returns(address) {
    return nftContracts[_uniqueId];
  }

  function getNftContracts(uint256 amount) external view returns(address[] memory) {
    uint256 length = allNftContracts.length;
    address[] memory nftContracts_ = new address[](amount);

    for (uint256 i = 0; i < amount; i++) {
      nftContracts_[i] = allNftContracts[length - amount + i];
    }

    return nftContracts_;
  }

  // function to check if unique ID is available
  function isUniqueIdAvailable(string calldata _uniqueId) public view returns(bool) {
    return nftContracts[_uniqueId] == address(0);
  }

  // WRITE
  
  /// @notice Launch new ERC721 collection with bonding curve pricing
  function launch(
    address contractOwner_,
    string memory mdDescription_,
    string memory mdImage_,
    string memory mdName_,
    string memory name_,
    string memory symbol_,
    string calldata uniqueId_
  ) external payable {
    require(!paused, "Launching new collections is paused");
    require(msg.value >= price, "Not enough ETH sent to cover price");
    require(isUniqueIdAvailable(uniqueId_), "Unique ID is not available");
    require(bytes(name_).length <= maxNftNameLength, "Unique ID must be 32 characters or less");

    (bool sent, ) = paymentReceiver.call{value: address(this).balance}("");
    require(sent, "Failed to send launch payment to the payment receiver");

    // create new NFT contract
    Nft721Bonding nftContract = new Nft721Bonding(
      address(this), contractOwner_, metadataAddress, mintingFeeReceiver, name_, symbol_, mintingFeePercentage, ratio
    );

    // update nftContracts mapping and allNftContracts array
    nftContracts[uniqueId_] = address(nftContract);
    allNftContracts.push(address(nftContract));

    // update metadata contract
    INftMetadata(metadataAddress).setCollectionPreview(address(nftContract), mdImage_);
    INftMetadata(metadataAddress).setDescription(address(nftContract), mdDescription_);
    INftMetadata(metadataAddress).setImage(address(nftContract), mdImage_);
    INftMetadata(metadataAddress).setName(address(nftContract), mdName_);

    // update stats
    IStatsContract(statsAddress).addWeiSpent(msg.sender, msg.value);
    IStatsContract(statsAddress).addWriterByWriter(address(nftContract));

    emit CollectionLaunch(contractOwner_, msg.sender, name_, uniqueId_, address(nftContract));
  }

  // OWNER

  function addNftAddressToFeatured(address _nftAddress) external onlyOwner {
    featuredNftContracts.push(_nftAddress);
  }

  /// @notice Recover ETH sent to this contract
  function recoverEth() external onlyOwner {
    (bool sent, ) = owner().call{value: address(this).balance}("");
    require(sent, "Failed to send ETH to TLD owner");
  }

  function removeNftAddressFromFeatured(address _nftAddress) external onlyOwner {
    for (uint256 i = 0; i < featuredNftContracts.length; i++) {
      if (featuredNftContracts[i] == _nftAddress) {
        featuredNftContracts[i] = featuredNftContracts[featuredNftContracts.length - 1];
        featuredNftContracts.pop();
        break;
      }
    }
  }

  function removeNftAddressFromfeaturedByIndex(uint256 _index) external onlyOwner {
    featuredNftContracts[_index] = featuredNftContracts[featuredNftContracts.length - 1];
    featuredNftContracts.pop();
  }

  /// @notice Set max NFT name length
  function setMaxNftNameLength(uint256 _maxNftNameLength) external onlyOwner {
    maxNftNameLength = _maxNftNameLength;
  }

  /// @notice Set metadata contract address
  function setMetadataAddress(address _metadataAddress) external onlyOwner {
    metadataAddress = _metadataAddress;
  }

  /// @notice Set royalty fee receiver
  function setMintingFeeReceiver(address _mintingFeeReceiver) external onlyOwner {
    mintingFeeReceiver = _mintingFeeReceiver;
  }

  /// @notice Set royalty fee percentage in wei
  function setMintingFeePercentage(uint256 _mintingFeePercentage) external onlyOwner {
    mintingFeePercentage = _mintingFeePercentage;
  }

  /// @notice Set payment receiver
  function setPaymentReceiver(address _paymentReceiver) external onlyOwner {
    paymentReceiver = _paymentReceiver;
  }

  /// @notice Set price for creating new NFT contract
  function setPrice(uint256 _price) external onlyOwner {
    price = _price;
  }

  /// @notice Set ratio for the bonding curve
  function setRatio(uint256 _ratio) external onlyOwner {
    ratio = _ratio;
  }

  /// @notice Set stats contract address
  function setStatsAddress(address _statsAddress) external onlyOwner {
    statsAddress = _statsAddress;
  }

  /// @notice Toggle pausing launching new collections
  function togglePaused() external onlyOwner {
    paused = !paused;
  }

}
