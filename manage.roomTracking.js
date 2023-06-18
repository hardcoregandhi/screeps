roomTracking = function () {
    Debug = function (roomName, str) {
        if (1 && roomName == "W13N1") {
            console.log(`${roomName}: ${str}`);
        }
    };

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
        Debug(r.name, `Refreshing ${r.name}`);

        const terrain = r.getTerrain();

        if (Memory.rooms[r.name] == undefined) {
            Debug(r.name, `Creating memory for new room`);
            Memory.rooms[r.name] = {};
        }

        var csites = r.find(FIND_CONSTRUCTION_SITES);
        creepRoomMap.set(r.name + "csites", csites.length);
        Debug(r.name, `csites: ${csites.length}`);

        Memory.rooms[r.name].roomVisuals = [];

        if (myRooms[Game.shard.name].includes(r.name)) {
            Debug(r.name, `is in myRooms`);

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

            if (Memory.rooms[r.name].mainSpawn && Memory.rooms[r.name].mainSpawn.id && Game.getObjectById(Memory.rooms[r.name].mainSpawn.id) == null) {
                // room may have been lost
                if (spawns.length == 0 && stores.length == 0 && towers.length == 0 && !r.controller.safeModeAvailable) {
                    console.log(`Room is LOST! Removing ${r.name} from myRooms`);
                    RemoveFromList(Memory.myRooms, r.name);
                    RemoveFromList(myRooms[Game.shard.name], r.name);
                    delete Memory.rooms[r.name];
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
            Debug(r.name, `eenergy: ${creepRoomMap.get(r.name + "eenergy")}`);

            //elapsed = Game.cpu.getUsed() - startCpu;
            //console.log("eenergy calc has used " + elapsed + " CPU time");
            //startCpu = Game.cpu.getUsed();
            if (Memory.rooms[r.name].towers == undefined) {
                Debug(r.name, `defining towers in memory`);
                Memory.rooms[r.name].towers = {};
            }
            _.forEach(towers, (t) => {
                if (Memory.rooms[r.name].mainTower == undefined) {
                    Debug(r.name, `setting mainTower`);

                    Memory.rooms[r.name].mainTower = {};
                    Memory.rooms[r.name].mainTower.id = t.id;
                    Memory.rooms[r.name].mainTower.healRequested = false;
                }
                if (Memory.rooms[r.name].towers[t.id] == undefined) {
                    Debug(r.name, `new tower found`);
                    Memory.rooms[r.name].towers[t.id] = {};
                    Memory.rooms[r.name].towers[t.id].id = t.id;
                    Memory.rooms[r.name].towers[t.id].currentTarget = null;
                }
            });

            // if (Memory.rooms[r.name] != undefined) delete Memory.rooms[r.name].sources;

            // mainStorage
            // find room spawn
            if (spawns.length) {
                Debug(r.name, `refreshing spawns`);

                if (Memory.rooms[r.name].spawns == undefined) {
                    Debug(r.name, `defining spawns{}`);
                    Memory.rooms[r.name].spawns = {};
                }
                _.forEach(spawns, (s) => {
                    if (Memory.rooms[r.name].spawns[s.name] == undefined) {
                        Debug(r.name, `new spawn found`);
                        Memory.rooms[r.name].spawns[s.name] = {};
                        Memory.rooms[r.name].spawns[s.name].id = s.id;
                    }
                    Memory.rooms[r.name].spawns[s.name].massHealing = false;
                    Memory.rooms[r.name].spawns[s.name].renewRequested = false;

                    //TODO remove, this should be done by renew now
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
                    Debug(r.name, `defining mainSpawn`);
                    log.log(`setting up ${r.name}`);
                    spawn = spawns[0];
                    Memory.rooms[r.name].mainSpawn = {};
                    Memory.rooms[r.name].mainSpawn.id = spawn.id;
                    Memory.rooms[r.name].mainSpawn.pos = spawn.pos;
                    Memory.rooms[r.name].currentRoomBuildingLevel = 2; // set to 2 immediately as no builds at 1
                    Memory.rooms[r.name].building = [];
                    for (var i = 1; i <= 8; i++) {
                        Memory.rooms[r.name].building[i] = {};
                        Memory.rooms[r.name].building[i].currentStage = 0;
                        Memory.rooms[r.name].building[i].isComplete = false;
                    }
                }
                Memory.rooms[r.name].mainSpawn.refilling = false; //TODO remove as ist must be done else where due to roomTracking being timed

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
                        Debug(r.name, `setting mainStorage`);
                        Memory.rooms[r.name].mainStorage = targets[0].id;
                    } else if (targets.length == 2) {
                        Debug(r.name, `multiple storage found close to mainSpawn`);
                        _.forEach(targets, (t) => {
                            // if container, set it as main while we empty it and transition to storage, then destroy it
                            if (t.structureType == STRUCTURE_CONTAINER) {
                                if (t.store.getFreeCapacity() == t.store.getCapacity()) {
                                    console.log("destroying old container mainStorage");
                                    t.destroy();
                                    return;
                                }
                                console.log("setting mainStorage to storage");
                                Memory.rooms[r.name].mainStorage = t.id;
                                return false;
                            }
                        });
                    }
                }

                // setup external sources
                if (Memory.rooms[r.name].externalSources == undefined) {
                    Debug(r.name, `defining externalSources`);
                    Memory.rooms[r.name].externalSources = [];
                }
                if (Memory.rooms[r.name].neighbouringRooms == undefined) {
                    Debug(r.name, `defining neighbouringRooms`);
                    console.log(`${r.name} has no neighbouring rooms. setting up now`);
                    exits = Game.map.describeExits(r.name);
                    if (exits == null) {
                        return;
                    }
                    exits = Object.values(exits).filter((e) => {
                        return !myRooms[Game.shard.name].includes(e);
                    });
                    Memory.rooms[r.name].neighbouringRooms = exits;
                } else {
                    Debug(r.name, `${r.name} has neighbouring rooms: ${Memory.rooms[r.name].neighbouringRooms}`);
                    if (
                        _.every(Memory.rooms[r.name].neighbouringRooms, (roomName) => {
                            return Memory.rooms[roomName] != null;
                        })
                    ) {
                        Debug(r.name, `every room valid`);
                        _.forEach(Memory.rooms[r.name].neighbouringRooms, (roomName) => {
                            // Get the neighbours, neighbours
                            if (Memory.rooms[roomName].neighbouringRooms == undefined) {
                                exits = Game.map.describeExits(roomName);
                                Memory.rooms[roomName].neighbouringRooms = Object.values(exits);
                                _.pull(Memory.rooms[roomName].neighbouringRooms, r.name); // Remove r.name so no circular searching
                                console.log(`retrieved ${roomName} neighbouringRooms: ${Memory.rooms[roomName].neighbouringRooms}`);
                            }
                            if (Memory.rooms[roomName].parentRoom == undefined) {
                                Memory.rooms[roomName].parentRoom = r.name;
                            }
                            if (Memory.rooms[roomName].parentRoom != r.name) {
                                return; // skip rooms owned by other rooms
                            }
                            // Add Neighbours sources
                            Debug(r.name, `adding ${roomName} sources`);

                            _.forEach(Object.keys(Memory.rooms[roomName].sources), (s) => {
                                if (Memory.rooms[r.name].externalSources.lastIndexOf(s) != -1) {
                                    return;
                                }
                                source = Game.getObjectById(s);
                                Debug(r.name, `source: ${source}`);

                                // console.log(source)
                                if (source != null) {
                                    // console.log(source.pos.findPathTo(Game.getObjectById(Memory.rooms[r.name].mainSpawn.id)))
                                    if ((Memory.rooms[roomName].reservation && Memory.rooms[roomName].reservation.username != "hardcoregandhi") || myRooms[Game.shard.name].includes(r.name) || Memory.rooms[roomName].parentRoom != r.name) {
                                        return;
                                    } else {
                                        if (PathFinder.search(source.pos, Game.getObjectById(Memory.rooms[r.name].mainSpawn.id).pos).path.length < 100) {
                                            addExternalSource(r.name, source);
                                        }
                                    }
                                }
                            });
                            // console.log(`adding ${roomName} neighbours sources`)

                            // Add Neighbours Neighbours sources
                            _.forEach(Memory.rooms[roomName].neighbouringRooms, (nn) => {
                                // console.log(`${r.name} neighbour ${roomName} neighbour: ${nn}`)

                                if (Memory.rooms[nn] == undefined) {
                                    return;
                                }
                                if (Memory.rooms[nn].sources == undefined) {
                                    return;
                                }
                                if (Memory.rooms[nn].parentRoom == undefined) {
                                    Memory.rooms[nn].parentRoom = r.name;
                                }
                                if (Memory.rooms[nn].parentRoom != r.name) {
                                    return; // skip rooms owned by other rooms
                                }
                                _.forEach(Object.keys(Memory.rooms[nn].sources), (ss) => {
                                    if (Memory.rooms[r.name].externalSources.includes(ss)) {
                                        return;
                                    }
                                    ssource = Game.getObjectById(ss);
                                    if (ssource != null) {
                                        setupSourceTracking(ssource);
                                        if (PathFinder.search(ssource.pos, Game.getObjectById(Memory.rooms[r.name].mainSpawn.id).pos).path.length < 100) {
                                            addExternalSource(r.name, ssource);
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
            minerals = r.find(FIND_MINERALS);
            if (Memory.rooms[r.name].mineral == undefined) {
                Memory.rooms[r.name].mineral = {};
                _.forEach(minerals, (mineral) => {
                    Memory.rooms[r.name].mineral[mineral.id] = {};
                    Memory.rooms[r.name].mineral[mineral.id].id = mineral.id;
                    Memory.rooms[r.name].mineral[mineral.id].extractor = false;
                });
            }
            _.forEach(minerals, (mineral) => {
                // console.log(r)
                if (Memory.rooms[r.name].mineral[mineral.id].extractor == false && mineral.pos.lookFor(LOOK_STRUCTURES).length) {
                    Memory.rooms[r.name].mineral[mineral.id].extractor = true;
                }
                if (Memory.rooms[r.name].mineral[mineral.id].container == undefined) {
                    containers = mineral.pos.findInRange(FIND_STRUCTURES, 2).filter((r) => r.structureType == STRUCTURE_CONTAINER);
                    if (containers.length) {
                        Memory.rooms[r.name].mineral[mineral.id].container = {};
                        Memory.rooms[r.name].mineral[mineral.id].container.id = containers[0].id;
                    }
                }
            });

            if (Memory.rooms[r.name].deposits == undefined) {
                Memory.rooms[r.name].deposits = [];
            }

            if (Memory.rooms[r.name] == undefined) {
                Memory.rooms[r.name] = {};
            }

            if (Memory.rooms[r.name].creeps == undefined) {
                Memory.rooms[r.name].creeps = {};
            }
            if (Memory.rooms[r.name].creeps.handlers == undefined) {
                Memory.rooms[r.name].creeps.handlers = {};
                Memory.rooms[r.name].creeps.handlers.currentTargets = [];
            }

            if (Memory.rooms[r.name].creeps.wanderers == undefined) {
                Memory.rooms[r.name].creeps.wanderers = {};
                Memory.rooms[r.name].creeps.wanderers.nextTargetRoomIndex = 0;
                Memory.rooms[r.name].creeps.wanderers.nextTargetRoomReverse = false;
            }

            // energy tracking
            if (Memory.rooms[r.name].stats == undefined) {
                Memory.rooms[r.name].stats = {};
                Memory.rooms[r.name].stats.energyLevels = {};
                Memory.rooms[r.name].stats.energyLevels.data = [];
                Memory.rooms[r.name].stats.energyLevels.average = 0;
            }
            if (Memory.rooms[r.name].mainStorage != undefined) {
                Memory.rooms[r.name].stats.energyLevels.data.push(Game.getObjectById(Memory.rooms[r.name].mainStorage).store.getUsedCapacity(RESOURCE_ENERGY));
            }
            var energyTotal = 0;
            for (var d of Memory.rooms[r.name].stats.energyLevels.data) {
                energyTotal += d;
            }
            Memory.rooms[r.name].stats.energyLevels.average = Math.round(energyTotal / Memory.rooms[r.name].stats.energyLevels.data.length);

            if (Memory.rooms[r.name].stats.energyLevels.data.length > 5) {
                recentTotal = 0;
                for (var i = Memory.rooms[r.name].stats.energyLevels.data.length - 5; i < Memory.rooms[r.name].stats.energyLevels.data.length; i++) {
                    recentTotal += Memory.rooms[r.name].stats.energyLevels.data[i];
                }
                Memory.rooms[r.name].stats.energyLevels.averageRecent = Math.round(recentTotal / 5);
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
                        Memory.rooms[r.name].sources[s.id].container.handlersNeeded = 2;
                    }
                }
            } else {
                if (Memory.rooms[r.name].sources[s.id].targetCarryParts == undefined) {
                    console.log("Container found without targetCarryParts, calculating now");
                    ret = calcTargetCarryParts(Game.getObjectById(Memory.rooms[r.name].sources[s.id].container.id), Game.getObjectById(Memory.rooms[Memory.rooms[r.name].parentRoom].mainSpawn.id), Memory.rooms[r.name].sources[s.id].container);
                    if (ret != -1) {
                        Memory.rooms[r.name].sources[s.id].targetCarryParts = ret;
                    } else {
                        console.log(`failed to calc targetCarryParts for ${s.id.substr(-3)}, cant continue`);
                    }
                }
            }

            if (myRooms[Game.shard.name].includes(r.name) && Memory.rooms[r.name].sources[s.id].link == undefined && r.controller && r.controller.level >= 6 && links.length) {
                for (link of links) {
                    if (link.pos.inRangeTo(s, 2)) {
                        console.log("adding new link ", r.name, " ", link.id);
                        Memory.rooms[r.name].sources[s.id].link = {};
                        Memory.rooms[r.name].sources[s.id].link = link.id;
                    }
                }
            }

            resetSourceContainerTracking(r.name);

            new RoomVisual(r.name).text(Memory.rooms[r.name].sources[s.id].targettedBy, s.pos.x - 0.17, s.pos.y + 0.2, { align: "left", font: 0.6 });

            if (Memory.rooms[r.name].sources[s.id].container != undefined) {
                var cont = Game.getObjectById(Memory.rooms[r.name].sources[s.id].container.id);
                if (cont == null) {
                    Memory.rooms[r.name].sources[s.id].container = undefined;
                } else {
                    new RoomVisual(r.name).text(Memory.rooms[r.name].sources[s.id].container.targettedBy, cont.pos.x - 0.17, cont.pos.y + 0.2, { align: "left", font: 0.6 });
                }
            }

            if (s.room.controller == undefined || (s.room.controller && s.room.controller.reservation != undefined && s.room.controller.reservation.username != "hardcoregandhi" && s.room.controller.reservation.ticksToEnd > 1000)) {
                console.log(`Memory.rooms[\'${r.name}\'].sources[\'${s.id}\']`);
                _.forEach(Memory.rooms[r.name].sources[s.id].targettedByList, (c) => {
                    console.log(`killing ${c} due to invader core reservation`);
                    Memory.creeps[c].DIE = true;
                });
                if (Memory.rooms[r.name].parentRoom != undefined) {
                    requestGunner(Memory.rooms[r.name].parentRoom, r.name);
                    requestSoldier(Memory.rooms[r.name].parentRoom, r.name);
                } else {
                    console.log(`${r.name} does not have a parentRoom`);
                }
                console.log(`Memory.rooms[\'${r.name}\'].sources[\'${s.id}\'].container`);
                if (Memory.rooms[r.name].sources[s.id].container != undefined) {
                    console.log("hello");
                    _.forEach(Memory.rooms[r.name].sources[s.id].container.targettedByList, (c) => {
                        console.log(`killing ${c} due to invader core reservation`);
                        Memory.creeps[c].DIE = true;
                    });
                }
                return;
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
                for (var p of powerBanks) {
                    if (Memory.rooms[r.name].powerBanks == undefined) {
                        Memory.rooms[r.name].powerBanks = {};
                    }
                    if (Memory.rooms[r.name].powerBanks[p.id] == undefined) {
                        localMiningSpots = 0;
                        for (var i = p.pos.x - 1; i <= p.pos.x + 1; i++) {
                            for (var j = p.pos.y - 1; j <= p.pos.y + 1; j++) {
                                if (terrain.get(i, j) != TERRAIN_MASK_WALL) {
                                    localMiningSpots++;
                                }
                            }
                        }
                        p.miningSpots = localMiningSpots;
                        p.expirationTime = Game.time + p.ticksToDecay;

                        Memory.rooms[r.name].powerBanks[p.id] = p;
                    }
                }
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

        deposits = Memory.rooms[r.name].deposits;
        _.forEach(deposits, (deposit) => {
            if (deposit.expirationTime == undefined || deposit.expirationTime <= Game.time) {
                _.remove(Memory.rooms[r.name].deposits, (d) => {
                    return d.id == deposit.id;
                });
            }
        });

        if (Memory.rooms[r.name].powerBanks == undefined) {
            Memory.rooms[r.name].powerBanks = {};
        }
        powerBanks = Memory.rooms[r.name].powerBanks;
        for (var p of Object.values(Memory.rooms[r.name].powerBanks)) {
            if (p.expirationTime == undefined || p.expirationTime <= Game.time) {
                delete Memory.rooms[r.name].powerBanks[p.id];
            }
        }

        if (r.controller && r.controller.reservation && r.controller.reservation.username != "hardcoregandhi") {
            console.log(`room ${r.name} is enemy controlled`);
            Memory.rooms[r.name].reservation = {};
            Memory.rooms[r.name].reservation.username = r.controller.reservation.username;
            Memory.rooms[r.name].reservation.ticksToEnd = r.controller.reservation.ticksToEnd;
            Memory.rooms[r.name].reservation.expiresAt = Game.time + r.controller.reservation.ticksToEnd;
        } else if (r.controller && r.controller.owner != undefined) {
            Memory.rooms[r.name].reservation = {};
            Memory.rooms[r.name].reservation.username = r.controller.owner.username;
            Memory.rooms[r.name].reservation.ticksToEnd = 999999999;
            Memory.rooms[r.name].reservation.expiresAt = 999999999;
        } else if (r.find(FIND_HOSTILE_STRUCTURES).length) {
            Memory.rooms[r.name].reservation = {};
            Memory.rooms[r.name].reservation.username = SYSTEM_USERNAME;
            Memory.rooms[r.name].reservation.ticksToEnd = 999999999;
            Memory.rooms[r.name].reservation.expiresAt = 999999999;
        }
        if (Memory.rooms[r.name].reservation && Memory.rooms[r.name].reservation.expiresAt < Game.time) {
            delete Memory.rooms[r.name].reservation;
        }

        try {
            // creepReduction(r);
        } catch (e) {
            console.log(`creepReduction() failed: ${e}`);
            for (var b in e) {
                console.log(b);
            }
        }
        
        if(Memory.rooms[r.name].mainStorage != undefined) {
            manStorage = Game.getObjectById(Memory.rooms[r.name].mainStorage)
            if (manStorage != null) {
                if (manStorage.store.getFreeCapacity() == 0) {
                    if (Memory.rooms[r.name].overflowTimer == undefined) {
                        Memory.rooms[r.name].overflowTimer = Game.time
                    } else {
                        if (Game.time >= Memory.rooms[r.name].overflowTimer + 10) {
                            queueSpawnCreep(roleUpgrader, "auto", {memory:{noHeal:true}}, r.name)
                            delete Memory.rooms[r.name].overflowTimer
                        }
                    }
                } else {
                    delete Memory.rooms[r.name].overflowTimer
                }
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
setupSourceTracking = function (source) {
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
};

function addExternalSource(roomName, source) {
    if (Memory.rooms[roomName].externalSources == undefined) {
        Memory.rooms[roomName].externalSources = [];
    }
    if (Memory.rooms[roomName].externalSources.lastIndexOf(source.id) === -1) {
        Debug(r.name, `adding ${source.id} to externalSources`);
        Memory.rooms[roomName].externalSources.push(source.id);
    }
}

resetSourceContainerTracking = function () {
    _.forEach(Game.rooms, (r) => {
        try {
            if (Memory.rooms[r.name].creeps) {
                if (Memory.rooms[r.name].creeps.handlers) {
                    if (Memory.rooms[r.name].creeps.handlers.currentTargets) {
                        Memory.rooms[r.name].creeps.handlers.currentTargets = [];
                    }
                }
            }

            _.forEach(Memory.rooms[r.name].sources, (s) => {
                s.targettedBy = 0;
                s.targettedByList = [];
                s.currentMiningParts = 0;
                s.currentCarryParts = 0;
                if (s.container != undefined) {
                    s.container.targettedBy = 0;
                    s.container.targettedByList = [];
                    s.targetCarryParts = 0;
                }
            });
            _.forEach(Memory.rooms[r.name].powerBanks, (p) => {
                p.targettedBy = 0;
                p.targettedByList = [];
            });
        } catch (e) {
            console.log(`${r.name} Failure in resetSourceContainerTracking: ${e}`);
        }
    });

    _.forEach(Game.creeps, (c) => {
        // console.log(c.name, c.pos)

        if (c.memory.baseRoomName == undefined) {
            console.log(c.name, c.pos, "no baseRoomName");
        }

        if (c.memory.DIE == true) {
            return;
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
            } else if (c.memory.role == "mover") {
                Memory.rooms[c.memory.baseRoomName].sources[c.memory.targetSource].container.targettedBy += 1;
                Memory.rooms[c.memory.baseRoomName].sources[c.memory.targetSource].container.targettedByList.push(c.name);
                creepCarryParts = Game.creeps[c.name].body.reduce((previous, p) => {
                    return p.type == CARRY ? (previous += 1) : previous;
                }, 0);
                Memory.rooms[c.memory.baseRoomName].sources[c.memory.targetSource].currentCarryParts += creepCarryParts;
            } else if (c.memory.role == "harvDepositSup") {
                Memory.rooms[c.memory.baseRoomName].mineral.container.targettedBy += 1;
                Memory.rooms[c.memory.baseRoomName].mineral.container.targettedByList.push(c.name);
            } else if (c.memory.role == "moverExt" || c.memory.role == "moverExtRepair") {
                if (Memory.creeps[c.name].DIE == undefined) {
                    creepCarryParts = Game.creeps[c.name].body.reduce((previous, p) => {
                        return p.type == CARRY ? (previous += 1) : previous;
                    }, 0);
                    Memory.rooms[c.memory.targetRoomName].sources[c.memory.targetSource].container.targettedBy += 1;
                    Memory.rooms[c.memory.targetRoomName].sources[c.memory.targetSource].container.targettedByList.push(c.name);
                    Memory.rooms[c.memory.targetRoomName].sources[c.memory.targetSource].targetCarryParts += creepCarryParts;
                }
            } else if (c.memory.role == "powHarvester") {
                Memory.rooms[c.memory.baseRoomName].powerBanks[c.memory.targetSource].targettedBy += 1;
                Memory.rooms[c.memory.baseRoomName].powerBanks[c.memory.targetSource].targettedByList.push(c.name);
            }

            if (c.memory.role == "soldier" || c.memory.role == "gunner" || c.memory.role == "healerChase") {
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
                if (Memory.rooms[c.memory.baseRoomName].defenders.healer == null) {
                    if (c.memory.role == "healerChase") {
                        Memory.rooms[c.memory.baseRoomName].defenders.healer = c.id;
                    }
                }
            }
        } catch (e) {
            console.log("error", c.name, c.pos, c.memory.baseRoomName, e);
        }
    });
};
