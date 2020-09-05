import React, { Fragment, useState, useEffect } from 'react';
import {
    web3PropType,
    contractPropType,
    accountPropType,
} from '../../utils/propTypes';

const FundAirline = ({ web3, contract, account }) => {
    const [funded, setFunded] = useState(false);

    const fund = () => {
        contract.methods.fundAirline()
            .send({ from: account, value: web3.utils.toWei('10', 'ether') })
            .catch(console.error); // eslint-disable-line no-console
    };

    const queryFundingStatus = () => {
        contract.methods.fundedEnough(account).call()
            .then((state) => {
                setFunded(state);
            })
            .catch(console.error); // eslint-disable-line no-console
    };

    useEffect(queryFundingStatus, []);

    useEffect(() => {
        contract.events.AirlineFunded({ filter: { account } }, (error) => {
            if (error) {
                console.error(error); // eslint-disable-line no-console
                return;
            }
            queryFundingStatus();
        });
    }, []);

    return (
        <div>
            <h3>Fund to participate Dapp</h3>
            {funded ? (
                <p>Funded enough.</p>
            ) : (
                <Fragment>
                    <p>Fund 10 ether to participate dapp!</p>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={fund}
                    >
                        Fund
                    </button>
                </Fragment>
            )}
        </div>
    );
};

FundAirline.propTypes = {
    web3: web3PropType.isRequired,
    contract: contractPropType.isRequired,
    account: accountPropType.isRequired,
};

export default FundAirline;
