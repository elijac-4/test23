'use strict';


const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('./CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('./AppUtil.js');

const channelName = process.env.CHANNEL_NAME || 'mychannel';
const chaincodeName = process.env.CHAINCODE_NAME || 'basic';
const asLocalHost = process.env.LOCALHOST ? process.env.LOCALHOST === 'true' : false;

console.log(`asLocalHost: ${asLocalHost}`);

const mspOrg1 = 'org1msp';
const walletPath = path.join(__dirname, 'wallet');
//const org1UserId = 'javascriptAppUser';
const org1UserId = 'admin';

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function main() {
	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'blockchain-project2-org1ca-ca.bbbt-dev-eu-de-1-bx2-4x16-35ff69903c9517ee3126f97460024740-0000.eu-de.containers.appdomain.cloud:443');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		//await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.

		console.log("\nCreating Gateway\n");
		const gateway = new Gateway();
		console.log("\nGateway Created\n");

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			console.log("\nConnecting Gateway\n");
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: asLocalHost } // using asLocalhost as this gateway is using a fabric network deployed locally
			});
			console.log("\nGateway Connected\n");

			// Build a network instance based on the channel where the smart contract is deployed
			console.log(`getNetwork(${channelName} started`);
			const network = await gateway.getNetwork(channelName);
			console.log(`getNetwork(${channelName} finished`);
			
			// Get the contract from the network.
			console.log(`getContract(${channelName} started`);
			const contract = network.getContract(chaincodeName);
			console.log(`getContract(${channelName} finished`);

			console.log(`submitting transaction...`);
			let result = await contract.submitTransaction('CreateTransaction', 'mydata', 'k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7', 'k8', 'k9');
			console.log('*** Result: committed');
			
			if (`${result}` !== '') {
				console.log(`*** Result: ${prettyJSONString(result.toString())}`);
			}
			
			/*
			// Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
			// This type of transaction would only be run once by an application the first time it was started after it
			// deployed the first time. Any updates to the chaincode deployed later would likely not need to run
			// an "init" type function.
			console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
			await contract.submitTransaction('InitLedger');
			console.log('*** Result: committed');

			// Let's try a query type operation (function).
			// This will be sent to just one peer and the results will be shown.
			console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
			let result = await contract.evaluateTransaction('GetAllAssets');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			// Now let's try to submit a transaction.
			// This will be sent to both peers and if both peers endorse the transaction, the endorsed proposal will be sent
			// to the orderer to be committed by each of the peer's to the channel ledger.
			console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, color, owner, size, and appraisedValue arguments');
			result = await contract.submitTransaction('CreateAsset', 'asset313', 'yellow', '5', 'Tom', '1300');
			console.log('*** Result: committed');
			if (`${result}` !== '') {
				console.log(`*** Result: ${prettyJSONString(result.toString())}`);
			}

			console.log('\n--> Evaluate Transaction: ReadAsset, function returns an asset with a given assetID');
			result = await contract.evaluateTransaction('ReadAsset', 'asset313');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			console.log('\n--> Evaluate Transaction: AssetExists, function returns "true" if an asset with given assetID exist');
			result = await contract.evaluateTransaction('AssetExists', 'asset1');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			console.log('\n--> Submit Transaction: UpdateAsset asset1, change the appraisedValue to 350');
			await contract.submitTransaction('UpdateAsset', 'asset1', 'blue', '5', 'Tomoko', '350');
			console.log('*** Result: committed');

			console.log('\n--> Evaluate Transaction: ReadAsset, function returns "asset1" attributes');
			result = await contract.evaluateTransaction('ReadAsset', 'asset1');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			try {
				// How about we try a transactions where the executing chaincode throws an error
				// Notice how the submitTransaction will throw an error containing the error thrown by the chaincode
				console.log('\n--> Submit Transaction: UpdateAsset asset70, asset70 does not exist and should return an error');
				await contract.submitTransaction('UpdateAsset', 'asset70', 'blue', '5', 'Tomoko', '300');
				console.log('******** FAILED to return an error');
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error}`);
			}

			console.log('\n--> Submit Transaction: TransferAsset asset1, transfer to new owner of Tom');
			await contract.submitTransaction('TransferAsset', 'asset1', 'Tom');
			console.log('*** Result: committed');

			console.log('\n--> Evaluate Transaction: ReadAsset, function returns "asset1" attributes');
			result = await contract.evaluateTransaction('ReadAsset', 'asset1');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
   			*/
		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
		process.exit(1);
	}
}


main();

const express = require('express')
const app = express()
const port = 3000
app.get('/', (req, res) => {
	res.send("'hello world!'")
})

app.listen(port, () => {
	console.log("listening on port 3000")
})
