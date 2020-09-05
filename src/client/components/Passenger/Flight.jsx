import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { flightPropType } from '../../utils/propTypes';
import format from '../../utils/format';

// eslint-disable-next-line object-curly-newline
const Flight = ({ row, flight, buyInsurance, fetchStatus, withdrawal }) => {
    const [amount, setAmount] = useState('');
    // eslint-disable-next-line object-curly-newline
    const { number, timestamp, airline, status } = flight;
    const registered = airline !== '';

    return (
        <tr>
            <th scope="row">{row}</th>
            <td>{number}</td>
            <td>{format.date(new Date(timestamp))}</td>
            <td>
                <span className="mr-2">
                    {format.flightStatus(status)}
                </span>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => fetchStatus(flight)}
                >
                    fetch
                </button>
            </td>
            <td>
                <form className="form-inline">
                    <div className="input-group mr-sm-2">
                        <input
                            type="text"
                            className="form-control"
                            id="insuranceAmount"
                            placeholder="input amount"
                            onChange={event => setAmount(event.target.value)}
                        />
                        <div className="input-group-prepend">
                            <div className="input-group-text">ether</div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className={`btn ${registered ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => buyInsurance(flight, amount)}
                        disabled={!registered}
                    >
                        buy
                    </button>
                </form>
            </td>
            <td>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => withdrawal(flight)}
                >
                    withdrawal
                </button>
            </td>
        </tr>
    );
};

Flight.propTypes = {
    row: PropTypes.number.isRequired,
    flight: flightPropType.isRequired,
    buyInsurance: PropTypes.func.isRequired,
    fetchStatus: PropTypes.func.isRequired,
    withdrawal: PropTypes.func.isRequired,
};

export default Flight;
