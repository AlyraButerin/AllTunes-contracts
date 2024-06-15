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
    it("Should bound a new ISRC and set its data", async function () {
      const { registry, owner } = await loadFixture(deployFixture);
      const admin = await registry.getAdmin();
      expect(admin).to.equal(owner.address);
    });

    it("Should always check the mocked ISRCvalidation", async function () {
      const { registry, owner } = await loadFixture(deployFixture);
      let tx = await registry.setNewISRC(MOCKED_ISRC_CODE, MIN_PRICE);
      await tx.wait();
      let spec = await registry.getISRCSpec(MOCKED_ISRC_CODE);

      expect(spec.minPrice).to.equal(MIN_PRICE);
      expect(spec.isBound).to.equal(true);
      expect(spec.artistAddress).to.equal(owner.address);
    });
  });
});
