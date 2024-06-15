// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract ISCRRegistry {
    /* error */

    /* data struct */
    // user's sample states

    /* states variables */
    // Perso use
    // mapping user to samples

    // Pro use

    // mapping artist to ISRC list => to be paid / spec of songs (prices...)
    // => ISRC to artist & spec

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

    /* private */

    /* pure & view */

    function getTest() external view returns (string memory) {
        return s_test;
    }
}
