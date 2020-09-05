import PropTypes from 'prop-types';
import Web3 from 'web3';

export const web3PropType = PropTypes.instanceOf(Web3);

export const contractPropType = PropTypes.shape({
    methods: PropTypes.shape({
        // Airline methods
        registerAirline: PropTypes.func.isRequired,
        fundAirline: PropTypes.func.isRequired,
        fundedEnough: PropTypes.func.isRequired,

        // Flight methods
        registerFlight: PropTypes.func.isRequired,
        fetchFlightStatus: PropTypes.func.isRequired,

        // Insurance methods
        buyInsurance: PropTypes.func.isRequired,
        withdrawalRefund: PropTypes.func.isRequired,
    }).isRequired,
});

export const accountPropType = PropTypes.string;

export const flightPropType = PropTypes.shape({
    number: PropTypes.string.isRequired,
    timestamp: PropTypes.number.isRequired,
    airline: PropTypes.string.isRequired,
    status: PropTypes.number.isRequired,
});
