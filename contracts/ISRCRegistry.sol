// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "./BridgedToken.sol";

error ISRCRegistry_notAdmin();
error ISRCRegistry_InvalideCode();
error ISRCRegistry_NotBound(string ISRCCode);
error ISRCRegistry_buyAllowanceFailed(string ISRCCode, address user);
error ISRCRegistry_payArtistFailed(address artistAddress, address user);

/**
 * @title ISRCRegistry (hackathon project : AllTunes)
 * @author ibourn (& AllTunes Team : ArnaudSene, YoannRDC)
 *
 * @notice this contract is intended to serve as a registry of listening rights to any sound when an ISRC is bound
 * @notice thus any music player can broadcast music to a user according to his rights
 * @notice any dapp can connect and a user has a 'universal' right to listen to whatever the player
 * @notice 2 possible mode for user : PRIVATE or PRO
 * @notice a private user can buy a lifetime rights (as if he'd bought a song in a store) or pay a subscription for a short time (rent)
 *
 * @notice NOT YET ADDED TO THE POC (due to loss of time with bridge project on allfeat) :
 * @notice a pro user should fund a subscription vault giving access to a limited time to play use the song
 * @notice a way to pay in usd equivalent token. The bridge will allow this
 * @notice an oracle and dex to swap tokens and be abble to accept more tokens to pay
 * @notice an oracle to fetch ISRC data from ISRC agency database to validate a code
 *
 * @notice IMPORTANT think about storage => huge amount of song and user can increase a lot the storage
 * @notice test and study needs
 * @notice a solution could be to have a main resolver contract allowing to have a "pagination" mechanism with child storage contract
 */
contract ISRCRegistry {
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

    address constant MAX_ADDRESS = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;
    /* event */

    event ISRCRegistry_buyAllowance(string ISRCCode, address user);
    event ISRCRegistry_revokAdmin();
    event ISRCRegistry_ISRCset(string ISRCCode, address artistAddress, uint256 price);
    event ISRCRegistry_ISRCallowanceSet(string ISRCCode, address user, Allowance allowanceType);
    event ISRCRegistry_paymentSent(address artistAddress, address buyerAddress);

    /* modifiers */

    modifier onlyAdmin() {
        if (s_admin != MAX_ADDRESS && msg.sender != s_admin) {
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
    /**
     * @dev allows user to buy listening rights for a song given its ISRC
     * @dev should be paid in usd equiv :
     * @dev FOR THE POC uses AFT or bridged ETH
     * @dev need oracle, bridge, dex to have stablecoin or accept token & convert value to usd price
     * @param ISRCCode ISRC of the song
     * @param tokenAddress address of token used to pay
     * @param amount amount to pay
     */
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

        // // For POC allow AFT and abETH payment (cause of bridge failure)
        // // In this case need to find a way to have a price equivalence
        _payArtist(artistAddress, tokenAddress, amount);

        emit ISRCRegistry_buyAllowance(ISRCCode, msg.sender);
    }

    // rentSong

    function revokeAdmin() external onlyAdmin {
        s_admin = MAX_ADDRESS;
        emit ISRCRegistry_revokAdmin();
    }
    /* public */

    /**
     * @notice checks vailidity of an ISRC code by requesting ISRC database
     * @dev MOCKED function (need an oracle..)
     * @dev needed to prevent hacks (see for example setNewISRC)
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
     * @dev should checkValidity ISRC => author == msg.sender to allow only autho to activate its code
     * @dev this to prevent frontrunning :
     * @dev concurrent could frontrun to set the ISRC onchain before legit artist
     * @dev this will cause the legit artist to not be abble to register its code and sell listening rights
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
        emit ISRCRegistry_ISRCset(ISRCCode, msg.sender, minPrice);
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
        emit ISRCRegistry_ISRCset(ISRCCode, msg.sender, minPrice);
    }

    /* internal */
    /**
     * @dev set listening allowance state (SHORT->rent... LIFE->bought, given)
     */
    function setUserAllowance(string calldata ISRCCode, UserMode mode, Allowance newState) internal {
        Usage memory usage;
        usage.mode = mode;
        usage.allowanceType = newState;
        s_userToUsage[msg.sender][ISRCCode] = usage;
        emit ISRCRegistry_ISRCallowanceSet(ISRCCode, msg.sender, newState);
    }
    // resolveArtist => get artist add from ISRC

    /* private */
    /**
     * @dev transfer payment to artist
     * @dev FOR POC :
     * @dev allow payment in native AFT or bridged ETH
     * @dev should fetch token price to get equivalence and should have ref price in usd
     * @dev => this need oracle and way to swap ou bridge stablecoin
     */
    function _payArtist(address artistAddress, address tokenAddress, uint256 amount) private returns (bool) {
        // For POC allow AFT and abETH payment (cause of bridge failure)
        // In this case need to find a way to have a price equivalence
        uint256 amountToSend = amount;
        bool result = true;
        if (msg.value != 0) {
            amountToSend = msg.value;
            (result,) = payable(artistAddress).call{value: amountToSend}("");
        } else {
            result = BridgedToken(tokenAddress).transferFrom(msg.sender, artistAddress, amount);
        }

        if (!result) {
            revert ISRCRegistry_payArtistFailed(artistAddress, msg.sender);
        }
        emit ISRCRegistry_paymentSent(artistAddress, msg.sender);
        return result;
    }

    /* getters pure & view */

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
