import React from 'react';
import PropTypes from 'prop-types';
import FundAirline from './FundAirline';
import RegisterAirline from './RegisterAirline';
import Flights from './Flights';
import {
    web3PropType,
    contractPropType,
    accountPropType,
    flightPropType,
} from '../../utils/propTypes';

// eslint-disable-next-line object-curly-newline
const Airline = ({ web3, contract, account, flights, containerClass }) => (
    <div className={containerClass}>
        <div className="row">
            <div className="col">
                <FundAirline
                    web3={web3}
                    contract={contract}
                    account={account}
                />
            </div>
            <div className="col">
                <RegisterAirline
                    contract={contract}
                    account={account}
                />
            </div>
        </div>
        <div className="row">
            <div className="col">
                <Flights
                    flights={flights}
                    contract={contract}
                    account={account}
                />
            </div>
        </div>
    </div>
);

Airline.defaultProps = {
    containerClass: '',
};

Airline.propTypes = {
    web3: web3PropType.isRequired,
    contract: contractPropType.isRequired,
    account: accountPropType.isRequired,
    flights: PropTypes.arrayOf(flightPropType).isRequired,
    containerClass: PropTypes.string,
};

export default Airline;
