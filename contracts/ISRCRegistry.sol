// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

error ISRCRegistry_notAdmin();
error ISRCRegistry_InvalideCode();

contract ISCRRegistry {
    /* error */

    /* data struct */
    enum AuthType {
        NONE,
        SHORT,
        LIFE
    }

    enum UserMode {
        PRIVATE,
        PRO
    }
    // user's sample states

    struct Usage {
        uint256 listenDuration;
        UserMode mode;
        AuthType authType;
    }

    struct ISRCSpec {
        uint256 minPrice; // ideally in usd => have to convert if paid in alts
        address artistAddress;
        bool isBound; // attribué
    }
    /* states variables */

    address s_admin;

    mapping(address user => mapping(string ISRCCode => Usage usage)) s_userToUsage;

    // mapping artist to ISRC list => to be paid / spec of songs (prices...)
    // => ISRC to artist & spec
    mapping(string ISRCCode => ISRCSpec spec) s_ISRCspecs;

    /* event */

    /* modifiers */
    modifier onlyAdmin() {
        if (msg.sender != s_admin) {
            revert ISRCRegistry_notAdmin();
        }
        _;
    }
    /* constructor */

    constructor() {
        s_admin = msg.sender;
    }

    /* deposit, fallback */

    /* external */
    // buySong

    // rentSong

    /**
     * @notice checks vailidity of an ISRC code by requesting ISRC database
     * @dev MOCKED function (need an oracle..)
     * @param code code to set
     * @param artist associated artist
     * @return bool the check result
     */
    function mockedCheckISRCValidity(string calldata code, address artist) public pure returns (bool) {
        // Should connect to an oracle to fetch data associated to the ISRC code
        address ISRCArtist = artist;
        // other data

        if (ISRCArtist != artist) {
            return false;
        }
        return true;
    }

    /**
     * @notice allows artist to register its new ISRC code
     * @param ISRCCode code to set
     * @param minPrice min price to buy this song
     */
    function setNewISRC(string calldata ISRCCode, uint256 minPrice) public {
        if (!mockedCheckISRCValidity(ISRCCode, msg.sender)) {
            revert ISRCRegistry_InvalideCode();
        }
        ISRCSpec memory spec;
        spec.minPrice = minPrice;
        spec.artistAddress = msg.sender;
        spec.isBound = true;
        s_ISRCspecs[ISRCCode] = spec;
    }

    // updateISRCSpec (change price...)

    // revokeAdmin
    /* public */

    /* internal */
    // resolveArtist => get artist add from ISRC

    // payArtist

    // check ISRC format LL-DDD-NN-NNNNN

    /* private */

    /* pure & view */

    function getAdmin() external view returns (address) {
        return s_admin;
    }

    function getISRCSpec(string calldata ISRCCode) external view returns (ISRCSpec memory) {
        return s_ISRCspecs[ISRCCode];
    }
}
