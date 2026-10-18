const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EvidenceRegistry Smart Contract", function () {
  let EvidenceRegistry;
  let registry;
  let owner;
  let authorizedOfficer;
  let unauthorizedUser;

  const SAMPLE_EVIDENCE_ID = "EVD-2026-001";
  let SAMPLE_COMMITMENT;
  let SECOND_COMMITMENT;

  beforeEach(async function () {
    [owner, authorizedOfficer, unauthorizedUser] = await ethers.getSigners();
    EvidenceRegistry = await ethers.getContractFactory("EvidenceRegistry");
    registry = await EvidenceRegistry.deploy();
    await registry.waitForDeployment();

    SAMPLE_COMMITMENT = ethers.keccak256(
      ethers.toUtf8Bytes("LEXCHAIN:EV1:EVD-2026-001:SHA256HASH:CASE-01"),
    );
    SECOND_COMMITMENT = ethers.keccak256(
      ethers.toUtf8Bytes("LEXCHAIN:EV1:EVD-2026-002:SHA256HASH:CASE-01"),
    );
  });

  describe("Deployment & Initial State", function () {
    it("should set the deployer as owner and authorized registrar", async function () {
      expect(await registry.owner()).to.equal(owner.address);
      expect(await registry.authorizedRegistrars(owner.address)).to.be.true;
    });

    it("should start with 0 total evidence records", async function () {
      expect(await registry.totalEvidenceCount()).to.equal(0);
    });
  });

  describe("Evidence Registration", function () {
    it("should successfully register an evidence commitment and emit EvidenceRegistered event", async function () {
      await expect(
        registry.registerEvidence(SAMPLE_EVIDENCE_ID, SAMPLE_COMMITMENT),
      )
        .to.emit(registry, "EvidenceRegistered")
        .withArgs(
          SAMPLE_EVIDENCE_ID,
          SAMPLE_COMMITMENT,
          owner.address,
          (ts) => ts > 0,
          (bn) => bn > 0,
        );

      expect(await registry.totalEvidenceCount()).to.equal(1);

      const record = await registry.getEvidenceRecord(SAMPLE_EVIDENCE_ID);
      expect(record.commitment).to.equal(SAMPLE_COMMITMENT);
      expect(record.submitter).to.equal(owner.address);
      expect(record.isRegistered).to.be.true;
    });

    it("should strictly prevent duplicate evidence registration", async function () {
      await registry.registerEvidence(SAMPLE_EVIDENCE_ID, SAMPLE_COMMITMENT);

      await expect(
        registry.registerEvidence(SAMPLE_EVIDENCE_ID, SAMPLE_COMMITMENT),
      )
        .to.be.revertedWithCustomError(registry, "EvidenceAlreadyRegistered")
        .withArgs(SAMPLE_EVIDENCE_ID);
    });

    it("should reject empty evidence identifier", async function () {
      await expect(
        registry.registerEvidence("", SAMPLE_COMMITMENT),
      ).to.be.revertedWithCustomError(registry, "InvalidEvidenceId");
    });

    it("should reject zero bytes32 commitment", async function () {
      await expect(
        registry.registerEvidence("EVD-EMPTY", ethers.ZeroHash),
      ).to.be.revertedWithCustomError(registry, "InvalidCommitment");
    });
  });

  describe("Access Control & Authorization", function () {
    it("should prevent unauthorized accounts from registering evidence", async function () {
      await expect(
        registry
          .connect(unauthorizedUser)
          .registerEvidence(SAMPLE_EVIDENCE_ID, SAMPLE_COMMITMENT),
      )
        .to.be.revertedWithCustomError(registry, "UnauthorizedCaller")
        .withArgs(unauthorizedUser.address);
    });

    it("should allow the owner to authorize and revoke registrar accounts", async function () {
      await expect(
        registry.setRegistrarAuthorization(authorizedOfficer.address, true),
      )
        .to.emit(registry, "RegistrarStatusUpdated")
        .withArgs(authorizedOfficer.address, true);

      expect(await registry.authorizedRegistrars(authorizedOfficer.address)).to
        .be.true;

      await expect(
        registry
          .connect(authorizedOfficer)
          .registerEvidence("EVD-OFFICER-01", SECOND_COMMITMENT),
      ).to.emit(registry, "EvidenceRegistered");

      await registry.setRegistrarAuthorization(
        authorizedOfficer.address,
        false,
      );
      expect(await registry.authorizedRegistrars(authorizedOfficer.address)).to
        .be.false;

      await expect(
        registry
          .connect(authorizedOfficer)
          .registerEvidence("EVD-OFFICER-02", SECOND_COMMITMENT),
      ).to.be.revertedWithCustomError(registry, "UnauthorizedCaller");
    });
  });

  describe("Custody Event Anchoring", function () {
    beforeEach(async function () {
      await registry.registerEvidence(SAMPLE_EVIDENCE_ID, SAMPLE_COMMITMENT);
    });

    it("should anchor an append-only custody event on-chain", async function () {
      const custodyCommitment = ethers.keccak256(
        ethers.toUtf8Bytes("CUSTODY_TRANSFER_TO_FORENSIC_LAB_01"),
      );

      await expect(
        registry.anchorCustodyEvent(
          SAMPLE_EVIDENCE_ID,
          "CUSTODY_TRANSFERRED",
          custodyCommitment,
        ),
      )
        .to.emit(registry, "CustodyEventAnchored")
        .withArgs(
          SAMPLE_EVIDENCE_ID,
          "CUSTODY_TRANSFERRED",
          custodyCommitment,
          owner.address,
          (ts) => ts > 0,
        );

      expect(await registry.getCustodyEventCount(SAMPLE_EVIDENCE_ID)).to.equal(
        1,
      );

      const ev = await registry.getCustodyEvent(SAMPLE_EVIDENCE_ID, 0);
      expect(ev.eventType).to.equal("CUSTODY_TRANSFERRED");
      expect(ev.custodyCommitment).to.equal(custodyCommitment);
      expect(ev.actor).to.equal(owner.address);
    });

    it("should reject anchoring custody events for non-existent evidence", async function () {
      const dummyCommitment = ethers.keccak256(ethers.toUtf8Bytes("DUMMY"));
      await expect(
        registry.anchorCustodyEvent(
          "EVD-NON-EXISTENT",
          "TRANSFER",
          dummyCommitment,
        ),
      )
        .to.be.revertedWithCustomError(registry, "EvidenceNotFound")
        .withArgs("EVD-NON-EXISTENT");
    });
  });

  describe("Verification & Discrepancy Checks", function () {
    beforeEach(async function () {
      await registry.registerEvidence(SAMPLE_EVIDENCE_ID, SAMPLE_COMMITMENT);
    });

    it("should return matches = true for identical commitment", async function () {
      const [matches, isRegistered] = await registry.verifyEvidenceCommitment(
        SAMPLE_EVIDENCE_ID,
        SAMPLE_COMMITMENT,
      );
      expect(matches).to.be.true;
      expect(isRegistered).to.be.true;
    });

    it("should return matches = false when commitment does not match stored reference", async function () {
      const wrongCommitment = ethers.keccak256(
        ethers.toUtf8Bytes("WRONG_OR_TAMPERED_HASH"),
      );
      const [matches, isRegistered] = await registry.verifyEvidenceCommitment(
        SAMPLE_EVIDENCE_ID,
        wrongCommitment,
      );
      expect(matches).to.be.false;
      expect(isRegistered).to.be.true;
    });

    it("should return isRegistered = false for unregistered evidence IDs", async function () {
      const [matches, isRegistered] = await registry.verifyEvidenceCommitment(
        "UNREGISTERED-ID",
        SAMPLE_COMMITMENT,
      );
      expect(matches).to.be.false;
      expect(isRegistered).to.be.false;
    });
  });
});
