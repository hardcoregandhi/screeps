
roomTracking = function() {
    _.forEach(Game.rooms, (r) => {
        if (Memory.rooms == undefined) {
            Memory.rooms = {};
        }
        const terrain = r.getTerrain();

        // console.log(r.name)
        stores = r.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_STORAGE;
            },
        });
        containers = r.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_CONTAINER;
            },
        });
        var total = 0;
        _.forEach(stores, (s) => {
            creepRoomMap.set(r.name + "eenergy", (total += s.store[RESOURCE_ENERGY]));
        });

        if (Memory.rooms[r.name] == undefined) Memory.rooms[r.name] = {};

        if (Memory.rooms[r.name] != undefined) delete Memory.rooms[r.name].sources;

        Memory.rooms[r.name].sources = {};
        // mainStorage
        // find room spawn
        spawn = r.find(FIND_STRUCTURES, {
            filter: (s) => {
                return s.structureType == STRUCTURE_SPAWN && s.my;
            },
        });
        if (spawn.length) {
            Memory.rooms[r.name].spawns = {}
            _.forEach(spawn, (s) => {
                Memory.rooms[r.name].spawns[s.name] = {}
                Memory.rooms[r.name].spawns[s.name].massHealing = false

                surroundingCreeps = 0
                for (var i = s.pos.x -1 ; i < s.pos.x + 1; i++) {
                    for (var j = s.pos.y -1 ; j < s.pos.y + 1; j++) {
                        localCreeps = s.room.lookForAt(LOOK_CREEPS, i, j).length
                        if(localCreeps.length && localCreep[0].memory.healing) {
                            surroundingCreeps++
                        }
                    }
                }
                if(surroundingCreeps >= 3) {
                    Memory.rooms[r.name].spawns[s.name].massHealing = true
                } else {
                    Memory.rooms[r.name].spawns[s.name].massHealing = false
                }
            })
            
            
            
            spawn = spawn[0];
            
            
            // base building setup and tracking
            if (Memory.rooms[r.name].mainSpawn.id == undefined) {
                log.log(`setting up ${r.name}`);
                Memory.rooms[r.name].mainSpawn = {};
                Memory.rooms[r.name].mainSpawn.id = spawn.id;
                Memory.rooms[r.name].mainSpawn.pos = spawn.pos;
                Memory.rooms[r.name].currentRoomBuildingLevel = r.controller.level;
                Memory.rooms[r.name].building = [];
                for (var i = 1; i <= 8; i++) {
                    Memory.rooms[r.name].building[i] = {};
                    Memory.rooms[r.name].building[i].currentStage = 0;
                    Memory.rooms[r.name].building[i].isComplete = false;
                }
            }
            Memory.rooms[r.name].mainSpawn.refilling = false
            
            // find closest storage/container to spawn which is presumably main storage
            var target = spawn.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_STORAGE || (structure.structureType == STRUCTURE_CONTAINER && spawn.pos.inRangeTo(structure, 3));
                },
            });
            if (target.length == 1) {
                Memory.rooms[r.name].mainStorage = target[0].id;
            } else if (target.length == 2) {
                _.forEach(target, (t) => {
                    // if container, set it as main while we empty it and transition to storage, then destroy it

                    if(t.structureType == STRUCTURE_CONTAINER) {
                        if(t.store.getFreeCapacity() == t.store.getCapacity()) {
                            t.destroy()
                            return
                        }
                        Memory.rooms[r.name].mainStorage = t.id;
                        return false
                    }
                })
            }
        }

        // source
        sources = r.find(FIND_SOURCES);
        if (Memory.rooms[r.name] == undefined) {
            Memory.rooms[r.name] = {};
        }
        Memory.rooms[r.name].sources = {};
        _.forEach(sources, (s, i) => {
            // console.log(i)
            // console.log(s.id)
            Memory.rooms[r.name].sources[s.id] = {};
            Memory.rooms[r.name].sources[s.id].id = s.id
            if (Memory.rooms[r.name].sources[s.id].targettedBy == undefined) {
                Memory.rooms[r.name].sources[s.id].targettedBy = [];
            }
            
            // get valid mining spots
            Memory.rooms[r.name].totalMiningSpots = 0
            if(Memory.rooms[r.name].sources[s.id].miningSpots == undefined) {
                localMiningSpots = 0
                totalMiningSpots = 0
                for (var i = s.pos.x -1 ; i <= s.pos.x + 1; i++) {
                    for (var j = s.pos.y -1 ; j <= s.pos.y + 1; j++) {
                        if (terrain.get(i,j) != TERRAIN_MASK_WALL) {
                            localMiningSpots++
                        }
                    }
                }
                Memory.rooms[r.name].sources[s.id].miningSpots = localMiningSpots
                Memory.rooms[r.name].totalMiningSpots += localMiningSpots
            }

            // find local containers
            var closeContainer = s.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return s.pos.inRangeTo(structure, 2) == true && structure.structureType == STRUCTURE_CONTAINER;
                },
            });
            if (closeContainer.length) {
                Memory.rooms[r.name].sources[s.id].container = {};
                Memory.rooms[r.name].sources[s.id].container.id = closeContainer[0].id;
                Memory.rooms[r.name].sources[s.id].container.targettedBy = 0;
            }

            // console.log(s)
            Memory.rooms[r.name].sources[s.id].targettedBy = 0;
            _.forEach(Game.creeps, (c) => {
                if ((c.memory.role == "harvester" && c.memory.baseRoomName == r.name) || (c.memory.role == "harvesterExt" && c.memory.targetRoomName == r.name)) {
                    // console.log("s.id:", s.id)
                    // console.log("c.memory.targetSource:", c.memory.targetSource)
                    if (s.id == c.memory.targetSource) {
                        Memory.rooms[r.name].sources[s.id].targettedBy += 1;
                        // console.log(Memory.rooms[r.name].sources[i].targettedBy)
                    }
                } else if (c.memory.role == "harvSup" || c.memory.role == "moverExt") {
                    if (Memory.rooms[r.name].sources[s.id].container != undefined) {
                        if (c.memory.targetContainer == Memory.rooms[r.name].sources[s.id].container.id) {
                            Memory.rooms[r.name].sources[s.id].container.targettedBy += 1;
                        }
                    }
                }
            });
            new RoomVisual().text(Memory.rooms[r.name].sources[s.id].targettedBy, s.pos.x - 0.17, s.pos.y + 0.2, { align: "left", font: 0.6 });

            if (Memory.rooms[r.name].sources[s.id].container != undefined) {
                var cont = Game.getObjectById(Memory.rooms[r.name].sources[s.id].container.id);
                new RoomVisual().text(Memory.rooms[r.name].sources[s.id].container.targettedBy, cont.pos.x - 0.17, cont.pos.y + 0.2, { align: "left", font: 0.6 });
            }
        });
    });

    // Logging
    roomOffset = 0;
    global.listOffset = 1;
    fontSize = 0.3;
    global.textOffset = 0;
    global.inc = function () {
        textOffset += fontSize;
        return textOffset;
    };

    for (var room in Game.rooms) {
        r = Game.rooms[room];
        if (!myRooms.includes(r.name)) {
            continue;
        }
        // Creep info
        new RoomVisual().text(r.name, 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("🔋  ExcessEnergy: " + creepRoomMap.get(r.name + "eenergy"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("⚡️ Energy      : " + r.energyAvailable + "/" + r.energyCapacityAvailable, 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("⛏️ Harvesters  : " + creepRoomMap.get(r.name + "harvester"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("🚚 Movers      : " + creepRoomMap.get(r.name + "mover"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("👷 Builders    : " + creepRoomMap.get(r.name + "builder"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("🚧 C sites     : " + creepRoomMap.get(r.name + "csites"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("🔺Upgraders    : " + creepRoomMap.get(r.name + "upgrader"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("HarvestExt    : " + creepRoomMap.get(r.name + "harvesterExt"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("MoverExt    : " + creepRoomMap.get(r.name + "moverExt"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("HarvestExtTarget    : " + creepRoomMap.get(r.name + "harvesterExtTarget"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("MoverExtTarget    : " + creepRoomMap.get(r.name + "moverExtTarget"), 1, listOffset + inc(), { align: "left", font: fontSize });
        textOffset;
    }
}
