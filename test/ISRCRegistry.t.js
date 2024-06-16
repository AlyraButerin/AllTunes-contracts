const hre = require("hardhat");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
// const { ethers } = require(ethers);

const getMaxAddress = () => {
  return toChecksumAddress("0x" + "f".repeat(40));
};
const toChecksumAddress = (address) => {
  return ethers.getAddress(address);
};

const MOCKED_ISRC_CODE = "AA6Q72000047";
const MIN_PRICE = hre.ethers.parseEther("0.05");
const NEW_MIN_PRICE = hre.ethers.parseEther("1");

describe("ISRCRegistry", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const [owner, otherAccount, stranger] = await ethers.getSigners();

    const ISRCRegistry = await ethers.getContractFactory("ISRCRegistry");
    const registry = await ISRCRegistry.deploy();

    return { registry, owner, otherAccount, stranger };
  }

  async function deployAndSetISRCFixture() {
    const [owner, otherAccount, stranger] = await ethers.getSigners();
    const ISRCRegistry = await ethers.getContractFactory("ISRCRegistry");
    const registry = await ISRCRegistry.deploy();

    let tx = await registry.setNewISRC(MOCKED_ISRC_CODE, MIN_PRICE);
    await tx.wait();
    // let spec = await registry.getISRCSpec(MOCKED_ISRC_CODE);
    return { registry, owner, otherAccount, stranger };
  }

  describe("Deployment", function () {
    it("Should set owner as admin", async function () {
      const { registry, owner } = await loadFixture(deployFixture);
      const admin = await registry.getAdmin();
      expect(admin).to.equal(owner.address);
    });

    it("Should always check the mocked ISRCvalidation", async function () {
      const { registry, owner } = await loadFixture(deployFixture);
      const result = await registry.mockedCheckISRCValidity(
        MOCKED_ISRC_CODE,
        getMaxAddress()
      );
      expect(result).to.equal(true);
    });
  });

  describe("Setters", function () {
    it("Should set new ISRC value", async function () {
      const { registry, owner } = await loadFixture(deployFixture);
      let tx = await registry.setNewISRC(MOCKED_ISRC_CODE, MIN_PRICE);
      await tx.wait();
      let spec = await registry.getISRCSpec(MOCKED_ISRC_CODE);

      expect(spec.minPrice).to.equal(MIN_PRICE);
      expect(spec.isBound).to.equal(true);
      expect(spec.artistAddress).to.equal(owner.address);
    });
    it("Should emit ISRCRegistry_ISRCset event ", async function () {
      const { registry, owner } = await loadFixture(deployFixture);

      await expect(registry.setNewISRC(MOCKED_ISRC_CODE, MIN_PRICE))
        .to.emit(registry, "ISRCRegistry_ISRCset")
        .withArgs(MOCKED_ISRC_CODE, owner.address, MIN_PRICE);
    });

    it("Should set new ISRC value with fixture", async function () {
      const { registry, owner } = await loadFixture(deployAndSetISRCFixture);
      let spec = await registry.getISRCSpec(MOCKED_ISRC_CODE);

      expect(spec.minPrice).to.equal(MIN_PRICE);
      expect(spec.isBound).to.equal(true);
      expect(spec.artistAddress).to.equal(owner.address);
    });

    it("Should update ISRC spec", async function () {
      const { registry, owner } = await loadFixture(deployAndSetISRCFixture);
      let oldSpec = await registry.getISRCSpec(MOCKED_ISRC_CODE);

      tx = await registry.updateISRC(MOCKED_ISRC_CODE, NEW_MIN_PRICE);
      await tx.wait();
      let newSpec = await registry.getISRCSpec(MOCKED_ISRC_CODE);
      expect(oldSpec.minPrice).to.equal(MIN_PRICE);
      expect(newSpec.minPrice).to.equal(NEW_MIN_PRICE);
      expect(newSpec.isBound).to.equal(true);
      expect(newSpec.artistAddress).to.equal(owner.address);
    });
    it("Shouldemit ISRCRegistry_ISRCset event", async function () {
      const { registry, owner } = await loadFixture(deployAndSetISRCFixture);

      await expect(registry.updateISRC(MOCKED_ISRC_CODE, NEW_MIN_PRICE))
        .to.emit(registry, "ISRCRegistry_ISRCset")
        .withArgs(MOCKED_ISRC_CODE, owner.address, NEW_MIN_PRICE);
    });
  });

  describe("buyAllowance", function () {
    it("Should transfer AFT buy amount to artist", async function () {
      const { registry, owner, otherAccount } = await loadFixture(
        deployAndSetISRCFixture
      );
      let spec = await registry.getISRCSpec(MOCKED_ISRC_CODE);

      expect(spec.minPrice).to.equal(MIN_PRICE);
      expect(spec.isBound).to.equal(true);
      expect(spec.artistAddress).to.equal(owner.address);

      let ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      let otherBalanceBefore = await ethers.provider.getBalance(
        otherAccount.address
      );

      tx = await registry
        .connect(otherAccount)
        .buyAllowance(MOCKED_ISRC_CODE, getMaxAddress(), 0, {
          value: MIN_PRICE,
        });
      let receipt = await tx.wait();
      const gasPrice = receipt.gasPrice;
      const gasSpent = receipt.gasUsed * gasPrice;
      let ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      let otherBalanceAfter = await ethers.provider.getBalance(
        otherAccount.address
      );
      console.log("TEST_buyAllowance ........... balances :");
      console.log("ownerBalanceBefore: ", ownerBalanceBefore);
      console.log("ownerBalanceAfter : ", ownerBalanceAfter);
      console.log("otherBalanceBefore: ", otherBalanceBefore);
      console.log("otherBalanceAfter : ", otherBalanceAfter);

      const biPrice = BigInt(MIN_PRICE);
      const otherBalanceDif = otherBalanceBefore - otherBalanceAfter;
      const ownerBalanceDif = ownerBalanceAfter - ownerBalanceBefore;
      console.log("otherBalanceDif", otherBalanceDif);
      console.log("ownerBalanceDif", ownerBalanceDif);
      console.log("gasSpent", gasSpent);

      expect(otherBalanceDif).to.equal(biPrice + gasSpent);
      expect(ownerBalanceDif).to.equal(biPrice);
    });

    it("Should accord LIFE time allowance to user", async function () {
      const { registry, owner, otherAccount } = await loadFixture(
        deployAndSetISRCFixture
      );
      let spec = await registry.getISRCSpec(MOCKED_ISRC_CODE);
      let userUsageBefore = await registry.getUserUsage(
        MOCKED_ISRC_CODE,
        otherAccount.address
      );
      let tx = await registry
        .connect(otherAccount)
        .buyAllowance(MOCKED_ISRC_CODE, getMaxAddress(), 0, {
          value: MIN_PRICE,
        });
      await tx.wait();
      let userUsageAfter = await registry.getUserUsage(
        MOCKED_ISRC_CODE,
        otherAccount.address
      );

      expect(userUsageBefore.allowanceType).to.equal(0n);
      expect(userUsageAfter.allowanceType).to.equal(2n);
    });
    it("Should emit ISRCRegistry_buyAllowance event", async function () {
      const { registry, owner, otherAccount } = await loadFixture(
        deployAndSetISRCFixture
      );

      await expect(
        registry
          .connect(otherAccount)
          .buyAllowance(MOCKED_ISRC_CODE, getMaxAddress(), 0, {
            value: MIN_PRICE,
          })
      )
        .to.emit(registry, "ISRCRegistry_buyAllowance")
        .withArgs(MOCKED_ISRC_CODE, otherAccount.address);
    });
    it("Should emit ISRCRegistry_paymentSent event", async function () {
      const { registry, owner, otherAccount } = await loadFixture(
        deployAndSetISRCFixture
      );

      await expect(
        registry
          .connect(otherAccount)
          .buyAllowance(MOCKED_ISRC_CODE, getMaxAddress(), 0, {
            value: MIN_PRICE,
          })
      )
        .to.emit(registry, "ISRCRegistry_paymentSent")
        .withArgs(owner.address, otherAccount.address);
    });
    it("Should emit ISRCRegistry_ISRCallowanceSet event", async function () {
      const { registry, owner, otherAccount } = await loadFixture(
        deployAndSetISRCFixture
      );

      await expect(
        registry
          .connect(otherAccount)
          .buyAllowance(MOCKED_ISRC_CODE, getMaxAddress(), 0, {
            value: MIN_PRICE,
          })
      )
        .to.emit(registry, "ISRCRegistry_ISRCallowanceSet")
        .withArgs(MOCKED_ISRC_CODE, otherAccount.address, 2n);
    });
    it("Should revert if balance is insufficient", async function () {
      const { registry, owner, otherAccount, stranger } = await loadFixture(
        deployAndSetISRCFixture
      );

      let balanceOtherAccount = await ethers.provider.getBalance(
        otherAccount.address
      );
      console.log("otherAccount balance:", balanceOtherAccount);
      let newPrice = 2n * balanceOtherAccount;
      await registry.updateISRC(MOCKED_ISRC_CODE, newPrice);

      expect(
        await registry
          .connect(otherAccount)
          .buyAllowance(MOCKED_ISRC_CODE, getMaxAddress(), 0, {
            value: MIN_PRICE,
          })
      ).to.be.revertedWithCustomError(registry, "ISRCRegistry_payArtistFailed");
    });
  });
  describe("revokeAdmin", function () {
    it("Should revoke admin", async function () {
      const { registry, owner, otherAccount, stranger } = await loadFixture(
        deployAndSetISRCFixture
      );
      let tx = await registry.revokeAdmin();

      let newAdmin = await registry.getAdmin();
      expect(newAdmin).to.equal(getMaxAddress());
    });
    it("Should emit event : ISRCRegistry_revokAdmin", async function () {
      const { registry, owner, otherAccount, stranger } = await loadFixture(
        deployAndSetISRCFixture
      );
      let tx = await registry.revokeAdmin();
      await tx.wait();
      await expect(registry.revokeAdmin()).to.emit(
        registry,
        "ISRCRegistry_revokAdmin"
      );
    });
  });
});
