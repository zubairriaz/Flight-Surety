import React, { useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import Airline from './Airline';
import Passenger from './Passenger';
import {
    web3PropType,
    contractPropType,
    accountPropType,
    flightPropType,
} from '../utils/propTypes';

const AIRLINE = Symbol('AIRLINE');
const PASSENGER = Symbol('PASSENGER');

// eslint-disable-next-line object-curly-newline
const Layout = ({ web3, contract, account, flights }) => {
    const [active, setActive] = useState(AIRLINE);

    return (
        <Fragment>
            <div className="row mt-3 mb-3">
                <div className="col">
                    <button
                        type="button"
                        className={`btn btn-block ${active === AIRLINE ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setActive(AIRLINE)}
                    >
                        Airline
                    </button>
                </div>
                <div className="col">
                    <button
                        type="button"
                        className={`btn btn-block ${active === PASSENGER ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setActive(PASSENGER)}
                    >
                        Passenger
                    </button>
                </div>
            </div>
            {active === AIRLINE ? (
                <Airline
                    web3={web3}
                    contract={contract}
                    account={account}
                    flights={flights}
                />
            ) : (
                <Passenger
                    web3={web3}
                    contract={contract}
                    account={account}
                    flights={flights.filter(flight => flight.airline !== '')}
                />
            )}
        </Fragment>
    );
};

Layout.propTypes = {
    web3: web3PropType.isRequired,
    contract: contractPropType.isRequired,
    account: accountPropType.isRequired,
    flights: PropTypes.arrayOf(flightPropType).isRequired,
};

export default Layout;
