roomTracking = function () {
    _.forEach(Game.rooms, (r) => {
        if (Memory.rooms == undefined) {
            Memory.rooms = {};
        }

        if (roomRefreshMap[r.name] == undefined) {
            console.log(r.name + " was added to roomRefreshMap");
            roomRefreshMap[r.name] = Game.time;
        }

        if (roomRefreshMap[r.name] > Game.time) {
            // console.log(`Skipping ${r.name} refresh`)
            return;
        }

        console.log(`Refreshing ${r.name}`);

        const terrain = r.getTerrain();

        if (Memory.rooms[r.name] == undefined) Memory.rooms[r.name] = {};

        var csites = r.find(FIND_CONSTRUCTION_SITES);
        creepRoomMap.set(r.name + "csites", csites.length);
        Memory.rooms[r.name].roomVisuals = [];

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
                if (Memory.rooms[r.name].mainTower == undefined) {
                    Memory.rooms[r.name].mainTower = {};
                    Memory.rooms[r.name].mainTower.id = t.id;
                    Memory.rooms[r.name].mainTower.healRequested = false;
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
                if (Memory.rooms[r.name].externalSources == undefined) {
                    Memory.rooms[r.name].externalSources = [];
                }
                if (Memory.rooms[r.name].neighbouringRooms == undefined) {
                    console.log(`${r.name} has no neighbouring rooms. setting up now`)
                    exits = Game.map.describeExits(r.name);
                    Memory.rooms[r.name].neighbouringRooms = Object.values(exits);
                } else {
                    // console.log(`${r.name} has neighbouring rooms: ${Memory.rooms[r.name].neighbouringRooms}`)
                    if (
                        _.every(Memory.rooms[r.name].neighbouringRooms, (roomName) => {
                            return Memory.rooms[roomName] != null;
                        })
                    ) {
                        // console.log(`every room valid`)
                        _.forEach(Memory.rooms[r.name].neighbouringRooms, (roomName) => {
                            // Get the neighbours, neighbours
                            if (Memory.rooms[roomName].neighbouringRooms == undefined) {
                                exits = Game.map.describeExits(roomName);
                                Memory.rooms[roomName].neighbouringRooms = Object.values(exits);
                                _.pull(Memory.rooms[roomName].neighbouringRooms, r.name); // Remove r.name so no circular searching
                                console.log(`retrieved ${roomName} neighbouringRooms: ${Memory.rooms[roomName].neighbouringRooms}`)
                            }
                            if (Memory.rooms[roomName].parentRoom == undefined) {
                                Memory.rooms[roomName].parentRoom = r.name;
                            }
                            // Add Neighbours sources
                            // console.log(`adding ${roomName} sources`)

                            _.forEach(Object.keys(Memory.rooms[roomName].sources), (s) => {
                                if (Memory.rooms[r.name].externalSources.lastIndexOf(s) != -1) {
                                    return;
                                }
                                source = Game.getObjectById(s);
                                // console.log(`source: ${source}`)

                                // console.log(source)
                                if (source != null) {
                                    // console.log(source.pos.findPathTo(Game.getObjectById(Memory.rooms[r.name].mainSpawn.id)))
                                    if (Memory.rooms[roomName].reservation && Memory.rooms[roomName].reservation.username != 'hardcoregandhi') {
                                        return;
                                    } else {
                                        if (PathFinder.search(source.pos, Game.getObjectById(Memory.rooms[r.name].mainSpawn.id).pos).path.length < 100) {
                                            if (Memory.rooms[r.name].externalSources == undefined) {
                                                Memory.rooms[r.name].externalSources = [];
                                            }
                                            if (Memory.rooms[r.name].externalSources.lastIndexOf(source.id) === -1) {
                                                Memory.rooms[r.name].externalSources.push(source.id);
                                            }
                                        }
                                    }
                                }
                            });
                            // console.log(`adding ${roomName} neighbours sources`)

                            // Add Neighbours Neighbours sources
                            _.forEach(Memory.rooms[roomName].neighbouringRooms, (nn) => {
                                // console.log(`${r.name} neighbour ${roomName} neighbour: ${nn}`)

                                if (Memory.rooms[nn] == undefined) {
                                    return
                                }
                                if (Memory.rooms[nn].sources == undefined) {
                                    return;
                                }
                                _.forEach(Object.keys(Memory.rooms[nn].sources), (ss) => {
                                    if (Memory.rooms[r.name].externalSources.lastIndexOf(ss) != -1) {
                                        return;
                                    }
                                    ssource = Game.getObjectById(ss);
                                    if (ssource != null) {
                                        setupSourceTracking(ssource);
                                        if (PathFinder.search(ssource.pos, Game.getObjectById(Memory.rooms[r.name].mainSpawn.id).pos).path.length < 100) {
                                            if (Memory.rooms[r.name].externalSources == undefined) {
                                                Memory.rooms[r.name].externalSources = [];
                                            }
                                            if (Memory.rooms[r.name].externalSources.lastIndexOf(ssource.id) === -1) {
                                                Memory.rooms[r.name].externalSources.push(ssource.id);
                                            }
                                        }
                                    }
                                });
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
            
            if (Memory.rooms[r.name].mineral == undefined) {
                mineral = r.find(FIND_MINERALS)[0]
                Memory.rooms[r.name].mineral = {};
                Memory.rooms[r.name].mineral.id = mineral.id;
                Memory.rooms[r.name].mineral.extractor = false;
            } else {
                // console.log(r)
                if (Game.getObjectById(Memory.rooms[r.name].mineral.id).pos.lookFor(LOOK_STRUCTURES).length) {
                    Memory.rooms[r.name].mineral.extractor = true;
                }
            }
            
            if (Memory.rooms[r.name].deposits == undefined) {
                Memory.rooms[r.name].deposits = [];
            }

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
            setupSourceTracking(s);

            if (Memory.rooms[r.name].sources[s.id].container == undefined) {
                containers = s.pos.findInRange(FIND_STRUCTURES, 2).filter((r) => r.structureType == STRUCTURE_CONTAINER);
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

            if (s.room.controller.reservation != undefined &&
                s.room.controller.reservation.username == 'Invader' &&
                s.room.controller.reservation.ticksToEnd > 1000
            ) {
                console.log(`Memory.rooms[\'${r.name}\'].sources[\'${s.id}\']`)
                _.forEach(Memory.rooms[r.name].sources[s.id].targettedByList, (c) => {
                    console.log(`killing ${c} due to invader core reservation`)
                    Memory.creeps[c].DIE = true;
                })
                if (Memory.rooms[r.name].parentRoom != undefined) {
                    requestGunner(Memory.rooms[r.name].parentRoom, r.name);
                    requestSoldier(Memory.rooms[r.name].parentRoom, r.name);
                } else {
                    console.log(`${r.name} does not have a parentRoom`)
                }
                console.log(`Memory.rooms[\'${r.name}\'].sources[\'${s.id}\'].container`)
                if (Memory.rooms[r.name].sources[s.id].container != undefined) {
                    console.log("hello")
                    _.forEach(Memory.rooms[r.name].sources[s.id].container.targettedByList, (c) => {
                        console.log(`killing ${c} due to invader core reservation`)
                        Memory.creeps[c].DIE = true;
                    })
                }
                return
            }
            
            
        });

        // links
        try {
            if (myRooms[Game.shard.name].includes(r.name)) {
                if (links.length >= 2 && Memory.rooms[r.name].link_storage == undefined && Memory.rooms[r.name].mainStorage != undefined) {
                    var link_storage = Game.getObjectById(Memory.rooms[r.name].mainStorage).pos.findInRange(links, 2);
                    if (link_storage.length) {
                        link_storage = link_storage[0];
                        Memory.rooms[r.name].link_storage = link_storage.id;
                    }
                }
                if (links.length >= 2 && Memory.rooms[r.name].link_controller == undefined && Memory.rooms[r.name].mainStorage != undefined) {
                    var link_controller = r.controller.pos.findInRange(links, 3);
                    if (link_controller.length) {
                        link_controller = link_controller[0];
                        Memory.rooms[r.name].link_controller = link_controller.id;
                    }
                }
            }
        } catch (e) {
            console.log(`link setup failed in ${r.name}: ${e}`);
        }
        
        if (isHighwayRoom(r.name)) {
            var powerBanks = r.find(FIND_STRUCTURES).filter((structure) => structure.structureType == STRUCTURE_POWER_BANK);
            var deposits = r.find(FIND_DEPOSITS);
            if (powerBanks.length) {
                // TODO: do something with found power bank
                console.log("found power bank in " + powerBanks[0].room.name);
            }
            if (deposits.length) {
                for (var d of deposits) {
                    console.log(`found ${d.depositType} in ${d.room.name}`);
                    if (Memory.rooms[r.name].deposits == undefined) {
                        Memory.rooms[r.name].deposits = {};
                    }
                    if (Memory.rooms[r.name].deposits[d.id] == undefined) {
                        Memory.rooms[r.name].deposits[d.id] = {};
                    }
                    Memory.rooms[r.name].deposits[d.id].expiresAt = Game.time + d.ticksToDecay;
                    Memory.rooms[r.name].deposits[d.id].id = d.id;
                    Memory.rooms[r.name].deposits[d.id].type = d.depositType;
                    Memory.rooms[r.name].deposits[d.id].room = d.room.name;
                    Memory.rooms[r.name].deposits[d.id].lastCooldown = d.lastCooldown;

                    // get valid mining spots
                    // Memory.rooms[r.name].totalMiningSpots = 0;
                    if (Memory.rooms[r.name].deposits[d.id].miningSpots == undefined) {
                        const terrain = r.getTerrain();
                        localMiningSpots = 0;
                        totalMiningSpots = 0;
                        for (var i = d.pos.x - 1; i <= d.pos.x + 1; i++) {
                            for (var j = d.pos.y - 1; j <= d.pos.y + 1; j++) {
                                if (terrain.get(i, j) != TERRAIN_MASK_WALL) {
                                    localMiningSpots++;
                                }
                            }
                        }
                        Memory.rooms[r.name].deposits[d.id].miningSpots = localMiningSpots;
                    }

                    if (Memory.rooms[r.name].deposits[d.id].creeps == undefined) {
                        Memory.rooms[r.name].deposits[d.id].creeps = {};
                        Memory.rooms[r.name].deposits[d.id].creepsUntracked = [];
                    }
                }
            }
        }
        
        if (r.controller && r.controller.reservation) {
            console.log(`room ${r.name} is enemy controlled`)
            Memory.rooms[r.name].reservation = {}
            Memory.rooms[r.name].reservation.username = r.controller.reservation.username;
            Memory.rooms[r.name].reservation.ticksToEnd = r.controller.reservation.ticksToEnd;
            Memory.rooms[r.name].reservation.expiresAt = Game.time + r.controller.reservation.ticksToEnd;
        }
        if (Memory.rooms[r.name].reservation && Memory.rooms[r.name].reservation.expiresAt < Game.time) {
            delete Memory.rooms[r.name].reservation;
        }
        

        try {
            creepReduction(r);
        } catch (e) {
            console.log(`creepReduction() failed: ${e}`);
            for (var b in e) {
                console.log(b);
            }
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

// Setup any missing memory for a source
setupSourceTracking = function(source) {
    const terrain = source.room.getTerrain();
    
    if (Memory.rooms[source.room.name].sources[source.id] == undefined) {
        console.log("adding new source ", r.name, " ", source.id);
        Memory.rooms[source.room.name].sources[source.id] = {};
        Memory.rooms[source.room.name].sources[source.id].id = source.id;
    }

    if (Memory.rooms[source.room.name].sources[source.id].targettedBy == undefined) {
        Memory.rooms[source.room.name].sources[source.id].targettedBy = 0;
    }

    // get valid mining spots
    if (Memory.rooms[source.room.name].totalMiningSpots == undefined) {
        Memory.rooms[source.room.name].totalMiningSpots = 0;
    }
    if (Memory.rooms[source.room.name].sources[source.id].miningSpots == undefined) {
        localMiningSpots = 0;
        totalMiningSpots = 0;
        for (var i = source.pos.x - 1; i <= source.pos.x + 1; i++) {
            for (var j = source.pos.y - 1; j <= source.pos.y + 1; j++) {
                if (terrain.get(i, j) != TERRAIN_MASK_WALL) {
                    localMiningSpots++;
                }
            }
        }
        Memory.rooms[source.room.name].sources[source.id].miningSpots = localMiningSpots;
        Memory.rooms[source.room.name].totalMiningSpots += localMiningSpots;
    }
}

resetSourceContainerTracking = function () {
    _.forEach(Game.rooms, (r) => {
        _.forEach(Memory.rooms[r.name].sources, (s) => {
            s.targettedBy = 0;
            s.targettedByList = [];
            s.currentMiningParts = 0;
            if (s.container != undefined) {
                s.container.targettedBy = 0;
                s.container.targettedByList = [];
                s.container.currentCarryParts = 0;
            }
        });
        if (Memory.rooms[r.name].mineral != undefined &&
            Memory.rooms[r.name].mineral.container != undefined) {
            Memory.rooms[r.name].mineral.container.targettedBy = 0;
            Memory.rooms[r.name].mineral.container.targettedByList = [];
        }
    });

    _.forEach(Game.creeps, (c) => {
        // console.log(c.name, c.pos)

        if (c.memory.baseRoomName == undefined) {
            console.log(c.name, c.pos, "no baseRoomName");
        }

        try {
            if (c.memory.role == "harvester") {
                Memory.rooms[c.memory.baseRoomName].sources[c.memory.targetSource].targettedBy += 1;
                Memory.rooms[c.memory.baseRoomName].sources[c.memory.targetSource].targettedByList.push(c.name);
                creepMiningParts = Game.creeps[c.name].body.reduce((previous, p) => {
                        return p.type == WORK ? (previous += 1) : previous;
                }, 0);
                Memory.rooms[c.memory.baseRoomName].sources[c.memory.targetSource].currentMiningParts += creepMiningParts;
            } else if (c.memory.role == "harvesterExt") {
                if (Memory.creeps[c.name].DIE == undefined) {
                    creepMiningParts = Game.creeps[c.name].body.reduce((previous, p) => {
                        return p.type == WORK ? (previous += 1) : previous;
                    }, 0);
                    Memory.rooms[c.memory.targetRoomName].sources[c.memory.targetSource].targettedBy += 1;
                    Memory.rooms[c.memory.targetRoomName].sources[c.memory.targetSource].targettedByList.push(c.name);
                    Memory.rooms[c.memory.targetRoomName].sources[c.memory.targetSource].currentMiningParts += creepMiningParts;
                }
            } else if (c.memory.role == "harvSup") {
                Memory.rooms[c.memory.baseRoomName].sources[c.memory.targetSource].container.targettedBy += 1;
                Memory.rooms[c.memory.baseRoomName].sources[c.memory.targetSource].container.targettedByList.push(c.name);
                creepCarryParts = Game.creeps[c.name].body.reduce((previous, p) => {
                        return p.type == CARRY ? (previous += 1) : previous;
                    }, 0);
                Memory.rooms[c.memory.baseRoomName].sources[c.memory.targetSource].container.currentCarryParts += creepCarryParts;
            } else if (c.memory.role == "harvDepositSup") {
                Memory.rooms[c.memory.baseRoomName].mineral.container.targettedBy += 1;
                Memory.rooms[c.memory.baseRoomName].mineral.container.targettedByList.push(c.name);
            } else if (c.memory.role == "moverExt" || c.memory.role == "moverExtRepair") {
                if (Memory.creeps[c.name].DIE == undefined) {
                    creepCarryParts = Game.creeps[c.name].body.reduce((previous, p) => {
                        return p.type == CARRY ? (previous += 1) : previous;
                    }, 0);
                    if (c.memory.role == "moverExt") {
                        Memory.rooms[c.memory.targetRoomName].sources[c.memory.targetSource].container.targettedBy += 1;
                        Memory.rooms[c.memory.targetRoomName].sources[c.memory.targetSource].container.targettedByList.push(c.name);
                    }
                    Memory.rooms[c.memory.targetRoomName].sources[c.memory.targetSource].container.currentCarryParts += creepCarryParts;
                }
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
