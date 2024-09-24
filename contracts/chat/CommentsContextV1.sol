// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

interface IModToken {
  function balanceOf(address account) external view returns (uint256);
}

/**
 * @title CommentsContextV1
 * @author TempeTechie.eth
 * @notice This contract is used to store comments within a certain context. Context can be comments under an NFT, playlist, etc. (whatever has an address)
 * 
 * Features:
 * - Simple comments thread under a crypto subject such as an NFT, a playlist, a blog post, etc. (it needs to have an address)
 * - Moderation and moderators: mods are determined based on holding a mod token (can be NFT, SBT, or ERC-20 - whatever has the balanceOf function)
 * - Post author and mods can delete a comment (it's marked as deleted instead of actually being deleted)
 * - Mods can restore a deleted comment
 * - Pause: owner can pause the contract to prevent any new posts (can be useful in case the chat context is archived)
 * - Owner is a single address, but it can be a governance contract where chat users vote on the moderators and other owner functions
 * - Retrieve all comments for a given subject, or exclude deleted ones, and/or retrieve only some fraction of them (pagination)
 * - Not included: edit a comment, fetch comments by a specific user, etc.
 */
contract CommentsContextV1 is Ownable {
  address public modTokenAddress; // NFT, SBT, or ERC-20 token which is used to determine if an address is a mod
  uint256 public modMinBalance; // minimum balance of mod token required to be considered a mod
  bool public paused = false; // whether the contract is paused or not
  uint256 public price = 0.00001 ether; // price of a comment

  mapping(address => Comment[]) public comments; // mapping from subject address to array of comments
  mapping(address => bool) public suspended; // whether an address is suspended from posting or not

  struct Comment {
    address author;
    uint256 createdAt; // timestamp when the comment was created
    bool deleted; // whether the comment is deleted or not
    uint256 index; // index of the comment in the comments array
    string url; // URL pointing to the comment stored on Arweave or IPFS etc., e.g. ar://some-identifier, ipfs://someIdentifier, ...
  }

  // CONSTRUCTOR
  constructor(address modTokenAddress_, address owner_, uint256 modMinBalance_) {
    modTokenAddress = modTokenAddress_;
    modMinBalance = modMinBalance_;
    transferOwnership(owner_);
  }

  // MODIFIERS
  modifier onlyMods() {
    require(
      IModToken(modTokenAddress).balanceOf(msg.sender) >= modMinBalance || 
      msg.sender == owner(),
      "Not a mod or owner"
    );
    _;
  }

  // EVENTS
  event CommentPosted(address indexed author, string indexed url, address indexed subjectAddress, uint256 createdAt);
  event CommentDeleted(address indexed eraser, string indexed url, address indexed subjectAddress, uint256 commentIndex, uint256 deletedAt);
  event CommentRestored(address indexed restorer, string indexed url, address indexed subjectAddress, uint256 commentIndex, uint256 restoredAt);

  // READ FUNCTIONS

  /**
   * @notice Fetch the last N comments for a given subject
   * @param includeDeleted_ Whether to include deleted comments
   * @param subjectAddress_ The address of the comments subject (NFT, playlist etc.)
   * @param length_ The number of comments to fetch
   * @return Comment[]
   */
  function fetchLastComments(
    bool includeDeleted_, // if false, you may not get the full requested length of comments if some are deleted
    address subjectAddress_,
    uint256 length_
  ) external view returns (Comment[] memory) {
    // if length_ is greater than comments[subjectAddress_].length, return all comments
    if (length_ > comments[subjectAddress_].length) {
      return _fetchComments(comments[subjectAddress_], includeDeleted_, 0, comments[subjectAddress_].length);
    }
    return _fetchComments(comments[subjectAddress_], includeDeleted_, comments[subjectAddress_].length - length_, length_);
  }

  /**
   * @notice Fetch multiple comments (pagination) for a single subject
   * @param includeDeleted_ Whether to include deleted comments
   * @param subjectAddress_ The address of the comments subject (NFT, playlist etc.)
   * @param fromIndex_ The index to start fetching from
   * @param length_ The number of comments to fetch
   * @return Comment[]
   */
  function fetchComments(
    bool includeDeleted_, 
    address subjectAddress_,
    uint256 fromIndex_,
    uint256 length_
  ) external view returns (Comment[] memory) {
    return _fetchComments(comments[subjectAddress_], includeDeleted_, fromIndex_, length_);
  }

  /**
   * @notice Get a single comment at a given index
   * @param subjectAddress_ The address of the comments subject (NFT, playlist etc.)
   * @param commentIndex_ The index of the comment
   * @return Comment
   */
  function getComment(
    address subjectAddress_, 
    uint256 commentIndex_
  ) external view returns (Comment memory) {
    return comments[subjectAddress_][commentIndex_];
  }

  function getCommentCount(address subjectAddress_) external view returns (uint256) {
    return comments[subjectAddress_].length;
  }

  function isUserMod(address user_) external view returns (bool) {  
    return IModToken(modTokenAddress).balanceOf(user_) >= modMinBalance || user_ == owner();
  }

  // WRITE FUNCTIONS

  /**
   * @notice Create a new comment for a given subject
   * @param subjectAddress_ The address of the comments subject (NFT, playlist etc.) to comment to
   * @param url_ The URL of the comment
   */
  function createComment(address subjectAddress_, string memory url_) external payable {
    require(!paused, "Contract is paused");
    require(!suspended[msg.sender], "You are suspended from posting");
    require(bytes(url_).length > 0, "URL cannot be empty");
    require(msg.value >= price, "Payment is less than the price");

    Comment memory newComment = Comment({
      author: msg.sender,
      url: url_,
      createdAt: block.timestamp,
      deleted: false,
      index: comments[subjectAddress_].length  // Set the index to the current length of the array
    });

    comments[subjectAddress_].push(newComment);
    emit CommentPosted(msg.sender, url_, subjectAddress_, block.timestamp);
  }  

  /**
   * @notice Delete a comment
   * @param subjectAddress_ The address of the comments subject (NFT, playlist etc.)
   * @param commentIndex_ The index of the comment to delete
   */
  function deleteComment(address subjectAddress_, uint256 commentIndex_) external {
    require(
      comments[subjectAddress_][commentIndex_].author == msg.sender || 
      msg.sender == owner(), 
      "Not the author or owner"
    );
    comments[subjectAddress_][commentIndex_].deleted = true;
    emit CommentDeleted(msg.sender, comments[subjectAddress_][commentIndex_].url, subjectAddress_, commentIndex_, block.timestamp);
  }

  // INTERNAL FUNCTIONS
  function _fetchComments(
    Comment[] storage comments_,
    bool includeDeleted_, 
    uint256 fromIndex_, 
    uint256 length_
  ) internal view returns (Comment[] memory) {
    uint256 totalComments = comments_.length;
    uint256 resultCount = 0;
    uint256 i = fromIndex_;
    
    Comment[] memory result = new Comment[](length_);

    while (resultCount < length_ && i < totalComments) {
      Comment memory selectedMsg = comments_[i];

      if (includeDeleted_ || !selectedMsg.deleted) {
        result[resultCount] = selectedMsg;
        resultCount++;
      }

      i++;
    }

    // Reduce the array length using assembly
    assembly {
      mstore(result, resultCount)
    }

    return result;
  }

  // MODERATOR

  /**
   * @notice Restore a comment
   * @param subjectAddress_ The address of the comments subject (NFT, playlist etc.)
   * @param commentIndex_ The index of the comment to restore
   */
  function restoreComment(address subjectAddress_, uint256 commentIndex_) external onlyMods {
    require(comments[subjectAddress_][commentIndex_].deleted, "Comment is not deleted");
    comments[subjectAddress_][commentIndex_].deleted = false;
    emit CommentRestored(msg.sender, comments[subjectAddress_][commentIndex_].url, subjectAddress_, commentIndex_, block.timestamp);
  }

  /**
   * @notice Suspend a user from posting
   * @param user_ The address of the user to suspend
   */
  function suspendUser(address user_) external onlyMods {
    suspended[user_] = true;
  }

  /**
   * @notice Pause the contract to prevent any new posts, or unpause it
   */
  function togglePaused() external onlyMods {
    paused = !paused;
  }

  /**
   * @notice Unsuspend a user from posting
   * @param user_ The address of the user to unsuspend
   */
  function unsuspendUser(address user_) external onlyMods {
    suspended[user_] = false;
  }

  // OWNER
  function withdrawRevenue(address to_) external onlyOwner {
    (bool success, ) = to_.call{value: address(this).balance}("");
    require(success, "Transfer failed");
  }

  function setModTokenAddress(address modTokenAddress_) external onlyOwner {
    modTokenAddress = modTokenAddress_;
  }

  function setModMinBalance(uint256 modMinBalance_) external onlyOwner {
    modMinBalance = modMinBalance_;
  }

  function setPrice(uint256 price_) external onlyOwner {
    price = price_;
  }
  
}
