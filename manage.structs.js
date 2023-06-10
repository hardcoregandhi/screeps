var roleTower = require("tower");

global.runStructs = function () {
    // console.log(Game.shard.name);
    myRooms[Game.shard.name].forEach((r) => {
        room = Game.rooms[r];

        if (room == null) return;

        // console.log(room);

        // var allStructures = room.find(FIND_STRUCTURES);

        // var stores = [];
        // var pspawns = [];
        // var containers = [];
        // var towers = [];
        // var links = [];
        // var observers = [];

        // for (structure of allStructures) {
        //     switch (structure.structureType) {
        //         case STRUCTURE_STORAGE:
        //             stores.push(structure);
        //             break;
        //         case STRUCTURE_CONTAINER:
        //             containers.push(structure);
        //             break;
        //         case STRUCTURE_SPAWN:
        //             spawns.push(structure);
        //             break;
        //         case STRUCTURE_TOWER:
        //             roleTower.run(structure);
        //             towers.push(structure);
        //             break;
        //         case STRUCTURE_POWER_SPAWN:
        //             pspawns.push(structure);
        //             p.processPower();
        //             break;
        //         case STRUCTURE_LINK:
        //             links.push(structure);
        //             break;
        //         case STRUCTURE_OBSERVER:
        //             observers.push(structure);
        //             break;
        //     }
        // }

        // var towers = room.find(FIND_STRUCTURES).filter((s) => s.structureType == STRUCTURE_TOWER);
        // for (t of Memory.rooms[room.name].towers) {
        //     roleTower.run(Game.getObjectById(t));
        // }

        // Resets
        _.forEach(Memory.rooms[room.name].spawns, (s) => {
            s.massHealing = false;
            s.renewRequested = false;
            s.spawnRequested = false;
            s.creeps = {};
        });
        if (Memory.rooms[room.name].mainSpawn != undefined) Memory.rooms[room.name].mainSpawn.refilling = false;
        if (Memory.rooms[room.name].mainTower != undefined) Memory.rooms[room.name].mainTower.healRequested = false;

        if (Memory.rooms[room.name].link_storage && Memory.rooms[room.name].link_controller) {
            // console.log(`${room.name} has 2 links`)
            var link_storage = Game.getObjectById(Memory.rooms[room.name].link_storage);
            if (link_storage == null) {
                Memory.rooms[room.name].link_storage == undefined;
                Memory.rooms[room.name].link_controller == undefined;
            }

            // if (link_storage && link_storage.store.getUsedCapacity([RESOURCE_ENERGY]) == 800 && creepRoomMap.get(room.name + "eenergy") > 2000) {
            //     var link_controller = Game.getObjectById(Memory.rooms[room.name].link_controller);
            //     if (link_controller == null) {
            //         Memory.rooms[room.name].link_storage == undefined
            //         Memory.rooms[room.name].link_controller == undefined
            //     }
            //     if (link_controller.store.getUsedCapacity([RESOURCE_ENERGY]) == 0) {
            //         // console.log(`Sending energy: ${room.name} Return:` + link_storage.transferEnergy(link_controller, 800));
            //         link_storage.transferEnergy(link_controller, 800);
            //     }
            // }
        }
        // else if(links.length > 2) {

        // }

        if (Memory.rooms[room.name].structs.observer != undefined) {
            // set target rooms and iterator
            if (Memory.rooms[room.name].structs.observer.targetPowerRooms == undefined) {
                targetPowerRooms = [];
                let re = /([NWSE])(\d*)([NWSE])(\d*)/;
                const match = room.name.match(re);
                if (match.length == 5) {
                    //match length is 5, the original word and then the matches
                    let modX = match[2] % 10; // strip to 0-9
                    let roundX = Math.round(modX / 10) * 10; // find it's closest 10
                    let diffX = Math.abs(roundX - modX); // find the dist to the column
                    let modY = match[4] % 10;
                    let roundY = Math.round(modY / 10) * 10;
                    let diffY = Math.abs(roundY - modY); // find the dist to the row
                    console.log(diffX);
                    console.log(diffY);
                    if (diffX > diffY) {
                        // closest to row
                        console.log("closest to row");
                        for (let i = match[2] - modX; i <= match[2] - modX + 10; i++) {
                            targetPowerRooms.push(match[1] + String(i) + match[3] + Math.floor(match[4] / 10) * 10);
                        }
                    } else {
                        // closest to column OR same dist from both
                        console.log("closest to column");
                        console.log(match[4]);
                        for (let i = parseInt(match[4]) - modY; i <= parseInt(match[4]) - modY + 10; i++) {
                            targetPowerRooms.push(match[1] + Math.floor(match[2] / 10) * 10 + match[3] + String(i));
                        }
                    }
                    //   console.log(targetPowerRooms)
                    Memory.rooms[room.name].structs.observer.targetPowerRooms = targetPowerRooms;
                    Memory.rooms[room.name].structs.observer.targetPowerRoom = 0;
                    Memory.rooms[room.name].structs.observer.externalResources = {};
                } else {
                    console.log("Error parsing room name");
                }
            }

            o = Game.getObjectById(Memory.rooms[room.name].structs.observer.id);
            observerTarget = Memory.rooms[room.name].structs.observer.targetPowerRooms[Memory.rooms[room.name].structs.observer.targetPowerRoom];

            if (observerTarget == undefined) {
                Memory.rooms[room.name].structs.observer.targetPowerRoom = 0;
                observerTarget = Memory.rooms[room.name].structs.observer.targetPowerRooms[Memory.rooms[room.name].structs.observer.targetPowerRoom];
            }

            o.observeRoom(observerTarget);
            // the room will be available on the next tick after observeRoom runs
            if (Game.rooms[observerTarget] != undefined) {
                // console.log("no power found, iterating observer");
                if (Memory.rooms[room.name].structs.observer.targetPowerRoom > 10) {
                    Memory.rooms[room.name].structs.observer.targetPowerRoom = 0;
                } else {
                    Memory.rooms[room.name].structs.observer.targetPowerRoom = Memory.rooms[room.name].structs.observer.targetPowerRoom + 1;
                }
            }

            _.forEach(Memory.rooms[room.name].structs.observer.externalResources, (resource) => {
                _.forEach(resource.creepsUntracked, (name) => {
                    // When spawning a new creep, that creep doesn't have a valid id until the next tick, so we handle that here
                    Memory.rooms[room.name].structs.observer.externalResources[d.id].creeps[Game.creeps[name].id] = {};
                    Memory.rooms[room.name].structs.observer.externalResources[d.id].creeps[Game.creeps[name].id] = Game.creeps[name].id;
                    resource.creepsUntracked = resource.creepsUntracked.filter((v) => v !== name);
                });
                _.forEach(resource.creeps, (c) => {
                    if (Game.getObjectById(c) == undefined) {
                        delete resource.creeps[c];
                    }
                });
            });
        }
        
        if (Memory.rooms[room.name].structs.pspawn != undefined) {
            var powerSpawn = Game.getObjectById(Memory.rooms[room.name].structs.pspawn.id);
            if (powerSpawn)
                powerSpawn.processPower();
        }

        // var ramparts = room.find(FIND_STRUCTURES, {
        //     filter: (structure) => {
        //         return structure.structureType == STRUCTURE_RAMPART;
        //     },
        // });
        // for (var r of ramparts) {
        //     r.setPublic(false)
        // }
        


        //This should probably be part of it's own defense code
        if (Memory.rooms[room.name].defence == undefined) {
            Memory.rooms[room.name].defence = {}
        }
        var hostileCreeps = room.find(FIND_HOSTILE_CREEPS).filter((c) => c.body.find((part) => part.type == ATTACK || part.type == RANGED_ATTACK));
        if (!hostileCreeps.length && Memory.rooms[room.name].defence.timerInvasionStarted != undefined) {
            delete Memory.rooms[room.name].defence.timerInvasionStarted;
            return;
        }
        Memory.rooms[room.name].defence.timerInvasionStarted = Game.time
        if (hostileCreeps.length > 2) {
            var {meleeCount, rangedCount} = getAttackPartCounts(room.name)
            requestHealer(Memory.rooms[r.name].parentRoom, r.name);
            if (meleeCount > rangedCount) {
                requestSoldier(Memory.rooms[r.name].parentRoom, r.name);
            } else {
                requestGunner(Memory.rooms[r.name].parentRoom, r.name);
            }
        }
        if (hostileCreeps.length > 2 && (Game.rooms.W22S29.find(FIND_STRUCTURES).filter(s => ["rampart", "constructedWall"].includes(s.structureType) && s.hits > 500).length || room.controller.ticksToDecay < 500)) {
            if (room.controller.my && room.controller.safeModeAvailable) {
                room.controller.activateSafeMode();
                Game.notify(">2 attackers in " + room.name + ". Activated Safe Mode.");
            }
        }
        if (hostileCreeps.length > 1 && room.controller.level <= 3 /* && towers.length == 0*/) {
            if (room.controller != undefined && room.controller.my && room.controller.safeModeAvailable) {
                Game.notify("attacker in " + room.name + ". Activated Safe Mode.");
                room.controller.activateSafeMode();
            }
        }
    });
};
