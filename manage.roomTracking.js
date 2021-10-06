roomTracking = function () {
    _.forEach(Game.rooms, (r) => {
        if (Memory.rooms == undefined) {
            Memory.rooms = {};
        }
        const terrain = r.getTerrain();

        if (Memory.rooms[r.name] == undefined) Memory.rooms[r.name] = {};

        if (myRooms.includes(r.name)) {
            //console.log(`room ${r}`);
            stores = [];
            spawns = [];
            pspawns = [];
            containers = [];
            towers = [];
            links = [];
            observers = [];

            //startCpu = Game.cpu.getUsed();

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
                        break;
                    case STRUCTURE_LINK:
                        links.push(structure);
                        break;
                    case STRUCTURE_OBSERVER:
                        observers.push(structure);
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

            Memory.rooms[r.name].towers = towers.map((t) => t.id);

            // if (Memory.rooms[r.name] != undefined) delete Memory.rooms[r.name].sources;

            // mainStorage
            // find room spawn
            if (spawns.length) {
                Memory.rooms[r.name].spawns = {};
                _.forEach(spawns, (s) => {
                    Memory.rooms[r.name].spawns[s.name] = {};
                    Memory.rooms[r.name].spawns[s.name].massHealing = false;

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
            // Memory.rooms[r.name].totalMiningSpots = 0;
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
                for (cont of containers) {
                    if (cont.pos.inRangeTo(s, 2)) {
                        console.log("adding new container ", r.name, " ", cont.id);
                        Memory.rooms[r.name].sources[s.id].container = {};
                        Memory.rooms[r.name].sources[s.id].container.id = cont.id;
                        Memory.rooms[r.name].sources[s.id].container.targettedBy = 0;
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

            new RoomVisual().text(Memory.rooms[r.name].sources[s.id].targettedBy, s.pos.x - 0.17, s.pos.y + 0.2, { align: "left", font: 0.6 });

            if (Memory.rooms[r.name].sources[s.id].container != undefined) {
                var cont = Game.getObjectById(Memory.rooms[r.name].sources[s.id].container.id);
                if (cont == null) {
                    Memory.rooms[r.name].sources[s.id].container = undefined;
                } else {
                    new RoomVisual().text(Memory.rooms[r.name].sources[s.id].container.targettedBy, cont.pos.x - 0.17, cont.pos.y + 0.2, { align: "left", font: 0.6 });
                }
            }
        });

        // links
        try {
            if (myRooms.includes(r.name)) {
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
        new RoomVisual().text(`${r.name} L:${r.controller.level}, ${Math.round(r.controller.progress / 1000)}K/${r.controller.progressTotal / 1000}K`, 1, listOffset + inc(), { align: "left", font: fontSize });
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
