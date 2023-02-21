// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.17;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

/// @title Domain metadata contract
/// @author Tempe Techie
/// @notice Contract that stores metadata for a TLD
contract IggyPostMetadata is Ownable {
  using Strings for uint256;

  string public description;
  string public brand;
  string public url;

  // EVENTS
  event DescriptionChanged(address indexed user, string description);
  event BrandChanged(address indexed user, string brand);

  // constructor
  constructor(
    string memory _brand,
    string memory _description,
    string memory _url
  ) {
    brand = _brand;
    description = _description;
    url = _url;
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
    string calldata _textPreview
  ) public view returns(string memory) {
    return string(
      abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(abi.encodePacked(
        _getOtherData(_tokenId, _postId, _author),
        '"image": "', _getImage(_tokenId, _textPreview), '"}'))))
    );
  }

  function _getImage(uint256 _tokenId, string memory _textPreview) internal pure returns (string memory) {
    string memory hue = _randomHueNum(_tokenId).toString();

    string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">',
        '<rect x="0" y="0" width="500" height="500" fill="hsl(', hue, ', 50%, 40%)"/>',
        '<foreignObject x="0" y="0" width="100%" height="100%" font-size="28">',
          '<div xmlns="http://www.w3.org/1999/xhtml" style="width=100%; height: 100%; padding: 10px; display: flex; justify-content: center; align-items: center; text-align: center; color: #ffffff;">',
            _textPreview, ' ...',
          '</div>',
        '</foreignObject>',
      '</svg>'
    ))));

    return string(abi.encodePacked("data:image/svg+xml;base64,", svgBase64Encoded));
  }

  function _getOtherData(uint256 _tokenId, string calldata _postId, address _author) internal view returns (string memory) {
    return string(abi.encodePacked(
      '{"name": "', brand, ' Post #', _tokenId.toString() ,'", ',
      '"description": "', description, '", ',
      '"external_url": "', url, '?id=', _postId ,'", ',
      '"attributes": [',
        '{"trait_type": "postId", "value": "', _postId ,'"}, ',
        '{"trait_type": "author", "value": "', _author ,'"}'
      '], '
    ));
  }

  // WRITE (OWNER)

  /// @notice Only metadata contract owner can call this function.
  function changeBrand(string calldata _brand) external onlyOwner {
    brand = _brand;
    emit BrandChanged(msg.sender, _brand);
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