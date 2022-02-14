setupTracking = function(baseRoomName) {
    if (baseRoomName == undefined) {
        return
    }
    if (Memory.rooms[baseRoomName].energyTracking == undefined) {
        Memory.rooms[baseRoomName].energyTracking = {};
        Memory.rooms[baseRoomName].energyTracking.allTimeNetTotal = 0;
        Memory.rooms[baseRoomName].energyTracking.events = [];
        Memory.rooms[baseRoomName].energyTracking.energyTrackingPerSourceNet = new Map();
        Memory.rooms[baseRoomName].energyTracking.energyTrackingPerSourceHarvested = new Map();
        Memory.rooms[baseRoomName].energyTracking.energyTrackingPerSourceStored = new Map();
    }
}

trackedTransferToStorage = function(creep, storage) {
    if (creep.memory.baseRoomName == undefined) {
        console.log(`creep ${creep} does not have a baseRoomName`)
        creep.transfer(storage, RESOURCE_ENERGY, amount)
        return;
    }
    setupTracking(creep.memory.baseRoomName)
    var amount = creep.store.getUsedCapacity(RESOURCE_ENERGY)
    var ret = creep.transfer(storage, RESOURCE_ENERGY, amount)
    if (ret == OK) {
        Memory.rooms[creep.memory.baseRoomName].energyTracking.energyTrackingPerSourceStored[creep.memory.targetSource] = Memory.rooms[creep.memory.baseRoomName].energyTracking.energyTrackingPerSourceStored[creep.memory.targetSource] | 0 + amount;
        Memory.rooms[creep.memory.baseRoomName].energyTracking.energyTrackingPerSourceNet[creep.memory.targetSource] = Memory.rooms[creep.memory.baseRoomName].energyTracking.energyTrackingPerSourceStored[creep.memory.targetSource] | 0 + amount;
    }
    return ret
}

trackedHarvest = function(creep, source) {
    setupTracking(creep.memory.baseRoomName);
    var amount = creep.memory.scoopSize
    var ret = creep.harvest(source)
    if (ret == OK) {
        Memory.rooms[creep.memory.baseRoomName].energyTracking.energyTrackingPerSourceHarvested[creep.memory.targetSource] = Memory.rooms[creep.memory.baseRoomName].energyTracking.energyTrackingPerSourceHarvested[creep.memory.targetSource] | 0 + amount;
    }
    return ret;

}

trackedSpawn = function(creep) {
    setupTracking(creep.memory.baseRoomName);
    if (creep.memory.tracked != undefined && creep.memory.tracked == true){
        return;
    }
    if (creep.memory.targetSource != undefined) {
        spawnCost = getBodyCost(creep.body.map((b) => b.type));
        Memory.rooms[creep.memory.baseRoomName].energyTracking.energyTrackingPerSourceNet[creep.memory.targetSource] = Memory.rooms[creep.memory.baseRoomName].energyTracking.energyTrackingPerSourceNet[creep.memory.targetSource] | 0 - spawnCost;
        creep.memory.tracked = true;
    }
}