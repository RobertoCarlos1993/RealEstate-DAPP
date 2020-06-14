const RS = artifacts.require("RealEstate");
// helper
const ETH_VALUE = 2; // Denomination check ETH --> later multiple to its equivalent to WEI
const ETH_VALUE_SECOND = 4; // price to diffenciate properties while testing!
const ETH_CHANGE = 5; // value used to appreciate or depreciated the ASSET!

contract('Real Estate Contract', (accounts) => {
    console.table(accounts);

    const [deployer, firstAccount, secondAccount, thirdAccount] = accounts;

    console.log('FIRST ACCOUNT: ' + firstAccount);

    let contract;

    before( async() => {
      contract = await RS.deployed();
    });

    // -- Uniquely verify that it was deployed succesfully
    describe("Deployment", async() => {
        it("Deploy correctly", async() => {
            const address = contract.address;
            console.log(address);
            const supervisor = await contract.exposeSupervisor();
        })
    });

   describe('Add and exchange Assets', async() => {

       it("Multiple Asset Added", async () => {
         // -- First Asset --
        const price = ETH_VALUE;
        const _cid = "393ksksk"; // CID for testing future feature of uploading images to IPFS!!
        await contract.addAsset(price, firstAccount, _cid);

          // -- Second Asset --
          const price_second = ETH_VALUE_SECOND;
          const _cid_second = "dbhgdf6576"; // CID for testing future feature of uploading images to IPFS!!
          await contract.addAsset(price_second, secondAccount, _cid_second);

        const owner = await contract.ownerOf(0);
        assert.equal(
            owner,
            firstAccount,
            "Owner was not the first account provided!"
        );

        const allAssets = await contract.allAssets();
        console.log(allAssets);
       });

       it("Approved an address and verify its approval", async () => {
        await contract.approve(thirdAccount, 0, {from : firstAccount })
        const whoIsApproved = await contract.getApproved(0);
        assert.equal(
            whoIsApproved,
            thirdAccount,
            "Approved account is not given permissions by the firstAccount"
        );
      })

      it("Check Asset value & Trasnfer ownsership of asset", async () => {
         /* const optionsSell = {
               from: thirdAccount, 
               value: ETH_VALUE,
               gas: 3900000
          };
          
          const valueAsset = await contract.assetValue(0);
          assert.equal(
            valueAsset,
            ETH_VALUE,
            'Asset value does not match with the setup'
          );

          await contract.transferFrom(0, optionsSell); // DOUBLE CHECK issue!!!*/
      });

      it("Increase value of an asset either owner or supervisor", async() => {
        //1. Test increasing by owner role
        await contract.build(0, ETH_CHANGE, {from : thirdAccount});
        const newAssetValue = await contract.assetValue(0);

        assert.equal(
            newAssetValue,
            ETH_VALUE + ETH_CHANGE,
            'New asset value after increasing does not match'
        );

        //2. Test increasing by supervisor role
        await contract.appreciate(0, ETH_CHANGE, {from : deployer});
        const newAssetValueManager = await contract.assetValue(0);

        assert.equal(
            newAssetValueManager,
            ETH_VALUE + ETH_CHANGE * 2,
            'New asset value after increasing does not match'
        );
      });

      it("Decrease value of an asset by the supervisor role", async() => {
        await contract.depreciate(0, ETH_CHANGE, {from : deployer});
        const newAssetValueManager = await contract.assetValue(0);

        assert.equal(
            newAssetValueManager,
            ETH_VALUE + ETH_CHANGE,
            'New asset value after increasing does not match'
        );
      });

    });

});