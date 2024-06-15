// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract ISCRRegistry {
    /* error */

    /* data struct */
    enum RecordState {
        NONE,
        RENT,
        BOUGHT
    }
    // user's sample states

    struct UserRecord {
        uint256 listenDuration;
        RecordState state;
    }
    //

    struct ProUserRecord {
        uint256 listenDuration;
        RecordState state;
    }
    //

    struct ISRCSpec {
        uint256 price; // ideally in usd => have to convert if paid in alts
        address artistAddress;
        bool alive; // attribué
    }
    /* states variables */
    // Perso use
    // mapping user to samples

    mapping(address user => mapping(string ISRCCode => UserRecord record)) userRecords;

    // Pro use
    mapping(address proUser => mapping(string ISRCCode => ProUserRecord record)) proUserRecords;

    // mapping artist to ISRC list => to be paid / spec of songs (prices...)
    // => ISRC to artist & spec
    mapping(string ISRCCode => ISRCSpec spec) ISRCspecs;

    string s_test;
    /* event */

    /* modifiers */

    /* constructor */
    constructor(string memory test) {
        // !! setup admin to revoke
        // getter for all data
        s_test = test;
    }

    /* deposit, fallback */

    /* external */
    // buySong

    // rentSong

    // checkISRCValidity ?? need ref src

    // setNewISRC => artist logs its ISRC

    // updateISRCSpec (change price...)

    /* public */

    /* internal */
    // resolveArtist => get artist add from ISRC

    // payArtist

    // check ISRC format LL-DDD-NN-NNNNN

    /* private */

    /* pure & view */

    function getTest() external view returns (string memory) {
        return s_test;
    }
}
