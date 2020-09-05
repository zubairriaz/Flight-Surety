pragma solidity ^0.5.2;

import "./Authorizable.sol";
import "./AirlineControl.sol";
import "./FlightControl.sol";
import "./Insuree.sol";
import "./Operationable.sol";

contract FlightSuretyData is Authorizable, AirlineControl, FlightControl, Insuree, Operationable {

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    constructor() Authorizable() public {
        // First airline is registered when contract is deployed
        AirlineControl.entry(msg.sender);
        AirlineControl.register(msg.sender);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /* Airlines */

    function registeredAirlinesCount()
        external
        view
        onlyAuthorizedContract
        returns(uint)
    {
        return AirlineControl.registeredAirlineCount;
    }

    function isRegisteredAirline(address account)
        external
        view
        onlyAuthorizedContract
        returns(bool)
    {
        return AirlineControl.isRegistered(account);
    }

    function isEntriedAirline(address account)
        external
        view
        onlyAuthorizedContract
        returns(bool)
    {
        return AirlineControl.isEntried(account);
    }

    function getDeposit(address account)
        external
        view
        onlyAuthorizedContract
        returns(uint)
    {
        return airlines[account].deposit;
    }

    function entryAirline(address account)
        external
        requireIsOperational
        onlyAuthorizedContract
    {
        AirlineControl.entry(account);
    }

    function registerAirline(address account)
        external
        requireIsOperational
        onlyAuthorizedContract
    {
        AirlineControl.register(account);
    }

    function voteAirline(address account, address from)
        external
        requireIsOperational
        onlyAuthorizedContract
        returns(uint)
    {
        AirlineControl.voted(account, from);
        return airlines[account].votedBy.length;
    }

    function fundAirline(address account, uint amount)
        external
        requireIsOperational
        onlyAuthorizedContract
        returns(uint)
    {
        AirlineControl.fund(account, amount);
        return airlines[account].deposit;
    }

    /* Flights */

    function registerFlight(bytes32 flightKey, address airline)
        external
        requireIsOperational
        onlyAuthorizedContract
    {
        FlightControl.register(flightKey, airline);
    }

    function isFlightRegistered(bytes32 flightKey)
        external
        view
        onlyAuthorizedContract
        returns(bool)
    {
        return FlightControl.isRegistered(flightKey);
    }

    function isFlightToPayout(bytes32 flightKey)
        external
        view
        onlyAuthorizedContract
        returns(bool)
    {
        return FlightControl.isStatusToPayout(flightKey);
    }

    function processFlightStatus(bytes32 flightKey, uint8 statusCode)
        external
        onlyAuthorizedContract
    {
        FlightControl.changeStatus(flightKey, statusCode);
    }

    /* Insurance */
    function buyInsurance(bytes32 insuranceKey, uint amount)
        external
        requireIsOperational
        onlyAuthorizedContract
    {
        Insuree.register(insuranceKey, amount);
    }

    function withdrawalRefund(bytes32 insuranceKey)
        external
        requireIsOperational
        onlyAuthorizedContract
        returns(uint)
    {
        return Insuree.refund(insuranceKey);
    }
}
