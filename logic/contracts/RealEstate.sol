pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "./helper_contracts/ERC721.sol";

///@title Real Estate Exchange
///@author Roberto Carlos
///@notice This contract represents a property exchange market

contract RealEstate is ERC721 {
    struct Asset {
        uint256 assetId;
        uint256 price;
        string cid;
    }

    uint256 public assetsCount;
    mapping(uint256 => Asset) public assetMap;

    address public supervisor;

    mapping(uint256 => address) private assetOwner;
    mapping(address => uint256) private ownedAssetsCount;
    mapping(uint256 => address) public assetApprovals;

    constructor() public {
        supervisor = msg.sender;
    }


    //Events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId, uint256 price);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    function exposeSupervisor() public view returns (address) {
        return supervisor;
    }

    /// Functions inherit from ERC721 ///

    function balanceOf() public view returns (uint256) {
        require(msg.sender != address(0), "Balance query for the zero address");

        return ownedAssetsCount[msg.sender];
    }

    function ownerOf(uint256 assetId) public view returns (address) {
        address owner = assetOwner[assetId];
        require(owner != address(0), 'No Asset is real');
        return owner;
    }

    function transferFrom(uint256 assetId) public payable {
        require(isApprovedOrOwner(msg.sender, assetId), 'Neither approved or owner');
        require(msg.value >= assetMap[assetId].price, 'Payment unsufficient');
        clearApproval(assetId, getApproved(assetId));
        address payable _seller = address(uint160(ownerOf(assetId)));

        ownedAssetsCount[_seller]--;

        ownedAssetsCount[msg.sender]++;
        assetOwner[assetId] = msg.sender;
        _seller.transfer(msg.value * 1000000000000000000);
        emit Transfer(_seller, msg.sender, assetId, msg.value);
    }

    function approve(address to, uint256 assetId) public {
        address owner = ownerOf(assetId);
        require(to != owner, "Current Owner");
        require(msg.sender == owner, "Not asset owner");
        assetApprovals[assetId] = to;
        emit Approval(owner, to, assetId);
    }

    function getApproved(uint256 assetId) public view returns (address) {
        require(exists(assetId), "Token not exist");
        return assetApprovals[assetId];
    }

    // Additional functions added to the token //

    function assetValue(uint256 assetId) public view returns(uint256) {
        return assetMap[assetId].price;
    }

    function allAssets() public view returns(Asset[] memory) {
        Asset[] memory helper = new Asset[](assetsCount); // -- always be aware of array length --
        for (uint i = 0; i < assetsCount; i++) {
            helper[i] = assetMap[i];
        }
        return helper;
    }

    function addAsset(uint256 price, address to, string memory _cid) public {
        require(supervisor == msg.sender, 'Not Supervisor');
        assetMap[assetsCount] = Asset(assetsCount, price, _cid);
        mint(to, assetsCount);
        assetsCount = assetsCount+1;
    }

    function clearApproval(uint256 assetId, address approved) public {
        if(assetApprovals[assetId] == approved) {
            assetApprovals[assetId] = address(0);
        }
    }

    function build(uint256 assetId, uint256 value) public payable {
         require(isApprovedOrOwner(msg.sender, assetId), "Not an approved Owner");
         Asset memory oldAsset = assetMap[assetId];
         assetMap[assetId] = Asset(oldAsset.assetId, oldAsset.price + value, oldAsset.cid);
    }

    function appreciate(uint256 assetId, uint256 value) public {
        require(msg.sender == supervisor, "Not a manager");
        Asset memory oldAsset = assetMap[assetId];
        assetMap[assetId] = Asset(oldAsset.assetId, oldAsset.price+value, oldAsset.cid);
    }

    function depreciate(uint256 assetId,uint256 value) public {
        require(msg.sender==supervisor,"Not a Manager");
        Asset memory oldAsset = assetMap[assetId];
        assetMap[assetId] = Asset(oldAsset.assetId, oldAsset.price - value, oldAsset.cid);
    }

    function getAssetsSize() public view returns(uint){
        return assetsCount;
    }

    // Functions used internally by another functions //

    function mint(address to, uint256 assetId) internal {
        require(to != address(0), "ZeroAddressMiniting");
        require(!exists(assetId), "Already Minted");
        assetOwner[assetId] = to;
        ownedAssetsCount[to]++;
        emit Transfer(address(0), to, assetId);
    }

    function exists(uint256 assetId) internal view returns (bool) {
        return assetOwner[assetId] != address(0);
    }

     function isApprovedOrOwner(address spender, uint256 assetId) internal view returns (bool) {
        require(exists(assetId), "ERC721: operator query for nonexistent token");
        address owner = ownerOf(assetId);
        return (spender == owner || getApproved(assetId) == spender);
    }

    // Unused ERC721 functions //
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    bytes4 private constant _ERC721_RECEIVED = 0x150b7a02;

    mapping (address => mapping (address => bool)) private _operatorApprovals;

    function setApprovalForAll(address to, bool approved) public {
        require(to != msg.sender, "ERC721: approve to caller");
        _operatorApprovals[msg.sender][to] = approved;
        emit ApprovalForAll(msg.sender, to, approved);
    }
}