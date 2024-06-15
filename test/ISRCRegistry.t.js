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

describe("ISCRRegistry", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    // const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    // const ONE_GWEI = 1_000_000_000;

    // const lockedAmount = ONE_GWEI;
    // const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const ISRCRegistry = await ethers.getContractFactory("ISCRRegistry");
    const registry = await ISRCRegistry.deploy();

    return { registry, owner, otherAccount };
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
    it("Should always check the mocked ISRCvalidation", async function () {
      const { registry, owner } = await loadFixture(deployFixture);
      let tx = await registry.setNewISRC(MOCKED_ISRC_CODE, MIN_PRICE);
      await tx.wait();
      let spec = await registry.getISRCSpec(MOCKED_ISRC_CODE);

      expect(spec.minPrice).to.equal(MIN_PRICE);
      expect(spec.isBound).to.equal(true);
      expect(spec.artistAddress).to.equal(owner.address);
    });

    it("Should update ISRC spec", async function () {
      const { registry, owner } = await loadFixture(deployFixture);
      let tx = await registry.setNewISRC(MOCKED_ISRC_CODE, MIN_PRICE);
      await tx.wait();
      let oldSpec = await registry.getISRCSpec(MOCKED_ISRC_CODE);

      tx = await registry.updateISRC(MOCKED_ISRC_CODE, NEW_MIN_PRICE);
      await tx.wait();
      let newSpec = await registry.getISRCSpec(MOCKED_ISRC_CODE);
      expect(oldSpec.minPrice).to.equal(MIN_PRICE);
      expect(newSpec.minPrice).to.equal(NEW_MIN_PRICE);
      expect(newSpec.isBound).to.equal(true);
      expect(newSpec.artistAddress).to.equal(owner.address);
    });
  });

  describe("buyAllowance", function () {
    it("Should transfer AFT buy amount to artist", async function () {
      const { registry, owner, otherAccount } = await loadFixture(
        deployFixture
      );
      let tx = await registry.setNewISRC(MOCKED_ISRC_CODE, MIN_PRICE);
      await tx.wait();
      let spec = await registry.getISRCSpec(MOCKED_ISRC_CODE);

      expect(spec.minPrice).to.equal(MIN_PRICE);
      expect(spec.isBound).to.equal(true);
      expect(spec.artistAddress).to.equal(owner.address);

      // let ownerBalanceBefore = await provider.getBalance(otherAccount);
      let ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      let otherBalanceBefore = await ethers.provider.getBalance(
        otherAccount.address
      );

      let usageBefore = registry.getUserUsage(
        MOCKED_ISRC_CODE,
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
      console.log(
        "TEST_buyAllowance / ownerBalanceBefore: ",
        ownerBalanceBefore
      );
      console.log(
        "TEST_buyAllowance / ownerBalanceAfter : ",
        ownerBalanceAfter
      );

      console.log(
        "TEST_buyAllowance / otherBalanceBefore: ",
        otherBalanceBefore
      );

      console.log(
        "TEST_buyAllowance / otherBalanceAfter : ",
        otherBalanceAfter
      );

      const biPrice = BigInt(MIN_PRICE);
      const otherBalanceDif = otherBalanceBefore - otherBalanceAfter;
      const ownerBalanceDif = ownerBalanceAfter - ownerBalanceBefore;
      console.log("otherBalanceDif", otherBalanceDif);
      console.log("ownerBalanceDif", ownerBalanceDif);
      console.log("gasSpent", gasSpent);

      expect(otherBalanceDif).to.equal(biPrice + gasSpent);
      expect(ownerBalanceDif).to.equal(biPrice);
    });

    //   it("Should allow other account to buy lifetime allowance", async function () {
    //     const { registry, owner } = await loadFixture(deployFixture);
    //     let tx = await registry.setNewISRC(MOCKED_ISRC_CODE, MIN_PRICE);
    //     await tx.wait();
    //     let spec = await registry.getISRCSpec(MOCKED_ISRC_CODE);

    //     expect(spec.minPrice).to.equal(MIN_PRICE);
    //     expect(spec.isBound).to.equal(true);
    //     expect(spec.artistAddress).to.equal(owner.address);
    //   });
  });
});
