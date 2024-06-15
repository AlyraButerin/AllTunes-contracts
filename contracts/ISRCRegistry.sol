// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "./BridgedToken.sol";

error ISRCRegistry_notAdmin();
error ISRCRegistry_InvalideCode();
error ISRCRegistry_NotBound(string ISRCCode);
error ISRCRegistry_buyAllowanceFailed(string ISRCCode, address user);

contract ISCRRegistry {
    /* error */

    /* data struct */
    enum Allowance {
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
        Allowance allowanceType;
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
    // buySong // need to approve token
    function buyAllowance(string calldata ISRCCode, address tokenAddress, uint256 amount)
        external
        payable
        returns (bool)
    {
        if (!s_ISRCspecs[ISRCCode].isBound) {
            revert ISRCRegistry_NotBound(ISRCCode);
        }

        // Suppose minPrice to be in usd
        // => need amount conversion => need oracle and dex or bridge to swap

        // POC : suppose to be paid in abETH (eth bridged to allfeat)
        // tokenAddres should be the abETH address on allfeat

        address artistAddress = getISRCSpec(ISRCCode).artistAddress;
        setUserAllowance(ISRCCode, UserMode.PRIVATE, Allowance.LIFE);

        // For POC allow AFT and abETH payment (cause of bridge failure)
        // In this case need to find a way to have a price equivalence
        uint256 amountToSend = amount;
        bool result = true;
        if (msg.value != 0) {
            amountToSend = msg.value;
            payable(artistAddress).transfer(amountToSend);
        } else {
            result = BridgedToken(tokenAddress).transferFrom(msg.sender, artistAddress, amount);
        }

        if (!result) {
            revert ISRCRegistry_buyAllowanceFailed(ISRCCode, msg.sender);
        }
        return result;
    }
    // rentSong

    // revokeAdmin
    /* public */

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

    /**
     * @notice allows artist to update its new ISRC spec
     * @param ISRCCode code to set
     * @param minPrice min price to buy this song
     */
    function updateISRC(string calldata ISRCCode, uint256 minPrice) public {
        if (!mockedCheckISRCValidity(ISRCCode, msg.sender)) {
            revert ISRCRegistry_InvalideCode();
        }
        s_ISRCspecs[ISRCCode].minPrice = minPrice;
        // other data..
    }

    /* internal */
    function setUserAllowance(string calldata ISRCCode, UserMode mode, Allowance newState) internal {
        Usage memory usage;
        usage.mode = mode;
        usage.allowanceType = newState;
        s_userToUsage[msg.sender][ISRCCode] = usage;
    }
    // resolveArtist => get artist add from ISRC

    // payArtist

    // check ISRC format LL-DDD-NN-NNNNN

    /* private */

    /* pure & view */

    function getAdmin() external view returns (address) {
        return s_admin;
    }

    function getISRCSpec(string calldata ISRCCode) public view returns (ISRCSpec memory) {
        return s_ISRCspecs[ISRCCode];
    }

    function getUserUsage(string calldata ISRCCode, address user) public view returns (Usage memory) {
        return s_userToUsage[user][ISRCCode];
    }
}
