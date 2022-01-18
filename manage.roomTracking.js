roomTracking = function () {
    _.forEach(Game.rooms, (r) => {
        if (Memory.rooms == undefined) {
            Memory.rooms = {};
        }
        
        if (roomRefreshMap[r.name] == undefined) {
            console.log(r.name + " was added to roomRefreshMap")
            roomRefreshMap[r.name] = Game.time
        }
        
        if (roomRefreshMap[r.name] > Game.time) {
            // console.log(`Skipping ${r.name} refresh`)
            return;
        }
        
        console.log(`Refreshing ${r.name}`)

        
        const terrain = r.getTerrain();

        if (Memory.rooms[r.name] == undefined) Memory.rooms[r.name] = {};

        var csites = r.find(FIND_CONSTRUCTION_SITES);
        creepRoomMap.set(r.name + "csites", csites.length);
        Memory.rooms[r.name].roomVisuals = []

        if (myRooms[Game.shard.name].includes(r.name)) {
            //console.log(`room ${r}`);
            stores = [];
            spawns = [];
            pspawns = [];
            containers = [];
            towers = [];
            links = [];
            terminals = [];
            observers = [];

            //startCpu = Game.cpu.getUsed();

            if (Memory.rooms[r.name].structs == undefined) {
                Memory.rooms[r.name].structs = {};
            }

            var allStructures = r.find(FIND_STRUCTURES);

            for (structure of allStructures) {
                switch (structure.structureType) {
                    case STRUCTURE_STORAGE:
                        stores.push(structure);
                        break;
                    case STRUCTURE_CONTAINER:
                        containers.push(structure);
                        break;
                    case STRUCTURE_SPAWN:
                        spawns.push(structure);
                        break;
                    case STRUCTURE_TOWER:
                        towers.push(structure);
                        break;
                    case STRUCTURE_POWER_SPAWN:
                        pspawns.push(structure);
                        if (Memory.rooms[r.name].structs.pspawn == undefined) {
                            Memory.rooms[r.name].structs.pspawn = {};
                            Memory.rooms[r.name].structs.pspawn.id = structure.id;
                        }
                        break;
                    case STRUCTURE_LINK:
                        links.push(structure);
                        break;
                    case STRUCTURE_TERMINAL:
                        if (Memory.rooms[r.name].structs.terminal == undefined) {
                            Memory.rooms[r.name].structs.terminal = {};
                            Memory.rooms[r.name].structs.terminal.id = structure.id;
                        }
                        // terminals.push(structure);
                        break;
                    case STRUCTURE_OBSERVER:
                        if (Memory.rooms[r.name].structs.observer == undefined) {
                            Memory.rooms[r.name].structs.observer = {};
                            Memory.rooms[r.name].structs.observer.id = structure.id;
                        }
                        // observers.push(structure);

                        break;
                    case STRUCTURE_FACTORY:
                        if (Memory.rooms[r.name].structs.factory == undefined) {
                            Memory.rooms[r.name].structs.factory = {};
                            Memory.rooms[r.name].structs.factory.id = structure.id;
                        }
                        break;
                }
            }

            //elapsed = Game.cpu.getUsed() - startCpu;
            //console.log("allStructures find has used " + elapsed + " CPU time");
            //startCpu = Game.cpu.getUsed();

            // //console.log(r.name)

            var total = 0;
            _.forEach(stores, (s) => {
                creepRoomMap.set(r.name + "eenergy", (total += s.store[RESOURCE_ENERGY]));
            });

            //elapsed = Game.cpu.getUsed() - startCpu;
            //console.log("eenergy calc has used " + elapsed + " CPU time");
            //startCpu = Game.cpu.getUsed();
            if (Memory.rooms[r.name].towers == undefined) {
                Memory.rooms[r.name].towers = {};
            }
            _.forEach(towers, (t) => {
                if(Memory.rooms[r.name].mainTower == undefined) {
                    Memory.rooms[r.name].mainTower = {}
                    Memory.rooms[r.name].mainTower.id = t.id
                    Memory.rooms[r.name].mainTower.healRequested = false
                }
                if (Memory.rooms[r.name].towers[t.id] == undefined) {
                    Memory.rooms[r.name].towers[t.id] = {};
                    Memory.rooms[r.name].towers[t.id].id = t.id;
                    Memory.rooms[r.name].towers[t.id].currentTarget = null;
                }
            });

            // if (Memory.rooms[r.name] != undefined) delete Memory.rooms[r.name].sources;

            // mainStorage
            // find room spawn
            if (spawns.length) {
                Memory.rooms[r.name].spawns = {};
                _.forEach(spawns, (s) => {
                    Memory.rooms[r.name].spawns[s.name] = {};
                    Memory.rooms[r.name].spawns[s.name].id = s.id;
                    Memory.rooms[r.name].spawns[s.name].massHealing = false;
                    Memory.rooms[r.name].spawns[s.name].renewRequested = false;

                    surroundingCreeps = 0;
                    for (var i = s.pos.x - 1; i < s.pos.x + 1; i++) {
                        for (var j = s.pos.y - 1; j < s.pos.y + 1; j++) {
                            localCreeps = s.room.lookForAt(LOOK_CREEPS, i, j).length;
                            if (localCreeps.length && localCreep[0].memory.healing) {
                                surroundingCreeps++;
                            }
                        }
                    }
                    if (surroundingCreeps >= 3) {
                        Memory.rooms[r.name].spawns[s.name].massHealing = true;
                    }
                });

                //elapsed = Game.cpu.getUsed() - startCpu;
                //console.log("surroundingCreeps has used " + elapsed + " CPU time");
                //startCpu = Game.cpu.getUsed();

                // base building setup and tracking
                if (Memory.rooms[r.name].mainSpawn == undefined || Memory.rooms[r.name].mainSpawn.id == undefined) {
                    log.log(`setting up ${r.name}`);
                    spawn = spawns[0];
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
                Memory.rooms[r.name].mainSpawn.refilling = false;

                //elapsed = Game.cpu.getUsed() - startCpu;
                //console.log("buildingSetup has used " + elapsed + " CPU time");
                //startCpu = Game.cpu.getUsed();

                if (Memory.rooms[r.name].mainSpawn.id != undefined) {
                    mainSpawn = Game.getObjectById(Memory.rooms[r.name].mainSpawn.id);
                    // find closest storage/container to spawn which is presumably main storage
                    var targets = r.find(FIND_STRUCTURES).filter((structure) => {
                        return structure.structureType == STRUCTURE_STORAGE || (structure.structureType == STRUCTURE_CONTAINER && mainSpawn.pos.inRangeTo(structure, 3));
                    });
                    if (targets.length == 1) {
                        Memory.rooms[r.name].mainStorage = targets[0].id;
                    } else if (targets.length == 2) {
                        _.forEach(targets, (t) => {
                            // if container, set it as main while we empty it and transition to storage, then destroy it
                            if (t.structureType == STRUCTURE_CONTAINER) {
                                if (t.store.getFreeCapacity() == t.store.getCapacity()) {
                                    t.destroy();
                                    return;
                                }
                                Memory.rooms[r.name].mainStorage = t.id;
                                return false;
                            }
                        });
                    }
                }
                
                // setup external sources
                if (Memory.rooms[r.name].neighbouringRooms == undefined) {
                    exits = Game.map.describeExits(r.name);
                    Memory.rooms[r.name].neighbouringRooms = Object.values(exits);
                } else {
                    if (_.every(Memory.rooms[r.name].neighbouringRooms, roomName => { return Memory.rooms[roomName] != null })) {
                        _.forEach(Memory.rooms[r.name].neighbouringRooms, roomName => {
                            _.forEach(Object.keys(Memory.rooms[roomName].sources), s => {
                                if (Memory.rooms[r.name].externalSources.lastIndexOf(s) != -1) {
                                    return
                                }
                                source = Game.getObjectById(s);
                                // console.log(source)
                                if (source != null) {
                                    // console.log(source.pos.findPathTo(Game.getObjectById(Memory.rooms[r.name].mainSpawn.id)))
                                    if (source.pos.findPathTo(Game.getObjectById(Memory.rooms[r.name].mainSpawn.id)).length < 100) {
                                        if(Memory.rooms[r.name].externalSources == undefined) {
                                            Memory.rooms[r.name].externalSources = []
                                        }
                                        if (Memory.rooms[r.name].externalSources.lastIndexOf(source.id) === -1) {
                                            Memory.rooms[r.name].externalSources.push(source.id)
                                        }
                                    }
                                }
                            });
                        });
                    }
                }
                    /*
                    if all neihgbouring rooms are valid
                    for each room
                    for each sources
                    get source
                    if not source return
                    if source . distance to spawn < 100
                    add to external sources
                    */
                
                

                //elapsed = Game.cpu.getUsed() - startCpu;
                //console.log("transitionCheck has used " + elapsed + " CPU time");
                //startCpu = Game.cpu.getUsed();
            }

            //elapsed = Game.cpu.getUsed() - startCpu;
            //console.log("eenergy calc has used " + elapsed + " CPU time");
            //startCpu = Game.cpu.getUsed();

            if (Memory.rooms[r.name] == undefined) {
                Memory.rooms[r.name] = {};
            }
        }

        var sources = r.find(FIND_SOURCES);

        if (Memory.rooms[r.name].sources == undefined) {
            Memory.rooms[r.name].sources = {};
        }

        // Memory.rooms[r.name].sources = {};
        _.forEach(sources, (s, i) => {
            //startCpu = Game.cpu.getUsed();

            // //console.log(i)
            // //console.log(s.id)
            if (Memory.rooms[r.name].sources[s.id] == undefined) {
                console.log("adding new source ", r.name, " ", s.id);
                Memory.rooms[r.name].sources[s.id] = {};
                Memory.rooms[r.name].sources[s.id].id = s.id;
            }

            if (Memory.rooms[r.name].sources[s.id].targettedBy == undefined) {
                Memory.rooms[r.name].sources[s.id].targettedBy = 0;
            }

            // get valid mining spots
            if (Memory.rooms[r.name].totalMiningSpots == undefined) {
                Memory.rooms[r.name].totalMiningSpots = 0;
            }
            if (Memory.rooms[r.name].sources[s.id].miningSpots == undefined) {
                localMiningSpots = 0;
                totalMiningSpots = 0;
                for (var i = s.pos.x - 1; i <= s.pos.x + 1; i++) {
                    for (var j = s.pos.y - 1; j <= s.pos.y + 1; j++) {
                        if (terrain.get(i, j) != TERRAIN_MASK_WALL) {
                            localMiningSpots++;
                        }
                    }
                }
                Memory.rooms[r.name].sources[s.id].miningSpots = localMiningSpots;
                Memory.rooms[r.name].totalMiningSpots += localMiningSpots;
            }

            if (Memory.rooms[r.name].sources[s.id].container == undefined) {
                containers = s.pos.findInRange(FIND_STRUCTURES, 2).filter((r) => r.structureType == STRUCTURE_CONTAINER)
                for (cont of containers) {
                    if (cont.pos.inRangeTo(s, 2)) {
                        console.log("adding new container ", r.name, " ", cont.id);
                        Memory.rooms[r.name].sources[s.id].container = {};
                        Memory.rooms[r.name].sources[s.id].container.id = cont.id;
                        Memory.rooms[r.name].sources[s.id].container.targettedBy = 0;
                        Memory.rooms[r.name].sources[s.id].container.moversNeeded = 2;

                    }
                }
            }

            if (Memory.rooms[r.name].sources[s.id].link == undefined && r.controller.level >= 6 && links.length) {
                for (link of links) {
                    if (link.pos.inRangeTo(s, 2)) {
                        console.log("adding new link ", r.name, " ", link.id);
                        Memory.rooms[r.name].sources[s.id].link = {};
                        Memory.rooms[r.name].sources[s.id].link = link.id;
                    }
                }
            }

            // resetSourceContainerTracking(r.name)

            new RoomVisual(r.name).text(Memory.rooms[r.name].sources[s.id].targettedBy, s.pos.x - 0.17, s.pos.y + 0.2, { align: "left", font: 0.6 });
            

            if (Memory.rooms[r.name].sources[s.id].container != undefined) {
                var cont = Game.getObjectById(Memory.rooms[r.name].sources[s.id].container.id);
                if (cont == null) {
                    Memory.rooms[r.name].sources[s.id].container = undefined;
                } else {
                    new RoomVisual(r.name).text(Memory.rooms[r.name].sources[s.id].container.targettedBy, cont.pos.x - 0.17, cont.pos.y + 0.2, { align: "left", font: 0.6 });
                }
            }
        });

        // links
        try {
            if (myRooms[Game.shard.name].includes(r.name)) {
                if (links.length >= 2 && Memory.rooms[r.name].link_storage == undefined && Memory.rooms[r.name].link_controller == undefined && Memory.rooms[r.name].mainStorage != undefined) {
                    var link_storage = Game.getObjectById(Memory.rooms[r.name].mainStorage).pos.findInRange(links, 2);
                    if (link_storage.length) link_storage = link_storage[0];
                    var link_controller = r.controller.pos.findInRange(links, 3);
                    if (link_controller.length) link_controller = link_controller[0];

                    Memory.rooms[r.name].link_storage = link_storage.id;
                    Memory.rooms[r.name].link_controller = link_controller.id;
                }
            }
        } catch (e) {
            console.log(`link setup failed in ${r.name}: ${e}`);
        }

        //elapsed = Game.cpu.getUsed() - startCpu;
        //console.log("source setup has used " + elapsed + " CPU time");
        //startCpu = Game.cpu.getUsed();
        
        Memory.RoomVisualData[r.name] = Game.rooms[r.name].visual.export();
        
        refreshRoomTrackingNextTick = false;
        nextRoomTrackingRefreshTime += roomTrackingRefreshInterval;
        roomRefreshMap[r.name] = Game.time + roomTrackingRefreshInterval;
        
    });

    
};

resetSourceContainerTracking = function () {
    _.forEach(Game.rooms, (r) => {
        _.forEach(Memory.rooms[r.name].sources, (s) => {
            s.targettedBy = 0;
            if (s.container != undefined) s.container.targettedBy = 0;
        });
    });

    _.forEach(Game.creeps, (c) => {
        // console.log(c.name, c.pos)

        if (c.memory.baseRoomName == undefined) {
            console.log(c.name, c.pos, "no baseRoomName");
        }

        try {
            if (c.memory.role == "harvester") {
                Memory.rooms[c.memory.baseRoomName].sources[c.memory.targetSource].targettedBy += 1;
            } else if (c.memory.role == "harvesterExt") {
                Memory.rooms[c.memory.targetRoomName].sources[c.memory.targetSource].targettedBy += 1;
            } else if (c.memory.role == "harvSup") {
                Memory.rooms[c.memory.baseRoomName].sources[c.memory.targetSource].container.targettedBy += 1;
            } else if (c.memory.role == "moverExt") {
                Memory.rooms[c.memory.targetRoomName].sources[c.memory.targetSource].container.targettedBy += 1;
            }

            if (c.memory.role == "soldier" || c.memory.role == "gunner") {
                // protects against claimers which will have baseRoomNames which dont have defenders
                if (Memory.rooms[c.memory.baseRoomName].defenders.soldier == null) {
                    if (c.memory.role == "soldier") {
                        Memory.rooms[c.memory.baseRoomName].defenders.soldier = c.id;
                    }
                }
                if (Memory.rooms[c.memory.baseRoomName].defenders.gunner == null) {
                    if (c.memory.role == "gunner") {
                        Memory.rooms[c.memory.baseRoomName].defenders.gunner = c.id;
                    }
                }
            }
        } catch (e) {
            console.log("error", c.name, c.pos, c.memory.baseRoomName, e);
        }
    });
};


