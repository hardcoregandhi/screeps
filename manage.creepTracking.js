
creepTracking = function() {
    // Active Creep Tracking
    global.creepRoomMap = new Map();
    _.forEach(Game.rooms, (r) => {
        creepRoomMap.set(r.name + "builder", 0);
        creepRoomMap.set(r.name + "mover", 0);
        creepRoomMap.set(r.name + "upgrader", 0);
        creepRoomMap.set(r.name + "harvester", 0);
        creepRoomMap.set(r.name + "claimer", 0);
        creepRoomMap.set(r.name + "harvesterExt", 0);
        creepRoomMap.set(r.name + "moverExt", 0);
    });

    _.forEach(Game.rooms, (r) => {
        _.forEach(Game.creeps, (c) => {
            key = r.name + c.memory.role;
            if (c.memory.baseRoomName == r.name) {
                if (creepRoomMap.get(key)) {
                    creepRoomMap.set(key, creepRoomMap.get(key) + 1);
                } else {
                    creepRoomMap.set(key, 1);
                }
            } else {
                if (creepRoomMap.get(key) == undefined) {
                    creepRoomMap.set(key, 0);
                }
            }

            key = r.name + c.memory.role + "Target";
            if (c.memory.targetRoomName == r.name) {
                if (creepRoomMap.get(key)) {
                    creepRoomMap.set(key, creepRoomMap.get(key) + 1);
                } else {
                    creepRoomMap.set(key, 1);
                }
            } else {
                if (creepRoomMap.get(key) == undefined) {
                    creepRoomMap.set(key, 0);
                }
            }

            key = r.name + c.memory.role + "Target" + c.memory.targetSource;
            if (c.memory.targetRoomName == r.name) {
                if (creepRoomMap.get(key)) {
                    creepRoomMap.set(key, creepRoomMap.get(key) + 1);
                } else {
                    creepRoomMap.set(key, 1);
                }
            } else {
                if (creepRoomMap.get(key) == undefined) {
                    creepRoomMap.set(key, 0);
                }
            }
        });
        creepRoomMap.set(r.name + "csites", r.find(FIND_CONSTRUCTION_SITES).length);
    });
}
