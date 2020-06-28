pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "./helper_contracts/ERC721.sol";

///@title Real Estate Exchange Market
///@author Roberto Carlos
///@notice This contract represents a property exchange market where a property can have multiple owners and buyers. Each property is represented as a ERC721 token.

contract RealEstate is ERC721 {
    struct Asset {
        uint256 assetId;
        uint256 price;
        string cid;
    }

    struct ApprovalFormat {
        address approval_address;
        uint256 percetange;
    }

    uint256 public assetsCount;
    mapping(uint256 => Asset) public assetMap;
    address public supervisor;

    mapping(uint256 => address[]) private assetOwners;
    mapping(address => uint256) private ownedAssetsCount;
    mapping(uint256 => uint256) public countApproveAddresses;
    mapping(uint256 => mapping(uint256 => ApprovalFormat)) public holdSharedApproval;

    constructor() public {
        supervisor = msg.sender;
    }


    // --- Events ---
    event Transfer(address indexed from, address[] indexed owners, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event SharedApproval(address[] indexed owners, uint256 indexed tokenId);

    // --- Functions inherit from ERC721 ---

    function balanceOf() public view returns (uint256) {
        require(msg.sender != address(0), "Balance query for the zero address");

        return ownedAssetsCount[msg.sender];
    }

    function ownersOf(uint256 assetId) public view returns (address[] memory) {
        address[] memory owners = assetOwners[assetId];
        for(uint i = 0; i < owners.length; i++) {
          require(owners[i] != address(0), 'No Asset is real');
        }
        return owners;
    }
    
    /// @notice Simply transfer the ownership from a ERC721 token to the approved addresses
    /// @param ownersToBePaid The addresses which will receive the payment from the approved address to buy
    /// @param assetId The ID of the token which will be purchase
    /// @dev Current implementation assumes that we pay equally to all the owners, taking into consideration the "percetange". 
    //       You may want to edit the behaviour to adapt better to your reqs
    function switchOwners(address[] payable ownersToBePaid, uint256 assetId) public payable {
        require(isApprovedOrOwner(msg.sender, assetId), 'Neither approved or owner');
        require(ownersOf(assetId) == ownersToBePaid, "The addresses are not owners");
        // This step is pendant of refactoring, as the first time run will clear all approvals!!!!
        clearApproval(assetId);

        for(uint i = 0; i < ownersToBePaid.length; i++) {
            ownedAssetsCount[ownersToBePaid[i]]--
        }

        ownedAssetsCount[msg.sender]++;

        assetOwners[assetId] = msg.sender;

        from.transfer(msg.value);
        emit Transfer(from, msg.sender, assetId);
    }

    function setSharedApproval(address[] memory addresses, uint8[] memory percetange, uint256 assetId) public {
      address[] memory owners = ownersOf(assetId);
      for (uint i = 0; i < addresses.length; i++) {
          require(addresses[i] != owners[i], "Current Owner");
      }
      for(uint i = 0; i < addresses.length; i++) {
          ApprovalFormat memory helper = ApprovalFormat(addresses[i], (percetange[i] * assetMap[assetId].price) / 100);
          holdSharedApproval[assetId][i] = helper;
          countApproveAddresses[assetId]++;
      }
      emit SharedApproval(owners, assetId);
    }

    // --- Additional functions added to the ERC721 Token ---

    function assetValue(uint256 assetId) public view returns(uint256) {
        return assetMap[assetId].price;
    }

    function allAssets() public view returns(Asset[] memory) {
        Asset[] memory helper = new Asset[](assetsCount);
        for (uint i = 0; i < assetsCount; i++) {
            helper[i] = assetMap[i];
        }
        return helper;
    }

    function addAsset(uint256 price, address[] memory owners, string memory _cid) public {
        require(supervisor == msg.sender, 'Not Supervisor');
        assetMap[assetsCount] = Asset(assetsCount, price, _cid);
        mint(owners, assetsCount);
        assetsCount = assetsCount+1;
    }

   function clearApproval(uint256 assetId) public {
       for (uint i = 0; i < countApproveAddresses[assetId]; i++) {
           holdSharedApproval[assetId][i].approval_address = address(0);
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

    // --- Functions used internally by another functions ---

    function mint(address[] memory owners, uint256 assetId) internal {
        for(uint i = 0; i < owners.length; i++) {
          require(owners[i] != address(0), "Zero Address Minting");
        }
        require(!exists(assetId), "Already Minted");
        assetOwners[assetId] = owners;
        for (uint i = 0; i < owners.length; i++) {
            ownedAssetsCount[owners[i]]++;
        }
        emit Transfer(address(0), owners, assetId);
    }

    function exists(uint256 assetId) internal view returns (bool) {
        bool checker = false;
        for (uint i = 0; i < assetOwners[assetId].length; i++) {
            checker = assetOwners[assetId][i] != address(0);
        }
        return checker;
    }

     function isApprovedOrOwner(address verify_address, uint256 assetId) internal view returns (bool) {
        require(exists(assetId), "ERC721: operator query for nonexistent token");
        bool helper = false;
        address[] memory owners = ownersOf(assetId);
        for (uint i = 0; i < owners.length; i++) {
           if(verify_address == owners[i]) {
             helper = true;
           }
        }
        for (uint i = 0; i < countApproveAddresses[assetId]; i++) {
           if(verify_address == holdSharedApproval[assetId][i].approval_address) {
             helper = true;
           }
        }
        return helper;
    }
}