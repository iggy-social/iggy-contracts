// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { OwnableWithManagers } from "../../access/OwnableWithManagers.sol";
import "./Nft721Bonding.sol";

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
contract IggyLaunchpad721Bonding is OwnableWithManagers {
  address public metadataAddress;
  address public mintingFeeReceiver; // the address that receives the ETH paid for launching a new NFT contract & minting fees from NFT contracts
  address public statsAddress; // usually the stats middleware address

  address[] public allNftContracts; // array of all NFT contracts launched by this contract
  address[] public featuredNftContracts; // array of NFT contracts that are featured by the contract owner

  bool public paused = false; // pause launching collections through the factory contract

  uint256 public maxNftNameLength = 32;
  uint256 public mintingFeePercentage; // in wei
  uint256 public price; // price for creating new NFT contract

  mapping (string => address) public nftAddressById; // mapping(uniqueID => NFT contract address) to easily find the NFT contract address

  // EVENTS
  event CollectionLaunch(address indexed contractOwner_, address indexed msgSender_, string name_, string uniqueId_, address indexed nftContract_);

  // CONSTRUCTOR
  constructor(
    address _metadataAddress,
    address _mintingFeeReceiver,
    address _statsAddress,
    uint256 _mintingFeePercentage,
    uint256 _price
  ) {
    metadataAddress = _metadataAddress;
    mintingFeeReceiver = _mintingFeeReceiver;
    statsAddress = _statsAddress;
    mintingFeePercentage = _mintingFeePercentage;
    price = _price;
  }

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

  // WRITE
  
  /// @notice Launch new ERC721 collection with bonding curve pricing
  function launch(
    address contractOwner_,
    string memory mdDescription_,
    string memory mdImage_,
    string memory mdName_,
    string memory name_,
    string memory symbol_,
    string calldata uniqueId_, // to easily find the NFT contract address
    uint256 ratio // ratio of price increase per token minted for bonding curve (in wei)
  ) external payable {
    require(!paused, "Launching new collections is paused");
    require(msg.value >= price, "Not enough ETH sent to cover price");
    
    require(ratio >= 1e16 && ratio <= 9_000_000 ether, "Ratio out of bounds");

    require(isUniqueIdAvailable(uniqueId_), "Unique ID is not available");
    require(bytes(name_).length <= maxNftNameLength, "Name must be 32 characters or less");

    (bool sent, ) = mintingFeeReceiver.call{value: address(this).balance}("");
    require(sent, "Failed to send launch payment to the payment receiver");

    // create new NFT contract
    bytes32 saltedHash = keccak256(abi.encodePacked(msg.sender, block.timestamp, uniqueId_));
    Nft721Bonding nftContract = new Nft721Bonding{salt: saltedHash}(
      address(this), metadataAddress, mintingFeeReceiver, name_, symbol_, mintingFeePercentage, ratio
    );

    // update nftAddressById mapping and allNftContracts array
    nftAddressById[uniqueId_] = address(nftContract);
    allNftContracts.push(address(nftContract));

    // update metadata contract
    INftMetadata(metadataAddress).addImageToCollection(address(nftContract), mdImage_);
    INftMetadata(metadataAddress).setCollectionPreview(address(nftContract), mdImage_);
    INftMetadata(metadataAddress).setDescription(address(nftContract), mdDescription_);
    INftMetadata(metadataAddress).setName(address(nftContract), mdName_);

    nftContract.transferOwnership(contractOwner_);

    // update stats
    if (statsAddress != address(0)) {
      IStatsContract(statsAddress).addWeiSpent(msg.sender, msg.value);
      IStatsContract(statsAddress).addWriterByWriter(address(nftContract));
    }

    emit CollectionLaunch(contractOwner_, msg.sender, name_, uniqueId_, address(nftContract));
  }

  // OWNER

  function addNftAddressToAll(address _nftAddress) external onlyManagerOrOwner {
    allNftContracts.push(_nftAddress);
  }

  function addNftAddressToFeatured(address _nftAddress) external onlyManagerOrOwner {
    featuredNftContracts.push(_nftAddress);
  }

  /// @notice Recover ETH sent to this contract
  function recoverEth() external onlyManagerOrOwner {
    (bool sent, ) = owner().call{value: address(this).balance}("");
    require(sent, "Failed to send ETH to TLD owner");
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

  /// @notice Set price for creating new NFT contract
  function setPrice(uint256 _price) external onlyManagerOrOwner {
    price = _price;
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
