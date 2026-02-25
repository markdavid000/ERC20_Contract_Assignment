import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("SchoolManagement", function () {
  async function deployAll() {
    const [owner, admin, student1, student2, staff1, staff2, outsider] =
      await hre.ethers.getSigners();

    const ERC20 = await hre.ethers.getContractFactory("ERC20");
    const token = await ERC20.deploy("CrystalBrains", "CBTK", 18, 1000000n);

    const School = await hre.ethers.getContractFactory("SchoolManagement");
    const school = await School.deploy(token.target, admin.address);

    return {
      owner,
      admin,
      student1,
      student2,
      staff1,
      staff2,
      outsider,
      token,
      school,
    };
  }

  describe("Deployment", function () {
    it("Should deploy correctly", async function () {
      const { school, owner, admin } = await loadFixture(deployAll);

      expect(await school.owner()).to.equal(owner.address);
      expect(await school.admin()).to.equal(admin.address);
    });

    it("Should revert if admin == owner", async function () {
      const ERC20 = await hre.ethers.getContractFactory("ERC20");
      const token = await ERC20.deploy("DeployErrorTest", "DETTK", 18, 100);

      const School = await hre.ethers.getContractFactory("SchoolManagement");
      await expect(
        School.deploy(token.target, await token.owner())
      ).to.be.revertedWith("ADMIN CAN'T BE THE OWNER");
    });
  });

  describe("Level Fees", function () {
    it("Owner should set level fees", async function () {
      const { school } = await loadFixture(deployAll);

      await school.setLevelFees();

      expect(await school.levelFees(100)).to.equal(100n * 10n ** 18n);
      expect(await school.levelFees(200)).to.equal(200n * 10n ** 18n);
      expect(await school.levelFees(300)).to.equal(300n * 10n ** 18n);
      expect(await school.levelFees(400)).to.equal(400n * 10n ** 18n);
    });

    it("Non-owner cannot set level fees", async function () {
      const { school, admin } = await loadFixture(deployAll);
      await expect(school.connect(admin).setLevelFees()).to.be.revertedWith(
        "YOU'RE NOT THE OWNER"
      );
    });
  });

  describe("Student Enrollment", function () {
    async function setupFeesAndApprove() {
      const { school, token, student1, student2, admin } = await loadFixture(
        deployAll
      );

      await school.setLevelFees();

      const fee = await school.levelFees(100);

      await token.transfer(student1.address, fee);
      await token.connect(student1).approve(school.target, fee);

      return { school, token, student1, student2, admin };
    }

    it("Admin can enroll a student", async function () {
      const { school, admin, student1 } = await setupFeesAndApprove();

      await expect(
        school.connect(admin).enrollStudent("Alice", 18, 100, student1.address)
      ).to.emit(school, "StudentEnrolled");

      const allStudents = await school.getAllStudentsWithDetails();
      expect(allStudents.length).to.equal(1);
      expect(allStudents[0].studentAddress).to.equal(student1.address);
      expect(allStudents[0].name).to.equal("Alice");
    });

    it("Non-admin cannot enroll a student", async function () {
      const { school, student1, student2 } = await setupFeesAndApprove();

      await expect(
        school.connect(student1).enrollStudent("A", 18, 100, student2.address)
      ).to.be.revertedWith("YOU'RE NOT AN ADMIN");
    });

    it("Should revert if level fee is not set", async function () {
      const { school, admin, student1 } = await loadFixture(deployAll);

      await expect(
        school.connect(admin).enrollStudent("A", 18, 100, student1.address)
      ).to.be.revertedWith("INSUFFIENT LEVEL FEE");
    });

    it("Should revert if student already exists", async function () {
      const { school, admin, student1 } = await setupFeesAndApprove();

      await school.connect(admin).enrollStudent("A", 18, 100, student1.address);

      await expect(
        school.connect(admin).enrollStudent("B", 20, 100, student1.address)
      ).to.be.revertedWith("STUDENT ALREADY REGISTERED");
    });
  });

  describe("Remove Student", function () {
    it("Admin can remove a student", async function () {
      const { school, admin, student1, token } = await loadFixture(deployAll);

      await school.setLevelFees();
      const fee = await school.levelFees(100);
      await token.transfer(student1.address, fee);
      await token.connect(student1).approve(school.target, fee);
      await school.connect(admin).enrollStudent("A", 18, 100, student1.address);

      await expect(
        school.connect(admin).removeStudent(student1.address)
      ).to.emit(school, "StudentRemoved");

      const allStudents = await school.getAllStudentsWithDetails();
      expect(allStudents.length).to.equal(0);
    });

    it("Should revert if student does not exist", async function () {
      const { school, admin, student1 } = await loadFixture(deployAll);

      await school.setLevelFees();

      await expect(
        school.connect(admin).removeStudent(student1.address)
      ).to.be.revertedWith("STUDENT NOT FOUND");
    });
  });

  describe("Staff Employment", function () {
    it("Owner can employ staff", async function () {
      const { school, owner, staff1 } = await loadFixture(deployAll);

      await expect(
        school
          .connect(owner)
          .employStaff(staff1.address, "John", "Teacher", 1000)
      ).to.emit(school, "StaffEmployed");

      const allStudents = await school.getAllStaff();
      expect(allStudents.length).to.equal(1);
      expect(allStudents[0].staffAddress).to.equal(staff1.address);
    });

    it("Non-owner cannot employ staff", async function () {
      const { school, admin, staff1 } = await loadFixture(deployAll);

      await expect(
        school
          .connect(admin)
          .employStaff(staff1.address, "John", "Teacher", 1000)
      ).to.be.revertedWith("YOU'RE NOT THE OWNER");
    });
  });

  describe("Pay Staff", function () {
    async function setupStaff() {
      const { school, owner, admin, staff1, student1, token } =
        await loadFixture(deployAll);

      await school.setLevelFees();
      const fee = await school.levelFees(100);
      await token.transfer(student1.address, fee);
      await token.connect(student1).approve(school.target, fee);
      await school.connect(admin).enrollStudent("A", 18, 100, student1.address);

      await school
        .connect(owner)
        .employStaff(staff1.address, "John", "Teacher", 1000);

      return { school, owner, staff1, token };
    }

    it("Owner can pay staff", async function () {
      const { school, owner, staff1, token } = await setupStaff();

      await expect(school.connect(owner).payStaff(staff1.address)).to.emit(
        school,
        "StaffPaid"
      );

      expect(await token.balanceOf(staff1.address)).to.equal(1000);
    });

    it("Cannot pay suspended staff", async function () {
      const { school, owner, staff1 } = await setupStaff();

      await school.connect(owner).suspendStaff(staff1.address, true);

      await expect(
        school.connect(owner).payStaff(staff1.address)
      ).to.be.revertedWith("STAFF IS SUSPENDED");
    });
  });

  describe("Suspend Staff", function () {
    it("Owner can suspend staff", async function () {
      const { school, owner, staff1 } = await loadFixture(deployAll);

      await school
        .connect(owner)
        .employStaff(staff1.address, "John", "Teacher", 1000);

      await expect(
        school.connect(owner).suspendStaff(staff1.address, true)
      ).to.emit(school, "StaffSuspended");

      const allStaffs = await school.getAllStaff();
      expect(allStaffs[0].suspended).to.equal(true);
    });
  });

  describe("Contract Token Balance", function () {
    it("Should show contract token balance", async function () {
      const { school, token } = await loadFixture(deployAll);

      await token.transfer(school.target, 5000);

      expect(await school.contractTokenBalance()).to.equal(5000);
    });
  });
});
