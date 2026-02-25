import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("PropertyManagement", function () {
  async function deployPropertyFixture() {
    const [owner, buyer, other] = await hre.ethers.getSigners();

    const ERC20 = await hre.ethers.getContractFactory("ERC20");
    const erc20 = await ERC20.deploy("MarkDavid", "MDTK", 18, 1_000_000);

    const Property = await hre.ethers.getContractFactory("PropertyManagement");
    const property = await Property.deploy(erc20.target);

    return { property, erc20, owner, buyer, other };
  }

  describe("Deployment", function () {
    it("Should deploy successfully with valid token address", async () => {
      const { property } = await loadFixture(deployPropertyFixture);
      expect(property).to.exist;
    });

    it("Should fail with zero token address", async () => {
      const Property = await hre.ethers.getContractFactory(
        "PropertyManagement"
      );
      await expect(Property.deploy(hre.ethers.ZeroAddress)).to.be.revertedWith(
        "INVALID TOKEN ADDRESS"
      );
    });
  });

  describe("Property Creation", function () {
    it("Should create a property successfully", async () => {
      const { property, owner } = await loadFixture(deployPropertyFixture);

      await expect(
        property.createProperty(
          "Duplex",
          "Ikorodu",
          "Full Package",
          5000n,
          true
        )
      )
        .to.emit(property, "PropertyCreated")
        .withArgs(1, owner.address, "Duplex", 5000);

      const all = await property.getAllProperties();
      expect(all.length).to.equal(1);
      expect(all[0].name).to.equal("Duplex");
    });
  });

  describe("Property Removal", function () {
    it("Should remove property successfully", async () => {
      const { property, owner } = await loadFixture(deployPropertyFixture);

      await property.createProperty(
        "Duplex",
        "Ikorodu",
        "Full Package",
        5000n,
        true
      );

      await expect(property.removeProperty(1))
        .to.emit(property, "PropertyRemoved")
        .withArgs(1, owner.address);

      const all = await property.getAllProperties();
      expect(all.length).to.equal(0);
    });

    it("Should revert if property does NOT exist", async () => {
      const { property } = await loadFixture(deployPropertyFixture);

      await expect(property.removeProperty(3)).to.be.revertedWithCustomError(
        property,
        "PROPERTY_DOES_NOT_EXIST"
      );
    });

    it("Should revert if caller is NOT the creator", async () => {
      const { property, buyer } = await loadFixture(deployPropertyFixture);

      await property.createProperty(
        "Duplex",
        "Ikorodu",
        "Full Package",
        5000n,
        true
      );

      await expect(
        property.connect(buyer).removeProperty(1)
      ).to.be.revertedWithCustomError(property, "NOT_PROPERTY_OWNER");
    });
  });

  describe("Buy Property", function () {
    it("Should let a buyer purchase a property", async () => {
      const { property, erc20, owner, buyer } = await loadFixture(
        deployPropertyFixture
      );

      await property.createProperty(
        "Duplex",
        "Ikorodu",
        "Full Package",
        5000n,
        true
      );

      await erc20.transfer(buyer.address, 10000n);
      await erc20.connect(buyer).approve(property.target, 5000);

      await expect(property.connect(buyer).buyProperty(1))
        .to.emit(property, "PropertyPurchased")
        .withArgs(1, buyer.address, 5000);

      const all = await property.getAllProperties();
      expect(all[0].owner).to.equal(buyer.address);
      expect(all[0].isForSale).to.equal(false);
    });

    it("Should revert if property does not exist", async () => {
      const { property, buyer } = await loadFixture(deployPropertyFixture);

      await expect(
        property.connect(buyer).buyProperty(999)
      ).to.be.revertedWithCustomError(property, "PROPERTY_DOES_NOT_EXIST");
    });

    it("Should revert if property is not for sale", async () => {
      const { property, erc20, buyer } = await loadFixture(
        deployPropertyFixture
      );

      await property.createProperty(
        "Duplex",
        "Ikorodu",
        "Full Package",
        5000n,
        false
      );

      await erc20.transfer(buyer.address, 2000);
      await erc20.connect(buyer).approve(await property.getAddress(), 1500);

      await expect(property.connect(buyer).buyProperty(1)).to.be.revertedWith(
        "PROPERTY NOT FOR SALE"
      );
    });

    it("Should revert if price is invalid", async () => {
      const { property, buyer, erc20 } = await loadFixture(
        deployPropertyFixture
      );

      await property.createProperty(
        "Duplex",
        "Ikorodu",
        "Full Package",
        0n,
        true
      );

      await erc20.transfer(buyer.address, 1000);
      await erc20.connect(buyer).approve(await property.getAddress(), 1000);

      await expect(property.connect(buyer).buyProperty(1)).to.be.revertedWith(
        "INVALID PRICE"
      );
    });

    it("Should not allow a user to buy their own property", async () => {
      const { property, owner } = await loadFixture(deployPropertyFixture);

      await property.createProperty(
        "Duplex",
        "Ikorodu",
        "Full Package",
        5000n,
        true
      );

      await expect(property.connect(owner).buyProperty(1)).to.be.revertedWith(
        "CANNOT BUY YOUR OWN PROPERTY"
      );
    });

    it("Should revert if token transfer fails (insufficient allowance)", async () => {
      const { property, erc20, buyer } = await loadFixture(
        deployPropertyFixture
      );

      await property.createProperty(
        "Duplex",
        "Ikorodu",
        "Full Package",
        5000n,
        true
      );

      await erc20.transfer(buyer.address, 5000);

      await expect(property.connect(buyer).buyProperty(1)).to.be.revertedWith(
        "Insufficient allowance"
      );
    });
  });

  describe("Fetching Properties", function () {
    it("Should return all created properties", async () => {
      const { property } = await loadFixture(deployPropertyFixture);

      await property.createProperty(
        "Duplex",
        "Ikorodu",
        "Full Package",
        5000n,
        true
      );
      await property.createProperty(
        "Bungalow",
        "Kubwa",
        "Fully Furnished",
        5000n,
        false
      );

      const allProperties = await property.getAllProperties();
      expect(allProperties.length).to.equal(2);
      expect(allProperties[0].name).to.equal("Duplex");
      expect(allProperties[1].name).to.equal("Bungalow");
    });
  });
});
