//Import Modules:
var cmd = require('node-command-line');
var Promise = require('bluebird');
var fs = require('fs');
fs.writeFile('NODES_IPv6_ADDRESS.txt','');

//Parameters and variables:
var expName = "IoTLab_Beorostica_Protocol_Test";
var expDuration = "5";
var nodGrenoble   = "3";
var nodSaclay     = "3";
var nodStrasbourg = "3";
var i;
var expId;
var expStatus;
var nodeReliable;
var NodeUnreliable;
var nodeIPv6Address = [];
var prefixIPv6Grenoble   = "2001:660:5307:3000::";
var prefixIPv6Saclay     = "2001:660:3207:0400::";
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
            console.log("Correctly booted nodes: " + dataBoot.deploymentresults['0']);
            console.log(" ");
            console.log("Not booted nodes: " + dataBoot.deploymentresults['1']);
            if (expStatus == "Running") {
                //Check the nodes available by SSH connection:
                console.log(" ");
                console.log("Waiting until SSH connections are verified ...");
                yield cmd.run("iotlab-ssh -i " + expId + " wait-for-boot > IoTLab_5_connection.json");
                var data_connection = fs.readFileSync("IoTLab_5_connection.json");
                var dataConnection = JSON.parse(data_connection);
                nodeReliable = dataConnection['wait-for-boot']['0'];
                nodeUnreliable = dataConnection['wait-for-boot']['1'];
                console.log("Correctly SSH connected nodes: " + nodeReliable);
                console.log(" ");
                console.log("Not SSH connected nodes: " + nodeUnreliable);
                //Get the global IPv6 address of the Realiable nodes:
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
                    var nodeID = nodeData.substring(index_nodeID_start,index_nodeID_end);
                    var nodeIDint = parseInt(nodeID);
                    var nodeIDhex = nodeIDint.toString(16);
                    //Get the public IPv6 address:
                    if (onGrenoble != -1) {
                        nodeIPv6Address[i] = prefixIPv6Grenoble + nodeIDhex;
                    }
                    if (onSaclay != -1) {
                        nodeIPv6Address[i] = prefixIPv6Saclay + nodeIDhex;
                    }
                    if (onStrasbourg != -1) {
                        nodeIPv6Address[i] = prefixIPv6Strasbourg + nodeIDhex;
                    }
                    //Write the IPv6 address in a file:
                    fs.appendFile("NODES_IPv6_ADDRESS.txt", nodeIPv6Address[i] + '\n');
                }
                //nodeIPv6Address[i]
                var objectNodes = array2object(nodeIPv6Address);
                fs.writeFile("NODES.json", JSON.stringify(objectNodes, null, 4));
                yield cmd.run("cat NODES.json");
            }
        }

        console.log("Executed your command :)");
    })();
}

runSingleCommandWithWait();

function array2object(array) {
    var object = {};
    var i;
    for (var i = 0; i < array.length; i++) {
        object[array[i]] = {};
    }
    return object;
}
