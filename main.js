require("manage.baseBuilding");
require("manage.spawns");
require("manage.structs");
require("manage.creeps");
require("manage.renew");
require("manage.roads");
require("role.common");

function getRandomInt(min = 100, max = 999) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
getBodyCost = function (bodyParts) {
    return _.sum(bodyParts, (b) => BODYPART_COST[b]);
};
removeAllSites = function (roomName) {
    const sites = Game.rooms[roomName].find(FIND_CONSTRUCTION_SITES);
    for (const site of sites) {
        if (site.progress == 0) site.remove();
    }
};

focusHealing = false;
global.myRooms = ["W16S21", "W15S21", "W19S21", "W17S19", "W16S22", "W14S23"];

generateBodyParts = function (_spawnRoom, _role = null){
    room = Game.rooms[_spawnRoom];
    energyAvailable = room.energyAvailable
    bodyParts = []
    if(_role.bodyLoop == null) {
        bodyLoop = [WORK,CARRY,MOVE]
    } else {
        bodyParts = _role.baseBodyParts
        bodyLoop = _role.bodyLoop
    }
    bodyIter = 0
    console.log(room)
    console.log(energyAvailable)

    while (getBodyCost(bodyParts) < energyAvailable &&
            bodyParts.length < 50) {
        
        bodyParts.push(bodyLoop[bodyIter++])
        if(bodyIter >= bodyLoop.length) bodyIter = 0
    }
    bodyParts.pop()
    console.log(getBodyCost(bodyParts))
    return bodyParts
}

cloneCreep = function (sourceCreepName, room = null) {
    sourceCreep = Game.creeps[sourceCreepName]
    if(sourceCreep === null) return -1
    spawnRoom = room != null ? Game.rooms[room] : Game.rooms[sourceCreep.memory.baseRoomName]
    if(spawnRoom === null) return -1
    try {
    roomSpawner = spawnRoom.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_SPAWN;
        },
    })[0];
    } catch (e) {
        return -1
    }
    var newName = _.capitalize(sourceCreep.memory.role) + "_" + getRandomInt();
    console.log("Cloning new " + newName + " from " + sourceCreepName);
    console.log(sourceCreep.body)
    console.log(newName)
    memoryClone = Object.assign({}, sourceCreep.memory)
    console.log(memoryClone)
    return roomSpawner.spawnCreep(sourceCreep.body.map(a => a.type), newName, memoryClone)
    
    
}

spawnCreep = function (_role, customBodyParts = null, customMemory = null, _spawnRoom = null) {
    var ret = -1;

    if (_spawnRoom != null) {
        room = Game.rooms[_spawnRoom];
        if (room == null) {
            console.log(`Room ${_spawnRoom} not found`);
            return -1;
        }
        roomSpawner = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_SPAWN;
            },
        });
        if (roomSpawner.length == 0) {
            console.log(`Spawn could not be found in ${_spawnRoom}`);
            return -1;
        }
        spawn = roomSpawner[0];
        // console.log(`Found spawn ${spawn}`)
    } else {
        spawn = "Spawn1";
        spawn = Game.spawns[spawn];
    }
    
    if (customBodyParts) {
        console.log(customBodyParts)
        // console.log("customActivated")
        if(customBodyParts == "auto") {
            customBodyParts = generateBodyParts(_spawnRoom, _role)
        }
        console.log(customBodyParts)
        console.log(customBodyParts.length)
        oldBodyParts = _role.BodyParts;
        _role.BodyParts = customBodyParts;
    }

    cost = getBodyCost(_role.BodyParts);
    
    myCreeps = spawn.room.find(FIND_MY_CREEPS, {
        filter: (c) => spawn.pos.inRangeTo(c, 1) && c.ticksToLive < 155 //150 is the highest spawn time for a 50 part creep
    })
    
    if (myCreeps.length) {
        return -1
    }
    // console.log("energy available", spawn.room.energyAvailable)
    // console.log("cost", cost)

    if (spawn.room.energyAvailable >= cost && !spawn.spawning) {
        var newName = _.capitalize(_role.name) + "_" + getRandomInt();
        console.log("Spawning new " + _role.name + " : " + newName);

        ret = spawn.spawnCreep(
            _role.BodyParts,
            newName,
            _.merge(
                {
                    memory: {
                        role: _role.name,
                        currentSource: "0",
                        baseRoomName: spawn.room.name,
                    },
                },
                _role.memory,
                customMemory
            )
        );
        if (ret != 0) {
            console.log("Spawn failed: ", ret);
        }
    } else {
        // console.log(`Funds not available: ${cost}`)
        new RoomVisual().text("Next " + spawn.room.name + ": " + _.capitalize(_role.name) + " Cost: " + cost, 1, (nextSpawnOffset += 1) + 0, { align: "left", font: 0.5 });
    }

    if (customBodyParts) {
        // console.log("customDeactivated")
        _role.BodyParts = oldBodyParts;
    }

    return ret;
};

// Any modules that you use that modify the game's prototypes should be require'd
// before you require the profiler.
const profiler = require("screeps-profiler");

// This line monkey patches the global prototypes.
profiler.enable();
module.exports.loop = function () {
    profiler.wrap(function () {
    // Cleanup
    for (var i in Memory.creeps) {
        if (!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }

    // Event logging
    _.forEach(Game.rooms, (room) => {
        let eventLog = room.getEventLog();
        let attackEvents = _.filter(eventLog, { event: EVENT_ATTACK });
        attackEvents.forEach((event) => {
            let target = Game.getObjectById(event.data.targetId);
            if (target && target.my) {
                console.log(event);
            }
        });
    });

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
            
            key = r.name + c.memory.role+"Target";
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
            
            key = r.name + c.memory.role+"Target"+c.memory.targetSource;
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
            
            creepRoomMap.set(r.name + "csites", r.find(FIND_CONSTRUCTION_SITES).length);
        });
    });

    // Active Energy Tracking
    _.forEach(Game.rooms, (r) => {
            if (Memory.rooms == undefined) {
                Memory.rooms = {};
            }
        // console.log(r.name)
        stores = r.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_STORAGE;
            },
        });
        var total = 0;
        _.forEach(stores, (s) => {
            creepRoomMap.set(r.name + "eenergy", (total += s.store[RESOURCE_ENERGY]));
        });

        delete Memory.rooms[r.name]

        sources = r.find(FIND_SOURCES);
        if (Memory.rooms[r.name] == undefined) {
            Memory.rooms[r.name] = {};
        }
        Memory.rooms[r.name].sources = sources;
        _.forEach(sources, (s, i) => {
            // console.log(i)
            // console.log(s.id)
            Memory.rooms[r.name].sources[i] = {};
            Memory.rooms[r.name].sources[i].id = s.id;
            if (Memory.rooms[r.name].sources[i].targettedBy == undefined) {
                Memory.rooms[r.name].sources[i].targettedBy = [];
            }

            // console.log(s)
            Memory.rooms[r.name].sources[i].targettedBy = 0;
            _.forEach(Game.creeps, (c) => {
                if ((c.memory.role == "harvester" && c.memory.baseRoomName == r.name)
                    || (c.memory.role == "harvesterExt"&& c.memory.targetRoomName == r.name)) {
                    // console.log("s.id:", s.id)
                    // console.log("c.memory.targetSource:", c.memory.targetSource)
                    if (s.id == c.memory.targetSource) {
                        Memory.rooms[r.name].sources[i].targettedBy += 1;
                        // console.log(Memory.rooms[r.name].sources[i].targettedBy)
                    }
                }
            });
            new RoomVisual().text(Memory.rooms[r.name].sources[i].targettedBy, s.pos.x-0.17, s.pos.y+0.2, { align: "left", font: 0.6 });
        });
    });

    // Logging
    roomOffset = 0;
    listOffset = 1;
    fontSize = 0.3;
    textOffset = 0
    function inc(){
        textOffset+=fontSize;
        return textOffset;
    }

    for (var room in Game.rooms) {
        r = Game.rooms[room];
        if (!myRooms.includes(r.name)) {
            continue;
        }
        // Creep info
        new RoomVisual().text(r.name, 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("🔋  ExcessEnergy: " + creepRoomMap.get(r.name + "eenergy"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("⚡️ Energy      : " + r.energyAvailable + "/" + r.energyCapacityAvailable, 1, listOffset + inc(), { align: "left" ,font:fontSize});
        new RoomVisual().text("⛏️ Harvesters  : " + creepRoomMap.get(r.name + "harvester"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("🚚 Movers      : " + creepRoomMap.get(r.name + "mover"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("👷 Builders    : " + creepRoomMap.get(r.name + "builder"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("🚧 C sites     : " + creepRoomMap.get(r.name + "csites"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("🔺Upgraders    : " + creepRoomMap.get(r.name + "upgrader"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("HarvestExt    : " + creepRoomMap.get(r.name + "harvesterExt"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("MoverExt    : " + creepRoomMap.get(r.name + "moverExt"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("HarvestExtTarget    : " + creepRoomMap.get(r.name + "harvesterExtTarget"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("MoverExtTarget    : " + creepRoomMap.get(r.name + "moverExtTarget"), 1, listOffset + inc(), { align: "left", font: fontSize });
        textOffset
    }

    runStructs();

    runSpawns();

    runCreeps();
    
    runRenew();


        runBaseBuilder();
    });
};
