function log(creep, str) {
    // if (creep.name == "Harvester_393")
    if (0) console.log(str);
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

    /** @param {Creep} creep **/
    run: function (creep) {
        csites = creep.room.find(FIND_CONSTRUCTION_SITES, {
            filter: (site) => {
                return creep.pos.inRangeTo(site, 3);
            },
        });

        var closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            if (creepRoomMap.get(creep.memory.baseRoomName + "soldier") == undefined || creepRoomMap.get(creep.memory.baseRoomName + "soldier") < 1) {
                spawnCreep(roleSoldier, null, { memory: { baseRoomName: creep.memory.baseRoomName, targetRoomName: creep.memory.targetRoomName } }, creep.memory.baseRoomName);
            }
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
            if ((Game.rooms[creep.memory.targetRoomName].controller.reservation == undefined || Game.rooms[creep.memory.targetRoomName].controller.reservation.ticksToEnd < 1000) && creepRoomMap.get(creep.memory.targetRoomName + "claimer") < 1) {
                //TODO FIX THIS
                spawnCreep(roleClaimer, null, { memory: { baseRoomName: creep.memory.targetRoomName } }, creep.memory.baseRoomName);
            } else if (csites.length == 1 && (creepRoomMap.get(creep.memory.baseRoomName + "moverExt") == undefined || creepRoomMap.get(creep.memory.baseRoomName + "moverExt") < 2)) {
                spawnCreep(roleMoverExt, null, { memory: { baseRoomName: creep.memory.baseRoomName, targetRoomName: creep.memory.targetRoomName } }, creep.memory.baseRoomName);
            }
        }

        if (creep.ticksToLive > 1400) {
            creep.memory.healing = false;
        }

        if (creep.ticksToLive < 300) {
            creep.say("healing");
            creep.memory.healing = true;
            returnToHeal(creep, creep.memory.baseRoomName);
            return;
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

        if (creep.room.name != creep.memory.fakeBaseRoomName) {
            const route = Game.map.findRoute(creep.room, creep.memory.fakeBaseRoomName);
            if (route.length > 0) {
                creep.say("Headin oot");
                const exit = creep.pos.findClosestByRange(route[0].exit);
                moveToTarget(creep, exit, true);
            } else {
                creep.say("No route found");
            }
            return;
        }

        if (creep.memory.mining) {
            if (Game.flags.pickerupper.pos.inRangeTo(creep, 5)) {
                creep.moveTo(Game.flags.midway.pos);
                return;
            }
            pickupNearby(creep);
            var targetSource = creep.pos.findClosestByRange(creep.room.find(FIND_SOURCES));
            if (creep.harvest(targetSource) != OK) {
                // console.log(creep.harvest(targetSource))
                moveToTarget(creep, targetSource, true);
            }
            return;
        } else {
            //Build any nearby container or road
            if (csites.length) {
                if (creep.build(csites[0]) == ERR_NOT_IN_RANGE) {
                    moveToTarget(creep, csites[0], true);
                }
                return;
            }
            targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_CONTAINER) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                },
            });
            if (!targets.length) {
                log(creep, "no exts, spawn, or container found");
            } else {
                target = creep.pos.findClosestByPath(targets);
                if (target.hitsMax - target.hits > 10000) {
                    creep.repair(target);
                } else if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    moveToTarget(creep, target.pos, true);
                }
            }
        }
    },
};

module.exports = roleHarvesterExt;
