const RS = artifacts.require("RealEstate");

module.exports = function(deployer) {
  deployer.deploy(RS);
};