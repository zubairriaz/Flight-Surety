import React, { useState } from 'react';
import {
    contractPropType,
    accountPropType,
} from '../../utils/propTypes';

const RegisterAirline = ({ contract, account }) => {
    const [address, setAddress] = useState('');

    const submit = () => {
        contract.methods.registerAirline(address).send({ from: account })
            .catch(console.error); // eslint-disable-line no-console
    };

    return (
        <div>
            <h3>Register another airline</h3>
            <form>
                <div className="form-group">
                    <label htmlFor="airlineAddress">
                        Airline address
                        <input
                            type="text"
                            className="form-control"
                            id="airlineAddress"
                            onChange={event => setAddress(event.target.value)}
                        />
                    </label>
                </div>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={submit}
                >
                    Submit
                </button>
            </form>
        </div>
    );
};

RegisterAirline.propTypes = {
    contract: contractPropType.isRequired,
    account: accountPropType.isRequired,
};

export default RegisterAirline;
