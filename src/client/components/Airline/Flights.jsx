import React from 'react';
import PropTypes from 'prop-types';
import RegisterFlight from './RegisterFlight';
import {
    contractPropType,
    accountPropType,
    flightPropType,
} from '../../utils/propTypes';

// eslint-disable-next-line object-curly-newline
const Flights = ({ contract, account, flights, containerClass }) => {
    const registerFlight = (flightNumber, timestamp) => {
        contract.methods.registerFlight(flightNumber, timestamp)
            .send({ from: account })
            .catch(console.error); // eslint-disable-line no-console
    };

    return (
        <div className={containerClass}>
            <h3>Flights</h3>
            <table className="table">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">airline</th>
                        <th scope="col">flight number</th>
                        <th scope="col">departure</th>
                        <th scope="col">register</th>
                    </tr>
                </thead>
                <tbody>
                    {flights.map((flight, index) => (
                        <RegisterFlight
                            key={`${flight.number}${flight.timestamp.toString()}`}
                            row={index + 1}
                            flight={flight}
                            registerFlight={registerFlight}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

Flights.defaultProps = {
    containerClass: '',
};

Flights.propTypes = {
    contract: contractPropType.isRequired,
    account: accountPropType.isRequired,
    flights: PropTypes.arrayOf(flightPropType).isRequired,
    containerClass: PropTypes.string,
};

export default Flights;
