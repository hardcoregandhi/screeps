function log(creep, str) {
    if (creep.name == "HarvesterExt_590") if (0) console.log(str);
}

var roleHarvester = require("role.harvester");

global.roleHarvesterExt = {
    name: "harvesterExt",
    roleMemory: { memory: { targetRoomName: "W17S21" } },

    // prettier-ignore
    BodyParts: [
        WORK, WORK, WORK, WORK, WORK,
        WORK, WORK, WORK, WORK, WORK,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE
        ],
    baseBodyParts: [],
    bodyLoop: [WORK, WORK, CARRY, MOVE, MOVE],

    /** @param {Creep} creep **/
    run: function (creep) {
        log(creep, 1);
        if (creep.ticksToLive > 1400) {
            creep.memory.healing = false;
            creep.memory.mining = true;
        }

        if (creep.ticksToLive < 300) {
            if (creep.store.getUsedCapacity > 0) {
                var containers = Game.rooms[creep.memory.targetRoomName].find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_CONTAINER && creep.pos.inRangeTo(structure.pos, 1);
                    },
                });
                if (!containers.length) {
                    creep.transfer(target, RESOURCE_ENERGY);
                }
            }
            creep.say("healing");
            creep.memory.healing = true;
            returnToHeal(creep, creep.memory.baseRoomName);
            return;
        }

        if (Game.rooms[creep.memory.targetRoomName] == undefined) {
            log(creep, "target room not currently used");
            log(creep, creep.memory.targetRoomName);
            if (creep.room.name != creep.memory.targetRoomName) {
                log(creep, "wrong room");
                const route = Game.map.findRoute(creep.room, creep.memory.targetRoomName);
                if (route.length > 0) {
                    creep.say("Headin oot");
                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    moveToMultiRoomTarget(creep, exit);
                } else {
                    creep.say("No route found");
                    log(creep, "no route to target room");
                }
                return;
            }
        }

        var csites = Game.rooms[creep.memory.targetRoomName].find(FIND_CONSTRUCTION_SITES, {
            filter: (site) => {
                return creep.pos.inRangeTo(site, 3) && site.structureType == STRUCTURE_CONTAINER;
            },
        });
        var containersNearToSource = Game.rooms[creep.memory.targetRoomName].find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_CONTAINER && Game.getObjectById(creep.memory.targetSource).pos.inRangeTo(structure, 2);
            },
        });
        log(creep, 2);

        var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        var closestStructure = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);

        if (closestHostile || closestStructure) {
            if (creepRoomMap.get(creep.memory.baseRoomName + "soldier") == undefined || creepRoomMap.get(creep.memory.baseRoomName + "soldier") < 1) {
                spawnCreep(roleSoldier, "auto", { memory: { baseRoomName: creep.memory.baseRoomName, targetRoomName: creep.memory.targetRoomName } }, creep.memory.baseRoomName);
            }
            if (closestStructure) return;
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

        // TODO a creep should not spawn other creeps
        if (creep.memory.targetRoomName != undefined && Game.rooms[creep.memory.targetRoomName] != undefined) {
            if (
                (Game.rooms[creep.memory.targetRoomName].controller.reservation == undefined || Game.rooms[creep.memory.targetRoomName].controller.reservation.ticksToEnd < 1000) &&
                creepRoomMap.get(creep.memory.targetRoomName + "claimer") < 1 &&
                creep.memory.noClaimSpawn != undefined
            ) {
                //TODO FIX THIS
                spawnCreep(roleClaimer, "auto", { memory: { baseRoomName: creep.memory.targetRoomName } }, creep.memory.baseRoomName);
            } else if (
                containersNearToSource.length > 0 &&
                creep.memory.targetSource != undefined &&
                (creepRoomMap.get(creep.memory.targetRoomName + "moverExtTarget" + creep.memory.targetSource) == undefined || creepRoomMap.get(creep.memory.targetRoomName + "moverExtTarget" + creep.memory.targetSource) < 2)
            ) {
                spawnCreep(roleMoverExt, "auto", { memory: { baseRoomName: creep.memory.baseRoomName, targetRoomName: creep.memory.targetRoomName, targetSource: creep.memory.targetSource } }, creep.memory.baseRoomName);
            }
        }

        if (creep.memory.mining && creep.store.getFreeCapacity() == 0) {
            creep.memory.mining = false;
            creep.say("🔄 dropping");
        }
        if (!creep.memory.mining && creep.store.getUsedCapacity() == 0) {
            creep.memory.healing = false;
            creep.memory.mining = true;
            creep.say("⛏️ mining");
        }

        if (creep.memory.fakeBaseRoomName == undefined) {
            creep.memory.fakeBaseRoomName = creep.memory.targetRoomName;
        }

        if (creep.memory.mining) {
            pickupNearby(creep);

            if (creep.memory.targetSource == undefined) {
                // Choose source
                Memory.rooms[creep.memory.targetRoomName].sources = sources;
                _.forEach(sources, (s, i) => {
                    // console.log(s)
                    if (Memory.rooms[r.name].sources[i].targettedBy == 0) {
                        creep.memory.targetSource = Memory.rooms[r.name].sources[i].id;
                        return false;
                    }
                });
            }

            var targetSource = Game.getObjectById(creep.memory.targetSource);

            log(creep, targetSource);
            if (creep.harvest(targetSource) != OK) {
                // console.log(creep.harvest(targetSource))
                moveToMultiRoomTarget(creep, targetSource);
            }
            return;
        } else {
            //Build any nearby container or road
            if (csites.length) {
                if (creep.build(csites[0]) == ERR_NOT_IN_RANGE) {
                    moveToMultiRoomTarget(creep, csites[0]);
                }
                return;
            }
            var containers = Game.rooms[creep.memory.targetRoomName].find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_CONTAINER && Game.getObjectById(creep.memory.targetSource).pos.inRangeTo(structure.pos, 2);
                },
            });
            if (!containers.length) {
                // console.log(666)
                log(creep, "no exts, spawn, or container found");
                creep.say("makin con");
                if (Game.getObjectById(creep.memory.targetSource).pos.inRangeTo(creep.pos, 2)) {
                    creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
                } else {
                    moveToMultiRoomTarget(creep, Game.getObjectById(creep.memory.targetSource).pos);
                }
            } else {
                target = creep.pos.findClosestByPath(containers);
                if (target != null && target.hits < 200000) {
                    creep.repair(target);
                } else if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    moveToMultiRoomTarget(creep, target.pos);
                }
            }
        }
    },
};

module.exports = roleHarvesterExt;
