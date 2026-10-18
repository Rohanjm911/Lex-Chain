pragma solidity ^0.8.20;


contract EvidenceRegistry {
    
    
    
    error EvidenceAlreadyRegistered(string evidenceId);
    error EvidenceNotFound(string evidenceId);
    error UnauthorizedCaller(address caller);
    error InvalidEvidenceId();
    error InvalidCommitment();
    error ZeroAddress();

    
    
    
    struct EvidenceRecord {
        bytes32 commitment;
        address submitter;
        uint256 blockTimestamp;
        uint256 blockNumber;
        bool isRegistered;
    }

    struct CustodyEvent {
        string eventType;
        bytes32 custodyCommitment;
        address actor;
        uint256 timestamp;
    }

    
    
    
    address public owner;
    mapping(address => bool) public authorizedRegistrars;

    
    mapping(string => EvidenceRecord) private _evidenceRecords;

    
    mapping(string => CustodyEvent[]) private _custodyHistory;

    
    uint256 public totalEvidenceCount;

    
    
    
    event EvidenceRegistered(
        string indexed evidenceId,
        bytes32 indexed commitment,
        address indexed submitter,
        uint256 blockTimestamp,
        uint256 blockNumber
    );

    event CustodyEventAnchored(
        string indexed evidenceId,
        string eventType,
        bytes32 indexed custodyCommitment,
        address indexed actor,
        uint256 timestamp
    );

    event RegistrarStatusUpdated(address indexed registrar, bool authorized);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    
    
    
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert UnauthorizedCaller(msg.sender);
        }
        _;
    }

    modifier onlyAuthorized() {
        if (msg.sender != owner && !authorizedRegistrars[msg.sender]) {
            revert UnauthorizedCaller(msg.sender);
        }
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedRegistrars[msg.sender] = true;
        emit RegistrarStatusUpdated(msg.sender, true);
    }

    
    
    
    function setRegistrarAuthorization(address registrar, bool authorized) external onlyOwner {
        if (registrar == address(0)) revert ZeroAddress();
        authorizedRegistrars[registrar] = authorized;
        emit RegistrarStatusUpdated(registrar, authorized);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address prev = owner;
        owner = newOwner;
        emit OwnershipTransferred(prev, newOwner);
    }

    
    
    
    
    function registerEvidence(
        string calldata evidenceId,
        bytes32 commitment
    ) external onlyAuthorized {
        if (bytes(evidenceId).length == 0) revert InvalidEvidenceId();
        if (commitment == bytes32(0)) revert InvalidCommitment();
        if (_evidenceRecords[evidenceId].isRegistered) {
            revert EvidenceAlreadyRegistered(evidenceId);
        }

        _evidenceRecords[evidenceId] = EvidenceRecord({
            commitment: commitment,
            submitter: msg.sender,
            blockTimestamp: block.timestamp,
            blockNumber: block.number,
            isRegistered: true
        });

        totalEvidenceCount++;

        emit EvidenceRegistered(
            evidenceId,
            commitment,
            msg.sender,
            block.timestamp,
            block.number
        );
    }

    
    
    
    
    function anchorCustodyEvent(
        string calldata evidenceId,
        string calldata eventType,
        bytes32 custodyCommitment
    ) external onlyAuthorized {
        if (!_evidenceRecords[evidenceId].isRegistered) {
            revert EvidenceNotFound(evidenceId);
        }
        if (custodyCommitment == bytes32(0)) revert InvalidCommitment();

        _custodyHistory[evidenceId].push(
            CustodyEvent({
                eventType: eventType,
                custodyCommitment: custodyCommitment,
                actor: msg.sender,
                timestamp: block.timestamp
            })
        );

        emit CustodyEventAnchored(
            evidenceId,
            eventType,
            custodyCommitment,
            msg.sender,
            block.timestamp
        );
    }

    
    
    
    
    function getEvidenceRecord(
        string calldata evidenceId
    ) external view returns (
        bytes32 commitment,
        address submitter,
        uint256 blockTimestamp,
        uint256 blockNumber,
        bool isRegistered
    ) {
        EvidenceRecord memory rec = _evidenceRecords[evidenceId];
        return (
            rec.commitment,
            rec.submitter,
            rec.blockTimestamp,
            rec.blockNumber,
            rec.isRegistered
        );
    }

    
    function verifyEvidenceCommitment(
        string calldata evidenceId,
        bytes32 expectedCommitment
    ) external view returns (bool matches, bool isRegistered) {
        EvidenceRecord memory rec = _evidenceRecords[evidenceId];
        if (!rec.isRegistered) {
            return (false, false);
        }
        return (rec.commitment == expectedCommitment, true);
    }

    
    function getCustodyEventCount(string calldata evidenceId) external view returns (uint256) {
        return _custodyHistory[evidenceId].length;
    }

    
    function getCustodyEvent(
        string calldata evidenceId,
        uint256 index
    ) external view returns (
        string memory eventType,
        bytes32 custodyCommitment,
        address actor,
        uint256 timestamp
    ) {
        if (!_evidenceRecords[evidenceId].isRegistered) {
            revert EvidenceNotFound(evidenceId);
        }
        CustodyEvent memory ev = _custodyHistory[evidenceId][index];
        return (ev.eventType, ev.custodyCommitment, ev.actor, ev.timestamp);
    }
}
