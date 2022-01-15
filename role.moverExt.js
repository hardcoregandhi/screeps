

global.roleMoverExt = {
    name: "moverExt",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [
        WORK,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        ],
    baseBodyParts: [WORK],
    bodyLoop: [MOVE, CARRY],
    bodyPartsMaxCount: 21,

    /** @param {Creep} creep **/
    run: function (creep) {
        Log(creep, "run()");
        if (healRoads(creep) == OK) return;
        var hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS).filter((c) => c.body.find((part) => part.type == ATTACK) || c.body.find((part) => part.type == RANGED_ATTACK));
        if (hostileCreeps.length) {
            creep.memory.fleeing = 20;
            const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
            if (route.length > 0) {
                creep.say("Headin oot");
                const exit = creep.pos.findClosestByRange(route[0].exit);
                moveToTarget(creep, exit, true);
                return;
            }
        }

        if (creep.memory.fleeing > 0) {
            creep.memory.fleeing -= 1;
            moveToTarget(creep, creep.room.controller, true);
            return;
        }

        if (creep.memory.fakeBaseRoomName == undefined) {
            creep.memory.fakeBaseRoomName = creep.memory.baseRoomName;
        }
        if (creep.memory.banking == undefined) {
            creep.memory.banking = false;
            creep.memory.fakeBaseRoomName = creep.memory.targetRoomName;
        }

        if (creep.memory.banking && creep.store.getUsedCapacity() == 0) {
            creep.memory.banking = false;
            creep.memory.fakeBaseRoomName = creep.memory.targetRoomName;
            creep.say("m2harvester");
        }
        if (!creep.memory.banking && creep.store.getFreeCapacity() == 0) {
            creep.memory.banking = true;
            creep.memory.fakeBaseRoomName = creep.memory.baseRoomName;
            creep.say("m2storage");
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (Game.rooms[creep.memory.targetRoomName] == undefined) {
            if (creep.room.name != creep.memory.targetRoomName) {
                Log(creep, "wrong room");
                const route = Game.map.findRoute(creep.room, creep.memory.targetRoomName);
                if (route.length > 0) {
                    creep.say("Headin oot");
                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    moveToMultiRoomTarget(creep, exit);
                } else {
                    creep.say("No route found");
                    Log(creep, "no route to target room");
                }
                return;
            }
        }

        if (creep.memory.targetSource == undefined) {
            console.log(creep.name, creep.pos);
        } else {
            if (creep.memory.noSpawn == undefined || creep.memory.noSpawn == false) {
                if (
                    creepRoomMap.get(creep.memory.targetRoomName + "harvesterExtTarget" + creep.memory.targetSource) == undefined ||
                    (creepRoomMap.get(creep.memory.targetRoomName + "harvesterExtTarget" + creep.memory.targetSource) < 1 && creepRoomMap.get(creep.memory.targetRoomName + "harvesterExtTarget" < 3))
                ) {
                    spawnCreep(roleHarvesterExt, null, { memory: { baseRoomName: creep.memory.baseRoomName, targetRoomName: creep.memory.targetRoomName, targetSource: creep.memory.targetSource, noHeal: true } }, creep.memory.baseRoomName);
                    Log(creep, `spawning Harvester`);
                }
            }
        }

        // if (creep.room.name != creep.memory.fakeBaseRoomName) {
        //     Log(creep, "out of room");
        //     const route = Game.map.findRoute(creep.room, creep.memory.fakeBaseRoomName);
        //     if (route.length > 0) {
        //         creep.say("Headin oot");
        //         const exit = creep.pos.findClosestByRange(route[0].exit);
        //         moveToTarget(creep, exit, true);
        //     } else {
        //         creep.say("No route found");
        //     }
        //     return;
        // }

        Log(creep, "in room");

        if (!creep.memory.banking) {
            Log(creep, "collectin");
            Log(creep, creep.memory.targetSource);

            var containers = Game.rooms[creep.memory.targetRoomName].find(FIND_STRUCTURES).filter((structure) => {
                return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) && structure.pos.inRangeTo(Game.getObjectById(creep.memory.targetSource).pos, 2);
            });
            // console.log(Game.getObjectById(creep.memory.targetSource))

            if (containers.length) {
                creep.memory.targetContainer = containers[0].id;
                Log(creep, "containers found");
                // var nearbySources = Game.rooms[creep.memory.targetRoomName].find(FIND_SOURCES, {
                //     filter: (s) => {
                //         return s.pos.inRangeTo(containers[0], 2)
                //     },
                // })
                // creep.memory.targetSource = nearbySources[0].id

                if (containers[0].store.getUsedCapacity() == 0) {
                    // don't walk all the way to the container and block the harvester returning to the source
                    if (!creep.pos.inRangeTo(containers[0], 3)) {
                        moveToMultiRoomTarget(creep, containers[0]);
                    }
                    return;
                }
                if (creep.withdraw(containers[0], RESOURCE_ENERGY) != OK) {
                    if (!creep.pos.inRangeTo(containers[0], 1)) moveToTarget(creep, containers[0]);
                }
            } else {
                Log(creep, `${creep.name} has no container`);
                targetSource = Game.getObjectById(creep.memory.targetSource);
                if (!creep.pos.inRangeTo(targetSource.pos, 1)) moveToTarget(creep, targetSource.pos);
            }
        } else {
            Log(creep, "banking");

            if (creep.room.name == creep.memory.baseRoomName && creep.room.controller.level == 8 && creep.memory.target_link == undefined) {
                var linkId;
                if (creep.pos.x >= 45 && creep.room.memory.link_right != undefined) {
                    creep.memory.target_link = creep.room.memory.link_right;
                }
                if (creep.pos.x <= 5 && creep.room.memory.link_left != undefined) {
                    creep.memory.target_link = creep.room.memory.link_left;
                }
                if (creep.pos.y >= 45 && creep.room.memory.link_down != undefined) {
                    creep.memory.target_link = creep.room.memory.link_down;
                }
                if (creep.pos.y <= 5 && creep.room.memory.link_up != undefined) {
                    creep.memory.target_link = creep.room.memory.link_up;
                }
            }

            if (creep.memory.target_link != null) {
                link = Game.getObjectById(creep.memory.target_link);
                if (link != undefined) {
                    if (creep.transfer(link, RESOURCE_ENERGY) != OK) {
                        moveToMultiRoomTarget(creep, link);
                    }
                    if (link.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                        link_storage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].link_storage);
                        link.transferEnergy(link_storage, link_storage.store.getFreeCapacity(RESOURCE_ENERGY));
                    }
                    return;
                }
            }

            mainStorage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
            if (mainStorage != undefined) {
                if (creep.transfer(mainStorage, RESOURCE_ENERGY) != OK) {
                    moveToMultiRoomTarget(creep, mainStorage);
                }
                return;
            }

            var storages = Game.rooms[creep.memory.baseRoomName].find(FIND_STRUCTURES).filter((structure) => structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER);
            Log(creep, storages);
            if (storages.length) {
                if (creep.transfer(storages[0], RESOURCE_ENERGY) != OK) {
                    // console.log(1)
                    moveToMultiRoomTarget(creep, storages[0]);
                }
            } else creep.say("no eenergy");
        }
    },
};

module.exports = roleMoverExt;
