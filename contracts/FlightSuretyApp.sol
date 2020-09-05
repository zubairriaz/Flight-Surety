pragma solidity ^0.5.2;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./FlightSuretyData.sol";
import "./Operationable.sol";
import "./OracleManager.sol";

contract FlightSuretyApp is Operationable, OracleManager {
    using SafeMath for uint;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    uint private constant REGISTERING_AIRLINE_WITHOUT_CONSENSUS = 4;
    uint private constant AIRLINE_DEPOSIT_THRESHOLD = 10 ether;
    uint private constant MAX_INSURANCE = 1 ether;
    uint private constant ORACLE_REGISTRATION_FEE = 1 ether;
    uint private constant MIN_ORACLE_RESPONSES = 3;

    FlightSuretyData flightSuretyData;

    event AirlineEntried(address indexed account);
    event AirlineVoted(address indexed account, uint votedCount);
    event AirlineRegistered(address indexed account);
    event AirlineFunded(address indexed account, uint deposit);

    event FlightRegistered(string flight, uint timestamp, address airline);
    event FlightStatusInfo(string flight, uint timestamp, uint8 status);

    event BuyInsurance(address indexed account, string flight, uint timestamp, uint amount);

    event OracleRequest(string flight, uint timestamp, uint8 indexed index);
    event OracleReport(string flight, uint timestamp, uint8 status);

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    modifier isRegisteredAirline() {
        require(
            flightSuretyData.isRegisteredAirline(msg.sender),
            "Not Registered airline"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    constructor(address dataContract) public {
        flightSuretyData = FlightSuretyData(dataContract);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function registerAirline(address account)
        public
        requireIsOperational
        isRegisteredAirline
    {
        if (!flightSuretyData.isEntriedAirline(account)) {
            _entryArline(account);
        }

        uint registeredCount = flightSuretyData.registeredAirlinesCount();

        if (registeredCount < REGISTERING_AIRLINE_WITHOUT_CONSENSUS) {
            _registerAirline(account);
        } else {
            _voteAirline(account, registeredCount.div(2));
        }
    }

    function fundAirline()
        public
        payable
        requireIsOperational
        isRegisteredAirline
    {
        uint deposit = flightSuretyData.fundAirline(msg.sender, msg.value);
        emit AirlineFunded(msg.sender, deposit);
    }

    function fundedEnough(address account)
        public
        view
        returns(bool)
    {
        return flightSuretyData.getDeposit(account) >= AIRLINE_DEPOSIT_THRESHOLD;
    }

    function registerFlight(string memory flight, uint timestamp)
        public
        requireIsOperational
        isRegisteredAirline
    {
        require(fundedEnough(msg.sender), "Deposit is inadequet");

        bytes32 flightKey = _buildFlightKey(flight, timestamp);
        flightSuretyData.registerFlight(flightKey, msg.sender);

        emit FlightRegistered(flight, timestamp, msg.sender);
    }

    function buyInsurance(string memory flight, uint timestamp)
        public
        payable
        requireIsOperational
    {
        require(msg.value <= MAX_INSURANCE, "Up to 1 ether for purchasing flight insurance");

        bytes32 flightKey = _buildFlightKey(flight, timestamp);
        require(flightSuretyData.isFlightRegistered(flightKey), "Flight is not registered");

        bytes32 insuranceKey = _buildInsuranceKey(msg.sender, flight, timestamp);
        flightSuretyData.buyInsurance(insuranceKey, msg.value);
        emit BuyInsurance(msg.sender, flight, timestamp, msg.value);
    }

    function withdrawalRefund(string memory flight, uint timestamp)
        public
        requireIsOperational
    {
        bytes32 flightKey = _buildFlightKey(flight, timestamp);
        require(flightSuretyData.isFlightToPayout(flightKey), "Not a flight to payout");

        bytes32 insuranceKey = _buildInsuranceKey(msg.sender, flight, timestamp);
        uint deposit = flightSuretyData.withdrawalRefund(insuranceKey);
        uint payout = deposit.mul(3).div(2);
        msg.sender.transfer(payout);
    }

    function fetchFlightStatus(string memory flight, uint timestamp)
        public
        requireIsOperational
    {
        uint8 index = getRandomIndex(msg.sender);
        bytes32 key = _buildResponseKey(index, flight, timestamp);

        OracleManager.registerRequest(key, msg.sender);

        emit OracleRequest(flight, timestamp, index);
    }

    function registerOracle()
        public
        payable
        requireIsOperational
    {
        require(msg.value >= ORACLE_REGISTRATION_FEE, "Inadequet registration fee");
        super.registerOracle();
    }

    function submitOracleResponse(
        uint8 index,
        string memory flight,
        uint timestamp,
        uint8 statusCode
    )
        public
        requireIsOperational
        isRegisteredOracle
        isValidOracleIndex(index)
    {
        bytes32 key = _buildResponseKey(index, flight, timestamp);
        require(OracleManager.isRequestOpen(key), "Request is closed");

        OracleManager.pushResponse(key, statusCode, msg.sender);
        emit OracleReport(flight, timestamp, statusCode);

        if (OracleManager.getResponseCount(key, statusCode) >= MIN_ORACLE_RESPONSES) {

            OracleManager.closeRequest(key);

            bytes32 flightKey = _buildFlightKey(flight, timestamp);
            flightSuretyData.processFlightStatus(flightKey, statusCode);

            emit FlightStatusInfo(flight, timestamp, statusCode);
        }
    }

    /********************************************************************************************/
    /*                                     PRIVATE FUNCTIONS                                    */
    /********************************************************************************************/

    function _entryArline(address account) private {
        flightSuretyData.entryAirline(account);
        emit AirlineEntried(account);
    }

    function _registerAirline(address account) private {
        flightSuretyData.registerAirline(account);
        emit AirlineRegistered(account);
    }

    function _voteAirline(address account, uint approvalThreshold) private {
        uint votedCount = flightSuretyData.voteAirline(account, msg.sender);
        emit AirlineVoted(account, votedCount);

        if (votedCount >= approvalThreshold) {
            _registerAirline(account);
        }
    }

    function _buildFlightKey(string memory flight, uint timestamp)
        private
        pure
        returns(bytes32)
    {
        return keccak256(abi.encodePacked(flight, timestamp));
    }

    function _buildInsuranceKey(address passenger, string memory flight, uint timestamp)
        private
        pure
        returns(bytes32)
    {
        return keccak256(abi.encodePacked(passenger, flight, timestamp));
    }

    function _buildResponseKey(uint8 index, string memory flight, uint timestamp)
        private
        pure
        returns(bytes32)
    {
        return keccak256(abi.encodePacked(index, flight, timestamp));
    }

    /********************************************************************************************/
    /*                                     FALLBACK FUNCTION                                    */
    /********************************************************************************************/

    // accept ether to pay insurance payout
    function() external payable {}
}
