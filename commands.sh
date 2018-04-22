#!/bin/bash

iotlab-ssh --verbose run-cmd "cd A8 && node IoTLab_protocol.js" -l grenoble,a8,102+100+95 &
iotlab-ssh --verbose run-cmd "cd A8 && node IoTLab_protocol.js" -l saclay,a8,100+103+102 &
iotlab-ssh --verbose run-cmd "cd A8 && node IoTLab_protocol.js" -l strasbourg,a8,13+10+11+12 &
sleep 30
iotlab-ssh --verbose run-cmd "cd A8 && node IoTLab_start_signal.js" --frontend
sleep 2m
iotlab-ssh --verbose run-cmd "cd A8 && node IoTLab_stop_signal.js" --frontend
