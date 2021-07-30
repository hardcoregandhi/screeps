global.rolePowHarvester = {
    name: "powHarvester",
    roleMemory: { memory: {} },
    BodyParts: [
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        ATTACK,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
        MOVE,
    ],

    /** @param {Creep} creep **/
    run: function (creep) {
        // creep.say('🏳️');
        targetRoom = "W20S20";

        var enemies = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
        if (enemies.length) {
            if (creep.attack(enemies[0]) != OK) {
                ret = creep.moveTo(enemies[0], {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
            }
            return;
        }

        var powerBanks = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_POWER_BANK;
            },
        });
        try {
            if (Memory.prevPowerBankHealth != powerBanks[0].hits) {
                console.log(powerBanks[0].hits / (Memory.prevPowerBankHealth - powerBanks[0].hits));
                Memory.prevPowerBankHealth = powerBanks[0].hits;
            }
        } catch {}
        if (powerBanks.length) {
            if (creep.attack(powerBanks[0]) != OK) {
                ret = creep.moveTo(powerBanks[0], {
                    visualizePathStyle: { stroke: "#ffaa00" },
                });
            }
            return;
        }

        if (creep.room.name != targetRoom) {
            const route = Game.map.findRoute(creep.room, targetRoom, {
                maxRooms: 1,
            });
            if (route.length > 0) {
                const exit = creep.pos.findClosestByRange(route[0].exit);
                moveToTarget(creep, exit, true);
            }
        } else {
            // creep.moveTo(creep.room.controller);
            // creep.attack(creep.room.controller)
        }
    },
};

module.exports = global.rolePowHarvester;
