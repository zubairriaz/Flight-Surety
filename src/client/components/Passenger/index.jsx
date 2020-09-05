import React from 'react';
import PropTypes from 'prop-types';
import Flights from './Flights';
import {
    web3PropType,
    contractPropType,
    accountPropType,
    flightPropType,
} from '../../utils/propTypes';

// eslint-disable-next-line object-curly-newline
const Passenger = ({ web3, contract, account, flights, containerClass }) => (
    <div className={containerClass}>
        <div className="row">
            <div className="col">
                <Flights
                    web3={web3}
                    flights={flights}
                    contract={contract}
                    account={account}
                />
            </div>
        </div>
    </div>
);

Passenger.defaultProps = {
    containerClass: '',
};

Passenger.propTypes = {
    web3: web3PropType.isRequired,
    contract: contractPropType.isRequired,
    account: accountPropType.isRequired,
    flights: PropTypes.arrayOf(flightPropType).isRequired,
    containerClass: PropTypes.string,
};

export default Passenger;
