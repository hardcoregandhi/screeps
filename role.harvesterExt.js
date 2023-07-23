var roleHarvester = require("role.harvester");

global.roleHarvesterExt = {
    name: "harvesterExt",
    roleMemory: { memory: { targetRoomName: "W17S21", targetResourceType: RESOURCE_ENERGY, moverLimit: 1 } },

    // prettier-ignore
    BodyParts: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE],
    baseBodyParts: [CARRY, MOVE, WORK, WORK],
    bodyLoop: [MOVE, WORK, WORK],
    bodyPartsMaxCount: 13,
    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.memory.targetSource == undefined) {
            console.log(creep.name);
            console.log(Memory.rooms[creep.memory.targetRoomName].sources);
            var lowestSource = 99;
            _.forEach(Memory.rooms[creep.memory.targetRoomName].sources, (s) => {
                if (s.targettedBy < lowestSource) {
                    lowestSource = s.targettedBy;
                    creep.memory.targetSource = s.id;
                }
            });
            Memory.rooms[creep.memory.targetRoomName].sources[s.id].targettedBy += 1;
        }

        if (creep.memory.moverLimit == undefined) {
            creep.memory.moverLimit = 1;
        }

        if (creep.memory.scoopSize == undefined || creep.spawning) {
            scoopSize = 0;
            _.forEach(creep.body, (b) => {
                if (b.type == WORK) {
                    scoopSize += 2;
                }
            });
            // console.log(creep.name, scoopSize)
            creep.memory.scoopSize = scoopSize;
        }

        Log(creep, 1);
        if (creep.ticksToLive > 1400) {
            creep.memory.healing = false;
            creep.memory.mining = true;
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            if (creep.store.getUsedCapacity() > 0) {
                var containers = Game.rooms[creep.memory.targetRoomName].find(FIND_STRUCTURES).filter((structure) => {
                    return structure.structureType == STRUCTURE_CONTAINER && creep.pos.inRangeTo(structure.pos, 1);
                });
                if (!containers.length) {
                    for (resourceType in creep.store) {
                        creep.transfer(target, resourceType);
                    }
                }
            }
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (Game.rooms[creep.memory.targetRoomName] == undefined) {
            Log(creep, "target room not currently used");
            Log(creep, creep.memory.targetRoomName);
            if (creep.room.name != creep.memory.targetRoomName) {
                Log(creep, "wrong room");
                const route = Game.map.findRoute(creep.room, creep.memory.targetRoomName);
                if (route.length > 0) {
                    creep.say("Headin oot");
                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.Move(exit);
                } else {
                    creep.say("No route found");
                    Log(creep, "no route to target room");
                }
                return;
            }
        }

        Log(creep, 2);

        EnemyCheckFleeRequestBackup(creep);
        if (creep.memory.fleeing > 0) {
            creep.memory.fleeing -= 1;
            moveToTarget(creep, Game.rooms[Memory.rooms[creep.memory.targetRoomName].parentRoom].controller);
            return;
        }

        Log(creep, creep.memory.noClaimSpawn != undefined && creep.memory.noClaimSpawn == false);

        // TODO a creep should not spawn other creeps
        if (creep.memory.noSpawn == undefined || creep.memory.noSpawn == false) {
            if (creep.memory.targetRoomName != undefined && Game.rooms[creep.memory.targetRoomName] != undefined && creep.room.name == creep.memory.targetRoomName) {
                // if (
                //     Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container != undefined &&
                //     Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].targetCarryParts != undefined &&
                //     Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].targetCarryParts != 0 &&
                //     Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].targetCarryParts < Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].targetCarryParts &&
                //     Memory.rooms[creep.memory.baseRoomName].mainStorage != undefined &&
                //     Game.getObjectById(Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.id).store.getUsedCapacity(RESOURCE_ENERGY) > 1000
                // ) {
                //     spawnCreep(roleMoverExt, null, { memory: { baseRoomName: creep.memory.baseRoomName, targetRoomName: creep.memory.targetRoomName, targetSource: creep.memory.targetSource, targetContainer: creep.memory.targetContainer } }, creep.memory.baseRoomName);
                // }

                if (
                    creep.memory.noClaimSpawn != true &&
                    (Game.rooms[creep.memory.targetRoomName].controller.reservation == undefined || Game.rooms[creep.memory.targetRoomName].controller.reservation.ticksToEnd < 1000) &&
                    (creepRoomMap.get(creep.memory.baseRoomName + "claimerTarget" + creep.memory.targetRoomName) == undefined || creepRoomMap.get(creep.memory.baseRoomName + "claimerTarget" + creep.memory.targetRoomName) < 1) &&
                    Game.rooms[creep.memory.baseRoomName].energyCapacityAvailable >= 500
                ) {
                    //TODO FIX THIS
                    spawnCreep(roleClaimer, "auto", { memory: { targetRoomName: creep.memory.targetRoomName } }, creep.memory.baseRoomName);
                }

                if (creepRoomMap.get(creep.memory.targetRoomName + "csites") != undefined && creepRoomMap.get(creep.memory.targetRoomName + "csites") > 2) {
                    if (creepRoomMap.get(creep.memory.baseRoomName + "builderExtTarget" + creep.memory.targetRoomName) == undefined || creepRoomMap.get(creep.memory.baseRoomName + "builderExtTarget" + creep.memory.targetRoomName) < Math.ceil(creepRoomMap.get(creep.memory.targetRoomName + "csites") / 10) &&
                        Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container != undefined) {
                        spawnCreep(roleBuilderExt, "auto", { memory: { targetRoomName: creep.memory.targetRoomName } }, creep.memory.baseRoomName);
                    }
                }
            }
        }

        if (creep.memory.mining && creep.store.getFreeCapacity() < creep.memory.scoopSize) {
            creep.memory.mining = false;
            creep.say("🔄 dropping");
            Log(creep, "switching to dropping");
            if (creep.memory.targetContainer != null) {
                cont = Game.getObjectById(creep.memory.targetContainer)
                if (cont != null) {
                    if (cont.pos.x == creep.pos.x && cont.pos.y == creep.pos.y && cont.store.getFreeCapacity()) {
                        creep.memory.mining = true;
                        creep.say("drop mining");
                    }
                }
            }
        }
        if (!creep.memory.mining && creep.store.getUsedCapacity() == 0) {
            creep.memory.healing = false;
            creep.memory.mining = true;
            creep.say("⛏️ mining");
            Log(creep, "switching to mining");
        }

        if (creep.memory.fakeBaseRoomName == undefined) {
            creep.memory.fakeBaseRoomName = creep.memory.targetRoomName;
        }
        var targetSource = Game.getObjectById(creep.memory.targetSource);
        if (targetSource == undefined) {
            log.error("source not found");
        }
        Log(creep, targetSource);

        if (creep.memory.mining) {
            Log(creep, "mining");

            pickupNearby(creep);

            Log(creep, targetSource);
            if (trackedHarvest(creep, targetSource) != OK) {
                // console.log(creep.harvest(targetSource))
                creep.Move(targetSource);
            }
            return;
        } else {
            Log(creep, "dropping");

            //Build any nearby container or road
            var container;
            try {
                if (Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container == undefined) {
                    var containersNearToSource = Game.rooms[creep.memory.targetRoomName].find(FIND_STRUCTURES).filter((structure) => {
                        return structure.structureType == STRUCTURE_CONTAINER && Game.getObjectById(creep.memory.targetSource).pos.inRangeTo(structure, 2);
                    });
                    if (containersNearToSource.length) {
                        Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container = {};
                        Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.id = containersNearToSource[0].id;
                        container = containersNearToSource[0];
                    }
                } else {
                    container = Game.getObjectById(Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.id);
                }

                if (container == null) {
                    delete Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container;
                } else {
                    if(creep.memory.targetContainer == null) {
                        creep.memory.targetContainer = container.id;
                        buildRoadsToExtSources(creep.memory.baseRoomName)
                    }
                }
                // createRoadBetweenTargets(container, Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainSpawn.id))
            } catch (e) {
                console.log(`${creep}: ${e}`);
                console.log(`${creep}: ${creep.memory.targetRoomName}`);
                console.log(`${creep}: ${creep.memory.targetSource}`);
            }
            if (container == undefined) {
                // console.log(666)
                var targetSite = null;

                if (creep.memory.containerConstructionSite == undefined) {
                    var csites = Game.rooms[creep.memory.targetRoomName].find(FIND_CONSTRUCTION_SITES, {
                        filter: (site) => {
                            return creep.pos.inRangeTo(site, 3) && site.structureType == STRUCTURE_CONTAINER;
                        },
                    });
                    if (csites.length) {
                        creep.memory.containerConstructionSite = csites[0].id;
                    } else {
                        if (targetSource.pos.inRangeTo(creep.pos, 2)) {
                            creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
                        } else {
                            creep.Move(targetSource.pos);
                        }
                    }

                    Log(creep, "no exts, spawn, or container found");
                    creep.say("makin con");
                }

                targetSite = Game.getObjectById(creep.memory.containerConstructionSite);
                if (targetSite == null) {
                    delete creep.memory.containerConstructionSite;
                    return;
                }
                Log(creep, "building");
                if (creep.build(targetSite) == ERR_NOT_IN_RANGE) {
                    creep.Move(targetSite);
                }
                return;
            } else {
                if (container != null && container.hits < 200000) {
                    Log(creep, `healing ${container}`);
                    if (creep.repair(container) != OK) {
                        creep.Move(container);
                    }
                } else if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.Move(container);
                    Log(creep, `filling ${container}`);
                }
            }
        }
    },
};

module.exports = roleHarvesterExt;
