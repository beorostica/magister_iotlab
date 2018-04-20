//Import Modules:
var cmd = require('node-command-line');
var Promise = require('bluebird');
var fs = require('fs');
//fs.writeFile('NODES_IPv6_ADDRESS.txt','');

//Parameters and variables:
var expName = "IoTLab_Beorostica_Protocol_Test";
var expDuration = "10";
var nodGrenoble   = "3";
var nodSaclay     = "6";
var nodStrasbourg = "3";
var i;
var expId;
var expStatus;
var auxDataBoot0 = [];
var auxDataBoot1 = [];
var nodeReliable = [];
var nodeUnreliable = [];
var nodeID = [];
var nodeIPv6Address = [];
var nodeRealAverage;
var nodeInitialValue = [];
var nodeTimeInterval = [];
var nodeSite = [];
var nodeObject = {};
var prefixIPv6Grenoble   = "2001:660:5307:3000::";
var prefixIPv6Saclay     = "2001:660:3207:400::";
var prefixIPv6Strasbourg = "2001:660:4701:f080::";

//Execute commands sequentially:
function runSingleCommandWithWait() {
    Promise.coroutine(function* () {
        //Authentication:
	yield cmd.run("iotlab-auth -u orostica -p Il-UvZvd > IoTLab_1_authentication.json");
	var data_authentication = fs.readFileSync("IoTLab_1_authentication.json");
	var dataAuthentication = JSON.parse(data_authentication);
        console.log("Authentication: " + dataAuthentication);
	if (dataAuthentication == "Written") {
            //Submit Experiment (get experiment ID):
            yield cmd.run("iotlab-experiment submit -n " + expName + " -d " + expDuration + " -l " + nodSaclay + ",archi=a8:at86rf231+site=saclay > IoTLab_2_submit.json");
            var data_submit = fs.readFileSync("IoTLab_2_submit.json");
            var dataSubmit = JSON.parse(data_submit);
            expId = dataSubmit.id;
            console.log("expId: " + expId);
            //Wait until Running Status:
            console.log(" ");
            console.log("Waiting until Running Status ...");
            yield cmd.run("iotlab-experiment wait -i " + expId + " > IoTLab_3_status.json");
            var data_status = fs.readFileSync("IoTLab_3_status.json");
            var dataStatus = JSON.parse(data_status);
            expStatus = dataStatus;
            console.log("expStatus: " + expStatus);
            //Get boot information:
            yield cmd.run("iotlab-experiment get -i " + expId + " -p > IoTLab_4_boot.json");
            var data_boot = fs.readFileSync("IoTLab_4_boot.json");
            var dataBoot = JSON.parse(data_boot);
            auxDataBoot0 = dataBoot.deploymentresults['0'];
            auxDataBoot1 = dataBoot.deploymentresults['1'];
            console.log("Correctly booted nodes:");
            for (var index in auxDataBoot0) {
                console.log(auxDataBoot0[index]);
            }
            console.log(" ");
            console.log("Not properly booted nodes:");
            for (var data in auxDataBoot1) {
                console.log(auxDataBoot1[index]);
            }
            if (expStatus == "Running") {
                //Check the nodes available by SSH connection:
                console.log(" ");
                console.log("Waiting until SSH connections are verified ...");
                yield cmd.run("iotlab-ssh -i " + expId + " wait-for-boot > IoTLab_5_connection.json");
                var data_connection = fs.readFileSync("IoTLab_5_connection.json");
                var dataConnection = JSON.parse(data_connection);
                nodeReliable = dataConnection['wait-for-boot']['0'];
                nodeUnreliable = dataConnection['wait-for-boot']['1'];
                console.log("Correctly SSH connected nodes:");
                for (var index in nodeReliable) {
                    console.log(nodeReliable[index]);
                }
                console.log(" ");
                console.log("Not SSH connected nodes:");
                for (var index in nodeUnreliable) {
                    console.log(nodeUnreliable[index]);
                }
                //Randomize-Shuffle the array of reliable nodes:
                nodeReliable = shuffle(nodeReliable);
                console.log(" ");
                console.log("Correctly SSH connected nodes RANDOMIZED:");
                for (var index in nodeReliable) {
                    console.log(nodeReliable[index]);
                }
                //Get the global IPv6 address of the Randomized-Realiable nodes:
                var i;
                for (i = 0; i < nodeReliable.length; i++) {
                    //Read the node information:
                    var nodeData = nodeReliable[i];
                    //Variables to check the site of the node:
                    var onGrenoble = nodeData.indexOf("grenoble");
                    var onSaclay = nodeData.indexOf("saclay");
                    var onStrasbourg = nodeData.indexOf("strasbourg");
                    //Get the node ID number:
                    var index_nodeID_start = 8;
                    var index_nodeID_end = nodeData.indexOf('.',0);
                    nodeID[i] = nodeData.substring(index_nodeID_start,index_nodeID_end);
                    var nodeIDint = parseInt(nodeID[i]);
                    var nodeIDhex = nodeIDint.toString(16);
                    //Get the public IPv6 address:
                    if (onGrenoble != -1) {
                        nodeIPv6Address[i] = prefixIPv6Grenoble + nodeIDhex;
                        nodeSite[i] = "grenoble";
                    }
                    if (onSaclay != -1) {
                        nodeIPv6Address[i] = prefixIPv6Saclay + nodeIDhex;
                        nodeSite[i] = "saclay";
                    }
                    if (onStrasbourg != -1) {
                        nodeIPv6Address[i] = prefixIPv6Strasbourg + nodeIDhex;
                        nodeSite[i] = "strasbourg";
                    }
                    //Write the IPv6 address in a file:
                    //fs.appendFile("NODES_IPv6_ADDRESS.txt", nodeIPv6Address[i] + '\n');
                    //Creating the nodeObject:
                    nodeInitialValue[i] = getRandomIntInclusive(0,100);
                    nodeTimeInterval[i] = 500*getRandomIntInclusive(1,3);
                    nodeObject[nodeIPv6Address[i]] = {dnsLAN: nodeData, site: nodeSite[i], idLAN: nodeID[i], ipv6Addr: nodeIPv6Address[i], initValue: nodeInitialValue[i], timeInterval: nodeTimeInterval[i], neighbor: []};
                }
                //Put the nodes address together in the nodeObject:
                nodeObject.ipv6Address = nodeIPv6Address;
                //Put the Average of the initial values in the nodeObject:
                var auxSum = nodeInitialValue.reduce((previous, current) => current += previous);
                nodeRealAverage = auxSum / nodeInitialValue.length;
                nodeObject.realAverage = nodeRealAverage;
                //fs.writeFile("NODES_REAL_AVERAGE.txt", nodeRealAverage + '\n');
                console.log("");
                console.log("Real Average Value: " + nodeRealAverage);
                //Define the Topology:
                var N = nodeIPv6Address.length;
                nodeObject[nodeIPv6Address[0]]["neighbor"]   = [nodeIPv6Address[N-1],nodeIPv6Address[1]];
                nodeObject[nodeIPv6Address[N-1]]["neighbor"] = [nodeIPv6Address[N-2],nodeIPv6Address[0]];
                for (i = 1; i < (N-1); i++) {
                    nodeObject[nodeIPv6Address[i]]["neighbor"] = [nodeIPv6Address[i-1],nodeIPv6Address[i+1]];
                }
                //Write the nodeObject on a .json file:
                fs.writeFile("NODES.json", JSON.stringify(nodeObject, null, 4));
                //Send Files to Grenoble, Saclay and Strasbourg Front-ends:
                console.log("");
                console.log("Sending Files to the France Front-Ends ...");
                yield cmd.run('scp "NODES.json" orostica@grenoble.iot-lab.info:A8/');
                yield cmd.run('scp "NODES.json" orostica@saclay.iot-lab.info:A8/');
                yield cmd.run('scp "NODES.json" orostica@strasbourg.iot-lab.info:A8/');
                yield cmd.run('scp "IoTLab_protocol.js" orostica@grenoble.iot-lab.info:A8/');
                yield cmd.run('scp "IoTLab_protocol.js" orostica@saclay.iot-lab.info:A8/');
                yield cmd.run('scp "IoTLab_protocol.js" orostica@strasbourg.iot-lab.info:A8/');
                yield cmd.run('scp "IoTLab_start_signal.js" orostica@grenoble.iot-lab.info:A8/');
                yield cmd.run('scp "IoTLab_start_signal.js" orostica@saclay.iot-lab.info:A8/');
                yield cmd.run('scp "IoTLab_start_signal.js" orostica@strasbourg.iot-lab.info:A8/');
                yield cmd.run('scp "IoTLab_stop_signal.js" orostica@grenoble.iot-lab.info:A8/');
                yield cmd.run('scp "IoTLab_stop_signal.js" orostica@saclay.iot-lab.info:A8/');
                yield cmd.run('scp "IoTLab_stop_signal.js" orostica@strasbourg.iot-lab.info:A8/');
                //Run the protocol on every node:
                console.log("");
                console.log("Running the protocol on every node ...");
                for (i = 0; i < N; i++) {
                    yield cmd.run('iotlab-ssh --verbose run-cmd "cd A8 && node IoTLab_protocol.js" -l saclay,a8,' + nodeID[i]);
                    console.log("Running node: " + nodeIPv6Address[i]);
                }
            }
        }
        console.log("");
        console.log("Experiment Ended! :)");
    })();
}


function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    //The maximum is inclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


runSingleCommandWithWait();

