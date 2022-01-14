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

global.rolePowMover.name = "powMover";
global.rolePowMover.run = function (creep) {
    // Lost creeps return home
    if (creep.room.name != creep.memory.baseRoomName) {
        const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
        if (route.length > 0) {
            creep.say("Headin oot");
            const exit = creep.pos.findClosestByRange(route[0].exit);
            moveToTarget(creep, exit);
        } else {
            creep.say("No route found");
        }
        return;
    }
    var power_spawn = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].structs.pspawn.id)
    var mainStorage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage)
    var power_spawn_pow = power_spawn.store.getUsedCapacity(RESOURCE_POWER) < 20;
    var power_spawn_en = power_spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    
    power_spawn.processPower();
    
    if (mainStorage.store.getUsedCapacity(RESOURCE_POWER) == 0 && power_spawn.store.getUsedCapacity(RESOURCE_POWER) == 0) {
        creep.memory.DIE = true;
        return;
    }

    if (power_spawn_pow) {
        creep.memory.job = job.MOVING_POWER;
    } else if (power_spawn_en) {
        creep.memory.job = job.MOVING_ENERGY;
    } else {
        creep.memory.job = job.RETURNING;
    }

    // If creep is holding non-energy, deposit it first
    for (const resourceType in creep.store) {
        switch (creep.memory.job) {
            case job.MOVING_POWER:
                if (resourceType != RESOURCE_POWER) {
                    if (creep.transfer(mainStorage, resourceType) != OK) {
                        // console.log(creep.transfer(storage, resourceType) )
                        moveToTarget(creep, mainStorage);
                        return;
                    }
                }
                break;
            case job.MOVING_ENERGY:
                if (resourceType != RESOURCE_ENERGY) {
                    if (creep.transfer(mainStorage, resourceType) != OK) {
                        // console.log(creep.transfer(storage, resourceType) )
                        moveToTarget(creep, mainStorage);
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

    if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
        creep.say("healing");
        creep.memory.healing = true;
        if (returnToHeal(creep, creep.memory.baseRoomName)) return;
    }

    if (!creep.memory.moving) {
        // creep.say("hello")
        
        creep.say("m2storage");
        switch (creep.memory.job) {
            case job.MOVING_POWER:
                if (creep.withdraw(mainStorage, RESOURCE_POWER) != OK) {
                    moveToTarget(creep, mainStorage);
                    if (mainStorage.store.getUsedCapacity(RESOURCE_POWER) == 0) {
                        creep.memory.moving = true
                    }
                }
                break;
            case job.MOVING_ENERGY:
                if (creep.withdraw(mainStorage, RESOURCE_ENERGY) != OK) {
                    moveToTarget(creep, mainStorage);
                }
                break;
        }
    } else {
        if (power_spawn) {
            switch (creep.memory.job) {
                case job.MOVING_POWER:
                    if (creep.transfer(power_spawn, RESOURCE_POWER) != OK) {
                        moveToTarget(creep, power_spawn);
                    }
                    break;
                case job.MOVING_ENERGY:
                    if (creep.transfer(power_spawn, RESOURCE_ENERGY) != OK) {
                        moveToTarget(creep, power_spawn);
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
