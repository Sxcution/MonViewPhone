package adb

import "sync"

var WifiEndpointMu sync.RWMutex
var WifiEndpointToSerial = map[string]string{}
