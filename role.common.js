/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.common');
 * mod.thing == 'a thing'; // true
 */

global.healRoads = function (creep) {
    // Heal Roads
    var towers = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_TOWER;
        },
    });
    if (towers.length == 0) {
        const damagedStructs = creep.room.find(FIND_STRUCTURES, {
            filter: (object) => object.hits < object.hitsMax / 2 && creep.pos.inRangeTo(object, 1),
        });
        damagedStructs.sort((a, b) => a.hits - b.hits);
        if (damagedStructs.length > 0) {
            if (creep.repair(damagedStructs[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(damagedStructs[0]);
            }
        }
    }
    //END Heal Roads
};

global.pickupNearby = function (creep) {
    // console.log("pickupNearby")
    const droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
        filter: (object) => object.resourceType == RESOURCE_ENERGY && creep.pos.inRangeTo(object, 1),
    });
    if (droppedEnergy.length > 0) {
        // console.log(creep.name + " picking up Nearby")
        creep.pickup(droppedEnergy[0]);
    }
};

global.returnToHeal = function (creep, room) {
    if (creep.ticksToLive > 1400) {
        creep.memory.healing = false;
        return;
    }

    if (creep.memory.healing === true) {
        if (creep.room.name != room) {
            const route = Game.map.findRoute(creep.room, room);
            if (route.length > 0) {
                creep.say("Headin oot");
                const exit = creep.pos.findClosestByRange(route[0].exit);
                moveToTarget(creep, exit, true);
            } else {
                creep.say("No route found");
            }
            // moveToRoom(creep, creep.memory.baseRoomName)
            return;
        }
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_SPAWN;
            },
        });
        if (creep.transfer(targets[0], RESOURCE_ENERGY) != OK) {
            creep.moveTo(targets[0], {
                visualizePathStyle: { stroke: "#ffaa00" },
            });
        }
        return;
    }
};
