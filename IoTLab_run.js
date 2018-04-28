//Import Modules:
var cmd = require('node-command-line');
var Promise = require('bluebird');
var fs = require('fs');

//Parameters and variables:
var expName = "IoTLab_Beorostica_Protocol_Test";
var protocolDuration = "100";
var nodGrenoble   = "75";
var nodSaclay     = "75";
var nodStrasbourg = "14";
var expDuration = "120";		//expDuration > protocolDuration + 6m
var i;
var N;
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
function runCommandsSequentially() {
    Promise.coroutine(function* () {

        //Remove all past files and Results:
        console.log("Removing past files and results ...")
        yield cmd.run("rm IoTLab_1_authentication.json");
        yield cmd.run("rm IoTLab_2_submit.json");
        yield cmd.run("rm IoTLab_3_status.json");
        yield cmd.run("rm IoTLab_4_boot.json");
        yield cmd.run("rm IoTLab_5_connection.json");
        yield cmd.run("rm NODES.json");
        yield cmd.run("rm -r RESULTS");
        fs.writeFile('IoTLab_shell_commands.sh','#!/bin/bash\n\n');

        //Removing all files inside the A8 folder in France Front-ends:
        yield cmd.run('ssh orostica@grenoble.iot-lab.info "rm -rf A8/*"');
        yield cmd.run('ssh orostica@saclay.iot-lab.info "rm -rf A8/*"');
        yield cmd.run('ssh orostica@strasbourg.iot-lab.info "rm -rf A8/*"');

        //Authentication:
	yield cmd.run("iotlab-auth -u orostica -p Il-UvZvd > IoTLab_1_authentication.json");
	var data_authentication = fs.readFileSync("IoTLab_1_authentication.json");
	var dataAuthentication = JSON.parse(data_authentication);
        console.log("Authentication: " + dataAuthentication);

	if (dataAuthentication == "Written") {

            //Submit Experiment (get experiment ID):
            yield cmd.run("iotlab-experiment submit -n " + expName + " -d " + expDuration +
                     " -l " + nodGrenoble + ",archi=a8:at86rf231+site=grenoble" +
                     " -l " + nodSaclay + ",archi=a8:at86rf231+site=saclay" +
                     " -l " + nodStrasbourg + ",archi=a8:at86rf231+site=strasbourg > IoTLab_2_submit.json");
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
            for (var index in auxDataBoot0) {console.log(auxDataBoot0[index]);}
            console.log(" ");
            console.log("Not properly booted nodes:");
            for (var data in auxDataBoot1) {console.log(auxDataBoot1[index]);}

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
                for (var index in nodeReliable) {console.log(nodeReliable[index]);}
                console.log(" ");
                console.log("Not SSH connected nodes:");
                for (var index in nodeUnreliable) {console.log(nodeUnreliable[index]);}

                //Randomize-Shuffle the array of reliable nodes:
                nodeReliable = shuffle(nodeReliable);
                console.log(" ");
                console.log("Correctly SSH connected nodes RANDOMIZED:");
                for (var index in nodeReliable) {console.log(nodeReliable[index]);}

                //Get the global nodeObject of the Randomized-Realiable nodes:
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

                    //Creating the nodeObject:
                    nodeInitialValue[i] = getRandomIntInclusive(0,100);
                    nodeTimeInterval[i] = 500*getRandomIntInclusive(1,3);
                    nodeObject[nodeIPv6Address[i]] = {dnsLAN: nodeData,
                                                      site: nodeSite[i],
                                                      idLAN: nodeID[i],
                                                      ipv6Addr: nodeIPv6Address[i],
                                                      initValue: nodeInitialValue[i],
                                                      timeInterval: nodeTimeInterval[i],
                                                      neighbor: []};

                }

                //Put the nodes address together in the nodeObject:
                nodeObject.ipv6Address = nodeIPv6Address;
                console.log("");
                console.log("Nodes IPv6 Address: ");
                console.log(nodeObject.ipv6Address);

                //Put the Average of the initial values in the nodeObject:
                var auxSum = nodeInitialValue.reduce((previous, current) => current += previous);
                nodeRealAverage = auxSum / nodeInitialValue.length;
                nodeObject.realAverage = nodeRealAverage;
                console.log("");
                console.log("Real Average Value: " + nodeRealAverage);

                //Define the Topology (Circular Topology):
                N = nodeIPv6Address.length;
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

                //Get an string with the LAN IDs separated by site:
                var nodeIDsGrenoble = "";
                var nodeIDsSaclay = "";
                var nodeIDsStrasbourg = "";
                for (i = 0; i < N; i++) {
                    if (nodeSite[i] == "grenoble") {nodeIDsGrenoble = nodeIDsGrenoble + nodeID[i] + '+';}
                    if (nodeSite[i] == "saclay") {nodeIDsSaclay = nodeIDsSaclay + nodeID[i] + '+';}
                    if (nodeSite[i] == "strasbourg") {nodeIDsStrasbourg = nodeIDsStrasbourg + nodeID[i] + '+';}
                }
                nodeIDsGrenoble   = nodeIDsGrenoble.slice(0,-1);
                nodeIDsSaclay     = nodeIDsSaclay.slice(0,-1);
                nodeIDsStrasbourg = nodeIDsStrasbourg.slice(0,-1);
                console.log("");
                console.log("LAN IDs by site:");
                console.log("nodeIDsGrenoble: " + nodeIDsGrenoble);
                console.log("nodeIDsSaclay: " + nodeIDsSaclay);
                console.log("nodeIDsStrasbourg: " + nodeIDsStrasbourg);

                //Write the IoTLab_shell_commands.sh to be executed later:
                fs.appendFile('IoTLab_shell_commands.sh','iotlab-ssh --verbose run-cmd "cd A8 && node IoTLab_protocol.js" -l grenoble,a8,' + nodeIDsGrenoble + ' &\n');
                fs.appendFile('IoTLab_shell_commands.sh','iotlab-ssh --verbose run-cmd "cd A8 && node IoTLab_protocol.js" -l saclay,a8,' + nodeIDsSaclay + ' &\n');
                fs.appendFile('IoTLab_shell_commands.sh','iotlab-ssh --verbose run-cmd "cd A8 && node IoTLab_protocol.js" -l strasbourg,a8,' + nodeIDsStrasbourg + ' &\n');
                fs.appendFile('IoTLab_shell_commands.sh','sleep 1m\n');
                fs.appendFile('IoTLab_shell_commands.sh','iotlab-ssh --verbose run-cmd "cd A8 && node IoTLab_start_signal.js" --frontend\n');
                fs.appendFile('IoTLab_shell_commands.sh','sleep ' + protocolDuration + 'm\n');
                fs.appendFile('IoTLab_shell_commands.sh','iotlab-ssh --verbose run-cmd "cd A8 && node IoTLab_stop_signal.js" --frontend\n');

                //Run the IoTLab_shell_commands.sh, ie. every node in france runs the protocol:
                console.log("");
                console.log("Nodes in France are running the protocol ...");
                yield cmd.run("chmod 777 IoTLab_shell_commands.sh");
                yield cmd.run('./IoTLab_shell_commands.sh');

		//Receiving results from the Front-ends:
                console.log("");
                console.log("Receiving Results from Front-ends ...");
                console.log("");
                yield cmd.run("scp -r orostica@grenoble.iot-lab.info:~/A8/ ~/RESULTS_GRENOBLE");
                yield cmd.run("scp -r orostica@saclay.iot-lab.info:~/A8/ ~/RESULTS_SACLAY");
                yield cmd.run("scp -r orostica@strasbourg.iot-lab.info:~/A8/ ~/RESULTS_STRASBOURG");

                //Keep just the Results en the RESULTS_site FOLDERS:
                yield cmd.run("rm RESULTS_GRENOBLE/IoTLab_protocol.js");
                yield cmd.run("rm RESULTS_GRENOBLE/IoTLab_start_signal.js");
                yield cmd.run("rm RESULTS_GRENOBLE/IoTLab_stop_signal.js");
                yield cmd.run("rm RESULTS_GRENOBLE/NODES.json");
                yield cmd.run("rm RESULTS_SACLAY/IoTLab_protocol.js");
                yield cmd.run("rm RESULTS_SACLAY/IoTLab_start_signal.js");
                yield cmd.run("rm RESULTS_SACLAY/IoTLab_stop_signal.js");
                yield cmd.run("rm RESULTS_SACLAY/NODES.json");
                yield cmd.run("rm RESULTS_STRASBOURG/IoTLab_protocol.js");
                yield cmd.run("rm RESULTS_STRASBOURG/IoTLab_start_signal.js");
                yield cmd.run("rm RESULTS_STRASBOURG/IoTLab_stop_signal.js");
                yield cmd.run("rm RESULTS_STRASBOURG/NODES.json");

                //Create just one folder RESULTS with the data:
                yield cmd.run("mkdir RESULTS");
                yield cmd.run("mv -v RESULTS_GRENOBLE/* ~/RESULTS/");
                yield cmd.run("mv -v RESULTS_SACLAY/* ~/RESULTS/");
                yield cmd.run("mv -v RESULTS_STRASBOURG/* ~/RESULTS/");
                yield cmd.run("rm -r RESULTS_GRENOBLE");
                yield cmd.run("rm -r RESULTS_SACLAY");
                yield cmd.run("rm -r RESULTS_STRASBOURG");

                //Stop the experiment:
                yield cmd.run('iotlab-experiment stop -i ' + expId);

                //Send a final message:
                console.log("");
                console.log("Experiment Ended! :)");
            }
        }
    })();
}


//Auxiliary function to randomize an array:
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

//Auxiliary funcion to get random integers between an interval:
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    //The maximum is inclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Execute the main function:
runCommandsSequentially();

