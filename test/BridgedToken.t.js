const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

// Test of the bridge token
// Fixtures used : deployment of storage, factory and vault
// Vault is the owner of the bridge token at the end of the deployment
// classic ERC20 tests + minting and burning and ownership transfer
describe("BridgedToken", function () {
  // deployment fixture :
  async function deployBridgedTokenFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    const token = await hre.ethers.deployContract("BridgedToken", [
      "ethereum",
      "abETH",
    ]);
    await token.waitForDeployment();
    console.log("BridgedToken deployed to:", token.target);
    return { token, owner, otherAccount };
  }

  describe("BridgedToken Deployment", function () {
    it("Should have ethereum as name and abETH as symbol", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployBridgedTokenFixture
      );
      console.log("bridgedToken", token);

      expect(await token.name()).to.equal("ethereum");
      expect(await token.symbol()).to.equal("abETH");
    });
    it("Should have admin as owner", async function () {
      const { token, owner } = await loadFixture(deployBridgedTokenFixture);

      expect(await token.getOwner()).to.equal(owner.address);
    });
    it("Should transfer ownership to otherAccount", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployBridgedTokenFixture
      );
      await token.updateAdmin(otherAccount.address);
      expect(await token.getOwner()).to.equal(otherAccount.address);
    });
    it("Should emit OwnershipTransferred event", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployBridgedTokenFixture
      );
      await expect(token.updateAdmin(otherAccount.address))
        .to.emit(token, "OwnerUpdated")
        .withArgs(token.name(), otherAccount.address);
    });
  });
  describe("BridgedToken minting and burning", function () {
    it("Should mint 1000 tokens to owner", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployBridgedTokenFixture
      );

      await token.connect(owner).mint(otherAccount.address, 1000);
      expect(await token.balanceOf(otherAccount.address)).to.equal(1000);
    });

    it("Should burn 1000 tokens from owner", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployBridgedTokenFixture
      );
      await token.connect(owner).mint(otherAccount.address, 1000);
      await token.connect(owner).burn(otherAccount.address, 1000);
      expect(await token.balanceOf(otherAccount.address)).to.equal(0);
    });
    it("Should revert when minter is not the owner", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployBridgedTokenFixture
      );
      await expect(
        token.connect(otherAccount).mint(otherAccount.address, 1000)
      ).to.be.revertedWith("only admin owner");
    });
    it("Should revert when burner is not the owner", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployBridgedTokenFixture
      );
      await expect(
        token.connect(otherAccount).burn(otherAccount.address, 1000)
      ).to.be.revertedWith("only admin owner");
    });
    it("Should revert when burner has not enough tokens", async function () {
      const { token, owner, otherAccount } = await loadFixture(
        deployBridgedTokenFixture
      );
      const otherAccountBalance = await token.balanceOf(otherAccount.address);
      await expect(token.connect(owner).burn(otherAccount.address, 1000))
        .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
        .withArgs(otherAccount.address, otherAccountBalance, 1000);
    });
  });
  // TODO classic ERC20 tests
});
