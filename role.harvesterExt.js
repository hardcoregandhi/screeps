var roleHarvester = require("role.harvester");

global.roleHarvesterExt = {
    name: "harvesterExt",
    roleMemory: { memory: { targetRoomName: "W17S21", targetResourceType: RESOURCE_ENERGY, moverLimit: 1 } },

    // prettier-ignore
    BodyParts: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE],
    baseBodyParts: [],
    bodyLoop: [WORK, WORK, CARRY, MOVE, MOVE],

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
                    moveToMultiRoomTarget(creep, exit);
                } else {
                    creep.say("No route found");
                    Log(creep, "no route to target room");
                }
                return;
            }
        }

        var csites = Game.rooms[creep.memory.targetRoomName].find(FIND_CONSTRUCTION_SITES, {
            filter: (site) => {
                return creep.pos.inRangeTo(site, 3); //; && site.structureType == STRUCTURE_CONTAINER;
            },
        });
        var containersNearToSource = Game.rooms[creep.memory.targetRoomName].find(FIND_STRUCTURES).filter((structure) => {
            return structure.structureType == STRUCTURE_CONTAINER && Game.getObjectById(creep.memory.targetSource).pos.inRangeTo(structure, 2);
        });
        Log(creep, 2);

        var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        var closestStructure = creep.room.find(FIND_HOSTILE_STRUCTURES).filter((structure) => {
            return structure.structureType == STRUCTURE_INVADER_CORE;
        });

        var hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS).filter((c) => {
            return c.body.find((part) => part.type == ATTACK) || c.body.find((part) => part.type == RANGED_ATTACK);
        });
        rangedCount = 0;
        meleeCount = 0;
        if (hostileCreeps.length) {
            console.log(hostileCreeps);
            _.forEach(hostileCreeps, (c) => {
                _.forEach(c.body, (part) => {
                    switch (part.type) {
                        case ATTACK:
                            meleeCount++;
                            break;
                        case RANGED_ATTACK:
                            rangedCount++;
                            break;
                    }
                });
            });
        }

        if (hostileCreeps.length || closestStructure.length) {
            try {
                if (meleeCount > rangedCount || creepRoomMap.get(creep.memory.targetRoomName + "soldierTarget") == undefined || creepRoomMap.get(creep.memory.targetRoomName + "soldierTarget") < 1) {
                    requestSoldier(creep.memory.baseRoomName, creep.memory.targetRoomName);
                } else if (meleeCount < rangedCount || creepRoomMap.get(creep.memory.targetRoomName + "gunnerTarget") == undefined || creepRoomMap.get(creep.memory.targetRoomName + "gunnerTarget") < 1) {
                    requestGunner(creep.memory.baseRoomName, creep.memory.targetRoomName);
                }
            } catch (e) {
                console.log(`${creep}: ${e}`);
            }
            if (closestStructure.length) return;
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

        Log(creep, creep.memory.noClaimSpawn != undefined && creep.memory.noClaimSpawn == false);

        // TODO a creep should not spawn other creeps
        if (creep.memory.noSpawn == undefined || creep.memory.noSpawn == false) {
            if (creep.memory.targetRoomName != undefined && Game.rooms[creep.memory.targetRoomName] != undefined && creep.room.name == creep.memory.targetRoomName) {
                if (
                    Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container != undefined &&
                    Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.targetCarryParts != undefined &&
                    Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.targetCarryParts != 0 &&
                    Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.currentCarryParts < Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.targetCarryParts &&
                    Memory.rooms[creep.memory.baseRoomName].mainStorage != undefined
                ) {
                    spawnCreep(roleMoverExt, null, { memory: { baseRoomName: creep.memory.baseRoomName, targetRoomName: creep.memory.targetRoomName, targetSource: creep.memory.targetSource } }, creep.memory.baseRoomName);
                }

                if (
                    creep.memory.noClaimSpawn != true &&
                    (Game.rooms[creep.memory.targetRoomName].controller.reservation == undefined || Game.rooms[creep.memory.targetRoomName].controller.reservation.ticksToEnd < 1000) &&
                    (creepRoomMap.get(creep.memory.baseRoomName + "claimerTarget" + creep.memory.targetRoomName) == undefined || creepRoomMap.get(creep.memory.baseRoomName + "claimerTarget" + creep.memory.targetRoomName) < 1) &&
                    Game.rooms[creep.memory.baseRoomName].energyCapacityAvailable >= 1250
                ) {
                    //TODO FIX THIS
                    spawnCreep(roleClaimer, "auto", { memory: { targetRoomName: creep.memory.targetRoomName } }, creep.memory.baseRoomName);
                }
            }
        }

        if (creep.memory.mining && creep.store.getFreeCapacity() == 0) {
            creep.memory.mining = false;
            creep.say("🔄 dropping");
            Log(creep, "switching to dropping");
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
            if (creep.harvest(targetSource) != OK) {
                // console.log(creep.harvest(targetSource))
                moveToMultiRoomTarget(creep, targetSource);
            }
            return;
        } else {
            Log(creep, "dropping");

            //Build any nearby container or road
            if (csites.length) {
                Log(creep, "building");
                if (creep.build(csites[0]) == ERR_NOT_IN_RANGE) {
                    moveToMultiRoomTarget(creep, csites[0]);
                }
                return;
            }
            try {
                if (Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container == undefined) {
                    var containersNearToSource = Game.rooms[creep.memory.targetRoomName].find(FIND_STRUCTURES).filter((structure) => {
                        return structure.structureType == STRUCTURE_CONTAINER && Game.getObjectById(creep.memory.targetSource).pos.inRangeTo(structure, 2);
                    });
                    if (containersNearToSource.length) {
                        Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container = {};
                        Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.id = containersNearToSource[0].id;
                    }
                }
                var container = Game.getObjectById(Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container.id);
                if (container == null) {
                    delete Memory.rooms[creep.memory.targetRoomName].sources[creep.memory.targetSource].container;
                } else {
                    creep.memory.targetContainer = container.id;
                }
                // createRoadBetweenTargets(container, Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainSpawn.id))
            } catch (e) {
                console.log(`${creep}: ${e}`);
                console.log(`${creep}: ${creep.memory.targetRoomName}`);
                console.log(`${creep}: ${creep.memory.targetSource}`);
            }
            if (container == undefined) {
                // console.log(666)
                Log(creep, "no exts, spawn, or container found");
                creep.say("makin con");
                if (targetSource.pos.inRangeTo(creep.pos, 2)) {
                    creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
                } else {
                    moveToMultiRoomTarget(creep, targetSource.pos);
                }
            } else {
                if (container.store.getFreeCapacity() == 0) {
                    // TODO: Bug: when a harvester dies, it does not carry over the moverLimit increase to the next harvester
                    //            This should be stored as source information
                    if (creep.memory.containerFilledTimestamp == undefined) {
                        creep.memory.containerFilledTimestamp = Game.time;
                    }
                    if (Game.time > creep.memory.containerFilledTimestamp + 60) {
                        if (creep.memory.moverLimitIncreaseCooldownTimestamp == undefined) {
                            creep.memory.moverLimitIncreaseCooldownTimestamp = Game.time;
                        }
                        if (Game.time > creep.memory.moverLimitIncreaseCooldownTimestamp + 10000) {
                            creep.memory.moverLimit = creep.memory.moverLimit + 1;
                            creep.memory.containerFilledTimestamp = undefined;
                            creep.memory.moverLimitIncreaseCooldownTimestamp = Game.time;
                        }
                    }
                }
                creep.memory.containerFilledTimestamp = undefined;
                if (container != null && container.hits < 200000) {
                    Log(creep, `healing ${container}`);
                    if (creep.repair(container) != OK) {
                        moveToMultiRoomTarget(creep, container);
                    }
                } else if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    moveToMultiRoomTarget(creep, container);
                    Log(creep, `filling ${container}`);
                }
            }
        }
    },
};

module.exports = roleHarvesterExt;
