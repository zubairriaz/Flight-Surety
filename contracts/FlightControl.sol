pragma solidity ^0.5.2;

contract FlightControl {
    mapping(bytes32 => Flight) private flights;

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    struct Flight {
        bool isRegistered;
        uint8 status;
        uint updatedTimestamp;
        address airline;
    }

    function register(bytes32 flightKey, address airline)
        internal
    {
        // solium-disable-next-line security/no-block-members
        Flight memory newFlight = Flight(true, STATUS_CODE_UNKNOWN, now, airline);
        flights[flightKey] = newFlight;
    }

    function isRegistered(bytes32 flightKey)
        internal
        view
        returns(bool)
    {
        return flights[flightKey].isRegistered;
    }

    function changeStatus(bytes32 flightKey, uint8 statusCode)
        internal
    {
        require(validStatusCode(statusCode), "Invalid statusCode");

        flights[flightKey].status = statusCode;
        flights[flightKey].updatedTimestamp = now; // solium-disable-line security/no-block-members
    }

    function validStatusCode(uint8 statusCode)
        private
        pure
        returns(bool)
    {
        return (
            statusCode == STATUS_CODE_UNKNOWN ||
            statusCode == STATUS_CODE_ON_TIME ||
            statusCode == STATUS_CODE_LATE_AIRLINE ||
            statusCode == STATUS_CODE_LATE_WEATHER ||
            statusCode == STATUS_CODE_LATE_TECHNICAL ||
            statusCode == STATUS_CODE_LATE_OTHER
        );
    }

    function isStatusToPayout(bytes32 flightKey)
        internal
        view
        returns(bool)
    {
        uint8 statusCode = flights[flightKey].status;
        return (
            statusCode == STATUS_CODE_LATE_AIRLINE ||
            statusCode == STATUS_CODE_LATE_TECHNICAL
        );
    }
}
