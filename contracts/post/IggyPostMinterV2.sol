// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IERC1155 } from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IChatTokenMinter {
  function mint(address to, uint256 amount) external;
}

interface IIggyPostNft is IERC1155 {

  function getPostPrice (string memory _postId, address _author) external view returns (uint256);

  function owner() external view returns(address);

  function mint(
    string memory _postId, 
    address _author, 
    address _nftReceiver, 
    string memory _textPreview,
    uint256 _quantity
  ) external returns(uint256);

}

interface IIggyPostEnumeration {
  function addMintedPostId(address _user, uint256 _postId) external;
  function addMintedWei(address _user, uint256 _wei) external;
  function addWeiEarnedByAuthorPerPostId(uint256 _postId, uint256 _wei) external;
}

/**
@title IggyPostMinterV2
@notice This contract allows users to mint IggyPost NFTs and paying with ETH.
@dev Use this contract when CHAT token is deployed.
*/
contract IggyPostMinterV2 is Ownable, ReentrancyGuard {
  address public immutable chatTokenAddress;
  address public daoAddress;
  address public devAddress;
  address public devFeeUpdaterAddress;
  address public enumAddress;
  address public immutable postAddress;
  address public stakingAddress; // address of the staking contract

  bool public enumEnabled = false;
  bool public paused = false;

  uint256 public chatEthRatio = 1_000; // 1 ETH (or payment token) = 1,000 CHAT

  uint256 public constant MAX_BPS = 10_000;
  uint256 public daoFee; // share of each domain purchase (in bips) that goes to the DAO/community that owns the frontend
  uint256 public devFee; // share of each domain purchase (in bips) that goes to the developer (Iggy team)
  uint256 public referrerFee; // share of each domain purchase (in bips) that goes to the referrer
  uint256 public stakingFee; // share of each domain purchase (in bips) that goes to the staking contract

  // CONSTRUCTOR
  constructor(
    address _chatTokenAddress,
    address _daoAddress,
    address _devAddress,
    address _postAddress,
    uint256 _daoFee,
    uint256 _devFee,
    uint256 _referrerFee,
    uint256 _stakingFee
  ) {
    require(_daoFee + _devFee + _referrerFee + _stakingFee <= MAX_BPS, "IggyPostMinterV2: Fees cannot be more than 100%");
    require(_chatTokenAddress != address(0), "IggyPostMinterV2: CHAT token cannot be zero address");
    require(_postAddress != address(0), "IggyPostMinterV2: Post address cannot be zero address");

    chatTokenAddress = _chatTokenAddress;
    daoAddress = _daoAddress;
    devAddress = _devAddress;
    devFeeUpdaterAddress = _devAddress;
    postAddress = _postAddress;

    daoFee = _daoFee;
    devFee = _devFee;
    referrerFee = _referrerFee;
    stakingFee = _stakingFee;
  }

  // WRITE

  function mint(
    string memory _postId, 
    address _author, 
    address _nftReceiver, 
    address _referrer,
    string memory _textPreview,
    uint256 _quantity
  ) external nonReentrant payable returns(uint256 tokenId) {
    require(!paused, "Minting paused");

    // find price
    uint256 price = IIggyPostNft(postAddress).getPostPrice(_postId, _author) * _quantity;

    require(msg.value >= price, "Value below price");

    // send a referrer fee
    if (referrerFee > 0 && _referrer != address(0)) {
      uint256 referrerPayment = (price * referrerFee) / MAX_BPS;
      (bool sentReferrerFee, ) = payable(_referrer).call{value: referrerPayment}("");
      require(sentReferrerFee, "Failed to send referrer fee");
    }

    // send a dev fee
    if (devFee > 0 && devAddress != address(0)) {
      uint256 devPayment = (price * devFee) / MAX_BPS;
      (bool sentDevFee, ) = payable(devAddress).call{value: devPayment}("");
      require(sentDevFee, "Failed to send dev fee");
    }

    // send a dao fee
    if (daoFee > 0 && daoAddress != address(0)) {
      uint256 daoFeePayment = (price * daoFee) / MAX_BPS;
      (bool sentDaoFee, ) = payable(daoAddress).call{value: daoFeePayment}("");
      require(sentDaoFee, "Failed to send dao fee");
    }

    // send a staking fee
    if (stakingFee > 0 && stakingAddress != address(0)) {
      uint256 stakingFeePayment = (price * stakingFee) / MAX_BPS;
      (bool sentStakingFee, ) = payable(stakingAddress).call{value: stakingFeePayment}("");
      require(sentStakingFee, "Failed to send staking fee");
    }

    // send the rest to post author
    (bool sent, ) = payable(_author).call{value: address(this).balance}("");
    require(sent, "Failed to send payment to the post author");

    // mint the post as NFT
    tokenId = IIggyPostNft(postAddress).mint(_postId, _author, _nftReceiver, _textPreview, _quantity);

    // store some stats in the enumeration contract
    if (enumEnabled && enumAddress != address(0)) {
      price = price - ((price * referrerFee) / MAX_BPS) - ((price * devFee) / MAX_BPS) - ((price * daoFee) / MAX_BPS);

      // feel free to comment out the stats that you don't need to track
      IIggyPostEnumeration(enumAddress).addMintedPostId(_nftReceiver, tokenId);
      IIggyPostEnumeration(enumAddress).addWeiEarnedByAuthorPerPostId(tokenId, price);
    }

    // mint chat tokens for the NFT receiver (use only the fees to calculate the share of chat tokens, not the whole price)
    if (chatTokenAddress != address(0)) {
      uint256 fees = (price * (devFee + daoFee)) / MAX_BPS; // exclude the referrer fee because msg sender could include their own address as a referrer
      IChatTokenMinter(chatTokenAddress).mint(_nftReceiver, fees*chatEthRatio);
    }
  }

  // OWNER

  /// @notice This changes the DAO address in the minter contract
  function changeDaoAddress(address _daoAddress) external onlyOwner {
    daoAddress = _daoAddress;
  }

  // change dao fee
  function changeDaoFee(uint256 _daoFee) external onlyOwner {
    require(_daoFee + devFee + referrerFee + stakingFee <= MAX_BPS, "Fees cannot be more than 100%");
    daoFee = _daoFee;
  }

  // change enum address
  function changeEnumAddress(address _enumAddress) external onlyOwner {
    enumAddress = _enumAddress;
  }

  // change referrer fee
  function changeReferrerFee(uint256 _referrerFee) external onlyOwner {
    require(daoFee + devFee + _referrerFee + stakingFee <= MAX_BPS, "Fees cannot be more than 100%");
    referrerFee = _referrerFee;
  }

  function changeStakingAddress(address _stakingAddress) external onlyOwner {
    stakingAddress = _stakingAddress;
  }

  // change staking fee
  function changeStakingFee(uint256 _stakingFee) external onlyOwner {
    require(daoFee + devFee + referrerFee + _stakingFee <= MAX_BPS, "Fees cannot be more than 100%");
    stakingFee = _stakingFee;
  }

  /// @notice Recover any ERC-20 token mistakenly sent to this contract address
  function recoverERC20(address tokenAddress_, uint256 tokenAmount_, address recipient_) external onlyOwner {
    IERC20(tokenAddress_).transfer(recipient_, tokenAmount_);
  }

  /// @notice Recover any ERC-721 token mistakenly sent to this contract address
  function recoverERC721(address tokenAddress_, uint256 tokenId_, address recipient_) external onlyOwner {
    IERC721(tokenAddress_).transferFrom(address(this), recipient_, tokenId_);
  }

  /// @notice Recover any ERC-1155 token mistakenly sent to this contract address
  function recoverERC1155(address tokenAddress_, uint256 tokenId_, address recipient_, uint256 _amount) external onlyOwner {
    IERC1155(tokenAddress_).safeTransferFrom(address(this), recipient_, tokenId_, _amount, "");
  }

  function toggleEnumEnabled() external onlyOwner {
    enumEnabled = !enumEnabled;
  }

  function togglePaused() external onlyOwner {
    paused = !paused;
  }

  /// @notice Withdraw native coins from contract
  function withdraw() external onlyOwner {
    (bool success, ) = owner().call{value: address(this).balance}("");
    require(success, "Failed to withdraw native coins from contract");
  }

  // OTHER WRITE METHODS

  // @notice This changes the CHAT:ETH ratio
  function changeChatEthRatio(uint256 _chatEthRatio) external {
    require(_msgSender() == daoAddress, "Sender is not the DAO");
    chatEthRatio = _chatEthRatio;
  }

  /// @notice This changes the developer's address in the minter contract
  function changeDevAddress(address _devAddress) external {
    require(_msgSender() == devAddress, "Sender is not the developer");
    devAddress = _devAddress;
  }

  /// @notice This changes the dev fee updater's address in the minter contract
  function changeDevFeeUpdaterAddress(address _devFeeUpdaterAddress) external {
    require(_msgSender() == devFeeUpdaterAddress, "Sender is not the dev fee updater");
    devFeeUpdaterAddress = _devFeeUpdaterAddress;
  }

  // change dev fee (only dev fee updater can change it)
  function changeDevFee(uint256 _devFee) external {
    require(_msgSender() == devFeeUpdaterAddress, "Sender is not the dev fee updater");
    require(daoFee + _devFee + referrerFee + stakingFee <= MAX_BPS, "Fees cannot be more than 100%");
    devFee = _devFee;
  }
 
}