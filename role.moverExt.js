function findReplacementTarget(creep) {
    Log(creep, "findReplacementTarget");

    ret = false;
    creep.memory.targetContainer = null;
    creep.memory.targetRoomName = null;
    creep.memory.targetSource = null;
    //copied from spawnMoverExt
    _.forEach(Memory.rooms[creep.memory.baseRoomName].externalSources, (sourceId) => {
        // console.log(sourceId)
        source = Game.getObjectById(sourceId);
        if (source == undefined || source == null) {
            return;
        }
        // console.log(roomName + "harvesterExtTarget" + source.id)

        if (Memory.rooms[source.room.name].sources[source.id].container == undefined) {
            return;
        }

        container = Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id);
        if (container == undefined) {
            return;
        }

        if (Memory.rooms[source.room.name].sources[source.id].targetCarryParts == 0 || Memory.rooms[source.room.name].sources[source.id].currentCarryParts == 0 && Memory.rooms[source.room.name].sources[source.id].container.targettedBy > 0) {
            console.log(`corrupt currentCarryParts/targettedByList found for ${source.id}`);
            totalCarryParts = 0;
            _.forEach(Memory.rooms[source.room.name].sources[source.id].container.targettedByList, (creepName) => {
                creepCarryParts = Game.creeps[creepName].body.reduce((previous, p) => {
                    return p.type == CARRY ? (previous += 1) : previous;
                }, 0);
                totalCarryParts += creepCarryParts;
            });
            Memory.rooms[source.room.name].sources[source.id].currentCarryParts = totalCarryParts;
        }

        if (Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id) == null) {
            delete Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container);
            return;
        }

        if (
            Memory.rooms[source.room.name].sources[source.id].targetCarryParts != undefined &&
            Memory.rooms[source.room.name].sources[source.id].currentCarryParts < Memory.rooms[source.room.name].sources[source.id].targetCarryParts &&
            Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id).store.getUsedCapacity() > 1000
        ) {
            console.log(
                `setting ${creep.name} to s: ${source.id.substr(-3)} r: ${source.room.name} curParts: ${Memory.rooms[source.room.name].sources[source.id].targetCarryParts} tarBy: ${
                    Memory.rooms[source.room.name].sources[source.id].targetCarryParts
                }`
            );

            Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.targettedByList.splice(creep.name);
            Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.targettedBy = Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.targettedBy - 1;
            var carryCount = creep.body.reduce((previous, p) => {
                return p.type == CARRY ? (previous += 1) : previous;
            }, 0);
            Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].currentCarryParts = Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].currentCarryParts - carryCount;

            creep.memory.targetRoomName = source.room.name;
            creep.memory.targetSource = source.id;
            creep.memory.targetContainer = container.id;

            Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.targettedByList.push(creep.name);
            Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.targettedBy = Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.targettedBy + 1;
            var carryCount = creep.body.reduce((previous, p) => {
                return p.type == CARRY ? (previous += 1) : previous;
            }, 0);
            Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].currentCarryParts = Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].currentCarryParts + carryCount;
            ret = true;
            return false; //early escape
        }
    });

    if (creep.memory.targetContainer == null && creep.memory.targetRoomName == null && creep.memory.targetSource == null) {
        console.log(`${creep.name}@${creep.pos} could not find a valid target. Retiring.`);
        creep.memory.DIE = true;
    }

    return ret;
}

global.roleMoverExt = {
    name: "moverExt",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [ // 2:1 carry:move with 1/1 movement on roads
        CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        ],
    baseBodyParts: [WORK, MOVE, MOVE, MOVE, CARRY, CARRY],
    bodyLoop: [MOVE, CARRY, CARRY],
    bodyPartsMaxCount: 21,

    /** @param {Creep} creep **/
    run: function (creep) {
        Log(creep, "roleMoverExt");
        creep.memory.noHeal = true;

        if (creep.isSpawning) {
            if (Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.targettedByList.lastIndexOf(creep.name) === -1) {
                Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.targettedByList.push(creep.name);
            }
        }

        Log(creep, "run()");
        if (healRoads(creep) == OK) return;

        EnemyCheckFleeRequestBackup(creep);

        if (creep.memory.fleeing > 0) {
            creep.memory.fleeing -= 1;
            creep.Move(Game.rooms[creep.memory.baseRoomName].controller);
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
            Log(creep, "setting banking false");
            creep.memory.banking = false;
            if (creep.ticksToLive < Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.distanceToSpawn * 2) {
                console.log(`${creep.name} is too old for another loop. Retiring.`);
                creep.memory.DIE = true;
                return;
            }
            creep.memory.fakeBaseRoomName = creep.memory.targetRoomName;
            creep.say("m2harvester");
        }
        if (!creep.memory.banking && creep.store.getFreeCapacity() == 0) {
            Log(creep, "setting banking true");
            creep.memory.banking = true;
            creep.memory.fakeBaseRoomName = creep.memory.baseRoomName;
            creep.say("m2storage");
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (creep.memory.targetContainer == null && creep.memory.targetRoomName == null && creep.memory.targetSource == null) {
            creep.memory.DIE = true;
        }

        if (Game.rooms[creep.memory.targetRoomName] == undefined) {
            if (creep.room.name != creep.memory.targetRoomName) {
                Log(creep, "wrong room");
                const route = Game.map.findRoute(creep.room, creep.memory.targetRoomName);
                if (route.length > 0) {
                    creep.say("Headin oot");
                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.Move(exit);
                } else {
                    creep.say("No route found");
                    Log(creep, "no route to target room ", creep.memory.targetRoomName);
                }
                return;
            }
        }

        if (creep.memory.targetSource == undefined) {
            console.log(creep.name, creep.pos);
        } else {
            // if (creep.memory.noSpawn == undefined || creep.memory.noSpawn == false) {
            //     if (
            //         creepRoomMap.get(creep.memory.baseRoomName + "harvesterExtTarget" + creep.memory.targetSource) == undefined ||
            //         (creepRoomMap.get(creep.memory.baseRoomName + "harvesterExtTarget" + creep.memory.targetSource) < 1 && creepRoomMap.get(creep.memory.targetRoomName + "harvesterExtTarget" < 3))
            //     ) {
            //         spawnCreep(roleHarvesterExt, null, { memory: { baseRoomName: creep.memory.baseRoomName, targetRoomName: creep.memory.targetRoomName, targetSource: creep.memory.targetSource, noHeal: true } }, creep.memory.baseRoomName);
            //         Log(creep, `spawning Harvester`);
            //     }
            // }
        }

        // if (creep.room.name != creep.memory.fakeBaseRoomName) {
        //     Log(creep, "out of room");
        //     const route = Game.map.findRoute(creep.room, creep.memory.fakeBaseRoomName);
        //     if (route.length > 0) {
        //         creep.say("Headin oot");
        //         const exit = creep.pos.findClosestByRange(route[0].exit);
        //         moveToTarget(creep, exit);
        //     } else {
        //         creep.say("No route found");
        //     }
        //     return;
        // }

        Log(creep, "in room");

        if (!creep.memory.banking) {
            Log(creep, "collectin");
            Log(creep, creep.memory.targetSource);

            // var containers = Game.rooms[creep.memory.targetRoomName].find(FIND_STRUCTURES).filter((structure) => {
            //     return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) && structure.pos.inRangeTo(Game.getObjectById(creep.memory.targetSource).pos, 2);
            // });
            // console.log(Game.getObjectById(creep.memory.targetSource))

            if (creep.memory.targetContainer) {
                targetContainer = Game.getObjectById(creep.memory.targetContainer);
                if (targetContainer == null) {
                    console.log(`${creep.name} targetRoom:${creep.memory.targetRoomName} targetSource:${creep.memory.targetSource} targetContainer:${creep.memory.targetContainer} container is null`);
                    try {
                        if (
                            Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container != undefined &&
                            Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.id != undefined &&
                            Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.id != creep.memory.targetContainer
                        ) {
                            console.log(`new container found`);
                            creep.memory.targetContainer = Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.id;
                            targetContainer = Game.getObjectById(creep.memory.targetContainer);
                        } else if (Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.id != creep.memory.targetContainer) {
                            console.log(`container was changed`);
                            creep.memory.targetContainer = Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.id;
                            findReplacementTarget(creep);

                            return;
                        } else if (Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container == undefined) {
                            throw "no container";
                        } else {
                            console.log(`moverExt has an unknown error`);
                        }
                    } catch (e) {
                        console.log(`container is dead`);
                        // creep.memory.targetContainer = null;
                        // creep.memory.targetRoomName = null;
                        // creep.memory.targetSource = null;
                        findReplacementTarget(creep);
                        return;
                    }
                }
                Log(creep, "containers found");
                // var nearbySources = Game.rooms[creep.memory.targetRoomName].find(FIND_SOURCES, {
                //     filter: (s) => {
                //         return s.pos.inRangeTo(containers[0], 2)
                //     },
                // })
                // creep.memory.targetSource = nearbySources[0].id

                if (targetContainer.store.getUsedCapacity() == 0) {
                    // don't walk all the way to the container and block the harvester returning to the source
                    if (creep.memory.prevPos != undefined && creep.memory.prevPos.time + 100 < Game.time) {
                        findReplacementTarget(creep);
                    }
                    if (!creep.pos.inRangeTo(targetContainer, 3)) {
                        creep.Move(targetContainer);
                    }

                    return;
                }
                if (creep.withdraw(targetContainer, RESOURCE_ENERGY) != OK) {
                    if (!creep.pos.inRangeTo(targetContainer, 1)) creep.Move(targetContainer);
                }
            } else {
                if (Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container != undefined) {
                    creep.memory.targetContainer = Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.id;
                } else {
                    Log(creep, `${creep.name} has no container`);
                    console.log(`${creep.name} has no container, killing.`);
                    // creep.memory.DIE = true;
                    targetSource = Game.getObjectById(creep.memory.targetSource);
                    if (!creep.pos.inRangeTo(targetSource.pos, 1)) creep.Move(targetSource.pos);
                }
            }
        } else {
            Log(creep, "banking");

            if (creep.room.name == creep.memory.baseRoomName && creep.room.controller.level >= 5 && creep.memory.target_link == undefined) {
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
                        creep.Move(link);
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
                if (mainStorage.store.getFreeCapacity() != 0) {
                    ret = trackedTransferToStorage(creep, mainStorage);
                    if (ret != OK) {
                        TransferAll(creep, mainStorage);
                    }
                } else {
                    roleHandler.run(creep);
                    return;
                }
                return;
            }

            var storages = Game.rooms[creep.memory.baseRoomName].find(FIND_STRUCTURES).filter((structure) => structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER);
            Log(creep, storages);
            if (storages.length) {
                if (creep.transfer(storages[0], RESOURCE_ENERGY) != OK) {
                    // console.log(1)
                    creep.Move(storages[0]);
                }
            } else creep.say("no eenergy");
        }
    },
};

module.exports = roleMoverExt;
