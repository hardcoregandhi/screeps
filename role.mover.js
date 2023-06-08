/*

calls		time		avg	    	function
652	    	440.7		0.676		roleMover.run
487		    186.2		0.382		Creep.moveTo
500 		95.7		0.191		Creep.move
288 		59.0		0.205		Creep.moveByPath
147 		57.7		0.392		RoomPosition.findClosestByPath
212 		53.2		0.251		RoomPosition.findPathTo
212 		50.0		0.236		Room.findPath
553 		42.9		0.078		Creep.transfer
4733		19.7		0.004		Room.find
3813		11.1		0.003		RoomPosition.isNearTo
3430		9.7 		0.003		RoomPosition.isEqualTo
40	    	4.1 		0.102		Creep.withdraw
87	    	0.6 		0.007		Creep.say
49	    	0.1 		0.003		Game

*/

global.roleMover = {
    name: "mover",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [
        WORK,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        ],
    baseBodyParts: [],
    bodyLoop: [CARRY, CARRY, MOVE],

    /** @param {Creep} creep **/
    run: function (creep) {
        Log(creep, 0);

        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            if (creep.memory.experimentalMovement != undefined) {
                moveToRoom(creep, creep.memory.baseRoomName);
                return;
            }
            Log(creep, 1);
            moveToMultiRoomTarget(creep, creep.memory.baseRoomName);
            return;
        }

        Log(creep, 2);
        pickupNearby(creep);

        // if (creep.room.energyCapacityAvailable - creep.room.energyAvailable < 100 && Memory.rooms[creep.room.name].link_storage == undefined) return;

        // Deposit other resources that may have been picked up during scavenging
        mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);
        if (mainStorage == null) {
            delete Memory.rooms[creep.room.name].mainStorage;
            resetMainStorage(creep.room.name);
        }
        if (creep.memory.transitioning == undefined || creep.memory.transitioning == false) {
            for (const resourceType in creep.store) {
                if (resourceType != RESOURCE_ENERGY) {
                    Log(creep, 3);
                    if (creep.transfer(mainStorage, resourceType) != OK) {
                        // console.log(creep.transfer(storage, resourceType) )
                        creep.moveTo(mainStorage);
                        return;
                    }
                }
            }
        }

        // we still must check for storage incase the storage is new and mainStorage still == a container
        // that way we can transition between the two structures
        //but we must do that outside of the moving/!moving loop

        mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);
        storage = [];
        if (mainStorage.structureType == STRUCTURE_CONTAINER) {
            var storage = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                return structure.structureType == STRUCTURE_STORAGE && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            });
        }

        Log(creep, 4);
        if (creep.memory.moving == undefined) creep.memory.moving = true;
        if (creep.memory.moving && creep.store.getUsedCapacity() == 0) {
            Log(creep, "setting moving false");
            creep.memory.moving = false;
            creep.memory.currentTarget = null;
            creep.say("🔄 harvest");
        }
        if (!creep.memory.moving && creep.store.getFreeCapacity() == 0) {
            Log(creep, "setting moving true");
            creep.memory.moving = true;
            creep.say("dropping");
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            if (upgradeCreep(creep.name) == 0) {
                return;
            }
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        Log(creep, 5);

        if (!creep.memory.moving) {
            Log(creep, "retrieving");
            if (mainStorage == undefined) {
                Log(creep, "mainStorage could not be found");
            } else {
                if (storage.length && mainStorage && storage[0].id != mainStorage.id) {
                    // transitioning
                    Log(creep, "transitioning");
                    creep.memory.transitioning = true;
                    if (mainStorage.store.getUsedCapacity() == 0) {
                        roomRefreshMap[creep.room.name] = Game.time -1
                    }
                    for (const resourceType in mainStorage.store) {
                        if (creep.withdraw(mainStorage, resourceType) != OK) {
                            Log(creep, creep.withdraw(mainStorage, resourceType));
                            creep.moveTo(mainStorage);
                        }
                        return;
                    }
                }
                if (mainStorage.structureType == STRUCTURE_STORAGE) {
                    creep.memory.transitioning = false;
                }
                Log(creep, "using mainStorage");
                if (mainStorage.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                    // no energy, but can still store what is already withdrawn
                    creep.memory.moving = true;
                }
                if (creep.withdraw(mainStorage, RESOURCE_ENERGY) != OK) {
                    // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                    creep.moveTo(mainStorage, {
                        visualizePathStyle: { stroke: "#ffaa00" },
                        maxRooms: 0,
                    });
                }
            }
            return;
        } else {
            Log(creep, "moving");

            // console.log(closestHostile)
            if (creep.room.memory.mainTower != undefined && creep.room.memory.mainTower.enemyInRoom == true) {
                var towers = creep.pos.findClosestByRange(FIND_STRUCTURES).filter((structure) => {
                    return structure.structureType == STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 200 && !Memory.rooms[creep.memory.baseRoomName].creeps.movers.currentTargets.includes(structure.id);
                });
                Log(creep, 6);
                Memory.rooms[creep.memory.baseRoomName].creeps.movers.currentTargets.push(towers[0].id)
                if (creep.transfer(towers[0], RESOURCE_ENERGY) != OK) {
                    creep.moveTo(towers[0]);
                }
                if (towers.length)
                    return;
            }

            // transition from container to storage
            if (storage.length && mainStorage && mainStorage.structureType == STRUCTURE_CONTAINER) {
                Log(creep, storage[0]);
                for (const resourceType in creep.store) {
                    if (creep.transfer(storage[0], resourceType) != OK) {
                        Log(creep, creep.transfer(storage[0], resourceType));
                        Log(creep, "dropping in storage");
                        creep.moveTo(storage[0]);
                    }
                    return;
                }
            }

            // repair if mainStorage is container
            if (mainStorage.structureType == STRUCTURE_CONTAINER) {
                if (mainStorage.hits < mainStorage.hitsMax / 2) {
                    if (creep.repair(mainStorage) == OK) {
                        return;
                    }
                }
            }

            if (creep.memory.currentTarget != null) {
                currentTarget = Game.getObjectById(creep.memory.currentTarget);
                if (currentTarget == null || currentTarget.store.getFreeCapacity(RESOURCE_ENERGY) == 0 ) {
                    creep.memory.currentTarget = null;
                } else {
                    Memory.rooms[creep.memory.baseRoomName].creeps.movers.currentTargets.push(creep.memory.currentTarget)
                    if (currentTarget.structureType == STRUCTURE_SPAWN && Memory.rooms[creep.room.name].mainSpawn.refilling != false && Memory.rooms[creep.room.name].mainSpawn.refilling != creep.name) { // should be removed if room.creeps.movers.currentTargets works
                        creep.memory.currentTarget = null;
                    } else {
                        for (const resourceType in creep.store) {
                            Log(creep, "transferring to currentTarget");
                            if (creep.transfer(currentTarget, resourceType) != OK) {
                                creep.moveTo(currentTarget);
                            }
                            return;
                        }
                    }
                }
            }

            var targets = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                return (
                    ((structure.structureType == STRUCTURE_TOWER && Math.round((structure.store[RESOURCE_ENERGY] / structure.store.getCapacity([RESOURCE_ENERGY])) * 100) < 70) ||
                        structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                    !Memory.rooms[creep.memory.baseRoomName].creeps.movers.currentTargets.includes(structure.id)
                );
            });
            Log(creep, targets);
            // creep.say('m2extTower');

            if (Memory.rooms[creep.room.name].mainSpawn.refilling) {
                mainSpawn = Game.getObjectById(Memory.rooms[creep.room.name].mainSpawn.id);
                targets = targets.filter((item) => item !== mainSpawn);
            }

            if (!targets.length) {
                // creep.say('m2Tower');
                targets = creep.room.find(FIND_STRUCTURES).filter((structure) => {
                    return structure.structureType == STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && !Memory.rooms[creep.memory.baseRoomName].creeps.movers.currentTargets.includes(structure.id);
                });
            }

            // add a send link if it is available to the target array
            try {
                if (creep.room.memory.link_storage != undefined && creepRoomMap.get(creep.room.name + "moverLink") == 0) {
                    Log(creep, 7);
                    Log(creep, Memory.rooms[creep.room.name]);
                    Log(creep, Memory.rooms[creep.room.name].link_storage);
                    var link_storage = Game.getObjectById(Memory.rooms[creep.room.name].link_storage);
                    if (link_storage != undefined && link_storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                        Log(creep, "pushing link_storage");
                        Log(creep, targets.length);
                        Log(creep, link_storage);
                        targets.push(link_storage);
                        Log(creep, targets.length);
                    }
                }
            } catch (e) {
                console.log(`${creep}: ${e}`);
            }

            if (!targets.length) {
                if (mainStorage.store.getUsedCapacity(RESOURCE_ENERGY) > 950000 && creep.room.controller.level == 8) {
                    var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
                    if (creep.transfer(terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        Log(creep, "moving to terminal");
                        creep.moveTo(terminal);
                        return;
                    }
                }
                // No targets found, return to the storage

                creep.say("no targets");
                try {
                    Log(creep, 8);
                    if (creep.store.getFreeCapacity()) {
                        creep.memory.moving = false;
                    } else {
                        creep.moveTo(mainStorage.pos.x - 7, mainStorage.pos.y);
                    }
                } catch (e) {
                    console.log(`${creep}: ${e}`);
                }
                return;
            }
            if (targets.length == 0) {
                if (creep.store.getFreeCapacity()) {
                    creep.memory.moving = false;
                } else {
                    creep.moveTo(mainStorage.pos.x - 7, mainStorage.pos.y);
                }
                // creep.moveTo(mainStorage);
                return;
            }
            target = creep.pos.findClosestByPath(targets);
            if (target == null) {
                //no path found
                creep.moveTo(mainStorage);
                return;
            }

            creep.memory.currentTarget = target.id;
            if (target.structureType == STRUCTURE_SPAWN) Memory.rooms[creep.room.name].mainSpawn.refilling = creep.name;

            for (const resourceType in creep.store) {
                Log(creep, 9);
                if (creep.transfer(target, resourceType) != OK) {
                    creep.moveTo(target);
                }
                return;
            }
        }
    },
};

module.exports = roleMover;
