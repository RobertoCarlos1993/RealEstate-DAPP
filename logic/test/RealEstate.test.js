const RS = artifacts.require("RealEstate");
// helper
const ETH_VALUE = 2; // Denomination check ETH --> later multiple to its equivalent to WEI
const ETH_VALUE_SECOND = 4; // price to diffenciate properties while testing!
const ETH_CHANGE = 5; // value used to appreciate or depreciated the ASSET!

const ETHER = 1000000000000000000; // 1 ETH

const hexToDecimal = (num) => {
  return parseInt(num, "hex");
};

contract("Real Estate Contract", (accounts) => {
  const [
    deployer,
    firstAccount,
    secondAccount,
    thirdAccount,
    fourthAccount,
    fifthAccount,
  ] = accounts;

  let contract;

  before(async () => {
    contract = await RS.deployed();
  });

  // -- Uniquely verify that it was deployed succesfully
  describe("Deployment", async () => {
    it("Deploy correctly", async () => {
      const address = contract.address;
    });
  });

  describe("Add and exchange Assets", async () => {
    it("Multiple Asset Added", async () => {
      // -- First Asset --
      const price = ETH_VALUE;
      const _cid = "393ksksk"; // CID for testing future feature of uploading images to IPFS!!
      await contract.addAsset(price, [firstAccount], _cid);

      // -- Second Asset --
      const price_second = ETH_VALUE_SECOND;
      const _cid_second = "dbhgdf6576"; // CID for testing future feature of uploading images to IPFS!!
      await contract.addAsset(price_second, [secondAccount, thirdAccount], _cid_second);
      
      // -- Verify multiple ownsership of an asset
      const owners_asset1 = await contract.ownersOf(1);
      assert.equal(
        owners_asset1.toString(),
        [secondAccount, thirdAccount].toString(),
        "Owner was not the multi-account provided!"
      );

      const allAssets = await contract.allAssets();
    });

    it("Approved an address and verify its approval", async () => {
      await contract.setSharedApproval([fifthAccount, firstAccount], [40, 60], 1);
      const approvedTotal = await contract.countApproveAddresses(1);
      let arrApproved = [];
      for(let i = 0; i < approvedTotal; i++) {
        const {approval_address} = await contract.holdSharedApproval(1, i);
        arrApproved.push(approval_address);
      }

      assert.equal(
        arrApproved.toString(),
        ([fifthAccount, firstAccount]).toString(),
        "Approved account is not given permissions by the secondAccount"
      );
    });


    it("Check Asset value & Transfer ownsership of asset", async () => {
      const valueAsset = await contract.assetValue(1);
      //// ----- SO FAR IT IS TESTED UNTIL HERE WITH THE NEW IMPLEMENTATION OF MULTIPLE OWNERS AND MULTIPLE APPROVED FUTURE OWNSERS!!
      /*assert.equal(
        valueAsset,
        ETH_VALUE_SECOND,
        "Asset value does not match with the setup"
      );
      await contract.switchOwner(secondAccount, 1, {
        from: thirdAccount,
        value: valueAsset * 1000000000000000000,
      });*/
    });
/*
    it("Increase value of an asset either owner or supervisor", async () => {
      //1. Test increasing by owner role
      await contract.build(0, ETH_CHANGE, { from: firstAccount });
      const newAssetValue = await contract.assetValue(0);

      assert.equal(
        newAssetValue,
        ETH_VALUE + ETH_CHANGE,
        "New asset value after increasing does not match"
      );

      //2. Test increasing by supervisor role
      await contract.appreciate(0, ETH_CHANGE, { from: deployer });
      const newAssetValueManager = await contract.assetValue(0);

      assert.equal(
        newAssetValueManager,
        ETH_VALUE + ETH_CHANGE * 2,
        "New asset value after increasing does not match"
      );
    });

    it("Decrease value of an asset by the supervisor role", async () => {
      await contract.depreciate(0, ETH_CHANGE, { from: deployer });
      const newAssetValueManager = await contract.assetValue(0);

      assert.equal(
        newAssetValueManager,
        ETH_VALUE + ETH_CHANGE,
        "New asset value after increasing does not match"
      );
    });*/
  });
});
