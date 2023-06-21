// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

interface IBasePunkTLD {
  function name() external view returns(string memory);
  function defaultNames(address) external view returns(string memory);
}

/// @title Metadata contract (v2) for Iggy Social Post NFT
/// @author Tempe Techie
/// @notice Contract that stores metadata for an Iggy Post NFT
contract IggyPostMetadataV2 is Ownable {
  using Strings for uint256;

  address public immutable tldAddress;

  string public description;
  string public name;
  string public url;

  // EVENTS
  event DescriptionChanged(address indexed user, string description);
  event NameChanged(address indexed user, string name);

  // constructor
  constructor(
    string memory _name,
    string memory _description,
    string memory _url,
    address _tldAddress
  ) {
    name = _name;
    description = _description;
    url = _url;

    tldAddress = _tldAddress;
  }

  // INTERNAL
  function _randomHueNum(uint256 _tokenId) internal pure returns(uint256) {
    return uint256(keccak256(abi.encodePacked(_tokenId))) % 361;
  }

  // READ
  function getMetadata(
    uint256 _tokenId,
    string calldata _postId, 
    address _author,
    string calldata _textPreview,
    string calldata _image,
    uint256 _timestamp
  ) public view returns(string memory) {
    return string(
      abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(abi.encodePacked(
        _getInitialData(_tokenId, _postId),
        _getAttributes(_postId, _author, _timestamp),
        '"image": "', _getImage(_tokenId, _textPreview, _image, _author), '"}'))))
    );
  }

  function _getImage(uint256 _tokenId, string memory _textPreview, string memory _image, address _author) internal view returns (string memory) {
    string memory hue = _randomHueNum(_tokenId).toString();
    string memory authorName = IBasePunkTLD(tldAddress).defaultNames(_author);

    if (bytes(authorName).length == 0) {
      authorName = "Anonymous";
    } else {
      authorName = string(abi.encodePacked(authorName, IBasePunkTLD(tldAddress).name()));
    }

    string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">',
        '<rect x="0" y="0" width="500" height="500" fill="hsl(', hue, ', 50%, 40%)"/>',
        '<foreignObject x="0" y="0" width="100%" height="100%" font-size="28">',
          '<div xmlns="http://www.w3.org/1999/xhtml" style="background-size: contain; background-image: url(',
            "'", _image, "'",
            '); width=100%; height: 100%; padding: 10px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: #ffffff;">',
            _textPreview,
            '<p></p>',
            authorName,
          '</div>',
        '</foreignObject>',
      '</svg>'
    ))));

    return string(abi.encodePacked("data:image/svg+xml;base64,", svgBase64Encoded));
  }

  function _getAttributes(string calldata _postId, address _author, uint256 _timestamp) internal pure returns (string memory) {
    return string(abi.encodePacked(
      '"attributes": [',
        '{"trait_type": "post id", "value": "', _postId, '"}, ',
        '{"trait_type": "author", "value": "', Strings.toHexString(uint160(_author), 20), '"}, ',
        '{"trait_type": "created", "display_type": "date", "value": "', _timestamp.toString(), '"}'
      '], '
    ));
  }

  function _getInitialData(uint256 _tokenId, string calldata _postId) internal view returns (string memory) {
    return string(abi.encodePacked(
      '{"name": "', name, ' #', _tokenId.toString(), '", ',
      '"description": "', description, '", ',
      '"external_url": "', url, '?id=', _postId, '", '
    ));
  }

  // WRITE (OWNER)

  /// @notice Only metadata contract owner can call this function.
  function changeName(string calldata _name) external onlyOwner {
    name = _name;
    emit NameChanged(msg.sender, _name);
  }

  /// @notice Only metadata contract owner can call this function.
  function changeDescription(string calldata _description) external onlyOwner {
    description = _description;
    emit DescriptionChanged(msg.sender, _description);
  }

  /// @notice Only metadata contract owner can call this function.
  function changeUrl(string calldata _url) external onlyOwner {
    url = _url;
  }
  
}