function log(str) {
    if (0) console.log(str);
}

var roleMover = require("role.mover");

global.rolePowMover = Object.assign({}, roleMover);

const job = {
    MOVING_POWER: 0,
    MOVING_ENERGY: 1,
    RETURNING: 2,
};

global.rolePowMover.run = function (creep) {
    // Lost creeps return home
    if (creep.room.name != creep.memory.baseRoomName) {
        const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
        if (route.length > 0) {
            creep.say("Headin oot");
            const exit = creep.pos.findClosestByRange(route[0].exit);
            moveToTarget(creep, exit, true);
        } else {
            creep.say("No route found");
        }
        return;
    }
    var power_spawns = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_POWER_SPAWN;
        },
    });
    var power_spawns_pow = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (
                structure.structureType == STRUCTURE_POWER_SPAWN && structure.store.getUsedCapacity(RESOURCE_POWER) < 20
            );
        },
    });
    var power_spawns_en = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (
                structure.structureType == STRUCTURE_POWER_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            );
        },
    });

    if (power_spawns_pow.length) {
        creep.memory.job = job.MOVING_POWER;
    } else if (power_spawns_en.length) {
        creep.memory.job = job.MOVING_ENERGY;
    } else {
        creep.memory.job = job.RETURNING;
    }

    // If creep is holding non-energy, deposit it first
    var storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_STORAGE && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        },
    });
    for (const resourceType in creep.store) {
        switch (creep.memory.job) {
            case job.MOVING_POWER:
                if (resourceType != RESOURCE_POWER) {
                    if (creep.transfer(storage, resourceType) != OK) {
                        // console.log(creep.transfer(storage, resourceType) )
                        moveToTarget(creep, storage, true);
                        return;
                    }
                }
                break;
            case job.MOVING_ENERGY:
                if (resourceType != RESOURCE_ENERGY) {
                    if (creep.transfer(storage, resourceType) != OK) {
                        // console.log(creep.transfer(storage, resourceType) )
                        moveToTarget(creep, storage, true);
                        return;
                    }
                }
                break;
        }
    }

    if (creep.memory.moving && creep.store.getUsedCapacity() == 0) {
        creep.memory.moving = false;
        creep.say("🔄 harvest");
    }
    if (!creep.memory.moving && creep.store.getFreeCapacity() == 0) {
        creep.memory.moving = true;
        creep.say("dropping");
    }

    if (creep.ticksToLive < 200 && creep.memory.moving) {
        creep.say("healing");
        creep.memory.healing = true;
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (
                    structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                );
            },
        });
        if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            moveToTarget(creep, targets[0], false);
        }
        return;
    }

    if (!creep.memory.moving) {
        // creep.say("hello")
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_STORAGE && structure.store.getUsedCapacity() > 0;
            },
        });
        if (targets.length) {
            creep.say("m2storage");
            switch (creep.memory.job) {
                case job.MOVING_POWER:
                    if (creep.withdraw(targets[0], RESOURCE_POWER) != OK) {
                        moveToTarget(creep, targets[0], true);
                    }
                    break;
                case job.MOVING_ENERGY:
                    if (creep.withdraw(targets[0], RESOURCE_ENERGY) != OK) {
                        moveToTarget(creep, targets[0], true);
                    }
                    break;
            }
        } else creep.say("no power");
    } else {
        if (power_spawns) {
            target = creep.pos.findClosestByPath(power_spawns);
            switch (creep.memory.job) {
                case job.MOVING_POWER:
                    if (creep.transfer(target, RESOURCE_POWER) != OK) {
                        moveToTarget(creep, target, false);
                    }
                    break;
                case job.MOVING_ENERGY:
                    target = creep.pos.findClosestByPath(power_spawns);
                    if (creep.transfer(target, RESOURCE_ENERGY) != OK) {
                        moveToTarget(creep, target, false);
                    }
                    break;
            }
        } else {
            creep.say("full");
            creep.memory.moving = false;
        }
    }
};

module.exports = rolePowMover;
