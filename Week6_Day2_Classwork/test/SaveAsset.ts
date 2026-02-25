import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("ERC20", function () {
  async function deployERC20() {
    // Contracts are deployed using the first signer/account by default
    const [owner] = await hre.ethers.getSigners();

    const ERC20 = await hre.ethers.getContractFactory("ERC20");
    const erc20 = await ERC20.deploy("MarkDavid", "MDTK", 18, 1000000);

    return { erc20, owner };
  }

  describe("Deployment", function () {
    it("Should get name", async function () {
      const { erc20 } = await loadFixture(deployERC20);

      const name = await erc20.name();

      expect(name).to.equal("MarkDavid");
    });

    it("Should get symbol", async function () {
      const { erc20, owner } = await loadFixture(deployERC20);

      const symbol = await erc20.symbol();

      expect(symbol).to.equal("MDTK");
    });

    it("Should get total supply", async function () {
      const { erc20 } = await loadFixture(deployERC20);

      const totalSupply = await erc20.totalSupply();

      expect(totalSupply).to.equal(1000000000000000000000000n);
    });

    it("Should get decimal", async function () {
      const { erc20 } = await loadFixture(deployERC20);

      const decimal = await erc20.decimals();

      expect(decimal).to.equal(18);
    });

    it("Should get balanceOf", async function () {
      const { erc20, owner } = await loadFixture(deployERC20);

      const balanceOf = await erc20.balanceOf(owner);

      expect(balanceOf).to.equal(1000000000000000000000000n);

      console.log(balanceOf);
    });
  });
});

describe("SaveERC20_Ether", function () {
  async function deploySaveAsset() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    // Deploy ERC20 first
    const ERC20 = await hre.ethers.getContractFactory("ERC20");
    const token = await ERC20.deploy("MarkDavid", "MDTK", 18, 1000000);

    // Deploy save contract with token addr
    const SaveAsset = await hre.ethers.getContractFactory("SaveERC20_Ether");
    const save_asset = await SaveAsset.deploy(token.target);

    return { save_asset, token, owner, otherAccount };
  }

  describe("ERC20 Deposits & Withdrawals", function () {
    it("Should deposit ERC20", async function () {
      const { save_asset, token, owner } = await loadFixture(deploySaveAsset);

      await token.approve(save_asset.target, 1000);
      await save_asset.depositERC20(1000);

      const erc20Balance = await save_asset.checkERC20Balance(owner.address);

      expect(erc20Balance).to.equal(1000);

      console.log(erc20Balance);
    });

    it("Should withdraw ERC20", async function () {
      const { save_asset, token, owner } = await loadFixture(deploySaveAsset);

      await token.approve(save_asset.target, 1000);

      await save_asset.depositERC20(1000);

      await save_asset.withdrawERC20(1000);

      expect(await save_asset.checkERC20Balance(owner.address)).to.equal(0);
    });

    it("Should revert withdraw if insufficient funds", async function () {
      const { save_asset } = await loadFixture(deploySaveAsset);

      await expect(save_asset.withdrawERC20(1000)).to.be.revertedWith(
        "insufficient funds"
      );
    });
  });

  describe("Ether Deposits", function () {
    it("Should deposit Ether", async function () {
      const { save_asset } = await loadFixture(deploySaveAsset);

      await save_asset.depositEther({ value: hre.ethers.parseEther("1") });

      expect(await save_asset.checkEtherBalance()).to.equal(
        hre.ethers.parseEther("1")
      );
    });

    it("Contract should show Ether balance", async function () {
      const { save_asset } = await loadFixture(deploySaveAsset);

      await save_asset.depositEther({
        value: hre.ethers.parseEther("0.5"),
      });

      expect(await save_asset.getContractBalance()).to.equal(
        hre.ethers.parseEther("0.5")
      );
    });

    it("Should withdraw ether", async () => {
      const { save_asset } = await loadFixture(deploySaveAsset);

      await save_asset.depositEther({
        value: hre.ethers.parseEther("4"),
      });

      await save_asset.withdrawEther(4000000000000000000n);

      expect(await save_asset.checkEtherBalance()).to.equal(
        hre.ethers.parseEther("0")
      );
    });
  });
});
