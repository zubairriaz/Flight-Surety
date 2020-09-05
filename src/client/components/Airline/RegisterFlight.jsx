import React from 'react';
import PropTypes from 'prop-types';
import { flightPropType } from '../../utils/propTypes';
import format from '../../utils/format';

const RegisterFlight = ({ row, flight, registerFlight }) => {
    const { number, timestamp, airline } = flight;
    const registered = airline !== '';

    return (
        <tr>
            <th scope="row">{row}</th>
            <td>{registered ? format.address(airline) : 'Not registered'}</td>
            <td>{number}</td>
            <td>{format.date(new Date(timestamp))}</td>
            <td>
                <button
                    type="button"
                    className={`btn ${registered ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => registerFlight(number, timestamp)}
                    disabled={registered}
                >
                    {registered ? 'registered' : 'register'}
                </button>
            </td>
        </tr>
    );
};

RegisterFlight.propTypes = {
    row: PropTypes.number.isRequired,
    flight: flightPropType.isRequired,
    registerFlight: PropTypes.func.isRequired,
};

export default RegisterFlight;
