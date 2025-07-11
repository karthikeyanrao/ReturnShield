// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CouponNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId = 1;

    event ReceiptMinted(address indexed to, uint256 indexed tokenId, string billNo, string tokenURI);

    constructor() ERC721("CouponNFT", "CPN") Ownable(msg.sender) {}

    function mintCoupon(address to, string memory couponCode, string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }

    function mintReceipt(address to, string memory billNo, string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        emit ReceiptMinted(to, tokenId, billNo, tokenURI);
        return tokenId;
    }

    function burnCoupon(uint256 tokenId) public {
        require(_isApprovedOrOwnerCustom(msg.sender, tokenId), "Not owner nor approved");
        _burn(tokenId);
    }

    function _isApprovedOrOwnerCustom(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
    }
}

