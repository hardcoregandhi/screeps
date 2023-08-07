refreshCreepTracking = function () {
    if (creepRoomMap.size == 0 || Game.time >= nextCreepRoomMapRefreshTime) {
        console.log("Refreshing CreepRoomMap");
        creepTracking();
        nextCreepRoomMapRefreshTime += nextCreepRoomMapRefreshInterval;
    }
};

creepTracking = function () {
    var backupExcessEnergyValue;
    if (creepRoomMap != undefined) {
        backupExcessEnergyValue = myRooms[Game.shard.name].map((r) => {
            return creepRoomMap.get(r + "eenergy");
        });
    }

    global.creepRoomMap = new Map();

    var i = 0;
    _.forEach(myRooms[Game.shard.name], (r) => {
        creepRoomMap.set(r + "eenergy", backupExcessEnergyValue[i++]);
    });

    // Active Creep Tracking
    _.forEach(Game.rooms, (r) => {
        creepRoomMap.set(r.name + "builder", 0);
        creepRoomMap.set(r.name + "handler", 0);
        creepRoomMap.set(r.name + "upgrader", 0);
        creepRoomMap.set(r.name + "harvester", 0);
        creepRoomMap.set(r.name + "claimer", 0);
        creepRoomMap.set(r.name + "harvesterExt", 0);
        creepRoomMap.set(r.name + "moverExt", 0);
        creepRoomMap.set(r.name + "moverLink", 0);
        creepRoomMap.set(r.name + "csites", r.find(FIND_MY_CONSTRUCTION_SITES).length);
    });

    _.forEach(Game.creeps, (c) => {
        key = c.memory.baseRoomName + c.memory.role;
        if (creepRoomMap.get(key) != undefined) {
            creepRoomMap.set(key, creepRoomMap.get(key) + 1);
        } else {
            creepRoomMap.set(key, 1);
        }

        if (c.memory.targetSource != undefined) {
            key = c.memory.baseRoomName + c.memory.role + "Target" + c.memory.targetSource;
            if (creepRoomMap.get(key) != undefined) {
                creepRoomMap.set(key, creepRoomMap.get(key) + 1);
            } else {
                creepRoomMap.set(key, 1);
            }
        }

        if (c.memory.targetRoomName != undefined) {
            key = c.memory.baseRoomName + c.memory.role + "Target" + c.memory.targetRoomName;
            // console.log(key)
            if (creepRoomMap.get(key) != undefined) {
                creepRoomMap.set(key, creepRoomMap.get(key) + 1);
            } else {
                creepRoomMap.set(key, 1);
            }
        }
    });

    nextCreepRoomMapRefreshTime += nextCreepRoomMapRefreshInterval;
    refreshCreepTrackingNextTick = false;
};

global.getRoomCreepTypeCount = function(roomName, type, targetRoomName = null) {
    if (targetRoomName != null) {
        targetRoomName = `Target${targetRoomName}`
    } else {
        targetRoomName = ""
    }
    key = `${roomName}${type}${targetRoomName}`
    ret = creepRoomMap.get(key)
    return ret == null ? 0 : ret
}
